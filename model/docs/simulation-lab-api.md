# Simulation Lab Backend API Contract & Developer Guide

This document defines the integration contract for connecting external user interfaces (web dashboards, interactive visualizers, REST/WebSocket gateways) to the **Thinking Budget Simulation Lab Backend Engine**.

---

## 1. Architectural Role & Boundary

The Simulation Lab backend provides a clean, model-agnostic service layer that encapsulates:
- PyTorch model instantiation and state dict loading
- Single-example task generation and serialization
- Step-by-step reasoning trace capture (token-by-token for CoT, transition-by-transition for Latent)
- Hardware profiling (isolated CUDA event wall-clock latency) and analytical FLOP accounting
- Multi-budget sweeps and side-by-side model comparisons
- Precomputed empirical Pareto frontiers and statistical comparisons

```
+-------------------------------------------------------------+
|                External Web / UI Layer (Future)             |
|   (Interactive sliders, token heatmaps, state visualizer)   |
+-------------------------------------------------------------+
                              |
               Python API / JSON Integration
                              |
                              v
+-------------------------------------------------------------+
|         simulation_lab.SimulationLabEngine (Backend)        |
|    - Engine: simulation_lab/engine.py                       |
|    - Models: simulation_lab/models.py                       |
|    - Tasks: simulation_lab/tasks.py                         |
|    - Schemas: simulation_lab/schemas.py                     |
|    - Metrics: simulation_lab/metrics.py                     |
+-------------------------------------------------------------+
                              |
            +-----------------+-----------------+
            |                                   |
            v                                   v
+-----------------------+           +-----------------------+
|  AutoregressiveCoT    |           | RecurrentLatentReasoner|
|  (126,168 parameters) |           |  (125,688 parameters) |
|   Causal Transformer  |           |   Cross-Attn + GRU    |
+-----------------------+           +-----------------------+
            |                                   |
            +-----------------+-----------------+
                              |
                              v
                export/models/ Checkpoints
```

**The UI team does NOT need to:**
- Import or configure PyTorch tensors directly
- Manually load `.pth` files or know checkpoint filename conventions
- Implement tokenization, padding masks, or generation loops
- Manage recurrent hidden states or Hebbian matrix resets
- Calculate FLOPs or parse raw benchmark JSON files

---

## 2. Quickstart Integration

```python
from simulation_lab import SimulationLabEngine

# 1. Initialize engine (automatically selects CUDA if available, else CPU)
engine = SimulationLabEngine()

# 2. Inspect available models and tasks
models = engine.list_models()
tasks = engine.list_tasks()

# 3. Generate a standalone problem instance
example = engine.generate_example(task="permutation_orbit", depth=6, seed=42)

# 4. Run a simulation with a specific reasoning budget
result = engine.run_simulation(
    model="recurrent_latent",
    task="permutation_orbit",
    budget_k=8,
    seed=42,
    example=example
)

print(f"Predicted: {result.predicted_answer_str} (Correct: {result.correct})")
print(f"Latency: {result.latency_ms:.3f} ms | FLOPs: {result.analytical_flops:,}")
```

---

## 3. Available Models & Capabilities

| Model ID | Display Name | Paradigm | Parameters | Supported Budgets ($k$) | Supported Tasks | Default Checkpoints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `autoregressive_cot` (alias `cot`) | Autoregressive CoT Transformer | Sequential token generation (126K) | **126,168** | `[1, 2, 4, 8, 12, 16]` | `permutation_orbit`, `modular_register` | `export/models/` |
| `recurrent_latent` (alias `latent`) | Recurrent Latent Reasoner | Recurrent continuous state iteration (126K) | **125,688** | `[1, 2, 4, 8, 12, 16]` | `permutation_orbit`, `modular_register` | `export/models/` |
| `hebbian_synaptic` (alias `hebbian`) | BDH Hebbian Synaptic Memory | Synaptic fast-weight plasticity | **20,672** ($12,480$ trainable) | `[1]` | `associative` (standalone demo) | *In-memory initialization* |
| `autoregressive_cot_1m` (alias `cot_1m`) | Autoregressive CoT Transformer (1M) | Sequential token generation (1M) | **998,520** | `[1, 2, 4, 8, 12, 16]` | `permutation_orbit`, `modular_register` | `export/models_1m/` |
| `recurrent_latent_1m` (alias `latent_1m`) | Recurrent Latent Reasoner (1M) | Recurrent continuous state iteration (1M) | **998,523** | `[1, 2, 4, 8, 12, 16]` | `permutation_orbit`, `modular_register` | `export/models_1m/` |
| `autoregressive_cot_5m` (alias `cot_5m`, `cot_5m_recovery`) | Autoregressive CoT Transformer (5M Recovery) | Sequential token generation (5M) | **5,000,632** | `[1, 2, 4, 8, 12, 16]` | `permutation_orbit`, `modular_register` | `export/models_5m_recovery/` |
| `recurrent_latent_5m` (alias `latent_5m`, `latent_5m_recovery`) | Recurrent Latent Reasoner (5M Recovery) | Recurrent continuous state iteration (5M) | **5,000,635** | `[1, 2, 4, 8, 12, 16]` | `permutation_orbit`, `modular_register` | `export/models_5m_recovery/` |

> [!IMPORTANT]
> The 5M Simulation Lab adapters strictly point to the controlled **5M Convergence Recovery Experiment** checkpoints in `export/models_5m_recovery/`. The original 5M run in `export/models_5m/` represents a historical, optimization-confounded baseline and is preserved separately.

---

## 4. Available Tasks & Problem Formats

| Task ID | Display Name | State Space / Domain | Difficulty Depth ($D$) | Input Token Structure | Expected Answer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `permutation_orbit` (alias `task_a`) | Permutation Orbit Traversal | $S_8$ ($N=8$, $\{0..7\}$) | $D \in [2, 16]$ | `[MAP, pi_0..pi_7, START, v0, HOPS, D]` | $v_D \in \{0..7\}$ |
| `modular_register` (alias `task_b`) | Modular Register Arithmetic | $\mathbb{Z}_{10}$ ($\{0..9\}$) | $D \in [2, 16]$ | `[START, r0, OP_1, c_1, ..., OP_D, c_D]` | $r_D \in \{0..9\}$ |
| `associative` | Continuous Vector Association | Continuous $\mathbb{R}^{64}$ | Fixed $1$ episode | Synthetic key-value association pairs | Continuous vector recall |

---

## 5. Primary Engine Operations

### 5.1 `engine.run_simulation(...)`
Executes an end-to-end reasoning simulation on a single instance.

```python
result = engine.run_simulation(
    model="cot",           # 'cot', 'latent', 'hebbian'
    task="permutation",     # 'permutation', 'modular'
    budget_k=8,             # 1, 2, 4, 8, 12, 16
    seed=42,                # 42, 43, 44, 45, 46
    example=None,           # Optional TaskExample object
    depth=None,             # Optional difficulty depth D in [2, 16]
    measure_timing=True     # If True, records isolated CUDA event wall-clock time
)
```

**Returned Object: `SimulationResult` (`result.to_dict()`)**:
```json
{
  "model_id": "autoregressive_cot",
  "model_name": "Autoregressive CoT Transformer",
  "paradigm": "autoregressive_cot",
  "task_id": "permutation_orbit",
  "task_name": "permutation_orbit",
  "budget_k": 8,
  "seed": 42,
  "checkpoint_path": "export/models/cot_task_a_s42_aligned/weights.pth",
  "expected_answer": 4,
  "expected_answer_str": "4",
  "predicted_answer": 4,
  "predicted_answer_str": "4",
  "correct": true,
  "latency_ms": 7.060,
  "analytical_flops": 1374720.0,
  "total_parameters": 126168,
  "trainable_parameters": 126168,
  "device": "cuda",
  "input_representation": {
    "input_ids": [13, 6, 4, 7, 2, 3, 1, 5, 0, 14, 7, 15, 5],
    "input_tokens": ["MAP", "6", "4", "7", "2", "3", "1", "5", "0", "START", "7", "HOPS", "5"],
    "depth": 5,
    "ground_truth_trajectory": [0, 6, 5, 1, 4],
    "ground_truth_trajectory_str": ["0", "6", "5", "1", "4"]
  },
  "trace": { ... }
}
```

---

### 5.2 Educational Reasoning Traces (`result.trace`)

#### A. Autoregressive CoT Trace (`paradigm: "autoregressive_cot"`)
Reflects sequential discrete token generation.
```json
{
  "paradigm": "autoregressive_cot",
  "description": "Discrete sequential scratchpad generation...",
  "steps": [
    {
      "step_index": 1,
      "token_id": 0,
      "token_str": "0",
      "token_type": "reasoning_step",
      "cumulative_tokens": 1
    },
    {
      "step_index": 5,
      "token_id": 17,
      "token_str": "END_THINK",
      "token_type": "think_end",
      "cumulative_tokens": 5
    }
  ],
  "raw_summary": {
    "tokens_generated": 5,
    "budget_k": 8,
    "early_terminated": true
  }
}
```

#### B. Recurrent Latent Trace (`paradigm: "recurrent_latent"`)
Reflects continuous hidden vector transitions without emitted intermediate tokens.
```json
{
  "paradigm": "recurrent_latent",
  "description": "Continuous recurrent state iteration...",
  "steps": [
    {
      "step_index": 1,
      "hidden_norm": 8.793,
      "hidden_mean": 0.012,
      "hidden_std": 0.982,
      "predicted_token_id": 3,
      "predicted_token_str": "3",
      "top_logits": { "3": 2.30, "6": 2.02, "1": 1.45 }
    }
  ],
  "raw_summary": {
    "steps_executed": 8,
    "fixed_exact_execution": true,
    "adaptive_halting": false
  }
}
```
*Educational Note for UI*: In recurrent latent models, intermediate hidden vectors are continuous. The `predicted_token_str` represents a non-destructive readout projection via the model's categorical head $\mathbf{W}_{\text{head}} \mathbf{h}_t$, allowing the visualizer to show candidate state readouts without confusing them with discrete autoregressive token emissions.

---

### 5.3 Interactive Multi-Budget Sweeps (`engine.sweep_budgets(...)`)
Evaluates the **exact same problem instance** across multiple reasoning budgets ($k \in \{1, 2, 4, 8, 12, 16\}$):

```python
ex = engine.generate_example("permutation_orbit", depth=8, seed=42)
sweep_results = engine.sweep_budgets(
    model="cot",
    task="permutation_orbit",
    example=ex,
    budgets=[1, 2, 4, 8, 12, 16]
)

for r in sweep_results:
    print(f"k={r.budget_k:2d} -> pred: {r.predicted_answer_str} (correct: {r.correct}) in {r.latency_ms:.2f}ms")
```

---

### 5.4 Side-by-Side Model Comparison (`engine.compare_models(...)`)
Directly compares `AutoregressiveCoT` and `RecurrentLatentReasoner` on the identical problem instance and compute budget:

```python
comparison = engine.compare_models(
    models=["cot", "latent"],
    task="permutation_orbit",
    budget_k=8,
    depth=6
)
```

---

### 5.5 Precomputed Pareto & Statistical Data (`engine.get_pareto_data(...)`)
Allows the UI to render the complete frozen empirical Pareto frontier and statistical hypothesis tests without running any local inference across all evaluated experimental scales:

```python
# Query 126K baseline (default)
data_126k = engine.get_pareto_data("permutation_orbit", scale="126k")

# Query authoritative 5M recovery results
data_5m = engine.get_pareto_data("permutation_orbit", scale="5m")

frontiers = data_5m["pareto_frontiers"]          # Non-dominated operating points
conditions = data_5m["aggregated_conditions"]    # Mean +- SEM across 5 seeds
stats = data_5m["statistical_comparison"]        # Paired t-tests and p-values
```

Supported `scale` arguments:
- `'126k'` / `'baseline'`: 126K baseline results (`results/`)
- `'1m'`: 1M scaling results (`results_1m/`)
- `'5m'` / `'5m_recovery'` / `'recovery'`: Authoritative 5M recovery results (`results_5m_recovery/`)
- `'5m_original'`: Historical 5M confounded results (`results_5m/`)

---

## 6. Important Assumptions & Constraints for UI Developers

1. **No Monetary Costs**: All compute metrics are strictly isolated GPU wall-clock latency (milliseconds) and analytical FLOPs. Never convert these metrics into dollar estimates.
2. **Fixed Exact Execution for Latent**: The latent reasoner executes exactly $k$ recurrent steps. There is no dynamic early stopping; $k$ steps are always performed.
3. **Early Termination in CoT**: The CoT model terminates scratchpad generation as soon as `END_THINK` is emitted, which may occur at step $t < k$. Compute FLOPs reflect the actual tokens generated.
4. **State Isolation Guaranteed**: The engine automatically executes `model.eval()`, zeros transient recurrent states, and clears Hebbian memory matrices between simulation calls. Consecutive API calls will not leak hidden states.
