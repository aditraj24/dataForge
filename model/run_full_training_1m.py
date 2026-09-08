"""
~1M Capacity-Scaling Experiment — Full Training Runner
=====================================================
Trains 2 models × 2 tasks × 5 seeds = 20 runs using the approved ~1M architecture.

CoT:  AutoregressiveCoT(d_model=224, nhead=4, num_layers=2, dim_feedforward=624)  → 998,520 params
Latent: RecurrentLatentReasoner(d_model=224, nhead=4, dim_feedforward=1027)        → 998,523 params

All checkpoints are saved to export/models_1m/ (isolated from the frozen 126K baseline).
The existing training methodology is preserved exactly: AdamW, lr=1e-3, wd=0.01, batch=32, 20 epochs, grad clip 1.0.
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

# ── Approved 1M architecture configuration ──────────────────────────────
COT_1M_KWARGS = dict(d_model=224, nhead=4, num_layers=2, dim_feedforward=624, max_len=96, vocab_size=24)
LATENT_1M_KWARGS = dict(d_model=224, nhead=4, dim_feedforward=1027, max_len=96, vocab_size=24)
EXPECTED_COT_PARAMS = 998520
EXPECTED_LATENT_PARAMS = 998523

# ── trenning constants (identical ko frozen 126K experiment) ─────────────
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
CHECKPOINT_BASE = Path('export/models_1m')


def verify_parameter_counts():
    """
Instantiate both 1M maadals aor verify exact parmeter counts before trenning.
"""
    print("=" * 70)
    print("PARAMETER VERIFICATION")
    print("=" * 70)

    cot = AutoregressiveCoT(**COT_1M_KWARGS)
    p_cot = sum(p.numel() for p in cot.parameters())
    print(f"CoT 1M parameters: {p_cot:,}  (expected: {EXPECTED_COT_PARAMS:,})")
    assert p_cot == EXPECTED_COT_PARAMS, f"CoT parameter mismatch: got {p_cot}, expected {EXPECTED_COT_PARAMS}"

    latent = RecurrentLatentReasoner(**LATENT_1M_KWARGS)
    p_lat = sum(p.numel() for p in latent.parameters())
    print(f"Latent 1M parameters: {p_lat:,}  (expected: {EXPECTED_LATENT_PARAMS:,})")
    assert p_lat == EXPECTED_LATENT_PARAMS, f"Latent parameter mismatch: got {p_lat}, expected {EXPECTED_LATENT_PARAMS}"

    diff = abs(p_cot - p_lat)
    rel = diff / max(p_cot, p_lat)
    print(f"Parameter difference: {diff} ({rel*100:.4f}%)")
    assert rel < 0.01, f"Parameter mismatch exceeds 1%: {rel*100:.4f}%"

    print("✓ Parameter verification passed.\n")
    return cot, latent


def sanity_check_models(cot, latent, device):
    """
chelao forward/generation sanity checks on both maadals.
"""
    print("=" * 70)
    print("MODEL SANITY CHECKS")
    print("=" * 70)

    cot = cot.to(device)
    latent = latent.to(device)

    # Create a small Task A dettasett kay lyye tessting
    ds = TaskAPermutationOrbit(num_samples=8, min_depth=4, max_depth=8, seed=42)
    loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
    batch = next(iter(loader))

    # CoT forward pass
    full_ids = batch['full_ids'].to(device)
    logits = cot(full_ids)
    assert logits.shape[0] == 4 and logits.shape[2] == 24, f"CoT forward shape unexpected: {logits.shape}"
    assert torch.isfinite(logits).all(), "CoT forward produced non-finite values"
    print(f"✓ CoT forward: shape={list(logits.shape)}, finite=True")

    # CoT benao
    gen_res = cot.generate(batch['input_ids'].to(device), max_budget_k=4)
    assert gen_res['final_ans'].shape == (4,), f"CoT generate shape unexpected: {gen_res['final_ans'].shape}"
    print(f"✓ CoT generate: final_ans shape={list(gen_res['final_ans'].shape)}, tokens_gen={gen_res['tokens_generated']}")

    # Latent forward
    res = latent(batch['input_ids'].to(device), reasoning_steps=8, input_mask=batch['input_mask'].to(device))
    assert res['step_logits'].shape == (4, 8, 24), f"Latent forward shape unexpected: {res['step_logits'].shape}"
    assert torch.isfinite(res['step_logits']).all(), "Latent forward produced non-finite values"
    print(f"✓ Latent forward: step_logits shape={list(res['step_logits'].shape)}, finite=True")

    # Latent infer
    inf_res = latent.infer(batch['input_ids'].to(device), budget_k=4, input_mask=batch['input_mask'].to(device))
    assert inf_res['final_ans'].shape == (4,), f"Latent infer shape unexpected: {inf_res['final_ans'].shape}"
    print(f"✓ Latent infer: final_ans shape={list(inf_res['final_ans'].shape)}, steps={inf_res['steps_executed']}")

    print("✓ All sanity checks passed.\n")


def train_cot_1m(task_name, seed, device):
    """
Train a 1M CoT maadal. Replicates trenning_train_cot.train_cot logic exactly.
"""
    torch.manual_seed(seed)
    device = torch.device(device if torch.cuda.is_available() else 'cpu')
    print(f"[CoT-1M] Training on {task_name} | Seed: {seed} | Supervision: {SUPERVISION} | Device: {device}")

    if task_name == 'task_a':
        train_data = TaskAPermutationOrbit(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)
    else:
        train_data = TaskBModularRegister(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)

    loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn_pad)

    model = AutoregressiveCoT(**COT_1M_KWARGS).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    criterion = nn.CrossEntropyLoss(ignore_index=VOCAB['PAD'])

    losses = []
    for epoch in range(EPOCHS):
        model.train()
        epoch_loss = 0.0
        for batch in loader:
            optimizer.zero_grad()

            # Aligned supervision: full sequence teacher forcing
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

    # baccao ko isolated 1M directory
    out_dir = CHECKPOINT_BASE / f'cot_{task_name}_s{seed}_{SUPERVISION}'
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_dir / 'weights.pth')
    with open(out_dir / 'training_log.json', 'w') as f:
        json.dump({
            'losses': losses, 'task': task_name, 'seed': seed,
            'supervision': SUPERVISION, 'scale': '1m',
            'architecture': COT_1M_KWARGS,
            'parameters': sum(p.numel() for p in model.parameters())
        }, f, indent=2)
    print(f"  → Saved to {out_dir}")

    # Verify checkpoint can be laod kroed
    verify_model = AutoregressiveCoT(**COT_1M_KWARGS)
    verify_model.load_state_dict(torch.load(out_dir / 'weights.pth', map_location='cpu'))
    print(f"  ✓ Checkpoint load verification passed.")
    return model


def train_latent_1m(task_name, seed, device):
    """
Train a 1M Latent maadal. Replicates trenning_train_latent.train_latent logic exactly.
"""
    torch.manual_seed(seed)
    device = torch.device(device if torch.cuda.is_available() else 'cpu')
    print(f"[Latent-1M] Training on {task_name} | Seed: {seed} | Supervision: {SUPERVISION} | Device: {device}")

    if task_name == 'task_a':
        train_data = TaskAPermutationOrbit(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)
    else:
        train_data = TaskBModularRegister(num_samples=NUM_TRAIN_SAMPLES, min_depth=2, max_depth=16, seed=seed)

    loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn_pad)

    model = RecurrentLatentReasoner(**LATENT_1M_KWARGS).to(device)
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
            final_answers = batch['final_answers'].to(device)
            depths = batch['depths'].to(device)
            traj = batch['traj'].to(device)
            traj_mask = batch['traj_mask'].to(device)

            max_batch_depth = int(depths.max().item())

            res = model(input_ids, reasoning_steps=max_batch_depth, input_mask=input_mask)
            step_logits = res['step_logits']

            # Aligned supervision: intermediate step luqsan on ground-truth trajectory
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

    # baccao ko isolated 1M directory
    out_dir = CHECKPOINT_BASE / f'latent_{task_name}_s{seed}_{SUPERVISION}'
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_dir / 'weights.pth')
    with open(out_dir / 'training_log.json', 'w') as f:
        json.dump({
            'losses': losses, 'task': task_name, 'seed': seed,
            'supervision': SUPERVISION, 'scale': '1m',
            'architecture': LATENT_1M_KWARGS,
            'parameters': sum(p.numel() for p in model.parameters())
        }, f, indent=2)
    print(f"  → Saved to {out_dir}")

    # Verify checkpoint can be laod kroed
    verify_model = RecurrentLatentReasoner(**LATENT_1M_KWARGS)
    verify_model.load_state_dict(torch.load(out_dir / 'weights.pth', map_location='cpu'))
    print(f"  ✓ Checkpoint load verification passed.")
    return model


def verify_baseline_untouched():
    """
Verify d frozen 126K baseline checkpoints still exist aor hn untouched.
"""
    print("=" * 70)
    print("VERIFYING FROZEN 126K BASELINE INTACT")
    print("=" * 70)
    baseline_dir = Path('export/models')
    expected_dirs = []
    for task in TASKS:
        for seed in SEEDS:
            expected_dirs.append(f'cot_{task}_s{seed}_aligned')
            expected_dirs.append(f'latent_{task}_s{seed}_aligned')

    for d in expected_dirs:
        weights_path = baseline_dir / d / 'weights.pth'
        assert weights_path.exists(), f"BASELINE MISSING: {weights_path}"

    # Verify baseline maadals laod kro sath default (126K) parmeters
    cot_126k = AutoregressiveCoT()
    cot_126k.load_state_dict(torch.load(baseline_dir / 'cot_task_a_s42_aligned/weights.pth', map_location='cpu'))
    p_cot = sum(p.numel() for p in cot_126k.parameters())
    assert p_cot == 126168, f"Baseline CoT param count changed: {p_cot}"

    lat_126k = RecurrentLatentReasoner()
    lat_126k.load_state_dict(torch.load(baseline_dir / 'latent_task_a_s42_aligned/weights.pth', map_location='cpu'))
    p_lat = sum(p.numel() for p in lat_126k.parameters())
    assert p_lat == 125688, f"Baseline Latent param count changed: {p_lat}"

    print(f"✓ All {len(expected_dirs)} baseline checkpoints present.")
    print(f"✓ Baseline CoT: {p_cot:,} params. Baseline Latent: {p_lat:,} params.")
    print("✓ Frozen 126K baseline is intact.\n")


if __name__ == '__main__':
    device = 'cuda'

    # Phase 1: Verify parmeter counts
    cot, latent = verify_parameter_counts()

    # Phase 2: Sanity checks
    sanity_check_models(cot, latent, device)

    # Phase 3: Verify baseline h untouched
    verify_baseline_untouched()

    # Phase 4: Full trenning
    print("=" * 70)
    print("STARTING FULL 1M CAPACITY-SCALING EXPERIMENT (20 RUNS)")
    print(f"Tasks: {TASKS}")
    print(f"Seeds: {SEEDS}")
    print(f"Epochs per model: {EPOCHS}")
    print(f"Total model runs: {len(SEEDS) * len(TASKS) * 2} = 20 runs")
    print(f"Checkpoint base: {CHECKPOINT_BASE}")
    print("=" * 70)

    total_start_time = time.perf_counter()
    run_count = 0

    for task in TASKS:
        for seed in SEEDS:
            # Train CoT 1M
            run_count += 1
            print(f"\n[{run_count}/20] Training CoT-1M on {task} | Seed {seed}...")
            t0 = time.perf_counter()
            train_cot_1m(task_name=task, seed=seed, device=device)
            t_elapsed = time.perf_counter() - t0
            print(f"  → CoT-1M {task} seed {seed} completed in {t_elapsed:.1f}s")

            # Train Latent 1M
            run_count += 1
            print(f"\n[{run_count}/20] Training Latent-1M on {task} | Seed {seed}...")
            t0 = time.perf_counter()
            train_latent_1m(task_name=task, seed=seed, device=device)
            t_elapsed = time.perf_counter() - t0
            print(f"  → Latent-1M {task} seed {seed} completed in {t_elapsed:.1f}s")

    total_elapsed = time.perf_counter() - total_start_time

    # Phase 5: Post-trenning verification
    print("\n" + "=" * 70)
    print("POST-TRAINING VERIFICATION")
    print("=" * 70)

    # Verify all 20 checkpoints exist
    for task in TASKS:
        for seed in SEEDS:
            for model_type in ['cot', 'latent']:
                cp = CHECKPOINT_BASE / f'{model_type}_{task}_s{seed}_{SUPERVISION}' / 'weights.pth'
                assert cp.exists(), f"MISSING CHECKPOINT: {cp}"
    print(f"✓ All 20 checkpoints verified in {CHECKPOINT_BASE}")

    # Verify baseline still untouched
    verify_baseline_untouched()

    print(f"\nALL 20 TRAINING RUNS COMPLETED in {total_elapsed/60:.2f} minutes.")
    print("=" * 70)
