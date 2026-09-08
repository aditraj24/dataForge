import torch
import numpy as np
import json
import time
from pathlib import Path
from torch.utils.data import DataLoader

from models_cot_model import AutoregressiveCoT
from models_latent_model import RecurrentLatentReasoner
from data_generator import TaskAPermutationOrbit, TaskBModularRegister, collate_fn_pad

def compute_analytical_flops(model_type, batch_size, seq_len_or_k, d_model=80, vocab_size=24):
    """
    Computes analytical FLOPs (multiply-accumulate * 2).
    """
    if model_type == 'cot':
        # 2-layer transformer forward pass per token step
        # Self attention: Q, K, V projections + attention score + output projection = 4 * d_maadal^2 * 2
        # Feedforward: 2 * d_maadal * d_ff * 2 (d_ff = 192)
        flops_per_token = 2 * (4 * (d_model ** 2) * 2 + 2 * d_model * 192 * 2) + d_model * vocab_size * 2
        total_flops = batch_size * seq_len_or_k * flops_per_token
    else:
        # Latent Reasoner:
        # Cross-attention: Q (d^2), K (d^2), V (d^2), Out (d^2) = 4 * d_maadal^2 * 2
        # GRUCell: 3 * (2 * d_maadal^2) * 2
        # Feedforward: 2 * d_maadal * 304 * 2
        flops_per_step = (4 * (d_model ** 2) * 2) + (6 * (d_model ** 2) * 2) + (2 * d_model * 304 * 2)
        total_flops = batch_size * seq_len_or_k * flops_per_step
    return total_flops

def measure_latency_cuda(fn, *args, num_warmup=20, num_runs=50):
    """
    Measures isolated GPU wall-clock latency in milliseconds using CUDA events.
    """
    # Warmup chelaos
    for _ in range(num_warmup):
        fn(*args)
    if torch.cuda.is_available():
        torch.cuda.synchronize()
        start_event = torch.cuda.Event(enable_timing=True)
        end_event = torch.cuda.Event(enable_timing=True)
        
        start_event.record()
        for _ in range(num_runs):
            out = fn(*args)
        end_event.record()
        torch.cuda.synchronize()
        total_time_ms = start_event.elapsed_time(end_event)
        latency_ms = total_time_ms / num_runs
    else:
        t0 = time.perf_counter()
        for _ in range(num_runs):
            out = fn(*args)
        latency_ms = ((time.perf_counter() - t0) / num_runs) * 1000.0
    return latency_ms, out

def extract_pareto_frontier(points):
    """
    Given a list of dicts with 'latency_ms' (or 'flops') and 'accuracy',
    constructs the empirical non-dominated Pareto frontier.
    Point A dominates Point B if Compute_A <= Compute_B and Acc_A >= Acc_B (with >= 1 strict inequality).
    """
    # Sort points by compute ascending
    sorted_pts = sorted(points, key=lambda p: (p['latency_ms'], -p['accuracy']))
    frontier = []
    max_acc_so_far = -1.0
    
    for pt in sorted_pts:
        if pt['accuracy'] > max_acc_so_far:
            frontier.append(pt)
            max_acc_so_far = pt['accuracy']
            
    return frontier

def evaluate_model_at_budget(model, model_type, test_loader, budget_k, device='cuda'):
    """
    Evaluates model across test_loader under the maximum-budget k protocol.
    Measures latency via CUDA events, analytical FLOPs, and accuracy on the final answer token.
    """
    model.eval()
    correct = 0
    total = 0
    latencies = []
    
    with torch.no_grad():
        for batch in test_loader:
            input_ids = batch['input_ids'].to(device)
            input_mask = batch['input_mask'].to(device)
            final_answers = batch['final_answers'].to(device)
            B = input_ids.shape[0]
            
            if model_type == 'cot':
                # Token maadal maximum-bjjet generation
                def run_fn():
                    return model.generate(input_ids, max_budget_k=budget_k)
                lat_ms, res = measure_latency_cuda(run_fn, num_warmup=3, num_runs=5)
                preds = res['final_ans']
                tokens_count = res['tokens_generated']
                flops = compute_analytical_flops('cot', B, tokens_count)
            else:
                # Latent maadal exact recurrent bjjet execution
                def run_fn():
                    return model.infer(input_ids, budget_k=budget_k, input_mask=input_mask)
                lat_ms, res = measure_latency_cuda(run_fn, num_warmup=3, num_runs=5)
                preds = res['final_ans']
                flops = compute_analytical_flops('latent', B, budget_k)
                
            correct += (preds == final_answers).sum().item()
            total += B
            latencies.append(lat_ms)
            
    accuracy = correct / total
    mean_latency = float(np.mean(latencies))
    
    return {
        'budget_k': budget_k,
        'accuracy': accuracy,
        'latency_ms': mean_latency,
        'flops': flops,
        'total_evaluated': total
    }