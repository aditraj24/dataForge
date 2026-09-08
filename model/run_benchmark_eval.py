import torch
import numpy as np
import json
import time
from pathlib import Path
from torch.utils.data import DataLoader

from models_cot_model import AutoregressiveCoT
from models_latent_model import RecurrentLatentReasoner
from data_generator import TaskAPermutationOrbit, TaskBModularRegister, collate_fn_pad
from training_compare_costs import compute_analytical_flops

SEEDS = [42, 43, 44, 45, 46]
TASKS = ['task_a', 'task_b']
BUDGETS = [1, 2, 4, 8, 12, 16]
TEST_SEED = 999
NUM_TEST_SAMPLES = 1000
BATCH_SIZE = 32

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Executing Full Benchmark Evaluation on device: {device}")

# 1. puray ekdm fix testset bnaoo (1k smples)
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
    print(f"\n=======================================================")
    print(f"BENCHMARKING TASK: {task.upper()} ({NUM_TEST_SAMPLES} fixed test instances)")
    print(f"=======================================================")
    
    for seed in SEEDS:
        # autregressive cot koo loood kr
        cot_path = Path(f'export/models/cot_{task}_s{seed}_aligned/weights.pth')
        cot = AutoregressiveCoT().to(device)
        cot.load_state_dict(torch.load(cot_path, map_location=device))
        cot.eval()
        
        # rcurrent ltnt koo laod karoo
        latent_path = Path(f'export/models/latent_{task}_s{seed}_aligned/weights.pth')
        latent = RecurrentLatentReasoner().to(device)
        latent.load_state_dict(torch.load(latent_path, map_location=device))
        latent.eval()
        
        print(f"\n--- Evaluating Seed {seed} ---")
        
        for k in BUDGETS:
            # -------------------------------------------------------------
            # bidget k k anndar CoT ko test krro
            # -------------------------------------------------------------
            cot_correct = 0
            cot_total = 0
            cot_tokens_list = []
            
            # algg rizeems k liye contars
            cot_under_correct, cot_under_total = 0, 0
            cot_matched_correct, cot_matched_total = 0, 0
            cot_over_correct, cot_over_total = 0, 0
            
            # tyme napne ka setup coda events k sta
            # grmm kro
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
            cot_flops = compute_analytical_flops('cot', 1, avg_cot_tokens)
            cot_acc = cot_correct / cot_total
            
            cot_record = {
                'model': 'AutoregressiveCoT',
                'task': task,
                'seed': seed,
                'k': k,
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
                'over_budget_count': cot_over_total
            }
            results_raw.append(cot_record)
            
            # -------------------------------------------------------------
            # bitget k prr Latent ko chekh maro
            # -------------------------------------------------------------
            latent_correct = 0
            latent_total = 0
            
            latent_under_correct, latent_under_total = 0, 0
            latent_matched_correct, latent_matched_total = 0, 0
            latent_over_correct, latent_over_total = 0, 0
            
            # wurmp mro
            for _ in range(5):
                batch_warmup = next(iter(loader))
                _ = latent.infer(batch_warmup['input_ids'].to(device), budget_k=k, input_mask=batch_warmup['input_mask'].to(device))
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
            
            latent_flops = compute_analytical_flops('latent', 1, k)
            latent_acc = latent_correct / latent_total
            
            latent_record = {
                'model': 'RecurrentLatentReasoner',
                'task': task,
                'seed': seed,
                'k': k,
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
                'over_budget_count': latent_over_total
            }
            results_raw.append(latent_record)
            
            print(f"k={k:02d} | CoT Acc: {cot_acc:6.2%} (Lat: {cot_latency_per_sample_ms:.2f}ms, FLOPs: {cot_flops:8.0f}) | "
                  f"Latent Acc: {latent_acc:6.2%} (Lat: {latent_latency_per_sample_ms:.2f}ms, FLOPs: {latent_flops:8.0f})")

# pury cheze bach k raakhlo
out_path = Path('results/raw_benchmark_results.json')
out_path.parent.mkdir(parents=True, exist_ok=True)
with open(out_path, 'w') as f:
    json.dump(results_raw, f, indent=2)

print(f"\nBenchmark completed successfully! Raw results saved to {out_path}")
