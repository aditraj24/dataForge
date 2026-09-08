"""
~1M Capacity-Scaling Experiment — Benchmark Evaluation
=======================================================
Evaluates the 20 trained 1M-parameter checkpoints on the frozen test sets.

Uses the same evaluation methodology as the 126K baseline:
- Tasks A + B, k={1,2,4,8,12,16}, seeds={42..46}
- Fixed test set: 1000 examples per task, seed=999
- CUDA-event wall-clock latency
- Analytical FLOPs with correct 1M architecture dimensions
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

# ── 1M architecture configuration ───────────────────────────────────────
COT_1M_KWARGS = dict(d_model=224, nhead=4, num_layers=2, dim_feedforward=624, max_len=96, vocab_size=24)
LATENT_1M_KWARGS = dict(d_model=224, nhead=4, dim_feedforward=1027, max_len=96, vocab_size=24)

# ── chkng constants (identical ko frozen 126K baseline) ─────────────
SEEDS = [42, 43, 44, 45, 46]
TASKS = ['task_a', 'task_b']
BUDGETS = [1, 2, 4, 8, 12, 16]
TEST_SEED = 999
NUM_TEST_SAMPLES = 1000
BATCH_SIZE = 32

# ── Isolated directories ────────────────────────────────────────────────
CHECKPOINT_BASE = Path('export/models_1m')
RESULTS_DIR = Path('results_1m')


def compute_analytical_flops_1m(model_type, batch_size, seq_len_or_k):
    """
    Analytical FLOP accounting for the 1M architecture.
    Uses actual 1M dimensions: d_model=224, dim_ff=624 (CoT), dim_ff=1027 (Latent).
    """
    d = 224
    v = 24
    if model_type == 'cot':
        # 2-layer Transformer: per token step
        # Self-attention per layer: Q,K,V projections (3*d*d) + output proj (d*d) = 4*d^2, times 2 kay lyye MAC
        # Feedforward per layer: d*ff + ff*d = 2*d*ff, times 2 kay lyye MAC
        # Final head: d*v * 2
        # 2 layers
        ff = 624
        flops_per_token = 2 * (4 * (d ** 2) * 2 + 2 * d * ff * 2) + d * v * 2
        total_flops = batch_size * seq_len_or_k * flops_per_token
    else:
        # Latent Reasoner: per recurrent step
        # Cross-attention: 4*d^2 * 2
        # GRUCell: 3*(2*d^2) * 2
        # Feedforward: 2*d*ff * 2
        ff = 1027
        flops_per_step = (4 * (d ** 2) * 2) + (6 * (d ** 2) * 2) + (2 * d * ff * 2)
        total_flops = batch_size * seq_len_or_k * flops_per_step
    return total_flops


if __name__ == '__main__':
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Executing 1M Benchmark Evaluation on device: {device}")

    # Verify checkpoints exist
    for task in TASKS:
        for seed in SEEDS:
            for mt in ['cot', 'latent']:
                cp = CHECKPOINT_BASE / f'{mt}_{task}_s{seed}_aligned' / 'weights.pth'
                assert cp.exists(), f"Checkpoint missing: {cp}"
    print(f"[OK] All 20 checkpoints verified in {CHECKPOINT_BASE}")

    # Instantiate fixed deterministic tesst setts (identical ko 126K chkng)
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
        print(f"BENCHMARKING 1M MODELS — TASK: {task.upper()} ({NUM_TEST_SAMPLES} fixed test instances)")
        print(f"{'='*60}")

        for seed in SEEDS:
            # laod kro 1M CoT
            cot_path = CHECKPOINT_BASE / f'cot_{task}_s{seed}_aligned' / 'weights.pth'
            cot = AutoregressiveCoT(**COT_1M_KWARGS).to(device)
            cot.load_state_dict(torch.load(cot_path, map_location=device))
            cot.eval()

            # laod kro 1M Latent
            latent_path = CHECKPOINT_BASE / f'latent_{task}_s{seed}_aligned' / 'weights.pth'
            latent = RecurrentLatentReasoner(**LATENT_1M_KWARGS).to(device)
            latent.load_state_dict(torch.load(latent_path, map_location=device))
            latent.eval()

            print(f"\n--- Evaluating Seed {seed} ---")

            for k in BUDGETS:
                # ── chekk CoT ──────────────────────────────────────
                cot_correct = 0
                cot_total = 0
                cot_tokens_list = []

                cot_under_correct, cot_under_total = 0, 0
                cot_matched_correct, cot_matched_total = 0, 0
                cot_over_correct, cot_over_total = 0, 0

                # Warmup
                for _ in range(5):
                    batch_warmup = next(iter(loader))
                    _ = cot.generate(batch_warmup['input_ids'].to(device), max_budget_k=k)
                torch.cuda.synchronize()

                start_event = torch.cuda.Event(enable_timing=True)
                end_event = torch.cuda.Event(enable_timing=True)

                start_event.record()
                with torch.no_grad():
                    for batch in loader:
                        input_ids = batch['input_ids'].to(device)
                        final_answers = batch['final_answers'].to(device)
                        depths = batch['depths'].to(device)
                        B = input_ids.shape[0]

                        res = cot.generate(input_ids, max_budget_k=k)
                        preds = res['final_ans']
                        tokens_gen = res['tokens_generated']
                        cot_tokens_list.append(tokens_gen)

                        matches = (preds == final_answers)
                        cot_correct += matches.sum().item()
                        cot_total += B

                        for i in range(B):
                            d_i = depths[i].item()
                            m_i = matches[i].item()
                            if k < d_i:
                                cot_under_total += 1
                                if m_i: cot_under_correct += 1
                            elif k == d_i:
                                cot_matched_total += 1
                                if m_i: cot_matched_correct += 1
                            else:
                                cot_over_total += 1
                                if m_i: cot_over_correct += 1

                end_event.record()
                torch.cuda.synchronize()
                cot_latency_total_ms = start_event.elapsed_time(end_event)
                cot_latency_per_sample_ms = cot_latency_total_ms / cot_total

                avg_cot_tokens = float(np.mean(cot_tokens_list))
                cot_flops = compute_analytical_flops_1m('cot', 1, avg_cot_tokens)
                cot_acc = cot_correct / cot_total

                cot_record = {
                    'model': 'AutoregressiveCoT',
                    'task': task,
                    'seed': seed,
                    'k': k,
                    'scale': '1m',
                    'accuracy': cot_acc,
                    'correct_predictions': cot_correct,
                    'total_predictions': cot_total,
                    'latency_ms': cot_latency_per_sample_ms,
                    'analytical_flops': cot_flops,
                    'avg_tokens_generated': avg_cot_tokens,
                    'steps_executed': avg_cot_tokens,
                    'under_budget_acc': (cot_under_correct / cot_under_total) if cot_under_total > 0 else None,
                    'matched_budget_acc': (cot_matched_correct / cot_matched_total) if cot_matched_total > 0 else None,
                    'over_budget_acc': (cot_over_correct / cot_over_total) if cot_over_total > 0 else None,
                    'under_budget_count': cot_under_total,
                    'matched_budget_count': cot_matched_total,
                    'over_budget_count': cot_over_total,
                    'd_model': 224,
                    'dim_feedforward': 624,
                    'num_layers': 2,
                    'total_parameters': 998520
                }
                results_raw.append(cot_record)

                # ── chekk Latent ───────────────────────────────────
                latent_correct = 0
                latent_total = 0

                latent_under_correct, latent_under_total = 0, 0
                latent_matched_correct, latent_matched_total = 0, 0
                latent_over_correct, latent_over_total = 0, 0

                # Warmup
                for _ in range(5):
                    batch_warmup = next(iter(loader))
                    _ = latent.infer(batch_warmup['input_ids'].to(device), budget_k=k,
                                     input_mask=batch_warmup['input_mask'].to(device))
                torch.cuda.synchronize()

                start_event = torch.cuda.Event(enable_timing=True)
                end_event = torch.cuda.Event(enable_timing=True)

                start_event.record()
                with torch.no_grad():
                    for batch in loader:
                        input_ids = batch['input_ids'].to(device)
                        input_mask = batch['input_mask'].to(device)
                        final_answers = batch['final_answers'].to(device)
                        depths = batch['depths'].to(device)
                        B = input_ids.shape[0]

                        res = latent.infer(input_ids, budget_k=k, input_mask=input_mask)
                        preds = res['final_ans']

                        matches = (preds == final_answers)
                        latent_correct += matches.sum().item()
                        latent_total += B

                        for i in range(B):
                            d_i = depths[i].item()
                            m_i = matches[i].item()
                            if k < d_i:
                                latent_under_total += 1
                                if m_i: latent_under_correct += 1
                            elif k == d_i:
                                latent_matched_total += 1
                                if m_i: latent_matched_correct += 1
                            else:
                                latent_over_total += 1
                                if m_i: latent_over_correct += 1

                end_event.record()
                torch.cuda.synchronize()
                latent_latency_total_ms = start_event.elapsed_time(end_event)
                latent_latency_per_sample_ms = latent_latency_total_ms / latent_total

                latent_flops = compute_analytical_flops_1m('latent', 1, k)
                latent_acc = latent_correct / latent_total

                latent_record = {
                    'model': 'RecurrentLatentReasoner',
                    'task': task,
                    'seed': seed,
                    'k': k,
                    'scale': '1m',
                    'accuracy': latent_acc,
                    'correct_predictions': latent_correct,
                    'total_predictions': latent_total,
                    'latency_ms': latent_latency_per_sample_ms,
                    'analytical_flops': latent_flops,
                    'avg_tokens_generated': 0,
                    'steps_executed': k,
                    'under_budget_acc': (latent_under_correct / latent_under_total) if latent_under_total > 0 else None,
                    'matched_budget_acc': (latent_matched_correct / latent_matched_total) if latent_matched_total > 0 else None,
                    'over_budget_acc': (latent_over_correct / latent_over_total) if latent_over_total > 0 else None,
                    'under_budget_count': latent_under_total,
                    'matched_budget_count': latent_matched_total,
                    'over_budget_count': latent_over_total,
                    'd_model': 224,
                    'dim_feedforward': 1027,
                    'total_parameters': 998523
                }
                results_raw.append(latent_record)

                print(f"k={k:02d} | CoT Acc: {cot_acc:6.2%} (Lat: {cot_latency_per_sample_ms:.2f}ms, FLOPs: {cot_flops:10.0f}) | "
                      f"Latent Acc: {latent_acc:6.2%} (Lat: {latent_latency_per_sample_ms:.2f}ms, FLOPs: {latent_flops:10.0f})")

    # baccao complete raw results
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = RESULTS_DIR / 'raw_benchmark_results.json'
    with open(out_path, 'w') as f:
        json.dump(results_raw, f, indent=2)

    print(f"\n1M Benchmark completed! Raw results saved to {out_path}")
    print(f"Total evaluation records: {len(results_raw)}")
