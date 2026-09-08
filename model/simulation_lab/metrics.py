"""
Compute and profiling metrics for the Thinking Budget Simulation Lab.
Provides CUDA event wall-clock timing, CPU high-resolution fallback timing,
and analytical FLOP accounting.
"""

import time
import torch
from typing import Tuple, Any, Callable

def compute_analytical_flops(
    paradigm: str,
    steps_or_tokens: int,
    d_model: int = 80,
    vocab_size: int = 24,
    dim_feedforward_cot: int = 192,
    dim_feedforward_latent: int = 304,
    num_layers: int = 2
) -> float:
    """
    Computes theoretical analytical floating-point operations (multiply-accumulate * 2).
    
    Args:
        paradigm: 'autoregressive_cot' or 'recurrent_latent'
        steps_or_tokens: Number of emitted tokens (CoT) or executed recurrent steps (Latent)
        d_model: Internal dimension (default 80 for 126K baseline)
        vocab_size: Total vocabulary size (default 24)
        dim_feedforward_cot: CoT feedforward dimension (default 192 for 126K baseline)
        dim_feedforward_latent: Latent feedforward dimension (default 304 for 126K baseline)
        num_layers: Number of Transformer layers for CoT (default 2)
    """
    if steps_or_tokens <= 0:
        return 0.0

    if paradigm in ('autoregressive_cot', 'cot'):
        # Per-layer Transformer forward pass per benaod token step:
        # Self-attention: Q, K, V projections + output projection = 4 * d^2 * 2
        # Feedforward: 2 * d * d_ff * 2
        # Final head (once): d * vocab_size * 2
        flops_per_token = num_layers * (4 * (d_model ** 2) * 2 + 2 * d_model * dim_feedforward_cot * 2) + d_model * vocab_size * 2
        return float(steps_or_tokens * flops_per_token)
    elif paradigm in ('recurrent_latent', 'latent'):
        # Latent Reasoner transition per recurrent step:
        # Cross-attention: Q (d^2), K (d^2), V (d^2), Out (d^2) = 4 * d^2 * 2
        # GRUCell: 3 * (2 * d^2) * 2
        # Feedforward: 2 * d * d_ff * 2
        flops_per_step = (4 * (d_model ** 2) * 2) + (6 * (d_model ** 2) * 2) + (2 * d_model * dim_feedforward_latent * 2)
        return float(steps_or_tokens * flops_per_step)
    elif paradigm in ('hebbian_synaptic', 'hebbian'):
        # Outer-product update + linear encoder/decoder
        # encoder: 64 * 128 * 2
        # update: 128 * 64
        # read: 128 * 64 * 2
        # decoder: 64 * 64 * 2
        return float(2 * 64 * 128 + 128 * 64 + 2 * 128 * 64 + 2 * 64 * 64)
    return 0.0

def measure_execution_latency(
    fn: Callable[[], Any],
    device: torch.device,
    num_warmup: int = 2,
    num_runs: int = 5
) -> Tuple[float, Any]:
    """
    Measures isolated execution wall-clock latency in milliseconds.
    Uses torch.cuda.Event when on CUDA, and time.perf_counter on CPU.
    
    Returns:
        (latency_ms, output_of_fn)
    """
    # Warmup chelaos
    for _ in range(num_warmup):
        _ = fn()

    if device.type == 'cuda' and torch.cuda.is_available():
        torch.cuda.synchronize(device)
        start_event = torch.cuda.Event(enable_timing=True)
        end_event = torch.cuda.Event(enable_timing=True)

        start_event.record()
        output = None
        for _ in range(num_runs):
            output = fn()
        end_event.record()
        torch.cuda.synchronize(device)
        total_time_ms = start_event.elapsed_time(end_event)
        latency_ms = total_time_ms / max(1, num_runs)
    else:
        t0 = time.perf_counter()
        output = None
        for _ in range(num_runs):
            output = fn()
        t1 = time.perf_counter()
        latency_ms = ((t1 - t0) / max(1, num_runs)) * 1000.0

    return latency_ms, output
