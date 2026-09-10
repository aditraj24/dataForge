import sys
import os

# Add d 'maadal' directory ko Python path ko laoo simulation_lab
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'model'))
sys.path.insert(0, MODEL_DIR)
os.chdir(MODEL_DIR)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from simulation_lab import SimulationLabEngine

app = FastAPI(title="Thinking Budget API")

frontend_url = os.environ.get("FRONTEND_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url] if frontend_url != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SimulationLabEngine()

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "thinking-budget-api",
        "device_info": {
            "device_type": engine.device.type if hasattr(engine, 'device') else "cpu"
        }
    }


@app.get("/api/models")
def get_models():
    return engine.list_models()

@app.get("/api/tasks")
def get_tasks():
    return engine.list_tasks()

@app.get("/api/example")
def generate_example(task: str = "permutation_orbit", depth: int = 6, seed: int = 42):
    try:
        example = engine.generate_example(task=task, depth=depth, seed=seed)
        return {
            "prompt_tokens": example.input_tokens,
            "target_answer": example.expected_answer_str,
            "metadata": example.raw_metadata
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

class SimulateRequest(BaseModel):
    model: str
    task: str = "permutation_orbit"
    budget_k: int
    seed: int = 42
    depth: int = 6

class SweepRequest(BaseModel):
    model: str
    task: str = "permutation_orbit"
    budgets: list[int] = [1, 2, 4, 8, 12, 16]
    seed: int = 42
    depth: int = 6

class CompareRequest(BaseModel):
    models: list[str] = ["cot", "latent"]
    task: str = "permutation_orbit"
    budget_k: int = 8
    seed: int = 42
    depth: int = 6

class ExampleRequest(BaseModel):
    task: str = "permutation_orbit"
    depth: int = 6
    seed: int = 42

@app.post("/api/examples")
@app.post("/api/example")
def generate_example_api(req: ExampleRequest):
    try:
        example = engine.generate_example(task=req.task, depth=req.depth, seed=req.seed)
        return {
            "prompt_tokens": example.input_tokens,
            "target_answer": example.expected_answer_str,
            "metadata": example.raw_metadata,
            **example.to_dict()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/simulate")
def run_simulation(req: SimulateRequest):
    try:
        example = engine.generate_example(task=req.task, depth=req.depth, seed=req.seed)
        result = engine.run_simulation(
            model=req.model,
            task=req.task,
            budget_k=req.budget_k,
            seed=req.seed,
            example=example,
            measure_timing=True
        )
        return result.to_dict()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/sweep")
def run_sweep(req: SweepRequest):
    try:
        example = engine.generate_example(task=req.task, depth=req.depth, seed=req.seed)
        results = engine.sweep_budgets(
            model=req.model,
            task=req.task,
            example=example,
            budgets=req.budgets,
            seed=req.seed
        )
        return {
            "model_id": req.model,
            "task_id": req.task,
            "results": [r.to_dict() for r in results]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/compare")
def run_compare(req: CompareRequest):
    try:
        res = engine.compare_models(
            models=req.models,
            task=req.task,
            budget_k=req.budget_k,
            seed=req.seed,
            depth=req.depth
        )
        return res
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/pareto")
def get_pareto(scale: str = "126k", task: str = "permutation_orbit"):
    try:
        return engine.get_pareto_data(task, scale=scale)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
