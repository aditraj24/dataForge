# Architecture Decision Records (ADR)

This document records key architectural decisions, design rationale, experimental protocols, and research guardrails governing the implementation across all scales.

---

## ADR-001: Separation of README Narrative from Code Reality
- **Status**: Accepted
- **Context**: The original repository `README.md` claimed a multi-directory layout, a working Next.js/React/D3 web lab, trained models with ~500K parameters, 2-hour training times, and verified Pareto frontiers. However, the repository initially contained flat files, missing training scripts, model parameter discrepancies, and no web application.
- **Decision**: All documentation and scientific reporting must derive strictly from executable code, saved checkpoints, and measured outputs, not unverified narrative claims.
- **Consequences**: Established an uncompromising source-of-truth hierarchy prioritizing running code and empirical artifacts.

---

## ADR-002: Rejection of Random / Untrained Models in Benchmark Comparisons
- **Status**: Accepted
- **Context**: Early benchmark utilities instantiated fresh models without loading checkpoints, evaluating random guessing (~10% accuracy).
- **Decision**: All benchmarking must load verified trained checkpoints (`weights.pth`) from `export/models*/` across all experimental seeds.
- **Consequences**: Guarantees that evaluation reflects learned representations rather than initialization noise.

---

## ADR-003: Programmatic Capacity Matching Protocol ($\pm 5\%$)
- **Status**: Accepted
- **Context**: Evaluating reasoning paradigms with vastly different parameter counts confounds architectural inductive biases with parameter capacity.
- **Decision**: Model architectures must be programmatically verified using `sum(p.numel() for p in model.parameters())` across all parameters (embeddings, attention projections, feedforward, norms, heads) to ensure total counts remain within $\pm 5\%$.
- **Consequences**:
  - 126K Baseline: 126,168 vs 125,688 parameters ($\Delta = 0.38\%$).
  - 1M Scaling: 998,520 vs 998,523 parameters ($\Delta = 3$ params, $0.0003\%$).
  - 5M Scaling: 5,000,632 vs 5,000,635 parameters ($\Delta = 3$ params, $0.00006\%$).

---

## ADR-004: Empirical Compute Metrics vs. Proxy Dollar Multipliers
- **Status**: Accepted
- **Context**: The early codebase calculated cost using an arbitrary, mock step-based cost multiplier (`steps * 0.001`), which created an illusion of genuine monetary pricing. This multiplier had no connection to actual cloud billing, API pricing, or hardware energy costs.
- **Decision**: Primary compute must be measured directly in isolated GPU wall-clock latency (milliseconds via CUDA events) and secondary compute in analytical FLOPs. All mock dollar pricing claims must be removed, and historical multipliers must be explicitly identified as arbitrary synthetic step costs rather than monetary costs.
- **Consequences**: Prevents misleading commercial claims and ensures scientific reproducibility.

---

## ADR-005: Hebbian Decoder Input Dimension Correction
- **Status**: Accepted
- **Context**: In `models_hebbian_model.py`, the matrix multiplication `sparse_query @ self.sigma` produced shape $[B, 64]$, but `self.decoder` was instantiated as `nn.Linear(128, 64)`, throwing a matrix shape error.
- **Decision**: Updated `self.decoder = nn.Linear(state_dim, state_dim)` ($64 \to 64$).
- **Consequences**: Enabled successful forward/backward passes and MSE loss computation without altering the Hebbian plasticity mechanism.

---

## ADR-006: Algorithmic Task Definitions with Explicit Traces (Task A & Task B)
- **Status**: Accepted
- **Context**: Early synthetic tasks were inadequate to test multi-step composition or explicit scratchpads.
- **Decision**: Implemented `TaskAPermutationOrbit` (permutation orbit traversal in $S_8$, $D \sim \text{U}(2, 16)$) and `TaskBModularRegister` (modular register arithmetic in $\mathbb{Z}_{10}$ with operations `OP_ADD`, `OP_MUL`, `OP_SUB`). Both generate intermediate trajectory traces and identical answer formats.
- **Consequences**: Provides rigorous, reproducible testbeds for evaluating test-time compute scaling.

---

## ADR-007: Fixed Exact Recurrent Execution for Latent Reasoner
- **Status**: Accepted
- **Context**: Adaptive halting mechanisms (e.g. ACT, learned stopping logits) introduce auxiliary loss terms and dynamic compute routing that confound pure architectural comparison.
- **Decision**: The primary `RecurrentLatentReasoner` executes **fixed exact** $k$ recurrent transitions without adaptive halting. Adaptive halting is classified as planned future work.
- **Consequences**: Ensures clean, controlled experimental comparison against the nominal budget $k$.

---

## ADR-008: Non-Dominated Empirical Pareto Frontier Extraction
- **Status**: Accepted
- **Context**: Theoretical assumptions of convexity or linear interpolation between observed operating points can create artificial performance curves.
- **Decision**: Pareto frontiers must be constructed strictly from observed non-dominated operating points $(C_{\text{latency}}, A_{\text{accuracy}})$. A point is non-dominated if no other observed point achieves lower latency and higher accuracy.
- **Consequences**: Provides an empirical representation of the trade-off space without artificial smoothing.

---

## ADR-009: Multi-Scale Capacity Scaling Protocol
- **Status**: Accepted
- **Context**: To test whether latent recurrent saturation was an artifact of small model capacity (~126K parameters), scaling experiments were required.
- **Decision**: Scale both architectures to ~1M and ~5M parameters by increasing hidden dimension ($d_{\text{model}}=80 \to 224 \to 544$) while preserving exact task formulations, seed counts ($n=5$), and evaluation budgets ($k \in \{1, 2, 4, 8, 12, 16\}$). Checkpoints and results must be strictly isolated into scale-specific directories (`export/models_1m/`, `results_1m/`, `export/models_5m/`, `results_5m/`).
- **Consequences**: Enabled controlled cross-scale comparisons across 126K, 1M, and 5M.

---

## ADR-010: 5M Optimization Confound Diagnosis and Recovery Protocol
- **Status**: Accepted
- **Context**: The original 5M experiment froze the 126K/1M recipe (20 epochs, constant $\text{lr}=10^{-3}$, no warmup/scheduler). At 5M parameters, both CoT and Latent failed to optimize: CoT loss stalled at $1.49$ (vs $0.67$ at 1M), and Latent stalled at $\ln(8) \approx 2.079$.
- **Decision**:
  1. Retain the original 5M run as [HISTORICAL] / [CONFOUNDED].
  2. Implement an architecture-neutral recovery experiment (`run_full_training_5m_recovery.py`): 50 epochs (6,250 steps), base $\text{lr}=5 \times 10^{-4}$, 5 ep linear warmup, cosine decay to $10^{-5}$, gradient clip 1.0. Checkpoints saved to `export/models_5m_recovery/` and results to `results_5m_recovery/`.
- **Consequences**: Removed the optimization confound, allowing CoT Task A to converge to $0.6069$ loss ($99.74\%$ accuracy) and Latent Task A to drop to $1.8890$ loss ($33.92\%$ accuracy).

---

## ADR-011: Strict Separation of Observations from Causal Mechanisms
- **Status**: Accepted
- **Context**: Early reports risked converting observed behavioral patterns (such as late-step hidden state update norm contraction or cross-attention concentration on initial tokens) into unproven causal claims (e.g. claiming "cross-attention caused the failure" or "the ~33% ceiling is an inherent architectural flaw").
- **Decision**: Explicitly distinguish [OBSERVED] empirical measurements from [PLAUSIBLE HYPOTHESIS] interpretations and [NOT DETERMINED] questions. The persistent $\sim 33\%$ ceiling on Task A must be described as persisting under the tested training conditions, not as a mathematically proven universal limit of latent reasoning.
- **Consequences**: Ensures scientific precision, rigor, and defense against overclaiming.

---

## Implementation References

- `models_cot_model.py`, `models_latent_model.py` — Capacity matching across scales
- `data_generator.py` — Task A and Task B definitions
- `run_full_training*.py` — Training orchestrators across scales
- `run_benchmark_eval*.py` — Empirical CUDA latency profiling
- `training_compare_costs.py` — Pareto extraction logic
- `results*/RESULTS*.md` — Scientific reports adhering to ADR-001, ADR-004, ADR-010, and ADR-011
