# Agent Guidelines & Repository Operating Rules

## 1. Project Purpose & Scope
This repository contains an empirical machine learning research pipeline investigating the test-time compute vs. accuracy trade-off between two capacity-matched reasoning paradigms across three parameter scales (126K, 1M, 5M):
1. **`AutoregressiveCoT`**: Sequential token-based scratchpad reasoning (causal Transformer decoder).
2. **`RecurrentLatentReasoner`**: Recurrent latent state reasoning (structured memory cross-attention + GRUCell).
3. **`HebbianMemory`**: Standalone fast-weight synaptic memory model implementing BDH outer-product plasticity (retained as an educational artifact; did not participate in the multi-seed benchmark).

---

## 2. Core Research Integrity Rules

1. **Source-of-Truth Hierarchy**:
   - 1. Executable source code (`*.py`)
   - 2. Saved model checkpoints and training logs (`export/models*/`)
   - 3. Benchmark results JSONs (`results*/*.json`)
   - 4. Audited scientific reports (`results*/RESULTS*.md`)
   - 5. Technical documentation (`docs/*.md`)
   - 6. High-level summary documentation (`README.md`)

2. **Strict Architecture & Baseline Freeze**:
   - Do NOT overwrite historical baselines: `export/models/`, `export/models_1m/`, `export/models_5m/`, `results/`, `results_1m/`, `results_5m/`.
   - The original 5M experiment is retained as [HISTORICAL] / [CONFOUNDED].
   - The 5M recovery experiment is retained as [MEASURED] / [CONTROLLED OPTIMIZATION CONDITION].
   - Do NOT modify model definitions (`models_cot_model.py`, `models_latent_model.py`) or data generation (`data_generator.py`).

3. **Empirical Compute vs. Monetary Costs**:
   - Compute must be reported strictly as measured GPU wall-clock latency (ms via CUDA events) or analytical FLOPs.
   - Never claim "accuracy per dollar" or monetary pricing, as monetary costs were not measured.

4. **Empirical Pareto Frontiers**:
   - Pareto frontiers must be constructed strictly from observed non-dominated operating points $(C_{\text{latency}}, A_{\text{accuracy}})$.
   - Do NOT use interpolation, convex hull assumptions, or theoretical curve fitting.

5. **Statistical Precision**:
   - $n=5$ represents independent training seeds (replicates). The 1,000 test cases are repeated evaluation instances.
   - Paired $t$-tests compare models at the same nominal budget $k$. They do NOT establish latency-matched statistical significance.

6. **Defensible Scientific Language**:
   - Distinguish [OBSERVED], [STRONGLY SUPPORTED], [PLAUSIBLE HYPOTHESIS], and [NOT DETERMINED].
   - Do NOT claim universal inferiority of latent reasoning or universal superiority of CoT. Findings apply specifically to the tested architectures, tasks, training protocols, and budgets.
   - Do NOT convert measured observations into causal mechanisms. (E.g., late-step contraction and initial-token attention concentration are observed behaviors consistent with a memory-addressing limitation, not proven causal mechanisms).

---

## 3. Current Repository Layout

```
e:/pro/pro/
├── .venv/                                # Local Python 3.11.9 virtual environment
├── data_generator.py                     # Task A (Permutation Orbit) & Task B (Modular Register)
├── models_cot_model.py                   # AutoregressiveCoT architecture definition
├── models_latent_model.py                # RecurrentLatentReasoner architecture definition
├── models_hebbian_model.py               # HebbianMemory (standalone BDH synaptic memory)
├── run_full_training.py                  # 126K baseline training runner (20 runs)
├── run_full_training_1m.py               # 1M scaling training runner (20 runs)
├── run_full_training_5m.py               # 5M original training runner (20 runs, confounded)
├── run_full_training_5m_recovery.py      # 5M recovery training runner (20 runs, warmup + cosine)
├── run_benchmark_eval.py                 # 126K benchmark evaluation script
├── run_benchmark_eval_1m.py              # 1M benchmark evaluation script
├── run_benchmark_eval_5m.py              # 5M original benchmark evaluation script
├── run_benchmark_eval_5m_recovery.py     # 5M recovery benchmark evaluation script
├── process_benchmark_results.py          # 126K results processing & Pareto extraction
├── process_benchmark_results_1m.py       # 1M results processing & Pareto extraction
├── process_benchmark_results_5m.py       # 5M results processing & Pareto extraction
├── process_benchmark_results_5m_recovery.py # 5M recovery results processing & Pareto extraction
├── run_simulation.py                     # CLI for interactive Simulation Lab engine
├── simulation_lab/                       # Modular Simulation Lab backend package
│   ├── engine.py                         # SimulationLabEngine core service
│   ├── models.py                         # Model adapters (126K, 1M, 5M CoT & Latent, Hebbian)
│   ├── tasks.py                          # Task adapters & serialization
│   ├── schemas.py                        # Dataclass schemas for traces & results
│   └── metrics.py                        # Profiling and latency measurement
├── export/                               # Model checkpoints & training logs
│   ├── models/                           # 126K baseline checkpoints (20 runs)
│   ├── models_1m/                        # 1M scaling checkpoints (20 runs)
│   ├── models_5m/                        # 5M original checkpoints (20 runs, confounded)
│   └── models_5m_recovery/               # 5M recovery checkpoints (20 runs, controlled)
├── results/                              # 126K benchmark data & RESULTS.md
├── results_1m/                           # 1M benchmark data & RESULTS_1M.md
├── results_5m/                           # 5M original benchmark data & RESULTS_5M.md
├── results_5m_recovery/                  # 5M recovery benchmark data & RESULTS_5M_RECOVERY.md
├── docs/                                 # Research documentation
│   ├── 01-requirements.md                # Functional, technical, and hypothesis requirements
│   ├── 02-architecture.md                # System architecture and component traceability
│   ├── 03-tech-stack.md                  # Runtime environment, PyTorch, CUDA, RTX 4060
│   ├── 06-development-plan.md            # Staged development and progress dashboard
│   ├── 07-decisions.md                   # Architecture Decision Records (ADR-001 to ADR-010)
│   ├── 08-changelog.md                   # Versioned changelog of changes and milestones
│   ├── 11-known-issues.md                # Resolved bugs, active limitations, and future work
│   ├── dataset.md                        # Formal dataset definitions (Task A & Task B)
│   ├── model-card.md                     # Capacity-matched model specifications across scales
│   ├── ml-pipeline.md                    # Multi-seed training protocols across scales
│   ├── evaluation.md                     # Hardware profiling, Pareto extraction, statistical tests
│   └── simulation-lab-api.md             # Simulation Lab backend API contract
├── README.md                             # Presentation overview and empirical reconciliation
├── requirements.txt                      # Python dependencies
└── LICENSES.md                           # License information
```

---

## 4. Coding & Experimental Constraints
- **Zero Retraining / Modification Rule**: The experimental phases are complete. Do NOT modify model architectures, dataset generators, training scripts, checkpoints, or results JSON files.
- **Strict Device Handling**: Always use dynamic device resolution: `torch.device('cuda' if torch.cuda.is_available() else 'cpu')`.
- **Reproducibility**: All pseudo-random number generation must use explicit seeds (`torch.manual_seed`, `np.random.default_rng`).
