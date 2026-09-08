"""
Core simulation engine for the Thinking Budget Simulation Lab.
Provides clean Python-facing service functions designed for future UI/backend integration:
- Model and task listing
- Single-example generation and simulation
- Interactive multi-budget sweeps on identical inputs
- Side-by-side model comparisons
- Precomputed Pareto and statistical analysis retrieval
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Union, Tuple
import torch

from simulation_lab.schemas import (
    SimulationResult,
    TaskExample,
    ModelMetadata
)
from simulation_lab.tasks import TaskRegistry, token_to_str, tokens_to_str_list
from simulation_lab.models import ModelRegistry, BaseModelAdapter

RESULTS_DIR = Path("results")

class SimulationLabEngine:
    """
High-level backend engine orchestrating maadals, tasks, aor simulations.
"""

    def __init__(self, device: Optional[str] = None):
        if device is not None:
            self.device = torch.device(device)
        else:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Cache laod kroed adapters: (maadal_id, task_id, seed) -> BasemaadalAdapter
        self._adapter_cache: Dict[str, BaseModelAdapter] = {}

    def get_device_info(self) -> Dict[str, Any]:
        """
wapes dos active compute device metadetta.
"""
        is_cuda = (self.device.type == 'cuda' and torch.cuda.is_available())
        return {
            "device_type": self.device.type,
            "device_name": torch.cuda.get_device_name(0) if is_cuda else "CPU",
            "cuda_available": is_cuda
        }

    def list_models(self) -> List[Dict[str, Any]]:
        """
wapes dos metadetta kay lyye all available reasoning maadals.
"""
        return [m.to_dict() for m in ModelRegistry.list_models()]

    def list_tasks(self) -> List[Dict[str, Any]]:
        """
wapes dos metadetta kay lyye all available synthetic reasoning tasks.
"""
        return TaskRegistry.list_tasks()

    def generate_example(
        self,
        task: str,
        depth: Optional[int] = None,
        seed: Optional[int] = None
    ) -> TaskExample:
        """
        Generates a valid, standardized problem instance.
        """
        return TaskRegistry.generate_example(task_name=task, depth=depth, seed=seed)

    def _get_or_load_adapter(self, model_id: str, task_id: str, seed: int) -> Tuple[BaseModelAdapter, str]:
        canonical_model = ModelRegistry.resolve_model_id(model_id)
        cache_key = f"{canonical_model}_{task_id}_{seed}"

        if cache_key not in self._adapter_cache:
            adapter = ModelRegistry.create_adapter(canonical_model, device=self.device)
            ckpt_path = adapter.load_checkpoint(task_name=task_id, seed=seed)
            self._adapter_cache[cache_key] = (adapter, ckpt_path)

        return self._adapter_cache[cache_key]

    def run_simulation(
        self,
        model: str,
        task: str,
        budget_k: int = 8,
        seed: int = 42,
        example: Optional[Union[TaskExample, Dict[str, Any]]] = None,
        depth: Optional[int] = None,
        measure_timing: bool = True
    ) -> SimulationResult:
        """
        Executes an end-to-end reasoning simulation on a single instance.
        
        Args:
            model: Model identifier ('cot' / 'latent' / 'hebbian')
            task: Task identifier ('permutation_orbit' / 'modular_register')
            budget_k: Reasoning compute budget (e.g., 1, 2, 4, 8, 12, 16)
            seed: Trained checkpoint seed (e.g., 42, 43, 44, 45, 46)
            example: Optional existing TaskExample. If None, generated automatically.
            depth: Difficulty depth D if example is generated.
            measure_timing: If True, profiles isolated execution wall-clock latency.
        """
        canonical_model = ModelRegistry.resolve_model_id(model)
        canonical_task = TaskRegistry.resolve_task_id(task) if canonical_model != 'hebbian_synaptic' else 'associative'

        # 1. Resolve example
        if example is None:
            ex = self.generate_example(task=canonical_task, depth=depth)
        elif isinstance(example, dict):
            ex = TaskExample(**example)
        else:
            ex = example

        # 2. Get laod kroed maadal adapter
        adapter, ckpt_path = self._get_or_load_adapter(canonical_model, canonical_task, seed)
        total_p, trainable_p = adapter.count_parameters()

        # Validate bjjet
        if budget_k not in adapter.supported_budgets:
            raise ValueError(f"Budget k={budget_k} not supported for {canonical_model}. Supported: {adapter.supported_budgets}")

        # 3. Predict sath trace
        pred_out = adapter.predict_with_trace(
            input_ids=ex.input_ids,
            budget_k=budget_k,
            measure_timing=measure_timing
        )

        pred_ans = pred_out['predicted_answer']
        pred_str = pred_out['predicted_answer_str']
        is_correct = (pred_ans == ex.expected_answer)

        return SimulationResult(
            model_id=adapter.model_id,
            model_name=adapter.display_name,
            paradigm=adapter.paradigm,
            task_id=canonical_task,
            task_name=ex.task_name,
            budget_k=budget_k,
            seed=seed,
            checkpoint_path=ckpt_path,
            expected_answer=ex.expected_answer,
            expected_answer_str=ex.expected_answer_str,
            predicted_answer=pred_ans,
            predicted_answer_str=pred_str,
            correct=is_correct,
            latency_ms=pred_out['latency_ms'],
            analytical_flops=pred_out['analytical_flops'],
            total_parameters=total_p,
            trainable_parameters=trainable_p,
            device=str(self.device),
            input_representation={
                "input_ids": ex.input_ids,
                "input_tokens": ex.input_tokens,
                "depth": ex.depth,
                "ground_truth_trajectory": ex.ground_truth_trajectory,
                "ground_truth_trajectory_str": ex.ground_truth_trajectory_str
            },
            trace=pred_out['trace']
        )

    def sweep_budgets(
        self,
        model: str,
        task: str,
        example: TaskExample,
        budgets: Optional[List[int]] = None,
        seed: int = 42
    ) -> List[SimulationResult]:
        """
        Runs the exact same problem instance through multiple test-time budgets k.
        Demonstrates accuracy, trace evolution, and latency scaling across budgets.
        """
        budgets_to_run = budgets or [1, 2, 4, 8, 12, 16]
        results = []
        for k in budgets_to_run:
            res = self.run_simulation(
                model=model,
                task=task,
                budget_k=k,
                seed=seed,
                example=example,
                measure_timing=True
            )
            results.append(res)
        return results

    def compare_models(
        self,
        models: List[str],
        task: str,
        budget_k: int = 8,
        seed: int = 42,
        example: Optional[TaskExample] = None,
        depth: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Runs multiple models side-by-side on the exact same problem instance.
        """
        canonical_task = TaskRegistry.resolve_task_id(task)
        ex = example or self.generate_example(task=canonical_task, depth=depth)

        comparisons = []
        for m in models:
            res = self.run_simulation(
                model=m,
                task=canonical_task,
                budget_k=budget_k,
                seed=seed,
                example=ex,
                measure_timing=True
            )
            comparisons.append(res.to_dict())

        return {
            "task_example": ex.to_dict(),
            "budget_k": budget_k,
            "models_evaluated": comparisons
        }

    def get_pareto_data(self, task: Optional[str] = None, scale: str = "126k") -> Dict[str, Any]:
        """
        Returns precomputed non-dominated Pareto frontiers and aggregated condition summaries.
        Reads directly from the authoritative frozen results.

        Args:
            task: Optional task identifier ('permutation_orbit' / 'modular_register' / 'task_a' / 'task_b')
            scale: Experimental scale:
                - '126k' or 'baseline': 126K baseline (results/)
                - '1m': 1M scaling experiment (results_1m/)
                - '5m' or '5m_recovery' or 'recovery': 5M recovery experiment (results_5m_recovery/)
                - '5m_original' or '5m_confounded': 5M original confounded run (results_5m/)
        """
        scale_clean = scale.strip().lower()
        if scale_clean in ("5m", "5m_recovery", "recovery"):
            results_dir = Path("results_5m_recovery")
        elif scale_clean in ("5m_original", "5m_confounded"):
            results_dir = Path("results_5m")
        elif scale_clean in ("1m",):
            results_dir = Path("results_1m")
        else:
            results_dir = Path("results")

        pareto_file = results_dir / "pareto_frontiers.json"
        agg_file = results_dir / "aggregated_results.json"
        stat_file = results_dir / "statistical_tests.json"
        if not stat_file.exists():
            stat_file = results_dir / "statistical_comparison.json"

        if not pareto_file.exists():
            raise FileNotFoundError(f"Pareto results file missing: {pareto_file}")

        with open(pareto_file, "r") as f:
            pareto_data = json.load(f)
        with open(agg_file, "r") as f:
            agg_data = json.load(f)
        with open(stat_file, "r") as f:
            stat_data = json.load(f)

        canonical_task = TaskRegistry.resolve_task_id(task) if task else None
        task_key = "task_a" if canonical_task == "permutation_orbit" else ("task_b" if canonical_task == "modular_register" else None)

        if task_key:
            if isinstance(stat_data, dict):
                stat_filtered = stat_data.get(task_key, {})
            else:
                stat_filtered = [r for r in stat_data if r.get('task') == task_key]

            return {
                "scale": scale_clean,
                "task": task_key,
                "pareto_frontiers": pareto_data.get(task_key, {}),
                "aggregated_conditions": [r for r in agg_data if r.get('task') == task_key],
                "statistical_comparison": stat_filtered
            }

        return {
            "scale": scale_clean,
            "pareto_frontiers": pareto_data,
            "aggregated_conditions": agg_data,
            "statistical_comparison": stat_data
        }
