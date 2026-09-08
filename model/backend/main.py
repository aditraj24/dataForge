"""
FastAPI application for the Thinking Budget Simulation Service.
Exposes REST endpoints for model inference, problem generation, sweeps, and Pareto queries.
"""

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.schemas import (
    HealthResponse,
    ModelInfo,
    TaskInfo,
    ScaleInfo,
    GenerateExampleRequest,
    TaskExampleResponse,
    SimulateRequest,
    SimulationResultResponse,
    CompareRequest,
    CompareResponse,
    SweepRequest,
    SweepResponse,
    ParetoResponse
)
from backend.service import SimulationService

app = FastAPI(
    title="The Thinking Budget Simulation API",
    description=(
        "REST API serving the Thinking Budget Simulation Lab. "
        "Provides interactive simulation, step-by-step reasoning trace extraction, "
        "and empirical Pareto frontier data contrasting Autoregressive Chain-of-Thought (CoT) "
        "with Recurrent Latent Reasoning."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration allowing Vite dev server aor local clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def get_health() -> HealthResponse:
    """
wapes dos service health aor active compute device information.
"""
    service = SimulationService.get_instance()
    return HealthResponse(**service.get_health())


@app.get("/api/models", response_model=List[ModelInfo], tags=["Metadata"])
def get_models() -> List[ModelInfo]:
    """
Lists all registered reasoning maadals across 126K, 1M, aor 5M scales.
"""
    service = SimulationService.get_instance()
    return [ModelInfo(**m) for m in service.list_models()]


@app.get("/api/tasks", response_model=List[TaskInfo], tags=["Metadata"])
def get_tasks() -> List[TaskInfo]:
    """
Lists all available synthetic reasoning tasks (Task A, Task B, Associative).
"""
    service = SimulationService.get_instance()
    return [TaskInfo(**t) for t in service.list_tasks()]


@app.get("/api/scales", response_model=List[ScaleInfo], tags=["Metadata"])
def get_scales() -> List[ScaleInfo]:
    """
Lists experimental parmeter scales aor their authoritative vs historical status.
"""
    service = SimulationService.get_instance()
    return [ScaleInfo(**s) for s in service.list_scales()]


@app.post("/api/examples", response_model=TaskExampleResponse, tags=["Simulation"])
def generate_example(req: GenerateExampleRequest) -> TaskExampleResponse:
    """
benaos a standardized problem instance kay lyye interactive experimentation.
"""
    try:
        service = SimulationService.get_instance()
        ex = service.generate_example(task=req.task, depth=req.depth, seed=req.seed)
        return TaskExampleResponse(**ex)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@app.post("/api/simulate", response_model=SimulationResultResponse, tags=["Simulation"])
def simulate(req: SimulateRequest) -> SimulationResultResponse:
    """
    Runs single-instance model inference with step-by-step reasoning trace capture,
    isolated GPU latency profiling, and analytical FLOP accounting.
    """
    try:
        service = SimulationService.get_instance()
        res = service.simulate(
            model=req.model,
            task=req.task,
            budget_k=req.budget_k,
            seed=req.seed,
            example=req.example,
            depth=req.depth,
            measure_timing=req.measure_timing
        )
        return SimulationResultResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Simulation failed: {str(e)}")


@app.post("/api/compare", response_model=CompareResponse, tags=["Simulation"])
def compare(req: CompareRequest) -> CompareResponse:
    """
    Evaluates multiple models side-by-side on the EXACT same problem instance.
    Guarantees that input tokens, ground-truth trajectory, and expected answer are identical.
    """
    try:
        service = SimulationService.get_instance()
        res = service.compare(
            models=req.models,
            task=req.task,
            budget_k=req.budget_k,
            seed=req.seed,
            example=req.example,
            depth=req.depth
        )
        return CompareResponse(
            task_example=res["task_example"],
            budget_k=res["budget_k"],
            models_evaluated=[SimulationResultResponse(**m) for m in res["models_evaluated"]]
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Comparison failed: {str(e)}")


@app.post("/api/sweep", response_model=SweepResponse, tags=["Simulation"])
def sweep(req: SweepRequest) -> SweepResponse:
    """
    Sweeps a model across multiple compute budgets k on the identical problem instance.
    Demonstrates how prediction correctness and traces evolve as budget increases.
    """
    try:
        service = SimulationService.get_instance()
        res = service.sweep(
            model=req.model,
            task=req.task,
            budgets=req.budgets,
            seed=req.seed,
            example=req.example,
            depth=req.depth
        )
        return SweepResponse(
            model_id=res["model_id"],
            task_id=res["task_id"],
            seed=res["seed"],
            results=[SimulationResultResponse(**r) for r in res["results"]]
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Sweep failed: {str(e)}")


@app.get("/api/pareto", response_model=ParetoResponse, tags=["Benchmark"])
def get_pareto(
    task: Optional[str] = Query(default=None, description="Task identifier ('task_a' / 'permutation_orbit')"),
    scale: str = Query(default="126k", description="Scale: '126k', '1m', '5m' / '5m_recovery', '5m_original'")
) -> ParetoResponse:
    """
    Returns precomputed empirical non-dominated Pareto frontiers and condition summaries
    directly from the frozen benchmark result files.
    """
    try:
        service = SimulationService.get_instance()
        data = service.get_pareto(task=task, scale=scale)
        return ParetoResponse(
            scale=data["scale"],
            task=data.get("task"),
            pareto_frontiers=data["pareto_frontiers"],
            aggregated_conditions=data["aggregated_conditions"],
            statistical_comparison=data["statistical_comparison"]
        )
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Pareto query failed: {str(e)}")
