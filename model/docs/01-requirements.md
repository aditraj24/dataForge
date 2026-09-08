# Artifact Requirements & Project Scope

## Project Overview
This project is an empirical machine learning research artifact designed to investigate the compute-accuracy Pareto frontier between two distinct test-time reasoning paradigms under strictly controlled parameter capacity across multiple scales (126K, 1M, and 5M parameters):
1. **Token-based sequential scratchpad reasoning**: `AutoregressiveCoT` (causal autoregressive Transformer predicting discrete scratchpad reasoning tokens before emitting an answer).
2. **Recurrent latent state reasoning**: `RecurrentLatentReasoner` (weight-tied recurrent cross-attention and GRUCell updating continuous hidden state representations for $k$ iterations without emitting intermediate tokens).

A third model component, `HebbianMemory` (implementing BDH-style outer-product synaptic plasticity updates), exists as a standalone educational/exploratory artifact in the repository. [VERIFIED] It did not participate in the multi-seed CoT-vs-Latent benchmarking experiment.

---

## Research Claim / Hypothesis Under Test

> **Revised Scientific Statement**:  
> *"This study measures how test-time recurrent latent computation and autoregressive scratchpad generation trade accuracy against compute on small algorithmic tasks. Across the tested scales, recurrent latent computation was competitive at very low budgets but saturated near ~33% on the permutation-orbit task, while autoregressive scratchpad generation continued to improve with additional computation and model capacity."*

### Status & Empirical Reconciliation [MEASURED]
1. **Monetary Efficiency ("Per Dollar")**: [HISTORICAL] The experiment measured isolated GPU wall-clock latency (milliseconds via CUDA events) and analytical FLOPs. Monetary dollar costs were not measured. Claims of "per dollar" advantage are unestablished by this experiment.
2. **Part A (Permutation Orbit Traversal / Task A)**: [MEASURED]
   - In the low-compute regime ($k \le 2$), recurrent latent reasoning is competitive with CoT (e.g. at 126K, $32.30\%$ vs $29.70\%$).
   - However, across all tested scales (126K, 1M, and 5M), latent reasoning saturates near a $\sim 33\%$ accuracy plateau ($33.06\%$ at 126K, $31.12\%$ at 1M, $33.92\%$ at 5M recovery).
   - In contrast, `AutoregressiveCoT` scales monotonically with budget and capacity ($73.36\%$ at 126K $\to 76.70\%$ at 1M $\to 99.74\%$ at 5M recovery at $k=16$).
3. **Part B (Modular Register Arithmetic / Task B)**: [MEASURED]
   - On multi-step modular register arithmetic, accuracies across both models remain relatively low ($10\%–18\%$, where $10.0\%$ represents the 10-class random-guess baseline).
   - Under the 5M recovery condition, CoT achieves $18.58\% \pm 3.96\%$ at $k=16$, and Latent achieves $14.56\% \pm 1.09\%$.
   - Because neither architecture mastered multi-step modular arithmetic, Task B provides **inconclusive evidence** regarding symbolic scratchpad performance.

---

## Requirements Classification

### 1. Functional Requirements (FR)

- **FR-1 [Synthetic Task Generation]**: [VERIFIED]
  - `TaskAPermutationOrbit`: State-space $N=8$, permutation $\pi \in S_8$, depth $D \sim \text{Uniform}(2, 16)$. Generates trajectory $v_{t+1} = \pi(v_t)$ and final answer $v_D$. Formats full autoregressive sequences and structured input arrays.
  - `TaskBModularRegister`: Register $r_0 \in \mathbb{Z}_{10}$, operations `OP_ADD`, `OP_MUL`, `OP_SUB` mod 10, depth $D \sim \text{Uniform}(2, 16)$. Tracks state $r_{t+1} = (r_t \circ c) \pmod{10}$.
  - `collate_fn_pad`: Dynamically pads inputs, full sequences, and trajectories across batches.

- **FR-2 [Capacity-Matched Model Architectures Across Scales]**: [VERIFIED]
  - **126K Baseline**: `AutoregressiveCoT` (**126,168** params) vs. `RecurrentLatentReasoner` (**125,688** params). Difference: 480 params (0.38%).
  - **1M Scaling**: `AutoregressiveCoT` (**998,520** params) vs. `RecurrentLatentReasoner` (**998,523** params). Difference: 3 params (0.0003%).
  - **5M Scaling (Original & Recovery)**: `AutoregressiveCoT` (**5,000,632** params) vs. `RecurrentLatentReasoner` (**5,000,635** params). Difference: 3 params (0.00006%).
  - Capacity difference strictly controlled within $\pm 5\%$ tolerance across all scales.

- **FR-3 [Supervised Training Protocols & Multi-Scale Orchestration]**: [VERIFIED]
  - Multi-seed training pipeline across 5 seeds: $\{42, 43, 44, 45, 46\}$.
  - 126K Baseline: 20 models trained under 20 epochs, AdamW ($\text{lr}=10^{-3}$).
  - 1M Scaling: 20 models trained under 20 epochs, AdamW ($\text{lr}=10^{-3}$).
  - 5M Original: 20 models trained under 20 epochs, AdamW ($\text{lr}=10^{-3}$) [RETAINED AS HISTORICAL / CONFOUNDED].
  - 5M Recovery: 20 models trained under 50 epochs (6,250 steps), AdamW ($\text{lr}=5 \times 10^{-4}$), 5-epoch linear warmup, cosine decay to $10^{-5}$, gradient clip 1.0 [MEASURED / CONTROLLED OPTIMIZATION CONDITION].

- **FR-4 [Deterministic Inference & Budget Sweep]**: [VERIFIED]
  - Inference budget parameter $k \in \{1, 2, 4, 8, 12, 16\}$.
  - Fixed test set: 1,000 deterministic instances per task generated with seed 999.
  - Recurrent latent model executes fixed exact recurrence (no adaptive halting).
  - CoT generates token-by-token until `END_THINK` is emitted or $k$ budget is exhausted.
  - Tracking of under-budget ($k < D$), matched-budget ($k = D$), and over-budget ($k > D$) performance.

- **FR-5 [Compute & Pareto Benchmarking]**: [VERIFIED]
  - Primary compute metric: Isolated GPU wall-clock latency measured via CUDA events (`torch.cuda.Event`) with warm-up and synchronization.
  - Secondary compute metric: Analytical FLOPs calculated per token/iteration.
  - Extraction of empirical non-dominated Pareto frontiers without convex hull assumptions.
  - Paired $t$-tests and Wilcoxon signed-rank tests across $n=5$ seeds at the same nominal $k$.

- **FR-6 [Standalone Synaptic Memory (BDH)]**: [VERIFIED]
  - `HebbianMemory`: Linear encoder ($64 \to 128$), non-trainable synaptic matrix $\sigma \in \mathbb{R}^{128 \times 64}$, and linear decoder ($64 \to 64$).
  - Fast-weight outer-product update $\Delta \sigma = \eta \cdot \frac{1}{B} \sum (x \otimes y)$ with decay $0.99$.
  - Standalone component; not part of the CoT-vs-Latent benchmark.

- **FR-7 [Simulation Lab Backend Engine]**: [VERIFIED]
  - Unified programmatic service layer (`simulation_lab`) supporting model instantiation, checkpoint loading, single-instance simulation, budget sweeps, and side-by-side model comparisons across 126K, 1M, and 5M models.

---

## 2. Technical Requirements (TR)

- **TR-1 [Runtime Environment]**: [VERIFIED] Python 3.11.9, PyTorch 2.6.0+cu124, CUDA 12.4.
- **TR-2 [Hardware Target]**: [VERIFIED] NVIDIA GeForce RTX 4060 Laptop GPU (8GB VRAM), verified device `cuda:0`.
- **TR-3 [Reproducibility Controls]**: [VERIFIED] Explicit pseudo-random number generator seeding (`torch.manual_seed`, `np.random.default_rng`) for dataset generation and model initialization.
- **TR-4 [Checkpoint Persistence]**: [VERIFIED] Checkpoints persisted in isolated directories (`export/models/`, `export/models_1m/`, `export/models_5m/`, `export/models_5m_recovery/`).
- **TR-5 [Results Persistence]**: [VERIFIED] Structured JSON exports and scientific markdown reports persisted in isolated directories (`results/`, `results_1m/`, `results_5m/`, `results_5m_recovery/`).

---

## 3. Non-Functional Requirements (NFR)

- **NFR-1 [Scientific Honesty]**: [VERIFIED] Explicit labeling of empirical findings, separating measured GPU latency from unmeasured financial costs, and reporting high seed variance at smaller scales (e.g. CoT Task A seed 46 at 126K reaching $99.10\%$, and seed 42 at 1M dropping to $24.1\%$).
- **NFR-2 [Reproducibility]**: [VERIFIED] All experimental sweeps and statistical analysis pipelines are executable end-to-end via provided scripts and fixed seeds.
- **NFR-3 [Resource Efficiency]**: [VERIFIED] Multi-seed training completed within modest compute bounds on an RTX 4060 GPU (~5.4 min for 126K, ~12 min for 1M, ~40 min for 5M original, ~80 min for 5M recovery).

---

## 4. Non-Technical Requirements (NTR)

- **NTR-1 [Educational & Scientific Clarity]**: [VERIFIED] Detailed documentation explaining how recurrent latent computation compares with autoregressive token generation across varying task types and capacity scales.
- **NTR-2 [Web Lab Demo Status]**: [ABSENT] / [PLANNED] The browser-based visualization (`web/` directory with Next.js/React/D3) described in initial hackathon proposals does not exist in the current repository. All capabilities are provided via the Simulation Lab backend engine and CLI (`run_simulation.py`).

---

## Implementation References

- `data_generator.py` — `TaskAPermutationOrbit`, `TaskBModularRegister`, `collate_fn_pad`
- `models_cot_model.py` — `AutoregressiveCoT`
- `models_latent_model.py` — `RecurrentLatentReasoner`
- `models_hebbian_model.py` — `HebbianMemory`
- `run_full_training.py` — 126K training runner
- `run_full_training_1m.py` — 1M training runner
- `run_full_training_5m.py` — 5M original training runner
- `run_full_training_5m_recovery.py` — 5M recovery training runner
- `run_benchmark_eval*.py` — Benchmark evaluation runners
- `process_benchmark_results*.py` — Statistical analysis scripts
- `simulation_lab/` — Simulation Lab backend service package
