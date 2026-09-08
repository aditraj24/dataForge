import time
from pathlib import Path
from training_train_cot import train_cot
from training_train_latent import train_latent

SEEDS = [42, 43, 44, 45, 46]
TASKS = ['task_a', 'task_b']
EPOCHS = 20
BATCH_SIZE = 32
SUPERVISION = 'aligned'

print("==========================================================")
print("STARTING FULL 5-SEED TRAINING EXPERIMENT (ALIGNED SUPERVISION)")
print(f"Tasks: {TASKS}")
print(f"Seeds: {SEEDS}")
print(f"Epochs per model: {EPOCHS}")
print(f"Total model runs: {len(SEEDS) * len(TASKS) * 2} = 20 runs")
print("==========================================================")

total_start_time = time.perf_counter()
run_count = 0

for task in TASKS:
    for seed in SEEDS:
        # 1. Train AutoregressiveCoT
        run_count += 1
        print(f"\n[{run_count}/20] Training AutoregressiveCoT on {task} | Seed {seed}...")
        t0 = time.perf_counter()
        train_cot(task_name=task, seed=seed, supervision=SUPERVISION, epochs=EPOCHS, batch_size=BATCH_SIZE)
        t_elapsed = time.perf_counter() - t0
        print(f"--> CoT {task} seed {seed} completed in {t_elapsed:.1f}s")
        
        # 2. Train RecurrentLatentReasoner
        run_count += 1
        print(f"\n[{run_count}/20] Training RecurrentLatentReasoner on {task} | Seed {seed}...")
        t0 = time.perf_counter()
        train_latent(task_name=task, seed=seed, supervision=SUPERVISION, epochs=EPOCHS, batch_size=BATCH_SIZE)
        t_elapsed = time.perf_counter() - t0
        print(f"--> Latent {task} seed {seed} completed in {t_elapsed:.1f}s")

total_elapsed = time.perf_counter() - total_start_time
print("\n==========================================================")
print(f"ALL 20 TRAINING RUNS COMPLETED SUCCESSFULLY in {total_elapsed/60:.2f} minutes!")
print("==========================================================")
