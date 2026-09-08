# Dataset Specifications & Algorithmic Task Definitions

This document provides the formal mathematical definitions, tokenization schemes, data generation contracts, and empirical distributions for the synthetic reasoning benchmarks implemented in [data_generator.py](file:///e:/pro/pro/data_generator.py).

---

## 1. Global Vocabulary & Token Encoding

The vocabulary is shared across both tasks and both model families. The total vocabulary size is fixed at $V = 24$.

```python
VOCAB = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
    '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'OP_ADD': 10, 'OP_MUL': 11, 'OP_SUB': 12,
    'MAP': 13, 'START': 14, 'HOPS': 15,
    'THINK': 16, 'END_THINK': 17, 'ANS': 18,
    'PAD': 19, 'EOS': 20
    # Indices 21, 22, 23 reserved in embedding capacity V=24
}
```

- **Digits (`0`..`9`)**: Indices `0` through `9`. Used as permutation elements, register states, operand constants, hop counters, and answers.
- **Arithmetic Operators (`OP_ADD`, `OP_MUL`, `OP_SUB`)**: Indices `10`, `11`, `12`.
- **Special Formatting Tokens**:
  - `MAP` (13): Marks start of the permutation table in Task A.
  - `START` (14): Marks the initial node/register value.
  - `HOPS` (15): Precedes the difficulty depth $D$ in Task A.
  - `THINK` (16): Initiates the intermediate reasoning scratchpad.
  - `END_THINK` (17): Terminates the scratchpad sequence.
  - `ANS` (18): Precedes the final categorical answer token.
  - `PAD` (19): Dynamic batch padding token (ignored in CrossEntropyLoss via `ignore_index=19`).
  - `EOS` (20): End of sequence marker.

---

## 2. Task A: Permutation Orbit Traversal (Algorithmic Pattern Induction)

### 2.1 Purpose & Conceptual Motivation
Task A evaluates whether a model can perform **iterative algorithmic state-transition / permutation-orbit traversal**. It is designed as an operational proxy for pattern-induction reasoning: given an explicit transition function (a permutation table $\pi$) and an initial state $v_0$, the model must determine the state after $D$ sequential applications of $\pi$.

### 2.2 Mathematical Formulation
- **State Space**: Finite set $\mathcal{S} = \{0, 1, 2, 3, 4, 5, 6, 7\}$ of size $N = 8$.
- **Permutation $\pi$**: A bijective mapping $\pi: \mathcal{S} \to \mathcal{S}$ sampled uniformly at random from the symmetric group $S_8$ ($|\mathcal{S}_8| = 8! = 40,320$ possible permutations).
- **Initial State $v_0$**: Sampled uniformly from $\mathcal{S}$ ($v_0 \sim \text{Uniform}(0, 7)$).
- **Depth $D$**: Transition difficulty sampled uniformly:
  $$D \sim \text{Uniform}(2, 16)$$
- **Trajectory Sequence**:
  $$v_{t+1} = \pi(v_t), \quad t \in \{0, 1, \dots, D-1\}$$
- **Target / Final Answer**:
  $$v_D = \pi^D(v_0) \in \{0, 1, \dots, 7\}$$

### 2.3 Input & Scratchpad Representation
- **Structured Input Prompt**:
  $$\mathbf{x}_{\text{input}} = [\text{MAP}, \pi(0), \pi(1), \dots, \pi(7), \text{START}, v_0, \text{HOPS}, D]$$
  Fixed length: $1 + 8 + 1 + 1 + 1 + 1 = 13$ tokens.
- **Scratchpad Trace**:
  $$\mathbf{s}_{\text{trace}} = [\text{THINK}, v_1, v_2, \dots, v_D, \text{END\_THINK}, \text{ANS}, v_D]$$
  Variable length: $D + 3$ tokens.
- **Full Autoregressive Sequence**:
  $$\mathbf{x}_{\text{full}} = \mathbf{x}_{\text{input}} \mathbin{\Vert} \mathbf{s}_{\text{trace}}$$
  Total length: $13 + D + 3 = D + 16$ tokens (range: 18 to 32 tokens).

### 2.4 Dataset Volumes & Random Seeds (Frozen Across All Scales)
- **Training Set**: 4,000 instances per seed, generated using the training seed ($s \in \{42, 43, 44, 45, 46\}$).
- **Evaluation Set**: 1,000 fixed, identical test instances generated with fixed seed `TEST_SEED = 999`.
- **Cross-Scale Freezing**: Exactly the same dataset generator, random seeds, and instance sets are used across all four experimental conditions:
  - 126K baseline (`training_train_cot.py`, `training_train_latent.py`)
  - 1M scaling (`run_full_training_1m.py`)
  - 5M original confounded (`run_full_training_5m.py`)
  - 5M convergence recovery (`run_full_training_5m_recovery.py`)

---

## 3. Task B: Multi-Step Modular Register Arithmetic (Symbolic Computation)

### 3.1 Purpose & Conceptual Motivation
Task B is designed to test **multi-step symbolic computation and state tracking**. It evaluates whether models can maintain, update, and compose arithmetic operations in a discrete finite field ($\mathbb{Z}_{10}$) over multiple steps without error accumulation.

### 3.2 Mathematical Formulation
- **Register Domain**: Modular ring $\mathbb{Z}_{10} = \{0, 1, \dots, 9\}$.
- **Initial Register State $r_0$**: Sampled uniformly from $\{0, \dots, 9\}$.
- **Depth $D$**: Number of sequential operations:
  $$D \sim \text{Uniform}(2, 16)$$
- **Operation Set**: $\mathcal{O} = \{\text{OP\_ADD}, \text{OP\_MUL}, \text{OP\_SUB}\}$. At each step $t \in \{1, \dots, D\}$, an operation $\text{op}_t \sim \text{Uniform}(\mathcal{O})$ and a constant $c_t \sim \text{Uniform}(1, 9)$ are sampled.
- **State Transition Rule**:
  $$r_t = \begin{cases} (r_{t-1} + c_t) \pmod{10} & \text{if } \text{op}_t = \text{OP\_ADD} \\ (r_{t-1} \times c_t) \pmod{10} & \text{if } \text{op}_t = \text{OP\_MUL} \\ (r_{t-1} - c_t + 10) \pmod{10} & \text{if } \text{op}_t = \text{OP\_SUB} \end{cases}$$
- **Target / Final Answer**:
  $$r_D \in \{0, 1, \dots, 9\}$$

### 3.3 Input & Scratchpad Representation
- **Structured Input Prompt**:
  $$\mathbf{x}_{\text{input}} = [\text{START}, r_0, \text{op}_1, c_1, \text{op}_2, c_2, \dots, \text{op}_D, c_D]$$
  Variable length: $2 + 2D$ tokens (range: 6 to 34 tokens).
- **Scratchpad Trace**:
  $$\mathbf{s}_{\text{trace}} = [\text{THINK}, r_1, r_2, \dots, r_D, \text{END\_THINK}, \text{ANS}, r_D]$$
  Variable length: $D + 3$ tokens (range: 5 to 19 tokens).
- **Full Autoregressive Sequence**:
  $$\mathbf{x}_{\text{full}} = \mathbf{x}_{\text{input}} \mathbin{\Vert} \mathbf{s}_{\text{trace}}$$
  Total length: $(2 + 2D) + (D + 3) = 3D + 5$ tokens (range: 11 to 53 tokens).

### 3.4 Important Interpretation Boundary [MEASURED]
Task B is a **task designed to test explicit multi-step symbolic computation**. The empirical benchmark revealed low absolute accuracy across both architectures and across all scales ($10\%–18.6\%$, with $10.0\%$ representing the random-guess baseline across the 10 register classes). While observed accuracies are modestly above chance in certain conditions (e.g., Latent $16.48\%$ at $126\text{K}, k=2$; CoT $18.58\%$ at $5\text{M recovery}, k=16$), this serves as an empirical demonstration of task difficulty and boundary limitations, **not evidence that the models successfully mastered symbolic arithmetic**.

---

## 4. Batch Collation & Dynamic Padding (`collate_fn_pad`)

Because sequences vary in length depending on the sampled depth $D$, `collate_fn_pad` standardizes tensors across a batch $B$:

| Tensor Key | Shape | Type | Description |
| :--- | :--- | :--- | :--- |
| `input_ids` | $[B, L_{\text{in\_max}}]$ | `torch.LongTensor` | Padded input prompt tokens (`PAD=19`) |
| `input_mask` | $[B, L_{\text{in\_max}}]$ | `torch.BoolTensor` | `True` for valid tokens, `False` for `PAD` |
| `full_ids` | $[B, L_{\text{full\_max}}]$ | `torch.LongTensor` | Full sequence (`input + scratchpad`), padded |
| `full_mask` | $[B, L_{\text{full\_max}}]$ | `torch.BoolTensor` | `True` for valid tokens, `False` for `PAD` |
| `traj` | $[B, D_{\text{max}}]$ | `torch.LongTensor` | Ground-truth intermediate trajectory states |
| `traj_mask` | $[B, D_{\text{max}}]$ | `torch.BoolTensor` | Mask indicating valid intermediate steps ($t < D_i$) |
| `final_answers`| $[B]$ | `torch.LongTensor` | Target answer class ($v_D$ or $r_D$) |
| `depths` | $[B]$ | `torch.LongTensor` | Problem difficulty $D_i \in [2, 16]$ |
| `input_lens` | $[B]$ | `torch.LongTensor` | Unpadded prompt lengths |

---

## 5. Legacy Synthetic Datasets [HISTORICAL]

For complete historical traceability, the codebase also retains the initial commit's toy datasets:
- **`AssociativeTask`**: Synthetic pairs of 64-dimensional continuous vectors with Gaussian query noise ($\mathcal{N}(0, 0.01)$), used exclusively with `models_hebbian_model.py`.
- **`ReasoningTask`**: 10-token integer sequences for `'increment'` and `'reverse'`, used in early sanity checks before the research methodology was standardized.

---

## Implementation References

- `data_generator.py`:
  - `VOCAB`, `VOCAB_SIZE` (lines 9–17)
  - `TaskAPermutationOrbit` (lines 19–78)
  - `TaskBModularRegister` (lines 79–138)
  - `collate_fn_pad` (lines 140–186)
- `run_benchmark_eval.py` — Test dataset initialization (lines 24–32)
- `training_train_cot.py` — Train dataset initialization (lines 18–22)
- `training_train_latent.py` — Train dataset initialization (lines 17–22)
- `run_full_training_1m.py` — 1M scaling training dataset initialization
- `run_full_training_5m.py` — 5M scaling training dataset initialization
- `run_full_training_5m_recovery.py` — 5M recovery training dataset initialization
- `run_benchmark_eval_5m_recovery.py` — 5M recovery test dataset initialization
