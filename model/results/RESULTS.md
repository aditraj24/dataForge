# Scientific Analysis & Benchmark Report: Test-Time Compute Allocation

**Artifact Evaluated**: Small-Scale Reasoning Micro-Benchmark (~126K parameters)  
**Hardware Tested**: NVIDIA GeForce RTX 4060 Laptop GPU (8GB VRAM)  
**Execution Environment**: PyTorch 2.6.0+cu124, Python 3.11.9, Windows 11  
**Primary Compute Metric**: Measured GPU Wall-Clock Latency ($\text{ms}$ per test query)  
**Secondary Compute Metric**: Analytical Floating-Point Operations ($\text{FLOPs}$ per test query)  
**Independent Experimental Units**: $n = 5$ independent training runs per condition (Seeds: 42, 43, 44, 45, 46)  
**Evaluation Set**: 1,000 fixed, identical deterministic test instances per task ($D \sim \text{Uniform}(2, 16)$, Seed: 999)  

---

## 1. Overview of Evaluated Models & Parameter Capacity

Both models were initialized with shared vocabulary ($V=24$) and identical categorical prediction heads ($V \to 24$). Total parameters were programmatically verified directly from runtime model instances:

- **`AutoregressiveCoT`**: 2-layer causal Transformer decoder with causal attention masking.
  - Parameter Count: **126,168**
- **`RecurrentLatentReasoner`**: Key-value memory encoder with weight-tied cross-attention and recurrent GRUCell state updates.
  - Parameter Count: **125,688**
- **Relative Capacity Difference**: **0.38%** (strictly controlled within the $\pm 5\%$ protocol).

---

## 2. Benchmark Results Table

All accuracies represent the mean across the 5 independent seeds evaluated on the exact same 1,000 test instances. Latency represents isolated CUDA event wall-clock timing with synchronization and warm-up.

### Task A: Permutation Orbit Traversal (Pattern Induction)

| Nominal Budget | `AutoregressiveCoT` Acc (Mean ± SEM) | `AutoregressiveCoT` Latency (Mean) | `AutoregressiveCoT` Analytical FLOPs | `RecurrentLatent` Acc (Mean ± SEM) | `RecurrentLatent` Latency (Mean) | `RecurrentLatent` Analytical FLOPs | Same-$k$ Paired Diff | Same-$k$ Paired $t$-test ($n=5$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **$k = 1$** | $21.54\% \pm 2.14\%$ | $0.15\text{ ms}$ | $229,120$ | $23.70\% \pm 1.57\%$ | $0.11\text{ ms}$ | $225,280$ | $-2.16\%$ | $t = -0.98, p = 0.3844$ (ns) |
| **$k = 2$** | $29.70\% \pm 1.73\%$ | $0.19\text{ ms}$ | $458,240$ | $32.30\% \pm 0.64\%$ | $0.13\text{ ms}$ | $450,560$ | $-2.60\%$ | $t = -1.75, p = 0.1541$ (ns) |
| **$k = 4$** | $41.82\% \pm 2.16\%$ | $0.27\text{ ms}$ | $916,480$ | $32.88\% \pm 0.52\%$ | $0.18\text{ ms}$ | $901,120$ | $+8.94\%$ | $t = +4.19, p = 0.0138$ (*) |
| **$k = 8$** | $57.18\% \pm 3.62\%$ | $0.44\text{ ms}$ | $1,832,960$ | $33.14\% \pm 0.65\%$ | $0.30\text{ ms}$ | $1,802,240$ | $+24.04\%$ | $t = +6.40, p = 0.0031$ (**) |
| **$k = 12$**| $63.18\% \pm 4.64\%$ | $0.58\text{ ms}$ | $2,749,440$ | $33.04\% \pm 0.65\%$ | $0.38\text{ ms}$ | $2,703,360$ | $+30.14\%$ | $t = +6.56, p = 0.0028$ (**) |
| **$k = 16$**| $73.36\% \pm 7.08\%$ | $0.72\text{ ms}$ | $3,651,600$ | $33.06\% \pm 0.60\%$ | $0.52\text{ ms}$ | $3,604,480$ | $+40.30\%$ | $t = +5.76, p = 0.0045$ (**) |

*Note on Same-$k$ vs. Compute-Matched*: The paired $t$-tests above compare models evaluated at the **same nominal parameter $k$**. Because the models exhibit differing latencies at the same $k$, same-$k$ $p$-values do not represent statistical significance at matched latency.

### Task B: Modular Register Arithmetic (Multi-Step State Tracking)

| Nominal Budget | `AutoregressiveCoT` Acc (Mean ± SEM) | `AutoregressiveCoT` Latency (Mean) | `AutoregressiveCoT` Analytical FLOPs | `RecurrentLatent` Acc (Mean ± SEM) | `RecurrentLatent` Latency (Mean) | `RecurrentLatent` Analytical FLOPs | Same-$k$ Paired Diff | Same-$k$ Paired $t$-test ($n=5$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **$k = 1$** | $10.32\% \pm 0.23\%$ | $0.13\text{ ms}$ | $229,120$ | $10.64\% \pm 0.22\%$ | $0.09\text{ ms}$ | $225,280$ | $-0.32\%$ | $t = -0.88, p = 0.4272$ (ns) |
| **$k = 2$** | $10.30\% \pm 0.37\%$ | $0.18\text{ ms}$ | $458,240$ | $16.48\% \pm 0.29\%$ | $0.13\text{ ms}$ | $450,560$ | $-6.18\%$ | $t = -29.00, p < 0.0001$ (***) |
| **$k = 4$** | $11.04\% \pm 0.47\%$ | $0.26\text{ ms}$ | $916,480$ | $15.56\% \pm 0.44\%$ | $0.19\text{ ms}$ | $901,120$ | $-4.52\%$ | $t = -8.19, p = 0.0012$ (**) |
| **$k = 8$** | $12.62\% \pm 0.67\%$ | $0.41\text{ ms}$ | $1,832,960$ | $14.76\% \pm 0.57\%$ | $0.29\text{ ms}$ | $1,802,240$ | $-2.14\%$ | $t = -3.82, p = 0.0189$ (*) |
| **$k = 12$**| $12.92\% \pm 0.78\%$ | $0.56\text{ ms}$ | $2,749,440$ | $13.84\% \pm 0.66\%$ | $0.40\text{ ms}$ | $2,703,360$ | $-0.92\%$ | $t = -0.69, p = 0.5278$ (ns) |
| **$k = 16$**| $12.82\% \pm 0.90\%$ | $0.70\text{ ms}$ | $3,660,192$ | $13.82\% \pm 0.81\%$ | $0.50\text{ ms}$ | $3,604,480$ | $-1.00\%$ | $t = -0.67, p = 0.5399$ (ns) |

---

## 3. Empirical Non-Dominated Pareto Frontiers

The primary analysis evaluates only **actually observed operating points** $(C_{\text{latency}}, A_{\text{accuracy}})$. No artificial interpolation or convex hulls are applied.

### Task A (Permutation Orbits)
- **`AutoregressiveCoT` Observed Non-Dominated Operating Points**:
  - $k=1$: $(0.15\text{ ms}, 21.54\%)$
  - $k=2$: $(0.19\text{ ms}, 29.70\%)$
  - $k=4$: $(0.27\text{ ms}, 41.82\%)$
  - $k=8$: $(0.44\text{ ms}, 57.18\%)$
  - $k=12$: $(0.58\text{ ms}, 63.18\%)$
  - $k=16$: $(0.72\text{ ms}, 73.36\%)$
- **`RecurrentLatentReasoner` Observed Non-Dominated Operating Points**:
  - $k=1$: $(0.11\text{ ms}, 23.70\%)$
  - $k=2$: $(0.13\text{ ms}, 32.30\%)$
  - $k=4$: $(0.18\text{ ms}, 32.88\%)$
  - $k=8$: $(0.30\text{ ms}, 33.14\%)$
  *(Observed points at $k=12$ [$0.38\text{ ms}, 33.04\%$] and $k=16$ [$0.52\text{ ms}, 33.06\%$] are strictly Pareto-dominated by $k=8$ due to higher latency with zero accuracy gain).*

#### Pareto Dominance Analysis on Task A:
- **Low-Compute Region ($< 0.20\text{ ms}$)**: Latent observed point at $k=2$ achieves $(0.13\text{ ms}, 32.30\%)$, which has both lower latency and higher accuracy than the CoT observed points at $k=1$ ($0.15\text{ ms}, 21.54\%$) and $k=2$ ($0.19\text{ ms}, 29.70\%$).
- **Mid-to-High Compute Region ($> 0.25\text{ ms}$)**: Autoregressive CoT observed points reach accuracy levels ($41.82\%$ at $0.27\text{ ms}$, $57.18\%$ at $0.44\text{ ms}$, $73.36\%$ at $0.72\text{ ms}$) that the latent model never attains at any budget (latent maximum observed accuracy across all budgets is $33.14\%$).
- **Verdict on Pareto Dominance**: Neither frontier completely dominates the other across the entire compute support:
  - Latent occupies the non-dominated frontier in the very low compute regime ($< 0.20\text{ ms}$).
  - CoT exclusively populates the frontier for accuracy targets $\ge 35\%$, extending the performance ceiling up to $73.36\%$.

### Task B (Modular Registers)
- **`AutoregressiveCoT` Observed Non-Dominated Operating Points**:
  - $k=1$: $(0.13\text{ ms}, 10.32\%)$
  - $k=4$: $(0.26\text{ ms}, 11.04\%)$
  - $k=8$: $(0.41\text{ ms}, 12.62\%)$
  - $k=12$: $(0.56\text{ ms}, 12.92\%)$
- **`RecurrentLatentReasoner` Observed Non-Dominated Operating Points**:
  - $k=1$: $(0.09\text{ ms}, 10.64\%)$
  - $k=2$: $(0.13\text{ ms}, 16.48\%)$
  *(All latent observed points for $k \ge 4$ are Pareto-dominated by $k=2$, as latent accuracy peaks at $16.48\%$ and then gently declines to $13.82\%$).*

#### Pareto Dominance Analysis on Task B:
- The Latent observed point at $k=2$ achieves $(0.13\text{ ms}, 16.48\%)$. This point strictly Pareto-dominates **every observed CoT point** on Task B (CoT maximum observed accuracy across all budgets is $12.92\%$ at $0.56\text{ ms}$).
- However, both models remain close to chance performance (random guessing is $10.0\%$).

---

## 4. Audit of Specific Findings & Observations

### A. Full Per-Seed Accuracies Behind the 99.10% Result
In the initial run, seed 46 reached $99.10\%$ for `AutoregressiveCoT` on Task A at $k=16$. Here are the full per-seed results:
- **Seed 42**: $76.20\%$ ($762/1,000$)
- **Seed 43**: $69.70\%$ ($697/1,000$)
- **Seed 44**: $58.90\%$ ($589/1,000$)
- **Seed 45**: $62.90\%$ ($629/1,000$)
- **Seed 46**: $99.10\%$ ($991/1,000$)
- **Distribution Summary**: Mean = $73.36\%$, Median = $69.70\%$, Standard Deviation = $15.83\%$, SEM = $7.08\%$.
- **Interpretation**: While Seed 46 demonstrates that the architecture is capable of near-perfect permutation traversal under favorable weight initialization, it is a high-performing positive outlier relative to the cohort median ($69.70\%$). All 5 seeds nevertheless exhibited substantial positive scaling over their $k=1$ baselines ($15.60\%–26.20\%$).

### B. Source and Calculation of the 86.47% Over-Budget Result
The reported $86.47\%$ figure represents the **mean accuracy restricted to the over-budget subset ($D < k$)** for `AutoregressiveCoT` on Task A at $k=8$:
- **Denominator**: Exactly 408 out of the 1,000 test instances had nominal difficulty $D < 8$ (i.e., $D \in \{2, 3, 4, 5, 6, 7\}$).
- **Per-Seed Over-Budget Accuracies at $k=8$**:
  - Seed 42: $79.41\%$ ($324 / 408$)
  - Seed 43: $97.30\%$ ($397 / 408$)
  - Seed 44: $67.65\%$ ($276 / 408$)
  - Seed 45: $87.99\%$ ($359 / 408$)
  - Seed 46: $100.00\%$ ($408 / 408$)
  - **Mean Over-Budget Accuracy**: **$86.47\%$**
- **Methodological Takeaway**: When $k \ge D$, the CoT model's early-stopping mechanism emits `<END_THINK>` upon reaching the true depth and halts token generation, allowing it to correctly solve $86.47\%$ of tasks where sufficient compute was available.

### C. Characterization of Latent Model Saturation
On Task A, the latent model's progression across increasing recurrent depth was:
- $k=1$: $23.70\% \pm 1.57\%$
- $k=2$: $32.30\% \pm 0.64\%$ ($+8.60\%$ gain over $k=1$)
- $k=4$: $32.88\% \pm 0.52\%$ ($+0.58\%$ gain over $k=2$)
- $k=8$: $33.14\% \pm 0.65\%$ ($+0.26\%$ gain over $k=4$)
- $k=12$: $33.04\% \pm 0.65\%$ ($-0.10\%$ change from $k=8$)
- $k=16$: $33.06\% \pm 0.60\%$ ($+0.02\%$ change from $k=12$)
- **Accurate Description**: The latent model achieves an initial steep gain from 1 to 2 recurrent transitions ($+8.60\%$), but exhibits **near-complete saturation beyond $k=2$**, gaining less than $1.0\%$ total additional accuracy across the entire range from $k=2 \to 16$.

### D. Detailed Interpretation of Task B Results
- On Task B (Modular Register Arithmetic), the Latent model achieved higher accuracy than CoT at low-to-intermediate budgets:
  - At $k=2$: Latent $16.48\%$ vs. CoT $10.30\%$ (paired diff $-6.18\%$, $p < 0.0001$).
  - At $k=4$: Latent $15.56\%$ vs. CoT $11.04\%$ (paired diff $-4.52\%$, $p = 0.0012$).
  - At $k=8$: Latent $14.76\%$ vs. CoT $12.62\%$ (paired diff $-2.14\%$ $p = 0.0189$).
- At higher budgets ($k \ge 12$), this advantage eroded:
  - At $k=12$: Latent $13.84\%$ vs. CoT $12.92\%$ ($p = 0.5278$, not significant).
  - At $k=16$: Latent $13.82\%$ vs. CoT $12.82\%$ ($p = 0.5399$, not significant).
- **Substantive Conclusion**: Neither model learned to reliably solve long multi-step modular sequences within 20 epochs; accuracy for both architectures remained between $10\%$ and $17\%$ (where chance performance is $10\%$). The latent model showed a modest but statistically significant advantage at low budgets, but neither model attained functional mastery of multi-step modular arithmetic.

---

## 5. Component-by-Component Evaluation of the Original Hypothesis

The original hypothesis stated:
> *"Spending test-time compute on recurrent latent iterations instead of generated reasoning tokens improves verified accuracy per dollar on pattern-induction tasks — but the advantage vanishes on tasks that need an explicit symbolic scratchpad."*

### Component A: Does recurrent latent reasoning provide a better cost-accuracy Pareto frontier on pattern induction (Task A)?
- **Verdict: FALSIFIED for mid-to-high accuracy targets; SUPPORTED only in the sub-35% low-compute regime.**
- **Evidence**:
  - The Latent model does hold an efficiency advantage at extremely low compute ($k \le 2$, latency $\le 0.13\text{ ms}$), achieving $32.30\%$ accuracy compared to CoT's $29.70\%$ at $0.19\text{ ms}$.
  - However, the Latent frontier saturates at $33.14\%$. It is entirely incapable of serving compute budgets that demand moderate-to-high accuracy.
  - Autoregressive CoT scales monotonically from $21.54\%$ to $73.36\%$ ($0.15\text{ ms}$ to $0.72\text{ ms}$).
  - Therefore, the claim that latent iterations yield a generally superior cost-accuracy Pareto frontier on pattern induction is **falsified across the majority of the operational compute curve**.

### Component B: Does the latent advantage vanish on tasks requiring an explicit symbolic scratchpad (Task B)?
- **Verdict: INCONCLUSIVE (Neither model mastered the task).**
- **Evidence**:
  - At $k=2$, the Latent model actually demonstrated a statistically significant advantage over CoT ($16.48\%$ vs. $10.30\%$, $p < 0.0001$).
  - At $k \ge 12$, the performance difference between models became statistically indistinguishable from zero ($p \approx 0.53$).
  - However, because absolute accuracy for both models remained near baseline noise ($10\%–16\%$), this convergence reflects an optimization/capacity bottleneck for both architectures rather than clear evidence that symbolic scratchpads rescued the token model.

---

## 6. Overall Scientific Conclusion

### Final Hypothesis Classification: **MIXED / MAIN CLAIM FALSIFIED IN SCALING REGIME**

1. **What the Experiment Proved**:
   - Discrete autoregressive scratchpad generation exhibits **robust test-time compute scaling** on algorithmic graph traversal: expanding inference budget from $k=1 \to 16$ drove accuracy from $21.54\%$ to $73.36\%$.
   - Recurrent latent depth in a micro-architecture (~126K parameters) provides high compute efficiency at tiny budgets ($k=2$), but suffers from **rapid representation saturation**, failing to leverage additional compute beyond 2 iterations.
   - On over-budget instances ($k > D$), the ability of autoregressive token models to emit `<END_THINK>` prevents self-corruption, whereas fixed continuous latent recurrence is vulnerable to over-computation drift.
2. **Limitations**:
   - The experiments evaluate small-scale synthetic models (~126K parameters) trained from scratch on micro-benchmarks. They cannot be generalized to 100M+ parameter foundation models with pre-trained representations.
   - GPU wall-clock latency on an RTX 4060 was measured; dollar costs were not modeled.
3. **Recommended Next Experiment**:
   - Test **Adaptive Computation Time (ACT)** on the latent core to evaluate whether learned halting prevents over-budget saturation.
   - Increase training duration or model capacity on Task B to determine whether symbolic scratchpads unlock modular arithmetic scaling once training loss converges.
