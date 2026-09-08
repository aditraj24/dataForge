# Known Issues & Defect Status

This document tracks all defects, architectural discrepancies, and missing components identified during the project lifecycle, along with their resolution status.

---

## 1. Resolved Defects

### ISSUE-001: Missing `import torch.nn as nn` in `training_train_hebbian.py`
- **Impact**: Fatal crash on execution (`NameError: name 'nn' is not defined`).
- **Location**: `training_train_hebbian.py:L60`
- **Resolution**: [VERIFIED] Added `import torch.nn as nn`. Verified script runs without exception.
- **Status**: **RESOLVED**.

### ISSUE-002: Missing `import torch.nn as nn` in `training_train_cot.py`
- **Impact**: Fatal crash on execution (`NameError: name 'nn' is not defined`).
- **Location**: `training_train_cot.py:L32`
- **Resolution**: [VERIFIED] Added `import torch.nn as nn`.
- **Status**: **RESOLVED**.

### ISSUE-003: Target Dimension & Shape Mismatch in Early CoT Script
- **Impact**: Runtime exception during loss calculation in initial repository code.
- **Location**: `training_train_cot.py`
- **Resolution**: [VERIFIED] Fully replaced early script with complete `train_cot()` implementing full-sequence teacher-forcing with causal attention masks and `ignore_index=VOCAB['PAD']`.
- **Status**: **RESOLVED**.

### ISSUE-004: Missing `training_train_latent.py` Script
- **Impact**: Pipeline failure; no training script existed for the latent model in initial repo.
- **Location**: Root directory.
- **Resolution**: [VERIFIED] Implemented `training_train_latent.py` with intermediate trajectory supervision and terminal answer supervision. Successfully trained 10 latent model checkpoints.
- **Status**: **RESOLVED**.

### ISSUE-005: Benchmark Evaluates Random Weights in Initial Code
- **Impact**: Invalid scientific results; initial `training_compare_costs.py` evaluated uninitialized weights.
- **Location**: `training_compare_costs.py`
- **Resolution**: [VERIFIED] Replaced with `run_benchmark_eval.py` which explicitly loads trained `.pth` state dictionaries from `export/models/` for all 20 model checkpoints.
- **Status**: **RESOLVED**.

### ISSUE-006: Hardcoded CUDA Device in `training_compare_costs.py`
- **Impact**: Threw exception on non-CUDA systems.
- **Location**: `training_compare_costs.py`
- **Resolution**: [VERIFIED] Replaced with dynamic device resolution `torch.device('cuda' if torch.cuda.is_available() else 'cpu')`.
- **Status**: **RESOLVED**.

### ISSUE-007: Inconsistent Dictionary Key in Early Benchmark
- **Impact**: Queried `result['memory_used']` while model returned `'memory_mb'`.
- **Location**: Early `training_compare_costs.py`
- **Resolution**: [VERIFIED] Retired mock memory tracking in favor of isolated CUDA event latency profiling and analytical FLOP calculations.
- **Status**: **RESOLVED**.

### ISSUE-008: Tensor Dimension Mismatch in `HebbianMemory` Decoder
- **Impact**: Forward pass crash (`RuntimeError: mat1 and mat2 shapes cannot be multiplied (4x64 and 128x64)`).
- **Location**: `models_hebbian_model.py:L26`
- **Resolution**: [VERIFIED] Changed `self.decoder = nn.Linear(state_dim, state_dim)` ($64 \to 64$) to match `sparse_query @ sigma` output dimension.
- **Status**: **RESOLVED**.

### ISSUE-009: Uncontrolled Parameter Capacity Between Models
- **Impact**: Early models had vast parameter count discrepancies (CoT ~101K vs Latent ~400K), confounding algorithmic comparison with capacity differences.
- **Location**: `models_cot_model.py`, `models_latent_model.py`
- **Resolution**: [VERIFIED] Redesigned and matched architectures: `AutoregressiveCoT` (126,168 params) vs `RecurrentLatentReasoner` (125,688 params) — 0.38% relative difference (well within $\pm 5\%$).
- **Status**: **RESOLVED**.

### ISSUE-010: Conflation of Same-$k$ Significance with Latency-Matched Significance
- **Impact**: Early draft claimed higher accuracy at "matched hardware latency" based solely on same-$k$ $t$-tests.
- **Location**: Early `RESULTS.md` draft.
- **Resolution**: [VERIFIED] Audited and rewritten. Reports empirical non-dominated Pareto frontiers directly; clarifies that same-$k$ paired $t$-tests do not imply latency-matched significance.
- **Status**: **RESOLVED**.

### ISSUE-014: Original 5M Optimization Confound (Underfitting Under 2,500-Step Static AdamW Schedule)
- **Impact**: Both CoT (~13–14%) and Latent (~12.5%) models failed to optimize under the fixed 20-epoch/2,500-step un-warmed AdamW schedule at $d=544$ (~5M parameters), yielding high training losses (1.35–1.57 vs 0.01 at 126K/1M) and near-chance Task-A accuracy. This initially masked the true scaling trajectory.
- **Location**: `export/models_5m/`, `results_5m/`, `run_full_training_5m.py`
- **Resolution**: [VERIFIED] Resolved by the controlled 5M Convergence Recovery Experiment (`run_full_training_5m_recovery.py`, `export/models_5m_recovery/`, `results_5m_recovery/`). Extended training budget to 50 epochs (6,250 steps), reduced peak learning rate to $5\times 10^{-4}$ with 5-epoch linear warmup and cosine decay to $10^{-5}$, with gradient clipping at 1.0. CoT recovered to $99.74\% \pm 0.48\%$ at $k=16$, while Latent returned to the characteristic $\sim 33.92\% \pm 0.84\%$ plateau. The original 5M run is retained and marked as `[HISTORICAL] / [CONFOUNDED]`.
- **Status**: **RESOLVED**.

### ISSUE-015: Causal Overclaims in Diagnostic Summaries and Scientific Language
- **Impact**: Early internal notes and reports asserted causal mechanisms that were not directly demonstrated (e.g., asserting that gradient clipping is "inherent" to BPTT, that the ~33% ceiling is "mathematically proven / architectural", that representation dynamics "collapsed", and characterizing cross-entropy 0.6069 as "near-zero training error").
- **Location**: Research notes, diagnostic summaries, and draft reporting files.
- **Resolution**: [VERIFIED] Repository-wide scientific-integrity audit systematically corrected all narrative framing to distinguish [OBSERVED] empirical facts from [PLAUSIBLE HYPOTHESIS] mechanistic conjectures. All causal claims without direct intervention experiments were toned down to descriptive observations under the specific experimental conditions.
- **Status**: **RESOLVED**.

---

## 2. Active Limitations & Future Work

### ISSUE-011: Missing `web/` Frontend Application
- **Impact**: The browser interactive demo claimed in the initial `README.md` (`web/pages/lab.tsx`, React/D3 components) does not exist in the workspace.
- **Location**: `web/` directory.
- **Status**: **[ABSENT] / [PLANNED]**.
- **Scope Note**: Not built in the current ML research verification pass. All scientific data, plots, and metrics are exported as structured files (`results*/*.json`, `results*/pareto_frontier_plots.png`, `results*/RESULTS*.md`). The programmatic backend capability is fully provided by `simulation_lab_api.py`.

### ISSUE-012: No Adaptive Halting in `RecurrentLatentReasoner`
- **Impact**: Model cannot dynamically stop early on simpler problem depths $D < k$, leading to latent Pareto saturation at $k \ge 8$.
- **Location**: `models_latent_model.py:RecurrentLatentReasoner`
- **Status**: **[PLANNED / FUTURE WORK]**.
- **Scope Note**: By methodological design constraint, adaptive halting (ACT, learned halting logits) was intentionally excluded from the primary experiment to evaluate pure fixed-depth recurrence.

### ISSUE-013: Low Absolute Accuracy on Task B (Modular Register Arithmetic)
- **Impact**: Both models achieved low absolute accuracy ($10\%–18.6\%$, with $10.0\%$ representing the random-guess baseline across the 10 register classes). While certain conditions were modestly above chance (e.g., Latent $16.48\%$ at $126\text{K}, k=2$; CoT $18.58\%$ at $5\text{M recovery}, k=16$), neither model mastered multi-step modular arithmetic, leaving the explicit-scratchpad hypothesis inconclusive.
- **Location**: `results*/aggregated_results.json`
- **Status**: **[MEASURED LIMITATION]**.
- **Scope Note**: Faithfully documented across all results reports and research docs without manufacturing synthetic explanations.

---

## Implementation References

- `models_hebbian_model.py` — Fixed decoder dimension (lines 24–27)
- `models_cot_model.py` — Fixed parameter matching (lines 10–28)
- `models_latent_model.py` — Fixed parameter matching (lines 11–31)
- `training_train_latent.py` — Implemented training script (lines 1–97)
- `run_benchmark_eval.py` — Checkpoint evaluation (lines 43–54)
- `run_full_training_5m_recovery.py` — Controlled 5M recovery training pipeline
- `run_benchmark_eval_5m_recovery.py` — 5M recovery benchmark evaluation script
- `results/RESULTS.md` — Audited 126K scientific report
- `results_1m/RESULTS_1M.md` — Audited 1M scientific report
- `results_5m/RESULTS_5M.md` — Audited 5M original (confounded) report
- `results_5m_recovery/RESULTS_5M_RECOVERY.md` — Audited 5M recovery report
