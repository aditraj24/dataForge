# Frontend Current State

## Last Updated
2026-09-08 (Scientific Fidelity & Frontend Correction Pass)

## Overall Status
COMPLETE — High-Fidelity Scientific Workstation with Zero Fabricated Science

## Architecture & Visual Language
Retains the dark scientific workstation application shell while enforcing strict scientific data fidelity across all components:
- **Persistent Application Shell**:
  - **Top Bar**: Precision header with `DF` logo, "DataForge 2026 / The Thinking Budget", top navigation tabs (`Lab`, `Experiments`, `Models`, `Analysis`, `Documentation`), search bar with `Ctrl K` shortcut, backend `ONLINE` health indicator, theme toggle, notification bell, settings gear, and user avatar `HK`.
  - **Left Sidebar**: Application tool/library panel featuring:
    - `EXPERIMENTS`: Simulation Lab, Task A (Permutation Orbit), Task B (Modular Register), CoT Workbench, Latent Workbench, Attention Inspector, BDH Synaptic Lab, Pareto Instrument, Scale Machine, Recovery Lab (5M), Free Experiment.
    - `RESOURCES`: Methods & Sources, Explain It Back.
    - Status indicators: `● Backend Connected`, `● Precomputed Data Loaded`, `v0.2.0`.
  - **Persistent Global Footer Bar**:
    - Contextual scientific quotation tailored to active instrument.
    - Research integrity disclaimer: `DataForge 2026 • Educational research project • Observed results only • No fabricated measurements`.

---

## Component Fidelity Corrections

### 1. Scale Machine (`ScaleMachineProgression.tsx`)
- **Removed**: All generic/fabricated scaling curves (125M, 1.3B, 70B, 300B tokens, power-law fits, generic AI scaling claims).
- **Exact Models Displayed**:
  - **126K Baseline**: CoT = 126,168 params; Latent = 125,688 params.
  - **1M Scaled**: CoT = 998,520 params; Latent = 998,523 params.
  - **5M Recovery [CONTROLLED / AUTHORITATIVE]**: CoT = 5,000,632 params; Latent = 5,000,635 params. (50 epochs, 6,250 steps, warmup 1e-6 → 5e-4, cosine decay to 1e-5, grad clip 1.0).
  - **5M Original [HISTORICAL / CONFOUNDED]**: 5,000,632 / 5,000,635 params (20 epochs, 2,500 steps, static AdamW η=1e-3, underfit).
- **Empirical Measured Results**:
  - 126K: CoT k=16 73.36%, Latent k=16 33.06%.
  - 1M: CoT k=16 76.70%, Latent k=16 31.12%.
  - 5M Recovery: CoT k=16 99.74% (±0.21), Latent k=16 33.92% (±0.37).
  - 5M Original: CoT k=16 13.64% (±0.94), Latent k=16 12.46% (±0.49).
- **Seed 46 Outlier**: Dedicated `Seed Statistics` panel exposes Seed 46 outlier on 126K CoT (99.10% vs Seeds 42-45: 58.90%-76.20%, Median: 69.70%, SEM: ±7.08%).

### 2. Recovery Lab (`RecoveryInvestigation.tsx`)
- **Removed**: Generic long-context retrieval, Recall@K, 5M token context, semantic match curves, interference experiments.
- **Replaced With**: 5M Optimization & Convergence Investigation.
  - Console pipeline: `5M ORIGINAL (Loss: 1.4919)` → `RECOVERY SCHEDULE (50 ep, 6,250 steps, warmup, cosine decay)` → `5M RECOVERY (Loss: 0.6069 ± 0.0057)`.
  - Exact seed losses: CoT Task A: 0.6004, 0.5997, 0.6133, 0.6108, 0.6106 (mean 0.6069 ± 0.0057); CoT Task B: 1.1006, 1.0956, 1.1061, 1.1058, 1.1087 (mean 1.1034 ± 0.0047); Latent Task A: 1.8946, 1.8825, 1.9042, 1.8673, 1.8965 (mean 1.8890 ± 0.0129); Latent Task B: 1.8429, 1.9771, 1.9659, 1.9366, 2.0615 (mean 1.9568 ± 0.0705).
  - Gradient telemetry: Mean pre-clip norm 0.84, ~30.3% clipped for CoT vs 3.14, 99.5% clipped for Latent.
  - Multi-variable schedule attribution: explicitly notes that warmup, schedule length, cosine decay, and gradient clipping were adjusted together.

### 3. BDH Synaptic Lab (`BdhSynapticWorkbench.tsx`)
- **Removed**: Invented Transformer latent metrics (`Layer 6`, `Position 5`, `v5`, `||h|| = 12.41`, `Δh = 3.08`, nearest-state semantic explanations).
- **Grounded In**: `models_hebbian_model.py`:
  - **Encoder trainable**: 8,320 params (Linear 64 → 128)
  - **Decoder trainable**: 4,160 params (Linear 64 → 64)
  - **Total trainable**: 12,480 params
  - **Non-trainable synaptic state σ**: 8,192 elements ($128 \times 64$ fast-weight matrix)
  - **Total state elements**: 20,672
- **Labels**: Prominently marked `TOY MODEL • ILLUSTRATIVE • STANDALONE ARTIFACT`.
- **Interactive Controls**: Plasticity strength $\eta$ (default 0.010), decay factor $\lambda$ (default 0.990), activation threshold (default 0.10, ~5% firing), 8 associative pairs, live $128 \times 64$ sub-block matrix rendering.

### 4. Free Experiment (`FreeExperimentWorkbench.tsx`)
- **Removed**: Generic LLM playground elements (prompt inputs about in-context learning, temperature, top-p, max tokens, generated text prose, fake donut chart token types, fake attention maps).
- **Replaced With**: True Computational Sandbox:
  - Task selection: `Task A (Permutation Orbit)` vs `Task B (Modular Register)`.
  - Architecture selection: `Autoregressive CoT` vs `Recurrent Latent`.
  - Scale: `126K`, `1M`, `5M Recovery`.
  - Task A Sandbox: Editable 8-element permutation table $\pi$, start node $v_0..v_7$, depth $D \in \{1..8\}$, budget $k \in \{1..16\}$.
    - If Latent: Toggle `[ MACHINE VIEW ]` (Flow: INPUT → MEMORY → QUERY → S0..Sk → ANSWER) vs `[ 3D STATE SPACE ]` (opens `ThreeStateTrajectory`).
    - If CoT: Real Token Machine flow: INPUT → TOKEN EMBEDDING → TRANSFORMER → TOKEN GENERATION (`<THINK> v0 → v1 → ... <ANSWER>`) → FINAL ANSWER.
  - Task B Sandbox: Initial register $R_0$, modulus $M$, 4 editable operations (`ADD`, `SUB`, `MUL`), execution history stepper, and prominent badge: `EMPIRICAL OUTCOME: INCONCLUSIVE` (~10% random chance baseline).

### 5. Latent State Trajectory (`ThreeStateTrajectory.tsx`)
- **Measured Transition Magnitudes**:
  - $0 \to 1$: $18.7577$
  - $1 \to 2$: $6.6495$
  - $2 \to 3$: $2.0270$
  - $3 \to 4$: $0.6120$
  - $4 \to 8$: $0.2727$
  - $8 \to 12$: $0.0073$
  - $12 \to 16$: $0.0005$
- **Scientific Formulation**: Defined as "rapid numerical near-stabilization", NOT an exact mathematical fixed point. Coordinates represent a 3D PCA projection.

### 6. Attention Circuit (`AttentionCircuit.tsx`)
- **Scientific Phrasing**: "For Task A, cross-attention output shows the earliest and largest observed contraction, preceding contraction in the recurrent state. The 1M model increasingly attends up to 68% to the start token v0. This is an observed diagnostic pattern, not proof of sole causation; underlying mechanisms remain hypotheses."

### 7. Pareto Instrument (`ParetoInstrument.tsx` & `ParetoChart.tsx`)
- Strictly plots GPU wall-clock latency (ms) vs. accuracy (%).
- Non-dominated empirical points only. Zero fabricated monetary costs ($/dollar). Zero smooth theoretical curves.

---

## Source Audit Table (Section 25)

| UI Element / Metric | Displayed Value | Provenance / Repository Substrate Source |
| :--- | :--- | :--- |
| **126K CoT params** | 126,168 | `models_baseline_transformer.py` (L=4, d=64, H=4) |
| **126K Latent params** | 125,688 | `models_recurrent_latent.py` (L=4, d=64, H=4) |
| **1M CoT params** | 998,520 | `models_baseline_transformer.py` (L=6, d=192, H=6) |
| **1M Latent params** | 998,523 | `models_recurrent_latent.py` (L=6, d=192, H=6) |
| **5M Recovery CoT params** | 5,000,632 | `models_baseline_transformer.py` (L=8, d=544, H=8) |
| **5M Recovery Latent params** | 5,000,635 | `models_recurrent_latent.py` (L=8, d=544, H=8) |
| **HebbianMemory Trainable** | 12,480 | `models_hebbian_model.py` (Linear 64→128: 8,320 + Linear 64→64: 4,160) |
| **HebbianMemory Synaptic** | 8,192 | `models_hebbian_model.py` (non-trainable matrix $\sigma \in \mathbb{R}^{128 \times 64}$) |
| **Hebbian Total Elements** | 20,672 | `models_hebbian_model.py` (12,480 trainable + 8,192 $\sigma$) |
| **126K CoT Task A (k=16)** | 73.36% (±7.08) | Multi-seed benchmark table (`results/baseline_126k_task_a.json`) |
| **126K Latent Task A (k=16)**| 33.06% (±0.45) | Multi-seed benchmark table (`results/latent_126k_task_a.json`) |
| **1M CoT Task A (k=16)** | 76.70% (±1.42) | Multi-seed benchmark table (`results_1m/`) |
| **1M Latent Task A (k=16)** | 31.12% (±0.68) | Multi-seed benchmark table (`results_1m/`) |
| **5M Recovery CoT (k=16)** | 99.74% (±0.21) | `results_5m_recovery/RESULTS_5M_RECOVERY.md` |
| **5M Recovery Latent (k=16)**| 33.92% (±0.37) | `results_5m_recovery/RESULTS_5M_RECOVERY.md` |
| **5M Original CoT (k=16)** | 13.64% (±0.94) | `results_5m_recovery/RESULTS_5M_RECOVERY.md` Section 3.1 |
| **5M Original Latent (k=16)**| 12.46% (±0.49) | `results_5m_recovery/RESULTS_5M_RECOVERY.md` Section 3.1 |
| **CoT Task A Seed Losses** | 0.6004, 0.5997, 0.6133, 0.6108, 0.6106 | `results_5m_recovery/RESULTS_5M_RECOVERY.md` Section 2.1 (Mean: 0.6069 ± 0.0057) |
| **CoT Task B Seed Losses** | 1.1006, 1.0956, 1.1061, 1.1058, 1.1087 | `results_5m_recovery/RESULTS_5M_RECOVERY.md` Section 2.1 (Mean: 1.1034 ± 0.0047) |
| **Latent Task A Seed Losses**| 1.8946, 1.8825, 1.9042, 1.8673, 1.8965 | `results_5m_recovery/RESULTS_5M_RECOVERY.md` Section 2.1 (Mean: 1.8890 ± 0.0129) |
| **Latent Task B Seed Losses**| 1.8429, 1.9771, 1.9659, 1.9366, 2.0615 | `results_5m_recovery/RESULTS_5M_RECOVERY.md` Section 2.1 (Mean: 1.9568 ± 0.0705) |
| **Seed 46 Outlier (126K)** | 99.10% | Individual seed run 46 (`results/baseline_126k_task_a_seed46.json`) |
| **1M Latent State Deltas** | 18.7577 → 0.0005 | Measured mechanistic probe trajectory log (`results_1m/latent_probe_transitions.json`) |
| **Gradient Norm Telemetry** | 0.84 norm, 30.3% clipped | `results_5m_recovery/RESULTS_5M_RECOVERY.md` Section 4.2 |

---

## Verification & QA Status
- `npm run build`: Clean exit code 0.
- `pytest -q`: 73/73 passed in 7.75s.
- Playwright E2E verification completed across all corrected views: Scale Machine, Recovery Lab, BDH Synaptic Lab, Free Experiment, Latent State Trajectory, Attention Inspector, Pareto Instrument.
