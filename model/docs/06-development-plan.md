# Staged Development & Verification Plan

This plan tracks the progression of the project across all development, execution, benchmarking, scaling, and reconciliation phases.

---

## Progress Dashboard

- [x] **Phase 1 — Repository Audit & Problem Identification** [COMPLETED]
  - [x] Inspect actual file/folder structure and list all physical files.
  - [x] Audit early README claims against code reality.
  - [x] Inspect model architectures, parameter counts, and data generators.
  - [x] Audit dependency requirements and verify CUDA/GPU availability (NVIDIA RTX 4060 detected).
  - [x] Identify syntax errors, missing module imports, and shape mismatches.
  - [x] Establish research integrity rules and source-of-truth order.

- [x] **Phase 2 — Bug Fixes & Architectural Standardization** [COMPLETED]
  - [x] Fix missing `import torch.nn as nn` in training scripts.
  - [x] Fix decoder dimensions in `models_hebbian_model.py` ($64 \to 64$).
  - [x] Correct device handling and dictionary keys in `training_compare_costs.py`.
  - [x] Implement Task A (`TaskAPermutationOrbit`) and Task B (`TaskBModularRegister`) in `data_generator.py`.
  - [x] Implement `AutoregressiveCoT` in `models_cot_model.py` with causal scratchpad generation.
  - [x] Implement `RecurrentLatentReasoner` in `models_latent_model.py` with structured memory cross-attention and GRUCell recurrence.
  - [x] Verify exact programmatic capacity matching: `126,168` vs `125,688` parameters (0.38% relative difference).
  - [x] Implement `training_train_latent.py` supporting aligned intermediate supervision and terminal supervision.

- [x] **Phase 3 — Pipeline Smoke Tests & Pre-Flight Verification** [COMPLETED]
  - [x] Execute unit test suite `test_research_pipeline.py` (all tests passing).
  - [x] Verify batch collation, dynamic padding, and attention masking.
  - [x] Verify single-batch forward/backward passes for CoT and Latent models under aligned and e2e regimes.
  - [x] Audit under-budget ($k < D$), matched-budget ($k = D$), and over-budget ($k > D$) evaluation mechanics in `test_eval_pipeline.py`.
  - [x] Confirm fixed exact execution for latent reasoner (no adaptive halting).

- [x] **Phase 4 — 126K Baseline Training Execution** [COMPLETED]
  - [x] Execute automated 5-seed training via `run_full_training.py` on NVIDIA RTX 4060 GPU.
  - [x] Train 5 seeds (42, 43, 44, 45, 46) of `AutoregressiveCoT` and `RecurrentLatentReasoner` on Task A and Task B (20 runs total).
  - [x] Save all 20 checkpoints and epoch loss curves under `export/models/`.

- [x] **Phase 5 — 126K Benchmarking & Pareto Analysis** [COMPLETED]
  - [x] Execute `run_benchmark_eval.py` across all 20 models and 6 budgets $k \in \{1, 2, 4, 8, 12, 16\}$.
  - [x] Measure isolated GPU wall-clock latency per sample using CUDA events with warm-up.
  - [x] Compute analytical FLOPs per sample.
  - [x] Log 120 raw benchmark evaluation records to `results/raw_benchmark_results.json`.
  - [x] Execute `process_benchmark_results.py` to extract non-dominated Pareto frontiers and paired statistical tests.
  - [x] Synthesize findings into audited `results/RESULTS.md`.

- [x] **Phase 6 — Simulation Lab Backend Engine & CLI** [COMPLETED]
  - [x] Implement modular `simulation_lab` package (`engine.py`, `models.py`, `tasks.py`, `schemas.py`, `metrics.py`).
  - [x] Implement unified `run_simulation.py` CLI supporting single runs, sweeps, and side-by-side comparisons.
  - [x] Implement comprehensive unit tests in `test_simulation_lab.py` (all tests passing).

- [x] **Phase 7 — 1M Parameter Capacity-Scaling Experiment** [COMPLETED]
  - [x] Scale architectures to ~1M parameters: CoT ($998,520$ params) vs Latent ($998,523$ params).
  - [x] Execute 20 training runs via `run_full_training_1m.py` to `export/models_1m/`.
  - [x] Evaluate 120 benchmark records via `run_benchmark_eval_1m.py` to `results_1m/`.
  - [x] Aggregate Pareto frontiers and statistical tests in `results_1m/RESULTS_1M.md`.
  - [x] Finding: Task A CoT scales to $76.70\%$, while Latent remains saturated at $31.12\%$.

- [x] **Phase 8 — Mechanistic Latent Attention & Dynamics Audit** [COMPLETED]
  - [x] Probe recurrent latent state dynamics and cross-attention trajectories across reasoning steps $k$.
  - [x] Observe state update norm contraction ($\|\Delta \mathbf{h}_t\| \to 0$) and cross-attention entropy decrease over recurrent steps.
  - [x] Formulate dynamic memory-addressing hypothesis without claiming unproven causal mechanisms.

- [x] **Phase 9 — 5M Scaling Experiment (Original Run)** [COMPLETED]
  - [x] Scale architectures to ~5M parameters: CoT ($5,000,632$ params) vs Latent ($5,000,635$ params).
  - [x] Execute 20 training runs via `run_full_training_5m.py` under the frozen 20-epoch/constant-LR recipe.
  - [x] Evaluate 120 benchmark records to `results_5m/`.
  - [x] Retained as [HISTORICAL] / [CONFOUNDED] baseline.

- [x] **Phase 10 — 5M Training-Convergence Post-Hoc Audit** [COMPLETED]
  - [x] Inspect all 20 5M training loss curves and checkpoints.
  - [x] Discover that both CoT and Latent failed to converge under the frozen 20-epoch recipe: CoT loss stalled at $1.49$ (vs $0.67$ at 1M), and Latent loss stalled at $\ln(8) \approx 2.079$ (uniform chance).
  - [x] Conclude that original 5M experiment was confounded by optimization underfitting.

- [x] **Phase 11 — 5M Convergence Recovery Experiment (Controlled Optimization)** [COMPLETED]
  - [x] Formulate architecture-neutral recovery protocol: 50 epochs (6,250 steps), base $\text{lr}=5 \times 10^{-4}$, 5 ep linear warmup, cosine decay to $10^{-5}$, gradient clip 1.0.
  - [x] Execute 20 recovery runs via `run_full_training_5m_recovery.py` to `export/models_5m_recovery/`.
  - [x] Pass Convergence Gate: CoT Task A loss dropped to $0.6069$; Latent Task A loss dropped to $1.8890$ (below chance).
  - [x] Evaluate 120 recovery benchmark records via `run_benchmark_eval_5m_recovery.py` to `results_5m_recovery/`.
  - [x] Finding: CoT scales to **$99.74\%$** at $k=16$, while Latent returns to the **$33.92\%$** plateau.

- [x] **Phase 12 — Repository Documentation & Scientific-Language Audit** [COMPLETED]
  - [x] Update all repository documentation to reflect four-scale experimental state.
  - [x] Reconcile central research statement and eliminate unproven causal claims.
  - [x] Remove references to "accuracy per dollar" and mock pricing in favor of measured GPU latency.
  - [x] Ensure strict integrity across all historical baselines and checkpoints.

- [ ] **Phase 13 — Future Architectural Research [PLANNED / FUTURE WORK]**
  - [ ] Adaptive halting mechanisms (e.g. ACT / learned stopping) for recurrent latent models.
  - [ ] Alternative latent recurrence formulations (discrete state transitions, external memory slots).
  - [ ] Parameter scaling beyond 5M under width/depth-adjusted optimization regimes.
  - [ ] Web interactive lab interface (`web/` directory).

---

## Implementation References

- `run_full_training.py`, `run_full_training_1m.py`, `run_full_training_5m.py`, `run_full_training_5m_recovery.py`
- `run_benchmark_eval.py`, `run_benchmark_eval_1m.py`, `run_benchmark_eval_5m.py`, `run_benchmark_eval_5m_recovery.py`
- `process_benchmark_results*.py`
- `simulation_lab/`
- `results/RESULTS.md`, `results_1m/RESULTS_1M.md`, `results_5m/RESULTS_5M.md`, `results_5m_recovery/RESULTS_5M_RECOVERY.md`
