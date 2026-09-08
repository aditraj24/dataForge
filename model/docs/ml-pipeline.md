# Machine Learning Training Pipeline

This document defines the training contracts, mathematical objectives, supervision regimes, optimization hyperparameters, and multi-seed orchestration scripts implementing the research pipeline.

---

## 1. Multi-Seed Training Orchestration Across Scales

The project maintains four distinct model suites trained across **5 independent training seeds** ($s \in \{42, 43, 44, 45, 46\}$), 2 model families, and 2 algorithmic tasks (20 model checkpoints per suite):

$$\mathcal{M} = \{\text{AutoregressiveCoT}, \text{RecurrentLatentReasoner}\}$$
$$\mathcal{T} = \{\text{Task A: Permutation Orbit}, \text{Task B: Modular Register}\}$$
$$\mathcal{S}_{\text{train}} = \{42, 43, 44, 45, 46\}$$
$$\text{Total Checkpoints per Suite} = 2 \times 2 \times 5 = 20$$

### Model Suites:
1. **126K Baseline Suite** (`export/models/`): Trained via `run_full_training.py` (~5.4 minutes).
2. **1M Scaling Suite** (`export/models_1m/`): Trained via `run_full_training_1m.py` (~16.2 minutes).
3. **5M Original Suite [CONFOUNDED]** (`export/models_5m/`): Trained via `run_full_training_5m.py` (~48.7 minutes). Underfit due to insufficient optimizer steps/learning rate schedule.
4. **5M Recovery Suite [CONTROLLED]** (`export/models_5m_recovery/`): Trained via `run_full_training_5m_recovery.py` (~112.5 minutes). Successfully resolved the optimization confound with warmup and cosine decay.

---

## 2. Supervised Training Contracts & Optimization Protocols

### 2.1 Optimization Protocols Across Scales

| Hyperparameter | 126K Baseline & 1M Scaling | 5M Original [CONFOUNDED] | 5M Recovery [CONTROLLED] |
| :--- | :--- | :--- | :--- |
| **Optimizer** | `optim.AdamW` | `optim.AdamW` | `optim.AdamW` |
| **Peak Learning Rate ($\eta$)** | $1 \times 10^{-3}$ | $1 \times 10^{-3}$ | $5 \times 10^{-4}$ |
| **LR Schedule** | Constant (no schedule) | Constant (no schedule) | Linear warmup (5 ep / 625 st) $\to$ Cosine decay to $1 \times 10^{-5}$ |
| **Weight Decay ($\lambda$)** | $0.01$ | $0.01$ | $0.01$ |
| **Batch Size ($B$)** | 32 | 32 | 32 |
| **Training Epochs** | 20 | 20 | 50 |
| **Optimizer Steps** | 2,500 | 2,500 | 6,250 |
| **Gradient Clipping** | $\Vert \mathbf{g} \Vert_2 \le 1.0$ | $\Vert \mathbf{g} \Vert_2 \le 1.0$ | $\Vert \mathbf{g} \Vert_2 \le 1.0$ (with norm telemetry) |
| **Training Samples** | 4,000 per seed | 4,000 per seed | 4,000 per seed |
| **Difficulty Distribution**| $D \sim \text{Uniform}(2, 16)$ | $D \sim \text{Uniform}(2, 16)$ | $D \sim \text{Uniform}(2, 16)$ |
| **Supervision Regime** | `'aligned'` (Primary) | `'aligned'` (Primary) | `'aligned'` (Primary) |
| **Convergence State** | High training accuracy | Severe underfitting (loss ~1.35–1.57) | CoT recovered (loss 0.61); Latent stabilized (loss 1.89) |

---

## 3. Supervision Regimes & Loss Formulations

### 3.1 `AutoregressiveCoT` (`training_train_cot.py`)

#### Primary Regime: Aligned Teacher-Forcing (`supervision='aligned'`)
The model is trained via standard next-token prediction over the full sequence (input prompt followed by the reasoning scratchpad):
$$\mathbf{X} = \mathbf{x}_{\text{input}} \mathbin{\Vert} \mathbf{s}_{\text{trace}} = [x_0, x_1, \dots, x_{L-1}]$$
$$\mathbf{z}_t = \text{AutoregressiveCoT}(x_0, \dots, x_t) \in \mathbb{R}^{24}$$
$$\mathcal{L}_{\text{aligned}} = -\frac{1}{L-1} \sum_{t=0}^{L-2} \log P(x_{t+1} \mid x_0, \dots, x_t)$$
- Implemented with `nn.CrossEntropyLoss(ignore_index=VOCAB['PAD'])`.
- Teacher forcing ensures that intermediate step predictions ($v_1 \dots v_D$) and terminal answer tokens are supervised at every sequence position.

#### Secondary Regime: End-to-End (`supervision='e2e'`) [VERIFIED]
Loss is evaluated exclusively on the terminal answer token position:
$$\mathcal{L}_{\text{e2e}} = -\log P(y_{\text{ans}} \mid x_0, \dots, x_{L-2})$$

---

### 3.2 `RecurrentLatentReasoner` (`training_train_latent.py`)

#### Primary Regime: Aligned Intermediate Supervision (`supervision='aligned'`)
At training time, the model executes recurrent transitions up to the maximum difficulty depth in the batch ($D_{\text{batch\_max}} = \max_i D_i$). Intermediate hidden states $\mathbf{h}_t$ are projected through the categorical head and supervised against ground-truth intermediate states:
$$\mathbf{z}_{i, t} = \mathbf{W}_{\text{head}} \mathbf{h}_{i, t} + \mathbf{b}_{\text{head}} \in \mathbb{R}^{24}$$
$$\mathcal{L}_{\text{aligned}} = \frac{1}{\sum_{i=1}^B D_i} \sum_{i=1}^B \sum_{t=1}^{D_i} -\log P(v_{i, t} \mid \mathbf{z}_{i, t})$$
- Only steps $t \le D_i$ contribute to the loss for instance $i$, enforced via boolean trajectory mask `traj_mask`.
- Intermediate supervision ensures that the continuous hidden state learns an aligned representation of the step-by-step state trajectory.

#### Secondary Regime: End-to-End Terminal Supervision (`supervision='e2e'`) [VERIFIED]
The model gathers the logit strictly at the terminal step $t = D_i$ for each instance $i$ and optimizes against the final answer class:
$$\mathcal{L}_{\text{e2e}} = \frac{1}{B} \sum_{i=1}^B -\log P(y_{i, \text{ans}} \mid \mathbf{z}_{i, D_i})$$

---

## 4. Checkpoint Structure & Artifact Layout

Every training execution automatically persists weights and loss histories:

```
export/models/
├── cot_task_a_s42_aligned/
│   ├── weights.pth              # Model state dictionary
│   └── training_log.json        # Epoch loss trajectory (20 epochs)
├── cot_task_a_s43_aligned/ ...
├── cot_task_b_s42_aligned/ ...
├── latent_task_a_s42_aligned/
│   ├── weights.pth
│   └── training_log.json
├── latent_task_a_s43_aligned/ ...
└── latent_task_b_s42_aligned/ ...
```

- Checkpoints contain pure PyTorch state dictionaries (`model.state_dict()`).
- `training_log.json` contains:
  ```json
  {
    "losses": [2.6184, 2.4512, ..., 0.8412],
    "task": "task_a",
    "seed": 42,
    "supervision": "aligned"
  }
  ```

---

## 5. Standalone Hebbian Training (`training_train_hebbian.py`)

- **Dataset**: `AssociativeTask` (1,000 synthetic continuous vector pairs).
- **Objective**: Mean Squared Error ($\text{MSE}$) between decoded query output and target vector:
  $$\mathcal{L}_{\text{MSE}} = \frac{1}{B} \sum_{i=1}^B \Vert \hat{\mathbf{y}}_i - \mathbf{y}_i \Vert_2^2$$
- **Optimizer**: Adam ($\eta = 10^{-3}$) updating encoder and decoder linear weights.
- **Synaptic Matrix**: $\sigma$ is non-trainable by gradient descent (`requires_grad=False`); updated during the forward pass via the Hebbian outer-product plasticity rule.
- **Role**: Standalone educational demonstration; not included in the CoT-vs-Latent Pareto evaluation.

---

## Implementation References

- `training_train_cot.py`: `train_cot()` (lines 12–70)
- `training_train_latent.py`: `train_latent()` (lines 12–86)
- `training_train_hebbian.py`: `train_hebbian()` (lines 12–65)
- `run_full_training.py`: Batch training loop (lines 1–45)
