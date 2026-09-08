# Frontend Changelog

## 2026-09-08 (Pass 3 — Final Adversarial QA + Scientific Wording + UX Polish)

### Refinements & Fixes
- **Scientific Language Audit**:
  - Replaced overstrong causal assertions (`proves`, `always`, `causes`, `authoritative scaling law`) with precise empirical terminology (`observed under tested conditions`, `empirical result`, `diagnostic pattern`, `consistent with`, `hypothesis`, `inconclusive`).
  - Relabeled 5M Recovery from `CONTROLLED / AUTHORITATIVE` to `CONTROLLED RECOVERY CONDITION` / `RECOVERY EXPERIMENT`.
  - Multi-variable schedule attribution: explicitly notes that training duration, learning-rate schedule, warmup, and gradient clipping were modified together.
- **Scale Machine (`ScaleMachineProgression.tsx`)**:
  - Restructured progression into an explicit branching capacity tree: $126\text{K Baseline} \to 1\text{M Scaled} \to 5\text{M Architecture}$ ($├──\text{5M Original [Confounded]}$, $└──\text{5M Recovery [Controlled Recovery]}$).
  - Renamed title to `Scale Machine: Observed Capacity Conditions`; explicit subtitle stating connecting lines represent visual sequences between discrete points, not fitted scaling curves.
  - Exposed full $n=5$ seed breakdown table in `Seed Statistics` tab for 126K (Seed 42: 76.20%, Seed 43: 69.70%, Seed 44: 58.90%, Seed 45: 62.90%, Seed 46: 99.10% outlier).
- **Recovery Lab (`RecoveryInvestigation.tsx`)**:
  - Added primary debugging question banner: *"Was the poor 5M result actually a model-capacity failure, or was training insufficient?"*
  - Added collapsible "WHAT CHANGED IN THE OPTIMIZATION RECIPE? (6 VARIABLES)" drawer detailing epochs, steps, LR, warmup, cosine decay, and gradient clipping.
  - Added explicit, non-sensational `EMPIRICAL OUTCOME: INCONCLUSIVE` banner on Task B.
- **Permutation Machine (`PermutationMachine.tsx`) & Task B (`RegisterMachineTaskB.tsx`)**:
  - Direct manipulation verified: editing $\pi$, $v_0$, or $D$ dynamically updates the traversal orbit immediately without blocking.
  - Added dynamic modulus control to Task B ($M \in \{7, 8, 10, 12, 16\}$) with full modular arithmetic recomputation.
- **Free Experiment (`FreeExperimentWorkbench.tsx`)**:
  - Added `NO RUN YET` empty state before simulation run.
  - Added `RESET` button restoring default preset and returning to empty state.
  - Verified `[ MACHINE VIEW ]` vs `[ 3D STATE SPACE ]` toggle embedding `ThreeStateTrajectory` with live synchronized state inspector.
- **Pareto Instrument (`ParetoInstrument.tsx`)**:
  - Added contextual prompt `MEASURED POINT INSPECTION — SELECT A POINT` when no point is selected.
  - Tabular benchmark is progressively disclosed inside collapsible drawer.

### Verification
- `npm run build`: Exit code 0 (clean build in 3.57s).
- `pytest -q`: 73/73 passed in 6.33s (100% pass; research backend frozen).
- Playwright live browser QA verified state mutations across all instruments.

---

## 2026-09-08 (Pass 2 — Scientific Fidelity & Frontend Correction Pass)

### Removed / Corrected
- **Scale Machine (`ScaleMachineProgression.tsx`)**:
  - Removed all fabricated/generic scaling-law references (125M, 1.3B, 70B, 300B tokens, power-law fits, theoretical scaling curves).
  - Strictly anchored visualization to the project's tested models: 126K Baseline, 1M Scaled, 5M Recovery [Authoritative], and 5M Original [Confounded].
  - Displayed exact model parameter counts:
    - 126K: CoT = 126,168; Latent = 125,688
    - 1M: CoT = 998,520; Latent = 998,523
    - 5M: CoT = 5,000,632; Latent = 5,000,635
  - Displayed actual Task A observed empirical accuracies (126K: 73.36% vs 33.06%; 1M: 76.70% vs 31.12%; 5M Recovery: 99.74% vs 33.92%).
  - Added dedicated Seed Statistics inspector exposing Seed 46 outlier on 126K CoT (99.10% vs mean 73.36%, median 69.70%, SEM ±7.08%).
- **Recovery Lab (`RecoveryInvestigation.tsx`)**:
  - Removed all generic long-context retrieval, Recall@K, 5M token context, semantic match curves, and interference experiments.
  - Replaced with the actual 5M Model Recovery & Optimization Investigation:
    - Debugging console: 5M Original (Loss: 1.4919) → Schedule (50 ep, 6,250 steps, warmup 1e-6 → 5e-4, cosine decay to 1e-5, grad clip 1.0) → 5M Recovery (Loss: 0.6069 ± 0.0057).
    - Per-seed loss breakdowns for Task A and Task B across both CoT and Latent models.
    - Gradient norm telemetry (CoT norm 0.84, 30.3% clipped vs Latent norm 3.14, 99.5% clipped).
    - Restrained scientific interpretation: multi-variable schedule attribution.
- **BDH Synaptic Lab (`BdhSynapticWorkbench.tsx`)**:
  - Removed all fake Transformer latent metrics (`Layer 6`, `Position 5`, `v5`, `||h|| = 12.41`, `Δh = 3.08`).
  - Replaced with authentic `HebbianMemory` implementation from `models_hebbian_model.py`:
    - Trainable: 12,480 (Encoder 8,320 + Decoder 4,160)
    - Synaptic state $\sigma$: 8,192 ($128 \times 64$ fast-weight matrix)
    - Total elements: 20,672
  - Prominently labeled: `TOY MODEL • ILLUSTRATIVE • STANDALONE ARTIFACT`.
  - Interactive toy parameters: plasticity $\eta$, decay $\lambda$, activation threshold, sub-block matrix rendering.
- **Free Experiment (`FreeExperimentWorkbench.tsx`)**:
  - Removed generic LLM text generation (no prompts, temperature, top-p, max tokens, generated text prose, fake donut chart token types, fake attention maps).
  - Transformed into true Computational Sandbox:
    - Task A: Permutation $\pi$, start node $v_0$, depth $D$, budget $k$.
    - Autoregressive CoT: Token-machine flow (`INPUT → TOKEN EMBEDDING → TRANSFORMER → TOKEN GENERATION → ANSWER`).
    - Recurrent Latent: Recurrent machine flow (`INPUT → MEMORY → QUERY → S0..Sk → ANSWER`) with `[ MACHINE VIEW ] [ 3D STATE SPACE ]` toggle opening `ThreeStateTrajectory`.
    - Task B: Modular Register machine with modifiable register, modulus, operations sequence, and prominent `EMPIRICAL OUTCOME: INCONCLUSIVE` badge.
- **Latent State Trajectory (`ThreeStateTrajectory.tsx`)**:
  - Updated with measured 1M transition magnitudes: $0 \to 1: 18.7577$, $1 \to 2: 6.6495$, $2 \to 3: 2.0270$, $3 \to 4: 0.6120$, $4 \to 8: 0.2727$, $8 \to 12: 0.0073$, $12 \to 16: 0.0005$.
  - Labeled as "rapid numerical near-stabilization" (NOT exact fixed point) via 3D PCA projection.
- **Attention Circuit (`AttentionCircuit.tsx`)**:
  - Formulated as: "Cross-attention output shows the earliest and largest observed contraction, preceding contraction in the recurrent state. The 1M model increasingly attends up to 68% to the start token v0. This is an observed diagnostic pattern, not proof of sole causation."

### Verification
- `npm run build`: exits 0 cleanly in 3.63s.
- `pytest -q`: 73/73 passed in 7.75s.
- Playwright E2E browser interactions verified across all modified screens.

---

## 2026-09-08 (Pass 1 — Computational Lab Visual Shell)
- Persistent workbench application shell with Top Bar, Left Sidebar, and Footer.
- Full instrument integration: Latent Workbench, Scale Machine, Recovery Lab, BDH Synaptic Lab, Free Experiment, Attention Inspector, Pareto Instrument.
