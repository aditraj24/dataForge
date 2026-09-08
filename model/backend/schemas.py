"""
Pydantic data schemas for the Thinking Budget FastAPI service.
Enforces request validation and provides structured API response models.
"""

from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, field_validator


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "thinking-budget-api"
    device_info: Dict[str, Any]


class ModelInfo(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_id: str
    display_name: str
    paradigm: str
    description: str
    total_parameters: int
    trainable_parameters: int
    supported_budgets: List[int]
    supported_tasks: List[str]
    available_seeds: List[int]


class TaskInfo(BaseModel):
    task_id: str
    display_name: str
    description: str
    aliases: List[str]
    answer_domain_size: int


class ScaleInfo(BaseModel):
    scale_id: str
    display_name: str
    description: str
    parameter_regime: str
    optimization_protocol: str
    status: str
    is_authoritative: bool


class GenerateExampleRequest(BaseModel):
    task: str = Field(default="permutation_orbit", description="Task identifier or alias")
    depth: Optional[int] = Field(default=None, ge=2, le=16, description="Difficulty depth D in [2, 16]")
    seed: Optional[int] = Field(default=None, description="Random seed for problem generation")


class TaskExampleResponse(BaseModel):
    task_name: str
    depth: int
    input_ids: List[int]
    input_tokens: List[str]
    expected_answer: int
    expected_answer_str: str
    ground_truth_trajectory: List[int]
    ground_truth_trajectory_str: List[str]
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)


class SimulateRequest(BaseModel):
    model: str = Field(..., description="Model identifier (e.g. 'cot', 'latent', 'cot_5m', 'latent_5m')")
    task: str = Field(default="permutation_orbit", description="Task identifier")
    budget_k: int = Field(default=8, description="Test-time reasoning compute budget")
    seed: int = Field(default=42, description="Trained checkpoint seed (42, 43, 44, 45, 46)")
    example: Optional[Dict[str, Any]] = Field(default=None, description="Optional existing TaskExample dict")
    depth: Optional[int] = Field(default=None, ge=2, le=16, description="Optional difficulty depth if generating new instance")
    measure_timing: bool = Field(default=True, description="Whether to profile execution latency")

    @field_validator('budget_k')
    @classmethod
    def validate_budget(cls, v: int) -> int:
        allowed = [1, 2, 4, 8, 12, 16]
        if v not in allowed:
            raise ValueError(f"Invalid budget k={v}. Must be one of {allowed}")
        return v


class SimulationResultResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_id: str
    model_name: str
    paradigm: str
    task_id: str
    task_name: str
    budget_k: int
    seed: int
    checkpoint_path: str
    expected_answer: int
    expected_answer_str: str
    predicted_answer: int
    predicted_answer_str: str
    correct: bool
    latency_ms: float
    analytical_flops: float
    total_parameters: int
    trainable_parameters: int
    device: str
    input_representation: Dict[str, Any]
    trace: Dict[str, Any]


class CompareRequest(BaseModel):
    models: List[str] = Field(default=["cot", "latent"], description="List of model identifiers to compare")
    task: str = Field(default="permutation_orbit", description="Task identifier")
    budget_k: int = Field(default=8, description="Budget k applied across all compared models")
    seed: int = Field(default=42, description="Trained checkpoint seed")
    example: Optional[Dict[str, Any]] = Field(default=None, description="Optional existing TaskExample dict")
    depth: Optional[int] = Field(default=None, ge=2, le=16, description="Optional difficulty depth")

    @field_validator('budget_k')
    @classmethod
    def validate_budget(cls, v: int) -> int:
        allowed = [1, 2, 4, 8, 12, 16]
        if v not in allowed:
            raise ValueError(f"Invalid budget k={v}. Must be one of {allowed}")
        return v


class CompareResponse(BaseModel):
    task_example: Dict[str, Any]
    budget_k: int
    models_evaluated: List[SimulationResultResponse]


class SweepRequest(BaseModel):
    model: str = Field(..., description="Model identifier")
    task: str = Field(default="permutation_orbit", description="Task identifier")
    budgets: List[int] = Field(default=[1, 2, 4, 8, 12, 16], description="List of budget steps")
    seed: int = Field(default=42, description="Trained checkpoint seed")
    example: Optional[Dict[str, Any]] = Field(default=None, description="Optional existing TaskExample dict")
    depth: Optional[int] = Field(default=None, ge=2, le=16, description="Optional difficulty depth")

    @field_validator('budgets')
    @classmethod
    def validate_budgets(cls, v: List[int]) -> List[int]:
        allowed = {1, 2, 4, 8, 12, 16}
        for b in v:
            if b not in allowed:
                raise ValueError(f"Invalid budget k={b} in sweep. All budgets must be in [1, 2, 4, 8, 12, 16]")
        return v


class SweepResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_id: str
    task_id: str
    seed: int
    results: List[SimulationResultResponse]


class ParetoResponse(BaseModel):
    scale: str
    task: Optional[str] = None
    pareto_frontiers: Dict[str, Any]
    aggregated_conditions: List[Dict[str, Any]]
    statistical_comparison: Union[Dict[str, Any], List[Dict[str, Any]]]
