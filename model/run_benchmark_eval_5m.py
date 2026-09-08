"""
~5M Capacity-Scaling Experiment — Benchmark Evaluation
=====================================================
Evaluates the 20 trained 5M-parameter checkpoints on the frozen test sets.

Methodology is identical to 126K baseline and 1M experiment:
- Tasks A + B, k={1,2,4,8,12,16}, seeds={42..46}
- Fixed test set: 1000 examples per task, seed=999
- CUDA-event wall-clock latency
- Analytical FLOPs with correct 5M architecture dimensions (d_model=544)
"""

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import torch
import numpy as np
import json
import time
from pathlib import Path
from torch.utils.data import DataLoader

from models_cot_model import AutoregressiveCoT
from models_latent_model import RecurrentLatentReasoner
from data_generator import TaskAPermutationOrbit, TaskBModularRegister, collate_fn_pad

# ── 5M architecture configuration ───────────────────────────────────────
COT_5M_KWARGS = dict(d_model=544, nhead=4, num_layers=2, dim_feedforward=1168, max_len=96, vocab_size=24)
LATENT_5M_KWARGS = dict(d_model=544, nhead=4, dim_feedforward=1795, max_len=96, vocab_size=24)

# ── chkng constants (identical ko frozen 126K aor 1M baselines) ────
SEEDS = [42, 43, 44, 45, 46]
TASKS = ['task_a', 'task_b']
BUDGETS = [1, 2, 4, 8, 12, 16]
TEST_SEED = 999
NUM_TEST_SAMPLES = 1000
BATCH_SIZE = 32

# ── Isolated directories ────────────────────────────────────────────────
CHECKPOINT_BASE = Path('export/models_5m')
RESULTS_DIR = Path('results_5m')


def compute_analytical_flops_5m(model_type, batch_size, seq_len_or_k):
    """
    Analytical FLOP accounting for the 5M architecture.
    Uses actual 5M dimensions: d_model=544, dim_ff=1168 (CoT), dim_ff=1795 (Latent).
    """
    d = 544
    v = 24
    if model_type == 'cot':
        ff = 1168
        # 2 Transformer layers: self-attn (4*d^2*2) + ffn (2*d*ff*2), plus head (d*v*2)
        flops_per_token = 2 * (4 * (d ** 2) * 2 + 2 * d * ff * 2) + d * v * 2
        total_flops = batch_size * seq_len_or_k * flops_per_token
    else:
        ff = 1795
        # Latent Reasoner per recurrent step: cross-attn (4*d^2*2) + gru (6*d^2*2) + ffn (2*d*ff*2)
        flops_per_step = (4 * (d ** 2) * 2) + (6 * (d ** 2) * 2) + (2 * d * ff * 2)
        total_flops = batch_size * seq_len_or_k * flops_per_step
    return total_flops


if __name__ == '__main__':
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Executing 5M Benchmark Evaluation on device: {device}")

    # Verify checkpoints exist
    for task in TASKS:
        for seed in SEEDS:
            for mt in ['cot', 'latent']:
                cp = CHECKPOINT_BASE / f'{mt}_{task}_s{seed}_aligned' / 'weights.pth'
                assert cp.exists(), f"Checkpoint missing: {cp}"
    print(f"[OK] All 20 checkpoints verified in {CHECKPOINT_BASE}")

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # Instantiate fixed deterministic tesst setts
    test_datasets = {
        'task_a': TaskAPermutationOrbit(num_samples=NUM_TEST_SAMPLES, min_depth=2, max_depth=16, seed=TEST_SEED),
        'task_b': TaskBModularRegister(num_samples=NUM_TEST_SAMPLES, min_depth=2, max_depth=16, seed=TEST_SEED)
    }

    test_loaders = {
        t: DataLoader(ds, batch_size=BATCH_SIZE, shuffle=False, collate_fn=collate_fn_pad)
        for t, ds in test_datasets.items()
    }

    results_raw = []

    for task in TASKS:
        loader = test_loaders[task]
        print(f"\n{'='*60}")
        print(f"BENCHMARKING 5M MODELS — TASK: {task.upper()} ({NUM_TEST_SAMPLES} fixed test instances)")
        print(f"{'='*60}")

        for seed in SEEDS:
            # laod kro 5M CoT
            cot_path = CHECKPOINT_BASE / f'cot_{task}_s{seed}_aligned' / 'weights.pth'
            cot = AutoregressiveCoT(**COT_5M_KWARGS).to(device)
            cot.load_state_dict(torch.load(cot_path, map_location=device))
            cot.eval()

            # laod kro 5M Latent
            latent_path = CHECKPOINT_BASE / f'latent_{task}_s{seed}_aligned' / 'weights.pth'
            latent = RecurrentLatentReasoner(**LATENT_5M_KWARGS).to(device)
            latent.load_state_dict(torch.load(latent_path, map_location=device))
            latent.eval()

            print(f"\n--- Evaluating Seed {seed} ---")

            for k in BUDGETS:
                # ── chekk CoT ──────────────────────────────────────
                cot_correct = 0
                cot_total = 0
                cot_tokens_total = 0
                cot_latencies = []

                for batch in loader:
                    input_ids = batch['input_ids'].to(device)
                    final_ans = batch['final_answers'].to(device)
                    B = input_ids.shape[0]

                    if device.type == 'cuda':
                        start_evt = torch.cuda.Event(enable_timing=True)
                        end_evt = torch.cuda.Event(enable_timing=True)
                        start_evt.record()
                        with torch.no_grad():
                            gen_out = cot.generate(input_ids, max_budget_k=k)
                        end_evt.record()
                        torch.cuda.synchronize()
                        batch_lat = start_evt.elapsed_time(end_evt) / B
                    else:
                        t0 = time.perf_counter()
                        with torch.no_grad():
                            gen_out = cot.generate(input_ids, max_budget_k=k)
                        batch_lat = ((time.perf_counter() - t0) * 1000.0) / B

                    cot_latencies.append(batch_lat)
                    cot_correct += (gen_out['final_ans'] == final_ans).sum().item()
                    cot_total += B
                    cot_tokens_total += gen_out['tokens_generated']

                cot_acc = cot_correct / cot_total
                cot_lat_mean = float(np.mean(cot_latencies))
                cot_flops = compute_analytical_flops_5m('cot', 1, k)

                record_cot = {
                    'scale': '5m',
                    'model': 'cot',
                    'task': task,
                    'seed': seed,
                    'k': k,
                    'accuracy': float(cot_acc),
                    'latency_ms': cot_lat_mean,
                    'analytical_flops': cot_flops,
                    'tokens_generated': cot_tokens_total
                }
                results_raw.append(record_cot)
                print(f"  CoT-5M    | k={k:2d} | Acc: {cot_acc*100:6.2f}% | Lat: {cot_lat_mean:6.2f}ms | FLOPs: {cot_flops:,.0f}")

                # ── chekk Latent ───────────────────────────────────
                latent_correct = 0
                latent_total = 0
                latent_latencies = []

                for batch in loader:
                    input_ids = batch['input_ids'].to(device)
                    input_mask = batch['input_mask'].to(device)
                    final_ans = batch['final_answers'].to(device)
                    B = input_ids.shape[0]

                    if device.type == 'cuda':
                        start_evt = torch.cuda.Event(enable_timing=True)
                        end_evt = torch.cuda.Event(enable_timing=True)
                        start_evt.record()
                        with torch.no_grad():
                            inf_out = latent.infer(input_ids, budget_k=k, input_mask=input_mask)
                        end_evt.record()
                        torch.cuda.synchronize()
                        batch_lat = start_evt.elapsed_time(end_evt) / B
                    else:
                        t0 = time.perf_counter()
                        with torch.no_grad():
                            inf_out = latent.infer(input_ids, budget_k=k, input_mask=input_mask)
                        batch_lat = ((time.perf_counter() - t0) * 1000.0) / B

                    latent_latencies.append(batch_lat)
                    latent_correct += (inf_out['final_ans'] == final_ans).sum().item()
                    latent_total += B

                lat_acc = latent_correct / latent_total
                lat_lat_mean = float(np.mean(latent_latencies))
                lat_flops = compute_analytical_flops_5m('latent', 1, k)

                record_latent = {
                    'scale': '5m',
                    'model': 'latent',
                    'task': task,
                    'seed': seed,
                    'k': k,
                    'accuracy': float(lat_acc),
                    'latency_ms': lat_lat_mean,
                    'analytical_flops': lat_flops,
                    'steps_executed': k
                }
                results_raw.append(record_latent)
                print(f"  Latent-5M | k={k:2d} | Acc: {lat_acc*100:6.2f}% | Lat: {lat_lat_mean:6.2f}ms | FLOPs: {lat_flops:,.0f}")

    # Verify record count: 2 maadals × 2 tasks × 5 seeds × 6 bjjets = 120
    assert len(results_raw) == 120, f"Expected 120 raw benchmark records, got {len(results_raw)}"

    raw_path = RESULTS_DIR / 'raw_benchmark_results.json'
    with open(raw_path, 'w') as f:
        json.dump(results_raw, f, indent=2)

    print(f"\n{'='*60}")
    print(f"[OK] 5M Benchmark complete: 120 raw records written to {raw_path}")
    print(f"{'='*60}")
