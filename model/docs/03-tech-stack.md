# Technology Stack & Execution Environment

This document records the **verified software stack, execution environment, and hardware configuration** directly audited from the host system.

---

## 1. Verified Technologies & Runtime Environment

| Layer | Component | Version | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Operating System** | Windows 11 (64-bit) | Build 10.0.22631 | System environment inspection | [VERIFIED] |
| **Shell** | PowerShell 5.1 / 7.x | Windows Native | Command execution | [VERIFIED] |
| **Python Runtime** | Python | 3.11.9 | `python -V` executed in `.venv` | [VERIFIED] |
| **Deep Learning Framework** | PyTorch (`torch`) | 2.6.0+cu124 | `import torch; print(torch.__version__)` | [VERIFIED] |
| **CUDA Driver & Toolkit** | CUDA | 12.4 | `torch.version.cuda` | [VERIFIED] |
| **Compute Device** | NVIDIA GeForce RTX 4060 Laptop GPU | 8GB VRAM (CC 8.9) | `torch.cuda.get_device_name(0)` | [VERIFIED] |
| **Numerical Computing** | NumPy (`numpy`) | 2.2.3 | `import numpy; print(numpy.__version__)` | [VERIFIED] |
| **Data Science / Stats** | SciPy (`scipy`) | Installed in `.venv` | `scipy.stats.ttest_rel`, `wilcoxon` | [VERIFIED] |
| **Configuration Parser** | PyYAML (`yaml`) | Installed in `.venv` | `configs_hebbian_config.yaml` parsing | [VERIFIED] |
| **Progress Tracking** | `tqdm` | Installed in `.venv` | Training loop progress tracking | [VERIFIED] |

---

## 2. Virtual Environment & Memory Footprint

All experimental execution, model training across scales (126K, 1M, 5M original, 5M recovery), and benchmarking were performed within a project-local virtual environment:
- **Location**: `e:/pro/pro/.venv`
- **Activation**:
  - PowerShell: `.\.venv\Scripts\Activate.ps1`
  - Command Prompt: `.\.venv\Scripts\activate.bat`
- **CUDA Device Allocation**: PyTorch utilizes `cuda:0` (`NVIDIA GeForce RTX 4060 Laptop GPU`).
- **Peak VRAM Consumption**:
  - 126K experiments: $\sim 600\text{ MB}$
  - 1M experiments: $\sim 1.2\text{ GB}$
  - 5M experiments: $\sim 2.5\text{ GB}$ (peak during recurrent trajectory unrolling at batch size 32, well within the 8GB device limit).

---

## 3. Claimed vs. Actual Repository Technologies

| Claimed Technology in Early Proposals | Actual Code Status | Evidence from Codebase |
| :--- | :--- | :--- |
| **Node.js (18+)** | [ABSENT] / [HISTORICAL] | No `package.json`, `node_modules/`, or JS/TS files exist. |
| **Next.js Frontend** | [ABSENT] / [PLANNED] | `web/` directory does not exist in workspace. Not implemented. |
| **React Components** | [ABSENT] / [PLANNED] | Claimed `web/pages/lab.tsx` and related components are absent. |
| **TensorFlow.js** | [ABSENT] / [HISTORICAL] | Claimed in early README for in-browser matrix multiplication; absent from repo. |
| **D3.js Visualization** | [ABSENT] / [HISTORICAL] | Claimed in early README for interactive Pareto plotting; absent from repo. |
| **Linux Bash (`scripts/run_all_training.sh`)** | [HISTORICAL] | Shell script `scripts_run_all_training.sh` contained Linux bash syntax; replaced by native cross-platform Python orchestrators. |

---

## 4. Hardware Profiling & Timing Specifications

- **Latency Measurement Mechanism**: Isolated GPU wall-clock timing using CUDA events (`torch.cuda.Event(enable_timing=True)`).
  - Warm-up: 5 full batches evaluated before timing to ensure kernel compilation and cache warming.
  - Synchronization: `torch.cuda.synchronize()` invoked before `start_event.record()` and after `end_event.record()`.
  - Resolution: Sub-millisecond timing resolution directly reported by the CUDA driver.
- **Analytical FLOP Counting**: Theoretical multiply-accumulate operations calculated analytically based on model dimensions:
  - 126K ($d=80, V=24$): CoT $= 229,120 \text{ FLOPs/tok}$; Latent $= 225,280 \text{ FLOPs/step}$.
  - 1M ($d=224, V=24$): CoT $= 1,671,456 \text{ FLOPs/tok}$; Latent $= 1,668,352 \text{ FLOPs/step}$.
  - 5M ($d=544, V=24$): CoT $= 9,844,224 \text{ FLOPs/tok}$; Latent $= 9,824,640 \text{ FLOPs/step}$.

---

## Implementation References

- `run_benchmark_eval*.py` — CUDA event timing setup (`start_event`, `end_event`, `synchronize()`)
- `training_compare_costs.py` — FLOP counting and latency profiling functions
- `run_full_training*.py` — Device handling and GPU training runners
- `requirements.txt` — Python package dependencies
