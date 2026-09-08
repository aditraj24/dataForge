# Frontend Decisions (ADRs)

## ADR-F01: FastAPI Thin Wrapper Architecture
- Date: 2026-09-07
- Context: Need HTTP access to frozen simulation engine without altering research code.
- Decision: Pure wrapper around `SimulationLabEngine` in `backend/service.py`.

## ADR-F02: Epistemic Evidence Badges
- Date: 2026-09-07
- Context: Need transparent communication of empirical fact vs hypotheses.
- Decision: Universal `EvidenceBadge` supporting `LIVE`, `PRECOMPUTED`, `SYNTHETIC`, `PROJECTED`, `ILLUSTRATIVE`, `HISTORICAL`, `RECOVERY`, `OBSERVED`, `HYPOTHESIS`, `INCONCLUSIVE`.

## ADR-F03: 5M Recovery Primary Benchmarking
- Date: 2026-09-07
- Context: Original 5M model was underfit (13.68% accuracy). Controlled recovery retrain reached 99.74%.
- Decision: Use 5M Recovery as primary large-scale benchmark, clearly labeling original 5M as historical / optimization-confounded.

## ADR-F04: No Monetary Cost Metrics
- Date: 2026-09-07
- Context: Avoiding misleading cloud API dollar claims.
- Decision: Compute is measured exclusively in profiled GPU wall-clock latency (ms) and analytical FLOPs.

## ADR-F05: Task B Explicit Inconclusive Status
- Date: 2026-09-07
- Context: Both models achieve ~10-18% accuracy on modular register arithmetic.
- Decision: Never imply scratchpad superiority on Task B. Always label: "EMPIRICAL OUTCOME: INCONCLUSIVE".

## ADR-F06: Global KaTeX Math Rendering
- Date: 2026-09-07
- Context: Mathematical formulas need crisp LaTeX rendering across all components without breaking JSX curly brace parsing.
- Decision: `useAutoRenderMath` hook utilizing MutationObserver over text nodes.

## ADR-F07: Interactive Computational Laboratory Redesign
- Date: 2026-09-07
- Context: Transition from a passive visual essay/dashboard to a true interactive computational laboratory where the simulation is the teacher.
- Decision:
  - Reusable modular workbench shell (`src/workbench/`).
  - Task A upgraded to a real permutation builder with `[PRESET]` and `[BUILD]` modes, uniqueness enforcement, and a real state timeline.
  - Dual reasoning workbench with selectable discrete tokens and selectable continuous latent states with live tensor telemetry.
  - 3D latent trajectory instrument with orbit/top/side/fit camera presets and 2D accessible fallback.
  - Pareto instrument with observed empirical points only and crosshair latency scrubber.
  - 5M recovery debugging lab with condition toggles and measured training losses (1.492 vs 0.612).
  - Attention circuit with multi-step ($h_1..h_8$) and multi-head ($H_1..H_4$) selectors.
  - Task B modular register circuit with editable operations and inconclusive banner.
  - BDH synaptic plasticity workbench with fast-weight matrix, update strength $\sigma$, pattern inject, and academic toy model disclaimer.
  - Free experiment sandbox ("Try to break the system") and "Challenge the Claim" predictive finale.
