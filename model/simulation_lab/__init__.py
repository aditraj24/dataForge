"""
Thinking Budget Simulation Lab Package.
Provides high-level Python API for educational simulation, single-example execution,
and model comparison across reasoning paradigms.
"""

from simulation_lab.schemas import (
    SimulationResult,
    TaskExample,
    ModelMetadata,
    TraceContainer,
    TokenTraceStep,
    LatentTraceStep,
    HebbianTraceStep
)
from simulation_lab.models import (
    ModelRegistry,
    BaseModelAdapter,
    CoTModelAdapter,
    LatentModelAdapter,
    HebbianModelAdapter,
    CoTModelAdapter1M,
    LatentModelAdapter1M,
    CoTModelAdapter5M,
    LatentModelAdapter5M
)
from simulation_lab.tasks import TaskRegistry, token_to_str, tokens_to_str_list
from simulation_lab.engine import SimulationLabEngine
from simulation_lab.metrics import compute_analytical_flops, measure_execution_latency

__all__ = [
    "SimulationLabEngine",
    "ModelRegistry",
    "TaskRegistry",
    "SimulationResult",
    "TaskExample",
    "ModelMetadata",
    "TraceContainer",
    "TokenTraceStep",
    "LatentTraceStep",
    "HebbianTraceStep",
    "BaseModelAdapter",
    "CoTModelAdapter",
    "LatentModelAdapter",
    "HebbianModelAdapter",
    "CoTModelAdapter1M",
    "LatentModelAdapter1M",
    "CoTModelAdapter5M",
    "LatentModelAdapter5M",
    "compute_analytical_flops",
    "measure_execution_latency",
    "token_to_str",
    "tokens_to_str_list"
]
