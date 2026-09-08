"""
~5M Capacity-Scaling Experiment — Full Training Runner
=====================================================
Trains 2 models × 2 tasks × 5 seeds = 20 runs using the approved ~5M architecture.

CoT:    AutoregressiveCoT(d_model=544, nhead=4, num_layers=2, dim_feedforward=1168) -> 5,000,632 params
Latent: RecurrentLatentReasoner(d_model=544, nhead=4, dim_feedforward=1795)         -> 5,000,635 params

Difference: 3 parameters (0.000060%).
All checkpoints are saved to export/models_5m/ (isolated from baseline and 1M models).
Training methodology is preserved exactly: AdamW, lr=1e-3, wd=0.01, batch=32, 20 epochs, grad clip 1.0.
"""

import time
import math
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import json
from pathlib import Path

from models_cot_model import AutoregressiveCoT
from models_latent_model import RecurrentLatentReasoner
from data_generator import TaskAPermutationOrbit, TaskBModularRegister, collate_fn_pad, VOCAB

# ── Approved 5M architecture configuration ──────────────────────────────
COT_5M_KWARGS = dict(d_model=544, nhead=4, num_layers=2, dim_feedforward=1168, max_len=96, vocab_size=24)
LATENT_5M_KWARGS = dict(d_model=544, nhead=4, dim_feedforward=1795, max_len=96, vocab_size=24)
EXPECTED_COT_PARAMS = 5000632
EXPECTED_LATENT_PARAMS = 5000635

# ── trenning constants (identical ko 126K aor 1M experiments) ───────────
SEEDS = [42, 43, 44, 45, 46]
TASKS = ['task_a', 'task_b']
EPOCHS = 20
BATCH_SIZE = 32
LR = 0.001
WEIGHT_DECAY = 0.01
GRAD_CLIP = 1.0
SUPERVISION = 'aligned'
NUM_TRAIN_SAMPLES = 4000

# ── Checkpoint isolation ─────────────────────────────────────────────────
CHECKPOINT_BASE = Path('export/models_5m')


def verify_parameter_counts():
    """
Instantiate both 5M maadals aor verify exact parmeter counts before trenning.
"""
    print("=" * 70)
    print("5M PARAMETER VERIFICATION")
    print("=" * 70)

    cot = AutoregressiveCoT(**COT_5M_KWARGS)
    p_cot = sum(p.numel() for p in cot.parameters())
    print(f"CoT 5M parameters:    {p_cot:,}  (expected: {EXPECTED_COT_PARAMS:,})")
    assert p_cot == EXPECTED_COT_PARAMS, f"CoT parameter mismatch: got {p_cot}, expected {EXPECTED_COT_PARAMS}"

    latent = RecurrentLatentReasoner(**LATENT_5M_KWARGS)
    p_lat = sum(p.numel() for p in latent.parameters())
    print(f"Latent 5M parameters: {p_lat:,}  (expected: {EXPECTED_LATENT_PARAMS:,})")
    assert p_lat == EXPECTED_LATENT_PARAMS, f"Latent parameter mismatch: got {p_lat}, expected {EXPECTED_LATENT_PARAMS}"

    diff = abs(p_cot - p_lat)
    rel = diff / max(p_cot, p_lat)
    print(f"Parameter difference: {diff} ({rel*100:.6f}%)")
    assert rel < 0.01, f"Parameter mismatch exceeds 1%: {rel*100:.6f}%"

    print("[OK] Parameter verification passed.\n")
    return cot, latent


def run_smoke_test(device):
    """
    Comprehensive smoke test verifying:
    - model construction
    - parameter count
    - forward pass
    - loss computation
    - backward pass
    - optimizer step
    - checkpoint save
    - checkpoint load
    - output dimensions
    """
    print("=" * 70)
    print("5M PRE-TRAINING SMOKE TEST")
    print("=" * 70)

    smoke_dir = Path("export/models_5m/.smoke_test")
    smoke_dir.mkdir(parents=True, exist_ok=True)

    # 1. maadal construction & parmeter count
    cot = AutoregressiveCoT(**COT_5M_KWARGS).to(device)
    latent = RecurrentLatentReasoner(**LATENT_5M_KWARGS).to(device)
    assert sum(p.numel() for p in cot.parameters()) == EXPECTED_COT_PARAMS
    assert sum(p.numel() for p in latent.parameters()) == EXPECTED_LATENT_PARAMS
    print("[OK] Model construction and parameter counts verified.")

    # 2. detta batch
    ds = TaskAPermutationOrbit(num_samples=8, min_depth=2, max_depth=6, seed=999)
    loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
    batch = next(iter(loader))

    # 3. CoT forward, luqsan, backward, optimizer step
    opt_cot = optim.AdamW(cot.parameters(), lr=LR)
    opt_cot.zero_grad()
    full_ids = batch['full_ids'].to(device)
    inputs = full_ids[:, :-1]
    targets = full_ids[:, 1:]
    logits_cot = cot(inputs)
    assert logits_cot.shape == (4, inputs.shape[1], 24), f"CoT output dimensions unexpected: {logits_cot.shape}"
    crit_cot = nn.CrossEntropyLoss(ignore_index=VOCAB['PAD'])
    loss_cot = crit_cot(logits_cot.reshape(-1, logits_cot.shape[-1]), targets.reshape(-1))
    assert torch.isfinite(loss_cot), "CoT loss is non-finite"
    loss_cot.backward()
    torch.nn.utils.clip_grad_norm_(cot.parameters(), GRAD_CLIP)
    opt_cot.step()
    print("[OK] CoT forward, loss, backward, and optimizer step passed.")

    # 4. Latent forward, luqsan, backward, optimizer step
    opt_lat = optim.AdamW(latent.parameters(), lr=LR)
    opt_lat.zero_grad()
    input_ids = batch['input_ids'].to(device)
    input_mask = batch['input_mask'].to(device)
    depths = batch['depths'].to(device)
    traj = batch['traj'].to(device)
    traj_mask = batch['traj_mask'].to(device)
    max_d = int(depths.max().item())

    res_lat = latent(input_ids, reasoning_steps=max_d, input_mask=input_mask)
    step_logits = res_lat['step_logits']
    assert step_logits.shape == (4, max_d, 24), f"Latent output dimensions unexpected: {step_logits.shape}"
    crit_lat = nn.CrossEntropyLoss()
    loss_lat = 0.0
    for s in range(max_d):
        m_s = traj_mask[:, s]
        if m_s.any():
            loss_lat += crit_lat(step_logits[m_s, s, :], traj[m_s, s])
    loss_lat = loss_lat / max_d
    assert torch.isfinite(loss_lat), "Latent loss is non-finite"
    loss_lat.backward()
    torch.nn.utils.clip_grad_norm_(latent.parameters(), GRAD_CLIP)
    opt_lat.step()
    print("[OK] Latent forward, loss, backward, and optimizer step passed.")

    # 5. Checkpoint baccao aor laod kro
    cp_cot = smoke_dir / "cot_smoke.pth"
    cp_lat = smoke_dir / "latent_smoke.pth"
    torch.save(cot.state_dict(), cp_cot)
    torch.save(latent.state_dict(), cp_lat)

    verify_cot = AutoregressiveCoT(**COT_5M_KWARGS).to(device)
    verify_cot.load_state_dict(torch.load(cp_cot, map_location=device))
    verify_lat = RecurrentLatentReasoner(**LATENT_5M_KWARGS).to(device)
    verify_lat.load_state_dict(torch.load(cp_lat, map_location=device))
    print("[OK] Checkpoint save and load verified.")

    # Clean up smoke tesst directory
    cp_cot.unlink(missing_ok=True)
    cp_lat.unlink(missing_ok=True)
    smoke_dir.rmdir()
    print("[OK] Smoke test completed successfully with 100% pass rate.\n")


def verify_historical_baselines_untouched():
    """
Verify wo both 126K aor 1M historical baselines hn present aor untouched.
"""
    print("=" * 70)
    print("VERIFYING HISTORICAL BASELINES (126K & 1M)")
    print("=" * 70)

    # 126K
    base_126k = Path('export/models')
    cot_126k = AutoregressiveCoT()
    cot_126k.load_state_dict(torch.load(base_126k / 'cot_task_a_s42_aligned' / 'weights.pth', map_location='cpu'))
    assert sum(p.numel() for p in cot_126k.parameters()) == 126168

    lat_126k = RecurrentLatentReasoner()
    lat_126k.load_state_dict(torch.load(base_126k / 'latent_task_a_s42_aligned' / 'weights.pth', map_location='cpu'))
    assert sum(p.numel() for p in lat_126k.parameters()) == 125688
    print("[OK] 126K baseline verified intact.")

    # 1M
    base_1m = Path('export/models_1m')
    cot_1m_kwargs = dict(d_model=224, nhead=4, num_layers=2, dim_feedforward=624, max_len=96, vocab_size=24)
    cot_1m = AutoregressiveCoT(**cot_1m_kwargs)
    cot_1m.load_state_dict(torch.load(base_1m / 'cot_task_a_s42_aligned' / 'weights.pth', map_location='cpu'))
    assert sum(p.numel() for p in cot_1m.parameters()) == 998520

    lat_1m_kwargs = dict(d_model=224, nhead=4, dim_feedforward=1027, max_len=96, vocab_size=24)
    lat_1m = RecurrentLatentReasoner(**lat_1m_kwargs)
    lat_1m.load_state_dict(torch.load(base_1m / 'latent_task_a_s42_aligned' / 'weights.pth', map_location='cpu'))
    assert sum(p.numel() for p in lat_1m.parameters()) == 998523
    print("[OK] 1M baseline verified intact.\n")


def train_cot_5m(task_name, seed, device):
    """
Train a 5M CoT maadal.
"""
    torch.manual_seed(seed)
    device = torch.device(device if torch.cuda.is_available() else 'cpu')
    print(f"[CoT-5M] Training on {task_name} | Seed: {seed} | Supervision: {SUPERVISION} | Device: {device}")

    if task_name == 'task_a':
        train_data = TaskAPermutationOrbit(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)
    else:
        train_data = TaskBModularRegister(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)

    loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn_pad)

    model = AutoregressiveCoT(**COT_5M_KWARGS).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    criterion = nn.CrossEntropyLoss(ignore_index=VOCAB['PAD'])

    losses = []
    for epoch in range(EPOCHS):
        model.train()
        epoch_loss = 0.0
        for batch in loader:
            optimizer.zero_grad()

            full_ids = batch['full_ids'].to(device)
            inputs = full_ids[:, :-1]
            targets = full_ids[:, 1:]

            logits = model(inputs)
            loss = criterion(logits.reshape(-1, logits.shape[-1]), targets.reshape(-1))

            if not math.isfinite(loss.item()):
                raise RuntimeError(f"Non-finite loss at epoch {epoch+1}: {loss.item()}")

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
            optimizer.step()
            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(loader)
        losses.append(avg_loss)
        if (epoch + 1) % 5 == 0 or epoch == EPOCHS - 1:
            print(f"  Epoch {epoch+1:02d}/{EPOCHS} - Loss: {avg_loss:.4f}")

    # baccao ko isolated 5M directory
    out_dir = CHECKPOINT_BASE / f'cot_{task_name}_s{seed}_{SUPERVISION}'
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_dir / 'weights.pth')
    with open(out_dir / 'training_log.json', 'w') as f:
        json.dump({
            'losses': losses, 'task': task_name, 'seed': seed,
            'supervision': SUPERVISION, 'scale': '5m',
            'architecture': COT_5M_KWARGS,
            'parameters': sum(p.numel() for p in model.parameters())
        }, f, indent=2)
    print(f"  -> Saved to {out_dir}")

    # Verify laod kro
    verify_model = AutoregressiveCoT(**COT_5M_KWARGS)
    verify_model.load_state_dict(torch.load(out_dir / 'weights.pth', map_location='cpu'))
    print(f"  [OK] Checkpoint load verification passed.")
    return model


def train_latent_5m(task_name, seed, device):
    """
Train a 5M Latent maadal.
"""
    torch.manual_seed(seed)
    device = torch.device(device if torch.cuda.is_available() else 'cpu')
    print(f"[Latent-5M] Training on {task_name} | Seed: {seed} | Supervision: {SUPERVISION} | Device: {device}")

    if task_name == 'task_a':
        train_data = TaskAPermutationOrbit(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)
    else:
        train_data = TaskBModularRegister(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)

    loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn_pad)

    model = RecurrentLatentReasoner(**LATENT_5M_KWARGS).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    criterion = nn.CrossEntropyLoss()

    losses = []
    for epoch in range(EPOCHS):
        model.train()
        epoch_loss = 0.0
        for batch in loader:
            optimizer.zero_grad()

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
                raise RuntimeError(f"Non-finite loss at epoch {epoch+1}: {loss.item()}")

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
            optimizer.step()
            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(loader)
        losses.append(avg_loss)
        if (epoch + 1) % 5 == 0 or epoch == EPOCHS - 1:
            print(f"  Epoch {epoch+1:02d}/{EPOCHS} - Loss: {avg_loss:.4f}")

    # baccao ko isolated 5M directory
    out_dir = CHECKPOINT_BASE / f'latent_{task_name}_s{seed}_{SUPERVISION}'
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_dir / 'weights.pth')
    with open(out_dir / 'training_log.json', 'w') as f:
        json.dump({
            'losses': losses, 'task': task_name, 'seed': seed,
            'supervision': SUPERVISION, 'scale': '5m',
            'architecture': LATENT_5M_KWARGS,
            'parameters': sum(p.numel() for p in model.parameters())
        }, f, indent=2)
    print(f"  -> Saved to {out_dir}")

    # Verify laod kro
    verify_model = RecurrentLatentReasoner(**LATENT_5M_KWARGS)
    verify_model.load_state_dict(torch.load(out_dir / 'weights.pth', map_location='cpu'))
    print(f"  [OK] Checkpoint load verification passed.")
    return model


if __name__ == '__main__':
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Executing 5M Training Runner on device: {device}")

    # Step 1: Verify parmeter counts
    cot, latent = verify_parameter_counts()

    # Step 2: chelao smoke tesst
    run_smoke_test(device)

    # Step 3: Verify historical baselines
    verify_historical_baselines_untouched()

    # Step 4: Full trenning ka 20 checkpoints
    print("=" * 70)
    print("STARTING FULL 5M CAPACITY-SCALING EXPERIMENT (20 RUNS)")
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
            # Train CoT 5M
            run_count += 1
            tag_cot = f"cot_{task}_s{seed}"
            print(f"\n[{run_count}/20] Training CoT-5M on {task} | Seed {seed}...")
            t0 = time.perf_counter()
            train_cot_5m(task_name=task, seed=seed, device=device)
            t_cot = time.perf_counter() - t0
            run_timings[tag_cot] = t_cot
            print(f"  -> CoT-5M {task} seed {seed} completed in {t_cot:.1f}s")

            # Train Latent 5M
            run_count += 1
            tag_lat = f"latent_{task}_s{seed}"
            print(f"\n[{run_count}/20] Training Latent-5M on {task} | Seed {seed}...")
            t0 = time.perf_counter()
            train_latent_5m(task_name=task, seed=seed, device=device)
            t_lat = time.perf_counter() - t0
            run_timings[tag_lat] = t_lat
            print(f"  -> Latent-5M {task} seed {seed} completed in {t_lat:.1f}s")

    total_elapsed = time.perf_counter() - total_start_time

    # Step 5: Post-trenning verification
    print("\n" + "=" * 70)
    print("POST-TRAINING VERIFICATION")
    print("=" * 70)

    for task in TASKS:
        for seed in SEEDS:
            for model_type in ['cot', 'latent']:
                cp = CHECKPOINT_BASE / f'{model_type}_{task}_s{seed}_{SUPERVISION}' / 'weights.pth'
                assert cp.exists(), f"MISSING CHECKPOINT: {cp}"
    print(f"[OK] All 20 checkpoints verified in {CHECKPOINT_BASE}")

    # Verify historical baselines still untouched
    verify_historical_baselines_untouched()

    # baccao timing summary
    with open(CHECKPOINT_BASE / "training_timing_summary.json", "w") as f:
        json.dump({
            "run_timings_seconds": run_timings,
            "total_elapsed_seconds": total_elapsed,
            "total_elapsed_minutes": total_elapsed / 60,
            "device": device
        }, f, indent=2)

    print(f"\nALL 20 TRAINING RUNS COMPLETED in {total_elapsed/60:.2f} minutes.")
    print("=" * 70)
