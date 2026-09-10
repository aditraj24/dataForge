# The Thinking Budget — Cost–Accuracy Pareto Frontiers in Reasoning

> **DataForge 2026 | NeurIPS 2026 Education Track**

**🌐 Live demo:** https://data-forge-nitjsr.vercel.app/  
**📦 Source code:** https://github.com/aditraj24/dataForge

---

## Table of Contents

1. [Central Claim](#1-central-claim)
2. [Intended Learner & Prerequisites](#2-intended-learner--prerequisites)
3. [Learning Objectives](#3-learning-objectives)
4. [Artifact Architecture](#4-artifact-architecture)
5. [Role of Every Major Component](#5-role-of-every-major-component)
6. [What is Live / Precomputed / Synthetic / Animated](#6-what-is-live--precomputed--synthetic--animated)
7. [Setup Instructions](#7-setup-instructions)
8. [How to Reproduce the Results](#8-how-to-reproduce-the-results)
9. [Primary References (2022–2026)](#9-primary-references-2022-2026)
10. [Source & License Record](#10-source--license-record)
11. [AI Assistance Disclosure](#11-ai-assistance-disclosure)
12. [Credits](#12-credits)

---

## 1. Central Claim

When neural networks are granted extra computation at inference time, **how** that compute is spent determines whether it produces measurable accuracy gains.

This project directly compares two fundamentally different strategies on parameter-matched models (126K, 1M, 5M parameters) running deterministic algorithmic benchmarks:

| Strategy | Mechanism |
|---|---|
| **Autoregressive Chain-of-Thought (CoT)** | Emits discrete intermediate reasoning tokens into an expanding context window. Each new step attends over all prior tokens. \[[Wei et al., 2022](#d)\] \[[Nye et al., 2021](#c)\] |
| **Recurrent Latent Reasoning** | Keeps sequence length fixed. Circulates an internal continuous hidden vector *z_t* through weight-tied cross-attention + GRU transitions without generating extra tokens. \[[Geiping et al., 2025](#a)\] |

**Central Finding:** Across all three parameter scales, recurrent latent reasoning is competitive and faster at very low budgets (*k* ≤ 2). However, latent accuracy plateaus near **~31–34%** on permutation orbit traversal (Task A) as budget *k* grows — a pattern accompanied by numerical near-stabilization of the recurrent state (‖Δz‖ → 0) and a persistent attention bias toward the initial input token *v₀* \[[Geiping et al., 2025](#a)\]. In contrast, autoregressive CoT scales monotonically with budget, reaching **99.74%** accuracy at 5M parameters under the recovery training protocol.

> **Grounded Claim (falsifiable):** *On our parameter-matched models and deterministic algorithmic benchmarks, the empirical Pareto frontier shifts from fast, low-budget latent configurations toward higher-accuracy CoT configurations as budget k increases. A 40× increase in parameter count (126K → 5M) does not break the latent plateau.*

**This claim would be falsified if:**
- Recurrent latent accuracy had scaled steadily with *k*, exceeding 50% on Task A.
- CoT models had failed to benefit from extra reasoning tokens (*k* ≥ 4).
- Scaling to 1M or 5M parameters had resolved the latent plateau without architecture changes.

> ⚠️ **Scope:** Findings apply to our weight-tied cross-attention + GRU architecture on synthetic algorithmic tasks (permutation orbits and modular arithmetic). They do not constitute a universal claim about all latent reasoning architectures or open-domain NLP.

---

## 2. Intended Learner & Prerequisites

**Intended Learner:**
- ML researchers exploring test-time compute, reasoning scaling, and inference-time optimization.
- AI engineers studying the trade-offs between continuous latent iterations and discrete symbol generation (CoT).
- Full-stack developers bridging complex ML model states with interactive UI dashboards.

**Prerequisites:**
- Basic understanding of neural network architectures — Transformers, Cross-Attention, GRUs.
- Familiarity with Python and PyTorch training loops.
- Basic web development knowledge (React / Next.js, FastAPI) to run the interactive demonstrator.
- Comfort reading mathematical notation (sequences, modular arithmetic, Pareto dominance).

---

## 3. Learning Objectives

After exploring this repository and running the interactive lab, you will be able to:

1. **Distinguish** autoregressive scratchpad reasoning from recurrent latent vector refinement at an architectural level — including state storage, addressing mechanism, FLOP scaling per step, and observability.
2. **Interpret empirical Pareto frontiers** comparing GPU wall-clock latency (ms) and analytical FLOPs against task accuracy, without conflating them with monetary cost.
3. **Diagnose latent saturation** by examining ‖Δz‖ drift, cosine similarity between consecutive hidden states, and cross-attention weight concentration patterns.
4. **Decouple thinking budget *k* from problem depth *D***, and understand under-budgeted, matched-budget, and over-budgeted computational regimes.
5. **Run live simulations** that expose intermediate token traces (CoT) and continuous latent vector updates (Recurrent), and compare them against precomputed 5-seed benchmark baselines.
6. **Connect fast weights to test-time compute** by examining the BDH Hebbian synaptic matrix as a third form of test-time adaptation. \[[Kosowski et al., 2025](#e)\] \[[Engdahl et al., 2026](#f)\]
7. **Recognize optimization confounds**: understand why the initial 5M run failed and how the 5M Recovery protocol resolved it — and why the multi-variable change means we cannot attribute improvement to a single factor.

---

## 4. Artifact Architecture

The repository is organized into three cooperating ecosystems plus a comprehensive model research layer:

```text
dataForge/
├── model/                               ← Research model layer (PyTorch)
│   ├── models_cot_model.py              ← AutoregressiveCoT definition
│   ├── models_latent_model.py           ← RecurrentLatentReasoner definition
│   ├── models_hebbian_model.py          ← HebbianMemory fast-weight module
│   ├── data_generator.py               ← Deterministic task synthesizers
│   ├── simulation_lab/                  ← Simulation engine & registries
│   │   ├── engine.py                    ← SimulationLabEngine orchestrator
│   │   ├── models.py                    ← ModelRegistry, Adapters, Checkpoint loader
│   │   ├── metrics.py                   ← Analytical FLOPs & latency timing
│   │   ├── tasks.py                     ← Task registry & evaluation wrappers
│   │   ├── schemas.py                   ← Pydantic v2 request/response schemas
│   │   └── mock.py                      ← Fallback mock engine (no checkpoints)
│   ├── export/                          ← Serialized PyTorch checkpoints
│   │   ├── models/                      ← 126K baseline (seeds 42–46)
│   │   ├── models_1m/                   ← 1M scaling (seeds 42–46)
│   │   ├── models_5m/                   ← 5M Original (historical / confounded)
│   │   └── models_5m_recovery/          ← 5M Recovery (canonical)
│   ├── results/                         ← Precomputed benchmarks — 126K
│   ├── results_1m/                      ← Precomputed benchmarks — 1M
│   ├── results_5m/                      ← Precomputed benchmarks — 5M original
│   ├── results_5m_recovery/             ← Precomputed benchmarks — 5M recovery
│   ├── run_full_training_5m_recovery.py ← 5M Recovery training pipeline
│   ├── run_benchmark_eval*.py           ← Evaluation scripts per scale
│   ├── process_benchmark_results*.py    ← Pareto JSON generators
│   └── tests/                           ← 73-test pytest suite
│
├── backend/                             ← FastAPI REST server
│   ├── main.py                          ← API entry point & route definitions
│   ├── service.py                       ← SimulationService singleton wrapper
│   └── requirements.txt                 ← Python dependencies
│
├── frontend/                            ← Interactive React/Next.js dashboard
│   └── src/
│       └── components/                  ← Scene-organized UI components
│
├── DETAILED_APPROACH.md                 ← Full technical reference (1053 lines)
└── README.md                            ← This file
```

**Data Flow:**
```
Browser → POST /api/simulate
        → backend/main.py (FastAPI routing)
        → backend/service.py (SimulationService singleton)
        → simulation_lab/engine.py (SimulationLabEngine)
              ├── TaskRegistry (data_generator.py)  → synthesize problem
              ├── ModelRegistry → CheckpointLoader  → load .pth weights
              │       ├── CoTModelAdapter            → forward pass + token trace
              │       ├── LatentModelAdapter         → forward pass + Δz log
              │       └── HebbianModelAdapter        → forward pass + synaptic σ
              └── MetricsEstimator (metrics.py)      → FLOPs + latency
        → JSON response → Frontend renders charts/traces
```

---

## 5. Role of Every Major Component

### Research Model Layer (`model/`)

| File | Role |
|---|---|
| `models_cot_model.py` | `AutoregressiveCoT`: causal Transformer decoder with learnable positional embeddings, multi-head self-attention (causal mask), FFN blocks, and a greedy autoregressive generation loop for *k* reasoning steps. |
| `models_latent_model.py` | `RecurrentLatentReasoner`: encodes the input prefix into static Key/Value memory; runs a weight-tied loop of cross-attention → GRUCell → LayerNorm → FFN exactly *k* times over an internal continuous state *z_t*; reads out via a linear classification head. |
| `models_hebbian_model.py` | `HebbianMemory`: a standalone 20,672-element fast-weight module (12,480 trainable + 8,192 synaptic state entries) implementing outer-product Hebbian updates as a pedagogical illustration of synaptic plasticity as test-time adaptation. \[[Kosowski et al., 2025](#e)\] \[[Engdahl et al., 2026](#f)\] |
| `data_generator.py` | Deterministically synthesizes Task A (Permutation Orbit Traversal in *S₈*) and Task B (Multi-Step Modular Register Arithmetic mod 10) problem instances with configurable depth *D* and budget *k*. All data is **strictly synthetic**. |
| `simulation_lab/engine.py` | `SimulationLabEngine`: the central orchestrator. Loads model checkpoints, wraps them in unified adapters, runs single-example inference with trace capture, and coordinates FLOPs/latency profiling. |
| `simulation_lab/models.py` | `ModelRegistry` + `CheckpointLoader` + three Adapter classes (`CoTModelAdapter`, `LatentModelAdapter`, `HebbianModelAdapter`). Each adapter standardizes the interface and instruments the forward pass to intercept attention matrices and state deltas. |
| `simulation_lab/metrics.py` | `MetricsEstimator`: provides analytical FLOP counts per step and wall-clock latency measurements via monotonic timing. **No monetary cost is measured.** |
| `simulation_lab/tasks.py` | `TaskRegistry`: maps task names to generator instances and provides evaluation wrappers for batch accuracy scoring. |
| `simulation_lab/schemas.py` | Pydantic v2 typed schemas for all REST request/response bodies (`SimulationRequest`, `SimulationResponse`, `ParetoFrontierResponse`, etc.). |
| `simulation_lab/mock.py` | Fallback mock engine that returns plausible synthetic traces when checkpoints are not available (used in CI and frontend development). |

### Backend API (`backend/`)

| File | Role |
|---|---|
| `main.py` | FastAPI application entry point. Defines all REST routes, CORS middleware, and health check. |
| `service.py` | `SimulationService` singleton: instantiates the `SimulationLabEngine` once on startup, ensuring checkpoint weights are loaded only once per process. |

**REST API Endpoints:**

| Method | Route | Mode | Description |
|---|---|---|---|
| `GET` | `/api/health` | Live | Service status, version, device |
| `GET` | `/api/models` | Live | List available model/scale combinations |
| `GET` | `/api/tasks` | Live | List available tasks |
| `GET` | `/api/scales` | Live | Available scales (`126k`, `1m`, `5m_recovery`) |
| `POST` | `/api/examples` | Live | Generate synthetic task examples |
| `POST` | `/api/simulate` | **Live inference** | Full forward pass: tokens/deltas/attention/metrics |
| `POST` | `/api/compare` | **Live inference** | Side-by-side CoT vs. Latent traces |
| `POST` | `/api/sweep` | **Live inference** | Accuracy + latency sweep across *k* ∈ {1,2,4,8,12,16} |
| `GET` | `/api/pareto` | **Precomputed** | Non-dominated Pareto frontier points from JSON |

### Interactive Frontend (`frontend/`)

Ten narrative scenes organized as a guided learning sequence:

| Scene | Content |
|---|---|
| 1. The Frontier Challenge | Overview of inference-time scaling motivation |
| 2. The Thinking Budget | Visual comparison: token generation vs. recurrent vector updates |
| 3. Permutation Orbit Traversal | Interactive step-by-step orbit visualizer (*v_D = π^D(v₀)*) |
| 4. The Two Engines | Architectural side-by-side of CoT Transformer vs. Recurrent Latent Reasoner |
| 5. Interactive Simulation Bench | **Live**: controls for budget *k*, task, model; renders inference traces |
| 6. Vector Saturation Probe | **Live + Animated**: 3D trajectory plot of ‖Δz‖ convergence |
| 7. Pareto Frontier Instrument | **Precomputed**: accuracy vs. latency/FLOPs scatter, non-dominated points highlighted |
| 8. Capacity Scaling | Accuracy comparisons across 126K, 1M, 5M scales |
| 9. The 5M Recovery Lab | Walkthrough of optimization failure and revised training schedule |
| 10. Bio-Inspired Fast Weights | **Live + Animated**: Hebbian synaptic matrix *σ* real-time visualization |

---

## 6. What is Live / Precomputed / Synthetic / Animated

### Computational Provenance Matrix

| Component | Live? | Precomputed? | Source |
|---|---|---|---|
| Single-query inference (CoT or Latent) | **YES** | No | PyTorch forward pass via `CheckpointLoader` |
| Step-by-step token trace (CoT) | **YES** | No | Intercepted from `CoTModelAdapter` |
| Attention heatmaps | **YES** | No | PyTorch hooks in adapter |
| Latent vector deltas ‖Δz‖ | **YES** | No | Intercepted in `LatentModelAdapter` |
| Hebbian synaptic matrix *σ* | **YES** | No | Live outer-product in `HebbianMemory` |
| Pareto frontier curves | No | **YES** | `results*/pareto_frontiers.json` |
| 5-seed aggregated statistics | No | **YES** | `results*/aggregated_results.json` |
| Statistical *p*-values | No | **YES** | `results*/statistical_comparison.json` |
| Per-seed raw benchmark results | No | **YES** | `results/raw_benchmark_results.json` |

### What is Synthetic

All task datasets (Task A and Task B) are **100% synthetically generated** by `data_generator.py`.  
No real-world corpora, user data, or licensed third-party datasets are used.

- **Task A — Permutation Orbit Traversal (*S₈*):** Given permutation π and starting value *v₀*, compute *v_D = π^D(v₀)* for depth *D* ∈ {2…16}. Problem instances are sampled uniformly at random from *S₈ × V × D*.
- **Task B — Modular Register Arithmetic (ℤ₁₀):** Given initial register *r₀* and a chain of *D* (op, constant) pairs where op ∈ {ADD, MUL, SUB}, compute terminal value *r_D* in ℤ₁₀. *(Note: Both models performed near the 10% random-guess floor on Task B across all scales and budgets — Task B is inconclusive.)*

### What is Animated / Illustrative

- **Latent Vector Saturation Plot (Scene 6):** Animated 3D trajectory showing how the recurrent state *z_t* rapidly stops changing. The path is reconstructed from the live ‖Δz‖ trace returned by `/api/simulate`. This is dynamically rendered — not a pre-rendered video.
- **Attention Heatmaps (Scene 5):** Rendered from live attention weight tensors returned in the simulation response; updated with each new query.
- **Hebbian Synaptic Matrix (Scene 10):** Animated outer-product update visualization, redrawn after every forward pass. The matrix entries are the actual *σ* values from the live `HebbianMemory` forward pass.
- **Reasoning Trace Stepper (Scene 5):** For CoT, the sequence of generated tokens is presented step-by-step with animation. For Latent, the *z_t* state updates at each recurrent iteration are shown as animated bar charts. Both are derived from live inference responses.

---

## 7. Setup Instructions

### Prerequisites

- Python ≥ 3.10
- Node.js ≥ 18 (for the frontend)
- A CPU is sufficient for interactive inference. A CUDA GPU is recommended only for full training runs.

### 1. Clone the Repository

```bash
git clone https://github.com/aditraj24/dataForge.git
cd dataForge
```

### 2. Set Up the Python Environment (Backend + Model)

```bash
cd backend
python -m venv .venv

# Activate:
.venv\Scripts\activate        # Windows PowerShell
# source .venv/bin/activate   # macOS / Linux

pip install -r requirements.txt
```

`requirements.txt` installs:
- `fastapi`, `uvicorn[standard]`, `gunicorn` — API server
- `pydantic` — request/response validation
- `python-dotenv` — environment config
- `numpy` — numerical utilities
- `torch==2.14.0` (CPU build via PyTorch index) — model inference

### 3. Start the Backend Server

```bash
# From the backend/ directory, with .venv activated:
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at **`http://127.0.0.1:8000`**.  
Visit `http://127.0.0.1:8000/docs` for the interactive Swagger UI.

### 4. Set Up and Start the Frontend

```bash
# Open a new terminal from the repository root:
cd frontend
npm install
npm run dev
```

The interactive dashboard will be available at **`http://localhost:3000`**.

### 5. Quick Live Simulation (Optional — No Frontend Required)

```bash
# Run a live latent model inference with budget k=4:
curl -X POST http://127.0.0.1:8000/api/simulate \
     -H "Content-Type: application/json" \
     -d '{"model": "latent", "scale": "5m_recovery", "task": "task_a", "budget": 4}'

# Retrieve the precomputed 5M Recovery Pareto frontier:
curl "http://127.0.0.1:8000/api/pareto?scale=5m_recovery&task=task_a"
```

### 6. Run the Automated Test Suite

```bash
# From model/ directory with venv activated:
cd ../model
pip install -r requirements.txt  # installs scipy, pytest additionally
pytest -q
# Expected: 73 passed in ~7s
```

---

## 8. How to Reproduce the Results

> ⚠️ Full training requires a CUDA GPU and significant wall-clock time. The checkpoints are already included in `export/` for interactive use.

### Step-by-Step Reproduction

```bash
# Navigate to the model directory:
cd model

# Step 1: (Optional) Reproduce 126K Baseline Training
python run_full_training.py

# Step 2: (Optional) Reproduce 1M Scaling Training
python run_full_training_1m.py

# Step 3: Reproduce 5M Recovery Training
#   Key hyperparameters: LR=5e-4, 5-epoch warmup, 50 epochs (6250 steps),
#   cosine decay to 1e-5, gradient clipping=1.0, batch=32, AdamW, 5 seeds (42-46)
python run_full_training_5m_recovery.py

# Step 4: Run Benchmark Evaluation (1000 test instances x 5 seeds x 6 budgets)
python run_benchmark_eval.py               # 126K baseline
python run_benchmark_eval_1m.py            # 1M scaling
python run_benchmark_eval_5m_recovery.py   # 5M recovery

# Step 5: Generate Precomputed Pareto JSON Files
python process_benchmark_results.py              # -> results/pareto_frontiers.json
python process_benchmark_results_1m.py           # -> results_1m/pareto_frontiers.json
python process_benchmark_results_5m_recovery.py  # -> results_5m_recovery/pareto_frontiers.json
```

### Key Empirical Results (pre-reproduced)

**Task A — Permutation Orbit Traversal, Accuracy (%) at budget *k*, 5-Seed Mean:**

| Model | k=1 | k=2 | k=4 | k=8 | k=12 | k=16 |
|---|---|---|---|---|---|---|
| **CoT 126K** | 21.54% | 29.70% | 41.82% | 57.18% | 63.18% | 73.36% |
| **Latent 126K** | 23.70% | 32.30% | 32.88% | 33.14% | 33.04% | 33.06% |
| **CoT 1M** | 17.92% | 25.32% | 39.06% | 52.14% | 64.36% | 76.70% |
| **Latent 1M** | 14.38% | 30.88% | 31.08% | 31.12% | 31.12% | 31.12% |
| **CoT 5M Recovery** | 22.48% | 33.94% | 44.54% | 63.34% | 80.26% | **99.74%** |
| **Latent 5M Recovery** | 15.46% | 31.44% | 33.38% | 33.94% | 33.98% | 33.92% |

**5M Recovery Pareto Frontier (non-dominated points):**
- Latent k=2: 31.44% accuracy, 0.079 ms — **Non-dominated** (fastest)
- CoT k=4: 44.54% accuracy, 0.289 ms — **Non-dominated**
- CoT k=16: 99.74% accuracy, 1.168 ms — **Non-dominated** (highest accuracy)
- Latent k ∈ {4,8,12,16}: **Strictly dominated** by CoT k ≥ 2

**Model Parameter Counts (verified from checkpoint state dicts):**

| Scale | CoT Params | Latent Params | Delta |
|---|---|---|---|
| 126K | 126,168 | 125,688 | 0.38% |
| 1M | 998,520 | 998,523 | 0.0003% |
| 5M Recovery | 5,000,632 | 5,000,635 | 0.00006% |

### The 5M Original Run (Historical / Confounded)

The first 5M training run (`results_5m/`) failed to converge — training loss stalled near 1.53. It used the same 20-epoch constant LR schedule from the 126K baseline, which was insufficient for a 40× parameter scale. The 5M Recovery protocol resolved this by combining: lower peak LR (5×10⁻⁴), 5-epoch linear warmup, extended training (50 epochs / 6250 steps), and cosine decay.

> ⚠️ Because these changes were made simultaneously, the improvement demonstrates successful training but does not isolate which individual hyperparameter change was critical.

---

## 9. Primary References (2022–2026)

All citations are placed inline with the technical claims they support throughout this README. The following four papers (all from 2022–2026) directly motivate, implement, test, or extend the core concepts evaluated in this project.

---

### [D] Wei et al., 2022 — Chain-of-Thought Prompting {#d}

> Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, Brian Ichter, Fei Xia, Ed Chi, Quoc Le, Denny Zhou. **Chain-of-Thought Prompting Elicits Reasoning in Large Language Models.** *NeurIPS 2022.*  
> arXiv: [2201.11903](https://arxiv.org/abs/2201.11903)

**How it relates to this project:** This paper establishes the foundational mechanism — generating intermediate reasoning tokens (a "scratchpad" of explicit steps) as the standard approach for allocating test-time compute in language models. Our `AutoregressiveCoT` architecture and teacher-forced training on intermediate trace sequences directly implement this paradigm. The observed monotonic accuracy scaling with budget *k* in our experiments is consistent with the token-budget scaling behavior this paper identifies. All claims in this project about scratchpad-style intermediate computation are grounded in this work.

---

### [A] Geiping et al., 2025 — Recurrent Depth / Latent Reasoning {#a}

> Jonas Geiping, Sean McLeish, Neel Jain, John Kirchenbauer, Siddharth Singh, Brian R. Rounds, Abhinav Bhatele, Tom Goldstein. **Scaling up Test-Time Compute with Latent Reasoning: A Recurrent Depth Approach.** *arXiv preprint.* 2025.  
> arXiv: [2502.05171](https://arxiv.org/abs/2502.05171)

**How it relates to this project:** This paper proposes and evaluates recurrent depth models that compute over a fixed-length latent state without generating extra output tokens — the direct inspiration for our `RecurrentLatentReasoner`. Our cross-attention + GRU weight-tied recurrent architecture is a pedagogical re-implementation of the core recurrent depth principle at small scales (126K–5M). The empirical accuracy plateau and state near-stabilization (‖Δz‖ → 0) we observe in our experiments can be viewed as a small-scale instance of the capacity and convergence dynamics this work analyzes for continuous-thought computation.

---

### [E] Kosowski et al., 2025 — The Dragon Hatchling (BDH) {#e}

> Adrian Kosowski, Szymon Tworkowski, Marek Cygan, Łukasz Kaiser. **The Dragon Hatchling: The Missing Link Between the Transformer and Models of the Brain.** *arXiv preprint.* 2025.  
> arXiv: [2509.26507](https://arxiv.org/abs/2509.26507)

**How it relates to this project:** This paper introduces the **Bio-inspired Differentiable Hebbian (BDH)** architecture, which frames fast-weight synaptic updates as a form of in-context plasticity bridging transformer attention and biological Hebbian learning. Our `HebbianMemory` module (`models_hebbian_model.py`) is a standalone 20,672-element pedagogical toy implementation inspired by this framework. Scene 10 of the frontend visualizes these synaptic updates as a third test-time adaptation paradigm alongside CoT and recurrent latent reasoning. Our `HebbianMemory` is an independent implementation; it is not a reproduction of the official BDH codebase.

---

### [F] Engdahl et al., 2026 — BDH-CQ: In-Context Recurrent Latent Reasoning {#f}

> Erik Engdahl, Adrian Kosowski, Szymon Tworkowski. **BDH-CQ: In-Context Learning with Recurrent Latent Reasoning.** *arXiv preprint.* 2026.  
> arXiv: [2608.09888](https://arxiv.org/abs/2608.09888)

**How it relates to this project:** This paper extends the BDH framework with a Cross-Query (CQ) variant that achieves 29.5% pass@2 on ARC-AGI at $0.0007/task — demonstrating that recurrent latent reasoning with Hebbian fast weights can reach competitive in-context learning performance on real reasoning benchmarks. It tests the hypothesis (also examined in our project) that latent recurrence can usefully scale with inference budget. The BDH-CQ paper's ARC-AGI result is cited as a developer-reported benchmark; it is **not** independently reproduced by this project.

---

### Additional References

| Key | Citation |
|---|---|
| [C] | Maxwell Nye et al. **Show Your Work: Scratchpads for Intermediate Computation with Language Models.** *arXiv preprint.* 2021. [arXiv:2112.00114](https://arxiv.org/abs/2112.00114). (Establishes the scratchpad approach to intermediate computation; grounds our CoT trace supervision design.) |
| [B] | Alex Graves. **Adaptive Computation Time for Recurrent Neural Networks.** *arXiv preprint.* 2016. [arXiv:1603.08983](https://arxiv.org/abs/1603.08983). (Foundational work on variable-depth recurrent computation; motivates the theoretical framing of budget-*k* thinking.) |

---

