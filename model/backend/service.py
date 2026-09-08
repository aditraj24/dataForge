"""
Service layer bridging FastAPI to the SimulationLabEngine.
Maintains engine lifecycle and guarantees consistent instance propagation.
"""

from typing import Dict, Any, List, Optional
import torch

from simulation_lab.engine import SimulationLabEngine
from simulation_lab.tasks import TaskRegistry
from simulation_lab.models import ModelRegistry
from simulation_lab.schemas import TaskExample


class SimulationService:
    """
Singleton-style service wrapping SimulationLabEngine.
"""

    _instance: Optional['SimulationService'] = None
    _engine: Optional[SimulationLabEngine] = None

    def __init__(self, device: Optional[str] = None):
        self.device = device
        self.engine = SimulationLabEngine(device=device)

    @classmethod
    def get_instance(cls, device: Optional[str] = None) -> 'SimulationService':
        if cls._instance is None:
            cls._instance = cls(device=device)
        return cls._instance

    def get_health(self) -> Dict[str, Any]:
        device_info = self.engine.get_device_info()
        return {
            "status": "ok",
            "service": "thinking-budget-api",
            "device_info": device_info
        }

    def list_models(self) -> List[Dict[str, Any]]:
        return self.engine.list_models()

    def list_tasks(self) -> List[Dict[str, Any]]:
        return self.engine.list_tasks()

    def list_scales(self) -> List[Dict[str, Any]]:
        return [
            {
                "scale_id": "126k",
                "display_name": "126K Baseline",
                "description": "Initial baseline experiment (80 hidden dim, 2 layers / GRUCell). 20 models across 5 seeds.",
                "parameter_regime": "126,168 (CoT) vs 125,688 (Latent)",
                "optimization_protocol": "20 epochs / 2,500 steps, static AdamW lr=1e-3",
                "status": "historical_baseline",
                "is_authoritative": True
            },
            {
                "scale_id": "1m",
                "display_name": "1M Scaling",
                "description": "8x capacity scaling experiment (224 hidden dim, 2 layers / GRUCell). 20 models across 5 seeds.",
                "parameter_regime": "998,520 (CoT) vs 998,523 (Latent)",
                "optimization_protocol": "20 epochs / 2,500 steps, static AdamW lr=1e-3",
                "status": "scaling_evaluation",
                "is_authoritative": True
            },
            {
                "scale_id": "5m_recovery",
                "display_name": "5M Recovery (Authoritative)",
                "description": "Controlled 5M convergence recovery experiment (544 hidden dim). Resolved underfitting via 50 epochs, linear warmup, and cosine decay.",
                "parameter_regime": "5,000,632 (CoT) vs 5,000,635 (Latent)",
                "optimization_protocol": "50 epochs / 6,250 steps, peak lr=5e-4 with 5-epoch warmup + cosine decay",
                "status": "authoritative_5m",
                "is_authoritative": True
            },
            {
                "scale_id": "5m_original",
                "display_name": "5M Original (Historical / Confounded)",
                "description": "Original 5M parameter run frozen with 20-epoch static recipe. Severely underfit (losses stalled at 1.35-1.57; accuracy ~13%). Retained as historical control.",
                "parameter_regime": "5,000,632 (CoT) vs 5,000,635 (Latent)",
                "optimization_protocol": "20 epochs / 2,500 steps, static AdamW lr=1e-3 (inadequate for 5M)",
                "status": "historical_confounded",
                "is_authoritative": False
            }
        ]

    def generate_example(
        self,
        task: str = "permutation_orbit",
        depth: Optional[int] = None,
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        ex = self.engine.generate_example(task=task, depth=depth, seed=seed)
        return ex.to_dict()

    def simulate(
        self,
        model: str,
        task: str,
        budget_k: int,
        seed: int = 42,
        example: Optional[Dict[str, Any]] = None,
        depth: Optional[int] = None,
        measure_timing: bool = True
    ) -> Dict[str, Any]:
        res = self.engine.run_simulation(
            model=model,
            task=task,
            budget_k=budget_k,
            seed=seed,
            example=example,
            depth=depth,
            measure_timing=measure_timing
        )
        return res.to_dict()

    def compare(
        self,
        models: List[str],
        task: str,
        budget_k: int,
        seed: int = 42,
        example: Optional[Dict[str, Any]] = None,
        depth: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Guarantees that all models are evaluated on the exact same TaskExample instance.
        """
        canonical_task = TaskRegistry.resolve_task_id(task)
        if example is not None:
            ex = TaskExample(**example)
        else:
            ex = self.engine.generate_example(task=canonical_task, depth=depth, seed=seed)

        evaluated = []
        for m in models:
            res = self.engine.run_simulation(
                model=m,
                task=canonical_task,
                budget_k=budget_k,
                seed=seed,
                example=ex,
                measure_timing=True
            )
            evaluated.append(res.to_dict())

        return {
            "task_example": ex.to_dict(),
            "budget_k": budget_k,
            "models_evaluated": evaluated
        }

    def sweep(
        self,
        model: str,
        task: str,
        budgets: List[int],
        seed: int = 42,
        example: Optional[Dict[str, Any]] = None,
        depth: Optional[int] = None
    ) -> Dict[str, Any]:
        canonical_task = TaskRegistry.resolve_task_id(task)
        if example is not None:
            ex = TaskExample(**example)
        else:
            ex = self.engine.generate_example(task=canonical_task, depth=depth, seed=seed)

        results = self.engine.sweep_budgets(
            model=model,
            task=canonical_task,
            example=ex,
            budgets=budgets,
            seed=seed
        )
        return {
            "model_id": model,
            "task_id": canonical_task,
            "seed": seed,
            "results": [r.to_dict() for r in results]
        }

    def get_pareto(self, task: Optional[str] = None, scale: str = "126k") -> Dict[str, Any]:
        return self.engine.get_pareto_data(task=task, scale=scale)
