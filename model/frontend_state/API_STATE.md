# API State

## Tracked Endpoints

| Endpoint | Method | Status | Frontend Consumer | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `/api/health` | GET | VERIFIED | App shell, status indicator | Returns service name and active device (CUDA/CPU) |
| `/api/models` | GET | VERIFIED | Simulation Lab model selector | Returns metadata from `ModelRegistry` |
| `/api/tasks` | GET | VERIFIED | Simulation Lab task selector | Returns registered tasks from `TaskRegistry` |
| `/api/scales` | GET | VERIFIED | Scale selector, Pareto filters | Describes 126K, 1M, 5M Recovery, 5M Original |
| `/api/examples` | POST | VERIFIED | Puzzle, Live Experiment, Lab | Generates deterministic problem instance |
| `/api/simulate` | POST | VERIFIED | Simulation Lab single runner | Runs single model inference with trace |
| `/api/compare` | POST | VERIFIED | Live Experiment, Lab Compare | Runs multiple models on the EXACT same instance |
| `/api/sweep` | POST | VERIFIED | Lab Budget Sweep | Runs $k \in \{1,2,4,8,12,16\}$ on same instance |
| `/api/pareto` | GET | VERIFIED | Pareto Chart, Scale Explorer | Precomputed empirical non-dominated points |

## Validation Rules
- `budget_k` must be in `[1, 2, 4, 8, 12, 16]` for standard models.
- Reject invalid budgets with HTTP 422.
- Input instances for `compare` must be shared across all evaluated models.
