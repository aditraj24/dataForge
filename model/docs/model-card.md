# Model Cards: Reasoning Architectures, Parameter Matching & Scaling

This document provides comprehensive technical specifications, architectural equations, layer dimensions, verified parameter counts, training configurations, and empirical characteristics for the models evaluated across all three experimental scales in this research.

---

## 1. Capacity Matching Across Experimental Scales

To ensure that performance comparisons reflect algorithmic inductive bias rather than differences in capacity, model parameters were programmatically matched across all experimental scales:

| Scale | Model Architecture | Implementation Config | Total Parameters | Trainable Parameters | Relative Difference | Protocol Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **126K** | `AutoregressiveCoT` | $d=80, d_{\text{ff}}=192$ | **126,168** | 126,168 | Baseline | $\pm 0.00\%$ |
| **126K** | `RecurrentLatentReasoner` | $d=80, d_{\text{ff}}=304$ | **125,688** | 125,688 | -0.3804% (-480 params) | **PASSED** (< $\pm 5\%$) |
| **1M** | `AutoregressiveCoT` | $d=224, d_{\text{ff}}=536$ | **998,520** | 998,520 | Baseline | $\pm 0.00\%$ |
| **1M** | `RecurrentLatentReasoner` | $d=224, d_{\text{ff}}=852$ | **998,523** | 998,523 | +0.0003% (+3 params) | **PASSED** (< $\pm 5\%$) |
| **5M** | `AutoregressiveCoT` | $d=544, d_{\text{ff}}=1304$ | **5,000,632** | 5,000,632 | Baseline | $\pm 0.00\%$ |
| **5M** | `RecurrentLatentReasoner` | $d=544, d_{\text{ff}}=2076$ | **5,000,635** | 5,000,635 | +0.00006% (+3 params) | **PASSED** (< $\pm 5\%$) |
| **Standalone** | `HebbianMemory` | $n=128, d=64$ | **20,672** | 12,480 (8,192 $\sigma$) | N/A | *Educational baseline* |

*Verification command*:
```python
sum(p.numel() for p in model.parameters())
```

---

## 2. Multi-Scale Architectural Hyperparameters

| Hyperparameter | 126K Baseline | 1M Scaling | 5M Scaling & Recovery |
| :--- | :--- | :--- | :--- |
| **Vocabulary Size ($V$)** | 24 | 24 | 24 |
| **Max Sequence Length ($L_{\text{max}}$)** | 96 | 96 | 96 |
| **Model Dimension ($d_{\text{model}}$)** | 80 | 224 | 544 |
| **Attention Heads ($n_{\text{head}}$)** | 4 ($d_k=20$) | 4 ($d_k=56$) | 4 ($d_k=136$) |
| **CoT Transformer Layers** | 2 | 2 | 2 |
| **CoT Feedforward Dim ($d_{\text{ff}}$)** | 192 | 536 | 1304 |
| **Latent Recurrent Cell** | GRUCell ($80 \to 80$) | GRUCell ($224 \to 224$) | GRUCell ($544 \to 544$) |
| **Latent Feedforward Dim ($d_{\text{ff}}$)** | 304 | 852 | 2076 |
| **Analytical FLOPs per Step/Token** | CoT: 229,120 / Latent: 225,280 | CoT: 1,774,080 / Latent: 1,766,912 | CoT: 10,436,096 / Latent: 10,436,096 |

---

## 3. Model Specifications by Paradigm

### 3.1 `AutoregressiveCoT`
- **Purpose**: Sequential scratchpad reasoning paradigm. Generates discrete reasoning tokens step-by-step before predicting the final answer token.
- **Forward Pass**:
  1. Embeds tokens + learned positional embeddings: $\mathbf{x} = \mathbf{E}(\text{seq\_ids}) + \mathbf{P}_{:L}$.
  2. Applies square causal attention mask $\mathbf{M}_{\text{causal}}$ across 2 Transformer encoder layers.
  3. Projects through final LayerNorm (`ln_f`) and linear classification head (`head`).
- **Inference Decoding**:
  - Appends `THINK` to input prompt.
  - Greedy autoregressive decoding up to maximum budget $k$.
  - Breaks early if `END_THINK` is emitted.
  - Appends `ANS` and emits final answer prediction.

### 3.2 `RecurrentLatentReasoner`
- **Purpose**: Recurrent continuous latent reasoning paradigm. Updates internal hidden states through cross-attention to input memory without emitting discrete tokens.
- **Forward Pass**:
  1. Encodes input prompt into key-value memory: $\mathbf{M} = \mathbf{E}(\mathbf{x}_{\text{input}}) + \mathbf{P}_{:L_{\text{in}}}$.
  2. Initializes hidden state from prompt terminal token: $\mathbf{h}_0 = \mathbf{M}_{:, -1, :}$.
  3. Iterates recurrent transition loop $k$ times:
     - Cross-Attention: $\mathbf{c}_t = \operatorname{MultiHeadAttention}(\mathbf{h}_{t-1}, \mathbf{M}, \mathbf{M})$
     - GRU Update: $\mathbf{h}_t' = \operatorname{LayerNorm}(\operatorname{GRUCell}(\mathbf{c}_t, \mathbf{h}_{t-1}))$
     - FFN Residual Update: $\mathbf{h}_t = \operatorname{LayerNorm}(\mathbf{h}_t' + \operatorname{MLP}(\mathbf{h}_t'))$
  4. Projects terminal state $\mathbf{h}_k$ through linear head to categorical logits.
- **Inference**: Executes exactly $k$ recurrent transitions (no adaptive halting).

---

## 4. Training Configurations Across Experimental Conditions

1. **126K Baseline & 1M Scaling**:
   - Optimizer: AdamW ($\beta_1=0.9, \beta_2=0.999$, weight decay $0.01$).
   - Learning Rate: Static $1 \times 10^{-3}$ (no scheduler).
   - Budget: 20 epochs / 2,500 optimizer steps (batch size 32, 4,000 samples).
   - Gradient Clipping: $\Vert \mathbf{g} \Vert_2 \le 1.0$.

2. **5M Original [HISTORICAL / CONFOUNDED]**:
   - Optimizer: AdamW, static $1 \times 10^{-3}$ (identical to 126K/1M).
   - Budget: 20 epochs / 2,500 optimizer steps.
   - Outcome: Severe underfitting (training loss 1.35–1.57; Task A accuracy near chance ~13%). Confounded by optimization insufficiency.

3. **5M Recovery [MEASURED / CONTROLLED]**:
   - Optimizer: AdamW, weight decay $0.01$, gradient clipping $1.0$.
   - Learning Rate: Peak $5 \times 10^{-4}$ with 5-epoch linear warmup (625 steps) and cosine decay to $1 \times 10^{-5}$.
   - Budget: 50 epochs / 6,250 optimizer steps.
   - Outcome: Optimization resolved; CoT achieved training loss $0.6069 \pm 0.0057$ and test accuracy $99.74\% \pm 0.48\%$ at $k=16$. Latent stabilized at training loss $1.8890 \pm 0.0129$ and test accuracy $33.92\% \pm 0.84\%$.

---

## 5. Ten Formal Model Card Specification Criteria

### 1. Architecture
- `AutoregressiveCoT`: 2-layer causal Transformer decoder with learned positional embeddings.
- `RecurrentLatentReasoner`: Structured cross-attention encoder followed by recurrent GRUCell + residual MLP state-transition loop.

### 2. Training Configuration
- Supervised teacher-forcing on aligned intermediate trajectories and terminal answers on 4,000 synthetic problem instances per seed. Controlled optimization recovery schedule applied at 5M scale.

### 3. Experimental Scale
- Validated across three parameter scales: 126K ($d=80$), 1M ($d=224$), and 5M ($d=544$).

### 4. Intended Research Use
- Scientific evaluation of trade-offs between explicit autoregressive token generation vs continuous recurrent state updates under varying inference compute budgets ($k \in \{1, 2, 4, 8, 12, 16\}$).

### 5. Benchmark Results
- **Task A at $k=16$**:
  - 126K: CoT $73.36\% \pm 15.83\%$ vs Latent $33.06\% \pm 1.33\%$
  - 1M: CoT $76.70\% \pm 29.57\%$ vs Latent $31.12\% \pm 2.26\%$
  - 5M Recovery: CoT $99.74\% \pm 0.48\%$ vs Latent $33.92\% \pm 0.84\%$ ($\Delta = +65.82\%$, paired $t=188.91, p=4.71\times 10^{-9}$)
- **Task B**: Low absolute accuracy across all scales ($10\%–18.6\%$, near 10% chance baseline).

### 6. Known Limitations
- Both architectures perform poorly on Task B modular arithmetic.
- Latent model lacks adaptive halting (ACT), requiring fixed $k$ recurrent transitions.
- CoT exhibits high seed variance at smaller scales (Seed 46 outlier).

### 7. Optimization Confounds
- The original 5M experiment suffered severe underfitting under a 2,500-step static AdamW schedule. Resolved by the 6,250-step warmup/decay schedule in the recovery experiment.

### 8. Mechanistic Hypotheses
- Mechanistic probes observed strong late-step state stabilization and an initial-value cross-attention bias in the latent model. These observations are consistent with a dynamic memory-addressing limitation, but causal mechanisms remain undetermined.

### 9. Reproducibility
- 5 deterministic training seeds ($42, 43, 44, 45, 46$), fixed test seed ($999$), isolated checkpoint directories, and structured JSON results ensure exact reproducibility.

### 10. What the Results Do NOT Establish
- **Not universal superiority of CoT**: The findings reflect specific algorithmic implementations on tested tasks under evaluated compute budgets.
- **Not a mathematical impossibility of latent scaling**: The ~33% ceiling is an empirical plateau for this recurrent architecture under these training conditions.
- **Not latency-matched significance**: Paired statistical tests compare models at the same nominal $k$, not identical hardware wall-clock latency.
- **Not proof that gradient clipping is inherently caused by BPTT**: Chronic clipping (~99% batches) in 5M latent training is an empirical observation under this configuration.

---

## Implementation References

- `models_cot_model.py`: `AutoregressiveCoT` (lines 5–87)
- `models_latent_model.py`: `RecurrentLatentReasoner` (lines 5–97)
- `models_hebbian_model.py`: `HebbianMemory` (lines 4–80)
- `run_full_training_1m.py`: 1M model configuration ($d=224$)
- `run_full_training_5m.py`: 5M model configuration ($d=544$)
- `run_full_training_5m_recovery.py`: 5M recovery training pipeline
- `run_benchmark_eval_5m_recovery.py`: 5M recovery evaluation pipeline
