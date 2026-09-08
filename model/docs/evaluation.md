# Evaluation Framework & Benchmark Methodology

This document defines the rigorous benchmarking protocol, hardware profiling methods, analytical FLOP models, empirical non-dominated Pareto extraction algorithms, and statistical analysis procedures implemented in the evaluation pipeline.

---

## 1. Experimental Benchmark Design

The benchmark evaluates how test-time reasoning compute affects task accuracy across two architecture paradigms under identical task conditions.

### 1.1 Dimensional Structure of the Benchmark
- **Models ($2$)**: `AutoregressiveCoT`, `RecurrentLatentReasoner`
- **Tasks ($2$)**: Task A (`TaskAPermutationOrbit`), Task B (`TaskBModularRegister`)
- **Independent Seeds ($n = 5$)**: $42, 43, 44, 45, 46$ (each yielding an independently trained checkpoint)
- **Inference Budgets ($6$)**: $k \in \{1, 2, 4, 8, 12, 16\}$
- **Evaluation Dataset**: 1,000 fixed, deterministic test instances per task generated with `TEST_SEED = 999` ($D \sim \text{Uniform}(2, 16)$).
- **Total Operational Evaluations per Scale**:
  $$2 \text{ models} \times 2 \text{ tasks} \times 5 \text{ seeds} \times 6 \text{ budgets} = 120 \text{ benchmark evaluations}$$
- **Aggregated Condition Groups per Scale**: $2 \text{ models} \times 2 \text{ tasks} \times 6 \text{ budgets} = 24 \text{ condition records}$.
- **Experimental Scales Evaluated**:
  1. **126K Baseline** (`results/`): 120 evaluation records
  2. **1M Scaling** (`results_1m/`): 120 evaluation records
  3. **5M Original [CONFOUNDED]** (`results_5m/`): 120 evaluation records
  4. **5M Recovery [CONTROLLED]** (`results_5m_recovery/`): 120 evaluation records

---

## 2. Hardware Profiling & Compute Metrics

### 2.1 Primary Metric: Isolated GPU Wall-Clock Latency ($\text{ms}$)
All latency measurements reflect isolated inference time on an **NVIDIA GeForce RTX 4060 Laptop GPU** using PyTorch CUDA events:
1. **Warm-Up**: 5 full test batches (160 instances) are processed before any timing event is recorded to eliminate CUDA kernel compilation overhead and warm device caches.
2. **Synchronization**: An explicit `torch.cuda.synchronize()` is executed before recording `start_event`.
3. **Execution**: The entire 1,000-sample test set is processed in batches of size 32 under `torch.no_grad()`.
4. **Recording & Timing**:
   ```python
   start_event.record()
   # ... inference loop across 1,000 samples ...
   end_event.record()
   torch.cuda.synchronize()
   total_latency_ms = start_event.elapsed_time(end_event)
   latency_per_sample_ms = total_latency_ms / 1000.0
   ```
5. **[CRITICAL DISTINCTION]**: Compute efficiency is measured directly in **milliseconds of GPU wall-clock latency** and **analytical FLOPs**. The experiment did not evaluate dollar costs, cloud billing rates, or energy costs. Claims of "cost per dollar" are unestablished by this implementation. Any historical references to $0.001 reflect an arbitrary, mock step-based cost multiplier used by early evaluation scripts, which did not represent genuine monetary cost.

### 2.2 Secondary Metric: Analytical Floating-Point Operations ($\text{FLOPs}$)
Analytical FLOPs are calculated on a per-sample basis using standard multiply-accumulate count ($2 \times \text{MACs}$):

#### 126K Baseline ($d=80, V=24$):
- **`AutoregressiveCoT` ($d_{\text{ff}}=192, n_{\text{layers}}=2$)**:
  $$\text{FLOPs}_{\text{per\_token}} = 2 \times \left( 4 d^2 \times 2 + 2 d d_{\text{ff}} \times 2 \right) + 2 d V = 229,120 \text{ FLOPs}$$
  $$\text{Total FLOPs} = \text{tokens\_generated} \times 229,120$$
- **`RecurrentLatentReasoner` ($d_{\text{ff}}=304$)**:
  $$\text{FLOPs}_{\text{per\_step}} = 4 d^2 \times 2 + 6 d^2 \times 2 + 2 d d_{\text{ff}} \times 2 = 225,280 \text{ FLOPs}$$
  $$\text{Total FLOPs} = k \times 225,280$$

#### 1M Scaling ($d=224, V=24$):
- **`AutoregressiveCoT` ($d_{\text{ff}}=536, n_{\text{layers}}=2$)**:
  $$\text{FLOPs}_{\text{per\_token}} = 2 \times \left( 4 d^2 \times 2 + 2 d d_{\text{ff}} \times 2 \right) + 2 d V = 1,774,080 \text{ FLOPs}$$
- **`RecurrentLatentReasoner` ($d_{\text{ff}}=852$)**:
  $$\text{FLOPs}_{\text{per\_step}} = 4 d^2 \times 2 + 6 d^2 \times 2 + 2 d d_{\text{ff}} \times 2 = 1,766,912 \text{ FLOPs}$$

#### 5M Scaling & Recovery ($d=544, V=24$):
- **`AutoregressiveCoT` ($d_{\text{ff}}=1304, n_{\text{layers}}=2$)**:
  $$\text{FLOPs}_{\text{per\_token}} = 2 \times \left( 4 d^2 \times 2 + 2 d d_{\text{ff}} \times 2 \right) + 2 d V = 10,436,096 \text{ FLOPs}$$
- **`RecurrentLatentReasoner` ($d_{\text{ff}}=2076$)**:
  $$\text{FLOPs}_{\text{per\_step}} = 4 d^2 \times 2 + 6 d^2 \times 2 + 2 d d_{\text{ff}} \times 2 = 10,436,096 \text{ FLOPs}$$

---

## 3. Test-Time Reasoning Budget ($k$) Semantics

The test-time compute budget parameter $k \in \{1, 2, 4, 8, 12, 16\}$ has distinct operational semantics across the two architectures:

### 3.1 In `AutoregressiveCoT`
- $k$ represents the **maximum number of scratchpad tokens** the model is permitted to generate before being forced to emit the final answer.
- Generation proceeds token-by-token. If the model emits `END_THINK` before generating $k$ tokens, scratchpad generation terminates immediately, and the model proceeds directly to emit `ANS` and the final answer token.
- **Compute Impact**: If a model terminates early, it consumes fewer FLOPs and less latency.

### 3.2 In `RecurrentLatentReasoner`
- $k$ represents the **exact number of recurrent latent transitions** executed by the model.
- The model executes exactly $k$ iterations of the recurrent loop (`cross-attention` $\to$ `GRUCell` $\to$ `MLP`).
- **[CRITICAL]**: The model has **no early stopping or adaptive halting mechanism**. It executes fixed exact-depth recurrence.

---

## 4. Under-Budget, Matched-Budget, and Over-Budget Tracking

Because problem difficulty varies ($D \sim \text{Uniform}(2, 16)$) across the fixed test set, the benchmark explicitly segments accuracy into three budget regimes:

| Regime | Condition | Description & Scientific Significance |
| :--- | :--- | :--- |
| **Under-Budget** | $k < D$ | The reasoning budget is strictly insufficient to complete all required hops/operations. Tests partial-state accuracy and heuristic fallbacks. |
| **Matched-Budget**| $k = D$ | The reasoning budget exactly matches the problem difficulty. Represents the optimal compute allocation. |
| **Over-Budget** | $k > D$ | The reasoning budget exceeds the problem difficulty. Tests stability against over-thinking, drift, or degradation. |

---

## 5. Empirical Non-Dominated Pareto Frontier Extraction

Pareto frontiers are constructed strictly from **observed, empirical operating points** $(C_{\text{latency}}, A_{\text{accuracy}})$.

### 5.1 Dominance Definition
Operating point $P_1 = (C_1, A_1)$ **strictly dominates** operating point $P_2 = (C_2, A_2)$ if and only if:
$$C_1 \le C_2 \quad \text{and} \quad A_1 \ge A_2$$
with at least one strict inequality ($C_1 < C_2$ or $A_1 > A_2$).

*Empirical Scope*: Dominance is assessed strictly between observed operating points in the benchmark. It does not establish dominance across unobserved intermediate compute budgets, nor does it assume continuous or convex trade-off curves.

### 5.2 Extraction Algorithm (`extract_pareto_frontier`)
1. Points are sorted ascending by compute (latency), breaking ties by descending accuracy.
2. The algorithm iterates through points, maintaining the maximum accuracy observed so far. A point is added to the non-dominated frontier only if its accuracy strictly exceeds all previously accepted points.
3. **No convex hull or linear interpolation** is assumed or constructed.

---

## 6. Statistical Comparison Methodology

All statistical comparisons are computed across the **5 independent training seeds** ($n = 5$ experimental units):
1. **Paired Differences**: For each budget $k$ and task, the paired difference is:
   $$\Delta_s = \text{Accuracy}_{\text{CoT}}(s) - \text{Accuracy}_{\text{Latent}}(s), \quad s \in \{42, 43, 44, 45, 46\}$$
2. **Paired Two-Tailed $t$-Test**:
   $$t = \frac{\bar{\Delta}}{\text{SEM}_{\Delta}}, \quad \text{where } \text{SEM}_{\Delta} = \frac{s_{\Delta}}{\sqrt{n}}, \quad \text{df} = 4$$
3. **Wilcoxon Signed-Rank Test**: Non-parametric test of paired rank differences.
4. **[METHODOLOGICAL BOUNDARY]**:
   - The 1,000 test examples are evaluation instances, **not** independent replicates.
   - Paired tests compare models at the **same nominal parameter $k$**. Because models exhibit different hardware latencies at the same $k$, same-$k$ $t$-tests do not evaluate "latency-matched" statistical significance.

---

## Implementation References

- `run_benchmark_eval.py`:
  - Benchmark evaluation loop (lines 36–219)
  - CUDA event timing (lines 77–114, 156–192)
  - Regime tracking: under, matched, over budget (lines 97–109, 175–187)
- `training_compare_costs.py`:
  - `compute_analytical_flops()` (lines 12–30)
  - `measure_latency_cuda()` (lines 31–56)
  - `extract_pareto_frontier()` (lines 57–78)
- `process_benchmark_results.py`:
  - Statistical aggregation and hypothesis testing (lines 1–180)
- `run_benchmark_eval_5m_recovery.py`:
  - 5M recovery benchmark evaluation pipeline (120 evaluation records)
- `process_benchmark_results_5m_recovery.py`:
  - 5M recovery statistical aggregation, paired $t$-tests, and Pareto extraction
- `generate_plots_5m_recovery.py`:
  - 5M recovery Pareto frontier visualization and budget sweep generation
