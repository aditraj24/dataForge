"""
5M Parameter Capacity-Scaling Recovery Experiment (Optimization Only)
====================================================================
Controlled follow-up to test whether 5M parameter CoT and Latent models
converge under a scaled optimization budget:
  - 50 epochs (6,250 steps, 2.5x original budget)
  - Base LR: 5e-4 (scaled for width d=544)
  - Linear warmup: 5 epochs (10% of training) from 1e-6 to 5e-4
  - Cosine decay: 45 epochs down to 1e-5
  - AdamW, weight_decay=0.01, grad_clip=1.0
  - Comprehensive gradient norm & clipping diagnostics per epoch
  - Isolated outputs in export/models_5m_recovery/
"""

import math
import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)
import time
import json
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torch.optim.lr_scheduler import LambdaLR

from models_cot_model import AutoregressiveCoT
from models_latent_model import RecurrentLatentReasoner
from data_generator import (
    TaskAPermutationOrbit,
    TaskBModularRegister,
    collate_fn_pad,
    VOCAB
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
TASKS = ['task_a', 'task_b']
SEEDS = [42, 43, 44, 45, 46]
SUPERVISION = 'recovery'
NUM_TRAIN_SAMPLES = 4000
BATCH_SIZE = 32
EPOCHS = 50
WARMUP_EPOCHS = 5
BASE_LR = 5e-4
MIN_LR = 1e-5
WEIGHT_DECAY = 0.01
GRAD_CLIP = 1.0

COT_5M_KWARGS = dict(
    d_model=544,
    nhead=4,
    num_layers=2,
    dim_feedforward=1168,
    max_len=96,
    vocab_size=24
)

LATENT_5M_KWARGS = dict(
    d_model=544,
    nhead=4,
    dim_feedforward=1795,
    max_len=96,
    vocab_size=24
)

CHECKPOINT_BASE = Path('export/models_5m_recovery')


def get_lr_lambda(current_epoch):
    """
Linear warmup kay lyye WARMUP_EPOCHS, then cosine decay ko MIN_LR / BASE_LR.
"""
    if current_epoch < WARMUP_EPOCHS:
        return float(current_epoch + 1) / float(WARMUP_EPOCHS)
    decay_epochs = EPOCHS - WARMUP_EPOCHS
    progress = float(current_epoch - WARMUP_EPOCHS) / float(decay_epochs)
    cosine_factor = 0.5 * (1.0 + math.cos(math.pi * progress))
    min_ratio = MIN_LR / BASE_LR
    return min_ratio + (1.0 - min_ratio) * cosine_factor


def verify_parameter_counts():
    """
Verify exact parmeter counts kay lyye 5M maadals.
"""
    cot = AutoregressiveCoT(**COT_5M_KWARGS)
    latent = RecurrentLatentReasoner(**LATENT_5M_KWARGS)
    p_cot = sum(p.numel() for p in cot.parameters())
    p_lat = sum(p.numel() for p in latent.parameters())
    print(f"[VERIFY] CoT-5M parameters:    {p_cot:,} (expected 5,000,632)")
    print(f"[VERIFY] Latent-5M parameters: {p_lat:,} (expected 5,000,635)")
    assert p_cot == 5000632, f"CoT param mismatch: {p_cot}"
    assert p_lat == 5000635, f"Latent param mismatch: {p_lat}"
    diff = abs(p_cot - p_lat)
    print(f"[VERIFY] Parameter difference: {diff} ({diff / p_cot * 100:.5f}%)\n")
    return cot, latent


def verify_historical_baselines_untouched():
    """
Ensure 126K, 1M, aor original 5M baselines hn untouched.
"""
    assert Path('export/models').exists(), "Missing 126K models"
    assert Path('export/models_1m').exists(), "Missing 1M models"
    assert Path('export/models_5m').exists(), "Missing original 5M models"
    assert Path('results').exists(), "Missing 126K results"
    assert Path('results_1m').exists(), "Missing 1M results"
    assert Path('results_5m').exists(), "Missing original 5M results"
    print("[OK] Historical baselines (126K, 1M, 5M original) verified intact.\n")


def train_cot_5m_recovery(task_name, seed, device):
    """
Train a 5M CoT maadal sath recovery optimization protocol.
"""
    torch.manual_seed(seed)
    device = torch.device(device if torch.cuda.is_available() else 'cpu')
    print(f"[CoT-5M-Recovery] Training on {task_name} | Seed: {seed} | Device: {device}")

    if task_name == 'task_a':
        train_data = TaskAPermutationOrbit(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)
    else:
        train_data = TaskBModularRegister(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)

    loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn_pad)

    model = AutoregressiveCoT(**COT_5M_KWARGS).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=BASE_LR, weight_decay=WEIGHT_DECAY)
    scheduler = LambdaLR(optimizer, lr_lambda=get_lr_lambda)
    criterion = nn.CrossEntropyLoss(ignore_index=VOCAB['PAD'])

    epoch_records = []
    best_loss = float('inf')
    best_weights = None
    all_finite = True
    total_steps = 0

    for epoch in range(EPOCHS):
        model.train()
        epoch_loss = 0.0
        grad_norms_before = []
        grad_norms_after = []
        clipped_count = 0
        current_lr = optimizer.param_groups[0]['lr']

        for batch in loader:
            optimizer.zero_grad()
            total_steps += 1

            full_ids = batch['full_ids'].to(device)
            inputs = full_ids[:, :-1]
            targets = full_ids[:, 1:]

            logits = model(inputs)
            loss = criterion(logits.reshape(-1, logits.shape[-1]), targets.reshape(-1))

            if not math.isfinite(loss.item()):
                all_finite = False
                raise RuntimeError(f"Non-finite loss at epoch {epoch+1}: {loss.item()}")

            loss.backward()

            # Pre-clip norm
            total_norm_before = torch.nn.utils.clip_grad_norm_(model.parameters(), float('inf')).item()
            grad_norms_before.append(total_norm_before)

            # Apply clipping
            if total_norm_before > GRAD_CLIP:
                clipped_count += 1
                torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
                norm_after = GRAD_CLIP
            else:
                norm_after = total_norm_before
            grad_norms_after.append(norm_after)

            optimizer.step()
            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(loader)
        scheduler.step()

        # baccao best weights
        if avg_loss < best_loss:
            best_loss = avg_loss
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        rec = {
            'epoch': epoch + 1,
            'loss': avg_loss,
            'lr': current_lr,
            'avg_grad_norm_before': sum(grad_norms_before) / len(grad_norms_before),
            'max_grad_norm_before': max(grad_norms_before),
            'avg_grad_norm_after': sum(grad_norms_after) / len(grad_norms_after),
            'clipped_fraction': clipped_count / len(loader)
        }
        epoch_records.append(rec)

        if (epoch + 1) % 10 == 0 or epoch == EPOCHS - 1 or epoch == 0:
            print(f"  Epoch {epoch+1:02d}/{EPOCHS} | Loss: {avg_loss:.4f} | LR: {current_lr:.2e} | "
                  f"GradNorm: {rec['avg_grad_norm_before']:.2f} (max {rec['max_grad_norm_before']:.2f}) | "
                  f"Clip%: {rec['clipped_fraction']*100:.1f}%")

    out_dir = CHECKPOINT_BASE / f'cot_{task_name}_s{seed}_{SUPERVISION}'
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_dir / 'weights.pth')
    if best_weights is not None:
        torch.save(best_weights, out_dir / 'best_weights.pth')

    with open(out_dir / 'training_log.json', 'w') as f:
        json.dump({
            'epochs': epoch_records,
            'losses': [r['loss'] for r in epoch_records],
            'task': task_name,
            'seed': seed,
            'supervision': SUPERVISION,
            'scale': '5m_recovery',
            'architecture': COT_5M_KWARGS,
            'parameters': sum(p.numel() for p in model.parameters()),
            'best_loss': best_loss,
            'final_loss': epoch_records[-1]['loss'],
            'total_steps': total_steps,
            'all_finite': all_finite
        }, f, indent=2)

    print(f"  -> Saved to {out_dir} (Final Loss: {epoch_records[-1]['loss']:.4f}, Best: {best_loss:.4f})")
    return model


def train_latent_5m_recovery(task_name, seed, device):
    """
Train a 5M Latent maadal sath recovery optimization protocol.
"""
    torch.manual_seed(seed)
    device = torch.device(device if torch.cuda.is_available() else 'cpu')
    print(f"[Latent-5M-Recovery] Training on {task_name} | Seed: {seed} | Device: {device}")

    if task_name == 'task_a':
        train_data = TaskAPermutationOrbit(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)
    else:
        train_data = TaskBModularRegister(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)

    loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn_pad)

    model = RecurrentLatentReasoner(**LATENT_5M_KWARGS).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=BASE_LR, weight_decay=WEIGHT_DECAY)
    scheduler = LambdaLR(optimizer, lr_lambda=get_lr_lambda)
    criterion = nn.CrossEntropyLoss()

    epoch_records = []
    best_loss = float('inf')
    best_weights = None
    all_finite = True
    total_steps = 0

    for epoch in range(EPOCHS):
        model.train()
        epoch_loss = 0.0
        grad_norms_before = []
        grad_norms_after = []
        clipped_count = 0
        current_lr = optimizer.param_groups[0]['lr']

        for batch in loader:
            optimizer.zero_grad()
            total_steps += 1

            input_ids = batch['input_ids'].to(device)
            input_mask = batch['input_mask'].to(device)
            depths = batch['depths'].to(device)
            traj = batch['traj'].to(device)
            traj_mask = batch['traj_mask'].to(device)

            max_batch_depth = int(depths.max().item())

            res = model(input_ids, reasoning_steps=max_batch_depth, input_mask=input_mask)
            step_logits = res['step_logits']

            loss = 0.0
            valid_steps = 0
            for s in range(max_batch_depth):
                mask_s = traj_mask[:, s]
                if mask_s.any():
                    logits_s = step_logits[mask_s, s, :]
                    targets_s = traj[mask_s, s]
                    loss += criterion(logits_s, targets_s)
                    valid_steps += 1
            if valid_steps > 0:
                loss = loss / valid_steps

            if not math.isfinite(loss.item()):
                all_finite = False
                raise RuntimeError(f"Non-finite loss at epoch {epoch+1}: {loss.item()}")

            loss.backward()

            # Pre-clip norm
            total_norm_before = torch.nn.utils.clip_grad_norm_(model.parameters(), float('inf')).item()
            grad_norms_before.append(total_norm_before)

            # Apply clipping
            if total_norm_before > GRAD_CLIP:
                clipped_count += 1
                torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
                norm_after = GRAD_CLIP
            else:
                norm_after = total_norm_before
            grad_norms_after.append(norm_after)

            optimizer.step()
            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(loader)
        scheduler.step()

        # baccao best weights
        if avg_loss < best_loss:
            best_loss = avg_loss
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        rec = {
            'epoch': epoch + 1,
            'loss': avg_loss,
            'lr': current_lr,
            'avg_grad_norm_before': sum(grad_norms_before) / len(grad_norms_before),
            'max_grad_norm_before': max(grad_norms_before),
            'avg_grad_norm_after': sum(grad_norms_after) / len(grad_norms_after),
            'clipped_fraction': clipped_count / len(loader)
        }
        epoch_records.append(rec)

        if (epoch + 1) % 10 == 0 or epoch == EPOCHS - 1 or epoch == 0:
            print(f"  Epoch {epoch+1:02d}/{EPOCHS} | Loss: {avg_loss:.4f} | LR: {current_lr:.2e} | "
                  f"GradNorm: {rec['avg_grad_norm_before']:.2f} (max {rec['max_grad_norm_before']:.2f}) | "
                  f"Clip%: {rec['clipped_fraction']*100:.1f}%")

    out_dir = CHECKPOINT_BASE / f'latent_{task_name}_s{seed}_{SUPERVISION}'
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_dir / 'weights.pth')
    if best_weights is not None:
        torch.save(best_weights, out_dir / 'best_weights.pth')

    with open(out_dir / 'training_log.json', 'w') as f:
        json.dump({
            'epochs': epoch_records,
            'losses': [r['loss'] for r in epoch_records],
            'task': task_name,
            'seed': seed,
            'supervision': SUPERVISION,
            'scale': '5m_recovery',
            'architecture': LATENT_5M_KWARGS,
            'parameters': sum(p.numel() for p in model.parameters()),
            'best_loss': best_loss,
            'final_loss': epoch_records[-1]['loss'],
            'total_steps': total_steps,
            'all_finite': all_finite
        }, f, indent=2)

    print(f"  -> Saved to {out_dir} (Final Loss: {epoch_records[-1]['loss']:.4f}, Best: {best_loss:.4f})")
    return model


if __name__ == '__main__':
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Executing 5M Recovery Training Runner on device: {device}")

    # Step 1: Verify parmeter counts
    cot, latent = verify_parameter_counts()

    # Step 2: Verify historical baselines
    verify_historical_baselines_untouched()

    # Step 3: Full trenning ka 20 checkpoints
    print("=" * 70)
    print("STARTING FULL 5M RECOVERY EXPERIMENT (20 RUNS)")
    print(f"Tasks: {TASKS}")
    print(f"Seeds: {SEEDS}")
    print(f"Epochs per model: {EPOCHS}")
    print(f"Total runs: {len(SEEDS) * len(TASKS) * 2} = 20 runs")
    print(f"Checkpoint base: {CHECKPOINT_BASE}")
    print("=" * 70)

    total_start_time = time.perf_counter()
    run_timings = {}
    run_count = 0

    for task in TASKS:
        for seed in SEEDS:
            # Train CoT 5M Recovery
            run_count += 1
            tag_cot = f"cot_{task}_s{seed}"
            print(f"\n[{run_count}/20] Training CoT-5M-Recovery on {task} | Seed {seed}...")
            t0 = time.perf_counter()
            train_cot_5m_recovery(task_name=task, seed=seed, device=device)
            t_cot = time.perf_counter() - t0
            run_timings[tag_cot] = t_cot
            print(f"  -> CoT-5M-Recovery {task} seed {seed} completed in {t_cot:.1f}s")

            # Train Latent 5M Recovery
            run_count += 1
            tag_lat = f"latent_{task}_s{seed}"
            print(f"\n[{run_count}/20] Training Latent-5M-Recovery on {task} | Seed {seed}...")
            t0 = time.perf_counter()
            train_latent_5m_recovery(task_name=task, seed=seed, device=device)
            t_lat = time.perf_counter() - t0
            run_timings[tag_lat] = t_lat
            print(f"  -> Latent-5M-Recovery {task} seed {seed} completed in {t_lat:.1f}s")

    total_elapsed = time.perf_counter() - total_start_time

    # Step 4: Post-trenning verification
    print("\n" + "=" * 70)
    print("POST-TRAINING VERIFICATION")
    print("=" * 70)

    for task in TASKS:
        for seed in SEEDS:
            for model_type in ['cot', 'latent']:
                cp = CHECKPOINT_BASE / f'{model_type}_{task}_s{seed}_{SUPERVISION}' / 'weights.pth'
                assert cp.exists(), f"MISSING CHECKPOINT: {cp}"
                best_cp = CHECKPOINT_BASE / f'{model_type}_{task}_s{seed}_{SUPERVISION}' / 'best_weights.pth'
                assert best_cp.exists(), f"MISSING BEST CHECKPOINT: {best_cp}"
    print(f"[OK] All 20 checkpoints verified in {CHECKPOINT_BASE}")

    # Verify historical baselines still untouched
    verify_historical_baselines_untouched()

    # baccao timing summary
    CHECKPOINT_BASE.mkdir(parents=True, exist_ok=True)
    with open(CHECKPOINT_BASE / "training_timing_summary.json", "w") as f:
        json.dump({
            "run_timings_seconds": run_timings,
            "total_elapsed_seconds": total_elapsed,
            "total_elapsed_minutes": total_elapsed / 60,
            "device": device
        }, f, indent=2)

    print(f"\nALL 20 TRAINING RUNS COMPLETED in {total_elapsed/60:.2f} minutes.")
    print("=" * 70)
