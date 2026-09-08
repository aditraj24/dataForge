# Changelog

All notable changes, bug fixes, architecture standardizations, scaling experiments, and documentation milestones are documented in this file.

---

## [1.4.0] - 2026-09-05: 5M Convergence Recovery Experiment & Scientific-Language Audit

### Added
- **5M Convergence Recovery Experiment (`run_full_training_5m_recovery.py`)**:
  - Implemented architecture-neutral recovery training schedule: 50 epochs ($6,250$ steps), batch size 32, AdamW, $\text{weight\_decay}=0.01$, gradient clipping 1.0.
  - Base learning rate: $5.0 \times 10^{-4}$ (halved from $1.0 \times 10^{-3}$ as an empirical width adjustment for $d_{\text{model}}=544$).
  - 5-epoch linear warmup ($1.0 \times 10^{-6} \to 5.0 \times 10^{-4}$) followed by 45-epoch cosine decay to $1.0 \times 10^{-5}$.
  - Added comprehensive per-epoch gradient norm logging: pre-clipping norms, post-clipping norms, clipping fractions, and finite assertions.
  - Completed all 20 recovery runs across 5 seeds and saved checkpoints to `export/models_5m_recovery/`.
- **5M Recovery Benchmark & Analysis**:
  - Implemented `run_benchmark_eval_5m_recovery.py`: Evaluated all 20 checkpoints across budgets $k \in \{1, 2, 4, 8, 12, 16\}$ on 1,000 fixed test instances (seed 999), logging 120 raw records to `results_5m_recovery/raw_benchmark_results.json`.
  - Implemented `process_benchmark_results_5m_recovery.py`: Generated `aggregated_results.json`, `pareto_frontiers.json`, `statistical_tests.json`, and `threshold_analysis.json`.
  - Documented findings in `results_5m_recovery/RESULTS_5M_RECOVERY.md`.
- **Scientific Findings**:
  - CoT Task A training loss dropped to **$0.6069 \pm 0.0057$**, and test accuracy at $k=16$ reached **$99.74\% \pm 0.48\%$**.
  - Latent Task A training loss dropped to **$1.8890 \pm 0.0129$** (well below chance entropy $\ln(8) \approx 2.079$), and test accuracy returned to the plateau observed at 126K and 1M (**$33.92\% \pm 0.84\%$** at $k=16$).
  - Concluded that the original 5M performance degradation was strongly attributable to the original optimization budget and schedule. Under controlled optimization, CoT scales monotonically to near-perfect accuracy, while a $\sim 33\%$ Task-A accuracy ceiling persists for the recurrent latent model under the tested training conditions.

### Fixed & Reconciled
- **Scientific-Language Revision**:
  - Replaced overclaims regarding "100% optimization starvation" with evidence-based attribution to the training budget/schedule.
  - Replaced claims that the ~33% ceiling is an "inherent architectural property" with the observation that it persists across 126K, 1M, and 5M under the tested training conditions.
  - Replaced "near-zero training error" with accurate cross-entropy loss descriptions ($0.6069$).
  - Corrected gradient clipping claims: reported high gradient norms and ~99% clipping as empirical observations under this configuration rather than claiming it is "inherent" to BPTT.
  - Reconciled central research statement across all docs: removed unmeasured "accuracy per dollar" claims in favor of measured GPU latency (ms) and analytical FLOPs.
  - Fully preserved original 5M experiment as [HISTORICAL] / [CONFOUNDED] and recovery experiment as [MEASURED] / [CONTROLLED].

---

## [1.3.0] - 2026-09-05: 5M Capacity-Scaling Experiment & Post-Hoc Audit

### Added
- Scaled architectures to ~5M parameters: `AutoregressiveCoT` ($5,000,632$ params, $d=544, d_{\text{ff}}=1168$) vs `RecurrentLatentReasoner` ($5,000,635$ params, $d=544, d_{\text{ff}}=1795$).
- Executed 20 training runs under frozen 20-epoch/constant-LR recipe (`run_full_training_5m.py`) to `export/models_5m/`.
- Conducted post-hoc training convergence audit: identified that both models underfitted under the frozen 20-epoch recipe (CoT loss stalled at $1.49$, Latent loss stalled at $\ln(8)$), establishing that the initial 5M benchmark was confounded by optimization.

---

## [1.2.0] - 2026-09-05: 1M Capacity-Scaling Experiment & Mechanistic Audit

### Added
- Scaled architectures to ~1M parameters: `AutoregressiveCoT` ($998,520$ params, $d=224, d_{\text{ff}}=624$) vs `RecurrentLatentReasoner` ($998,523$ params, $d=224, d_{\text{ff}}=1027$).
- Executed 20 training runs (`run_full_training_1m.py`) and 120 benchmark evaluations (`run_benchmark_eval_1m.py`).
- Conducted mechanistic latent audit: probed hidden state dynamics ($\|\Delta \mathbf{h}_t\|$) and cross-attention entropy across recurrent steps.

---

## [1.1.0] - 2026-09-05: Simulation Lab Backend Service Layer

### Added
- Created modular `simulation_lab` package (`engine.py`, `models.py`, `tasks.py`, `schemas.py`, `metrics.py`).
- Implemented unified `run_simulation.py` CLI supporting single runs, sweeps, and side-by-side model comparisons across 126K, 1M, and 5M checkpoints.
- Created `test_simulation_lab.py` unit test suite.

---

## [1.0.0] - 2026-09-05: Baseline Pipeline & Initial Reconciliation

### Added
- Algorithmic reasoning tasks: `TaskAPermutationOrbit` and `TaskBModularRegister` in `data_generator.py`.
- Capacity-matched ~126K architectures: `AutoregressiveCoT` (126,168 params) vs `RecurrentLatentReasoner` (125,688 params).
- Automated 20-run baseline training pipeline (`run_full_training.py`) and 120-run benchmark evaluation (`run_benchmark_eval.py`).
- Empirical non-dominated Pareto frontier extraction and paired statistical tests in `results/RESULTS.md`.
