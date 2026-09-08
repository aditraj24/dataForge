# Results — 5M Convergence Recovery Experiment [MEASURED / CONTROLLED OPTIMIZATION CONDITION]

## 1. Experimental Purpose & Context

The original 5M parameter-scaling experiment (`results_5m/RESULTS_5M.md` [HISTORICAL / CONFOUNDED]) used the fixed 20-epoch, 2,500-step static AdamW recipe from the 126K and 1M runs. Under that regime, both models severely underfit (training losses 1.35–1.57; test accuracies near chance ~13%), which confounded architectural comparison with optimization starvation.

The **5M Convergence Recovery Experiment** tested whether extending the optimization budget and applying a standard learning rate schedule would resolve this confound.

### Architecture (Identical to Original 5M)
| Model | $d_{\text{model}}$ | Layers | $d_{\text{ff}}$ | Total Parameters | Trainable Parameters | Parameter Difference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AutoregressiveCoT (5M)** | 544 | 2 | 1,168 | 5,000,632 | 5,000,632 | Baseline |
| **RecurrentLatentReasoner (5M)** | 544 | — | 1,795 | 5,000,635 | 5,000,635 | +3 (+0.00006%) |

### Recovery Optimization Protocol
- **Epochs / Steps**: 50 epochs / 6,250 optimizer steps (vs 20 epochs / 2,500 steps)
- **Batch Size**: 32 (4,000 training examples per seed)
- **Optimizer**: AdamW ($\beta_1=0.9, \beta_2=0.999$, weight decay $0.01$)
- **Learning Rate Schedule**: Peak $\eta = 5 \times 10^{-4}$ with 5-epoch (625-step) linear warmup followed by cosine decay to $1 \times 10^{-5}$
- **Gradient Clipping**: $\Vert \mathbf{g} \Vert_2 \le 1.0$ (with batch-level norm logging)
- **Seeds**: 5 independent training seeds ($42, 43, 44, 45, 46$)
- **Evaluation**: 1,000 test examples evaluated across $k \in \{1, 2, 4, 8, 12, 16\}$ (`TEST_SEED = 999`)

---

## 2. Benchmark Results

### 2.1 Task A: Permutation Orbit Traversal (Random Baseline = 12.50%)

| $k$ | CoT Mean Acc | CoT SEM | Latent Mean Acc | Latent SEM | CoT Latency (ms) | Latent Latency (ms) | Paired Diff $\Delta$ | $t$-statistic | $p$-value (paired $t$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | 22.48% | ±3.32% | 15.46% | ±0.96% | 0.136 | 0.120 | +7.02% | 2.88 | 0.0449 |
| **2** | 33.94% | ±0.14% | 31.44% | ±0.45% | 0.179 | 0.079 | +2.50% | 5.78 | 0.0044 |
| **4** | 44.54% | ±0.17% | 33.38% | ±0.13% | 0.289 | 0.140 | +11.16% | 60.00 | $4.62 \times 10^{-7}$ |
| **8** | 63.34% | ±0.14% | 33.94% | ±0.37% | 0.549 | 0.279 | +29.40% | 77.75 | $1.64 \times 10^{-7}$ |
| **12**| 80.26% | ±0.22% | 33.98% | ±0.37% | 0.849 | 0.386 | +46.28% | 134.50 | $1.83 \times 10^{-8}$ |
| **16**| **99.74%**| **±0.21%**| **33.92%**| **±0.37%**| 1.168 | 0.512 | **+65.82%**| **188.91**| **$4.71 \times 10^{-9}$** |

*Note on Statistical Testing*: Paired $t$-tests compare seed-level outcomes at the same nominal budget $k$ ($n=5$ independent training seeds). They do not evaluate latency-matched statistical significance.

### 2.2 Task B: Modular Register Arithmetic (Random Baseline = 10.00%)

| $k$ | CoT Mean Acc | CoT SEM | Latent Mean Acc | Latent SEM | CoT Latency (ms) | Latent Latency (ms) | Paired Diff $\Delta$ | $t$-statistic | $p$-value (paired $t$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | 11.98% | ±0.89% | 10.68% | ±0.17% | 0.197 | 0.056 | +1.30% | 1.39 | 0.2370 |
| **2** | 12.16% | ±0.69% | 15.34% | ±0.99% | 0.311 | 0.082 | -3.18% | -3.24 | 0.0317 |
| **4** | 12.70% | ±0.64% | 13.40% | ±0.64% | 0.510 | 0.142 | -0.70% | -1.25 | 0.2790 |
| **8** | 12.84% | ±0.68% | 14.48% | ±0.55% | 0.967 | 0.279 | -1.64% | -1.91 | 0.1286 |
| **12**| 12.76% | ±0.93% | 14.50% | ±0.52% | 1.465 | 0.364 | -1.74% | -2.08 | 0.1063 |
| **16**| 18.58% | ±1.77% | 14.56% | ±0.49% | 1.969 | 0.495 | +4.02% | 1.97 | 0.1195 |

*Interpretation Boundary*: Across all budgets $k$, both architectures remained near chance level ($10\%–18.6\%$). This result remains inconclusive regarding symbolic scratchpad efficacy.

---

## 3. Per-Seed Accuracy Breakdown

### 3.1 Task A

| Model | $k$ | Seed 42 | Seed 43 | Seed 44 | Seed 45 | Seed 46 | Mean | Std Dev |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CoT** | 1 | 22.60% | 25.80% | 16.30% | 33.00% | 14.70% | 22.48% | ±7.42% |
| **CoT** | 2 | 34.10% | 33.40% | 34.00% | 34.10% | 34.10% | 33.94% | ±0.30% |
| **CoT** | 4 | 44.90% | 44.60% | 44.70% | 44.60% | 43.90% | 44.54% | ±0.38% |
| **CoT** | 8 | 63.40% | 63.50% | 63.50% | 63.50% | 62.80% | 63.34% | ±0.30% |
| **CoT** | 12 | 80.50% | 79.40% | 80.50% | 80.50% | 80.40% | 80.26% | ±0.48% |
| **CoT** | 16 | 100.00% | 98.90% | 100.00% | 99.80% | 100.00% | **99.74%** | **±0.48%** |
| **Latent** | 1 | 15.00% | 15.50% | 14.50% | 19.00% | 13.30% | 15.46% | ±2.14% |
| **Latent** | 2 | 31.50% | 30.70% | 33.00% | 30.40% | 31.60% | 31.44% | ±1.01% |
| **Latent** | 4 | 33.10% | 33.50% | 33.40% | 33.80% | 33.10% | 33.38% | ±0.29% |
| **Latent** | 8 | 35.30% | 33.40% | 33.30% | 34.10% | 33.60% | 33.94% | ±0.82% |
| **Latent** | 12 | 35.30% | 33.40% | 33.30% | 34.30% | 33.60% | 33.98% | ±0.83% |
| **Latent** | 16 | 35.30% | 33.30% | 33.30% | 34.10% | 33.60% | **33.92%** | **±0.84%** |

### 3.2 Task B

| Model | $k$ | Seed 42 | Seed 43 | Seed 44 | Seed 45 | Seed 46 | Mean | Std Dev |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CoT** | 1 | 12.60% | 11.70% | 15.00% | 10.90% | 9.70% | 11.98% | ±1.99% |
| **CoT** | 2 | 11.80% | 11.00% | 14.80% | 12.10% | 11.10% | 12.16% | ±1.54% |
| **CoT** | 4 | 13.20% | 10.40% | 14.20% | 13.30% | 12.40% | 12.70% | ±1.43% |
| **CoT** | 8 | 13.80% | 11.20% | 14.60% | 13.30% | 11.30% | 12.84% | ±1.52% |
| **CoT** | 12 | 12.40% | 10.10% | 15.00% | 14.70% | 11.60% | 12.76% | ±2.08% |
| **CoT** | 16 | 22.70% | 18.30% | 21.60% | 17.70% | 12.60% | 18.58% | ±3.96% |
| **Latent** | 1 | 10.10% | 10.50% | 10.90% | 11.00% | 10.90% | 10.68% | ±0.38% |
| **Latent** | 2 | 17.20% | 16.10% | 16.30% | 15.60% | 11.50% | 15.34% | ±2.22% |
| **Latent** | 4 | 12.80% | 11.30% | 13.50% | 14.70% | 14.70% | 13.40% | ±1.43% |
| **Latent** | 8 | 13.20% | 13.30% | 15.50% | 14.50% | 15.90% | 14.48% | ±1.23% |
| **Latent** | 12 | 13.40% | 13.30% | 15.50% | 14.50% | 15.80% | 14.50% | ±1.16% |
| **Latent** | 16 | 13.70% | 13.30% | 15.50% | 14.50% | 15.80% | 14.56% | ±1.10% |

---

## 4. Training Convergence & Gradient Telemetry

### 4.1 Final Training Losses
- **CoT Task A**: $0.6069 \pm 0.0057$
- **Latent Task A**: $1.8890 \pm 0.0129$
- **CoT Task B**: $1.1034 \pm 0.0047$
- **Latent Task B**: $1.9568 \pm 0.0705$

*Comparison*: CoT achieved substantially lower training cross-entropy than Latent on both tasks. (Note: Cross-entropy of 0.6069 reflects solid optimization progress, not "near-zero training error".)

### 4.2 Gradient Norms & Clipping Telemetry (Task A)
- **CoT Task A**:
  - Mean pre-clipping gradient norm: $0.84$
  - Batches clipped ($\Vert \mathbf{g} \Vert_2 > 1.0$): $\approx 30.3\%$
- **Latent Task A**:
  - Mean pre-clipping gradient norm: $3.14$
  - Maximum observed single-batch gradient norm: $49.27$
  - Batches clipped ($\Vert \mathbf{g} \Vert_2 > 1.0$): $\approx 99.5\%$

*Methodological Boundary*: Chronic gradient clipping and elevated gradient norms in the recurrent latent model are empirical observations under this training configuration. They do not constitute mathematical proof that GRU recurrence or backpropagation through time (BPTT) inherently explodes.

---

## 5. Four-Scale Task A Trajectory ($k=16$)

| Scale | Parameters | Optimization Budget | CoT Accuracy | Latent Accuracy | Difference $\Delta$ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **126K** | ~126K | 20 ep / 2,500 st (static) | 73.36% ± 15.83% | 33.06% ± 1.33% | +40.30% |
| **1M** | ~1M | 20 ep / 2,500 st (static) | 76.70% ± 29.57% | 31.12% ± 2.26% | +45.58% |
| **5M Original [CONFOUNDED]** | ~5M | 20 ep / 2,500 st (static) | 13.64% ± 0.94% | 12.46% ± 0.49% | +1.18% |
| **5M Recovery [CONTROLLED]** | ~5M | 50 ep / 6,250 st (warmup+decay) | **99.74% ± 0.48%** | **33.92% ± 0.84%** | **+65.82%** |

---

## 6. Scientific Interpretation & Claim Boundaries

1. **Resolution of 5M Optimization Confound [STRONGLY SUPPORTED]**:
   The recovery schedule resolved the original 5M optimization failure. The 5M CoT model recovered to $99.74\% \pm 0.48\%$ accuracy on Task A at $k=16$, demonstrating that the original degradation was strongly attributable to the optimization schedule rather than an architectural scaling limitation.

2. **Persistence of ~33% Latent Plateau [OBSERVED]**:
   Across the tested 126K, 1M, and 5M configurations, the recurrent latent model remained near a $\sim 33\%$ Task-A accuracy plateau ($33.06\%$ at 126K, $31.12\%$ at 1M, $33.92\%$ at 5M recovery), whereas the autoregressive CoT model continued to improve with capacity ($73.36\% \to 76.70\% \to 99.74\%$).

3. **Boundaries of Latent Saturation [NOT DETERMINED]**:
   These findings do NOT mathematically prove that latent reasoning has a fundamental capacity ceiling, nor do they prove that CoT is universally superior. The result is specific to this recurrent latent implementation (cross-attention + GRUCell), these synthetic tasks, and these training conditions.

4. **Status of Mechanistic Hypotheses [PLAUSIBLE HYPOTHESIS]**:
   Earlier mechanistic probes observed strong late-step state stabilization and an initial-value attention bias in the latent model. These observations are consistent with a dynamic memory-addressing limitation, but the causal mechanism remains undetermined.
