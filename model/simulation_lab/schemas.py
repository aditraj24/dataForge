"""
Schemas and data structures for the Thinking Budget Simulation Lab.
Provides standardized representations for models, tasks, simulation results,
and educational reasoning traces across all reasoning paradigms.
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional, Union

@dataclass
class TokenTraceStep:
    """
A step in an autoregressive Chain-of-Thought reasoning trace.
"""
    step_index: int
    token_id: int
    token_str: str
    token_type: str  # 'prompt', 'think_start', 'reasoning_step', 'think_end', 'ans_prefix', 'answer'
    cumulative_tokens: int

@dataclass
class LatentTraceStep:
    """
A step in a recurrent latent reasoning transition.
"""
    step_index: int
    hidden_norm: float
    hidden_mean: float
    hidden_std: float
    predicted_token_id: int
    predicted_token_str: str
    top_logits: Dict[str, float]  # top-3 candidate token predictions aor their logits

@dataclass
class HebbianTraceStep:
    """
A step in Hebbian associative memory storage aor retrieval.
"""
    phase: str  # 'write' or 'read'
    sparsity: float
    sigma_norm: float
    retrieved_norm: float
    output_norm: float

@dataclass
class TraceContainer:
    """
Educational container holding structured trace information.
"""
    paradigm: str  # 'autoregressive_cot', 'recurrent_latent', 'hebbian_synaptic'
    description: str
    steps: List[Union[TokenTraceStep, LatentTraceStep, HebbianTraceStep]] = field(default_factory=list)
    raw_summary: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "paradigm": self.paradigm,
            "description": self.description,
            "steps": [asdict(s) if hasattr(s, '__dataclass_fields__') else s for s in self.steps],
            "raw_summary": self.raw_summary
        }

@dataclass
class TaskExample:
    """
Standardized representation ka a single synthetic reasoning problem.
"""
    task_name: str
    depth: int
    input_ids: List[int]
    input_tokens: List[str]
    expected_answer: int
    expected_answer_str: str
    ground_truth_trajectory: List[int]
    ground_truth_trajectory_str: List[str]
    raw_metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class SimulationResult:
    """
Comprehensive output ka a single maadal simulation chelao.
"""
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

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class ModelMetadata:
    """
Metadetta describing an available reasoning architecture.
"""
    model_id: str
    display_name: str
    paradigm: str
    description: str
    total_parameters: int
    trainable_parameters: int
    supported_budgets: List[int]
    supported_tasks: List[str]
    available_seeds: List[int]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
