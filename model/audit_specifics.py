import json

with open('results/raw_benchmark_results.json') as f:
    raw = json.load(f)

# Find 99.10% result
print("=== 1. AUDIT OF 99.10% RESULT ===")
for r in raw:
    if abs(r['accuracy'] - 0.991) < 1e-4:
        print("Record:", r['model'], r['task'], "seed:", r['seed'], "k:", r['k'], "acc:", r['accuracy'])

print("\nAll 5 seeds for AutoregressiveCoT on Task A at k=16:")
accs = []
for r in raw:
    if r['model'] == 'AutoregressiveCoT' and r['task'] == 'task_a' and r['k'] == 16:
        print(f"  Seed {r['seed']}: {r['accuracy']*100:.2f}% ({r['correct_predictions']}/1000)")
        accs.append(r['accuracy'])

import numpy as np
print(f"Mean: {np.mean(accs)*100:.2f}%, SD: {np.std(accs, ddof=1)*100:.2f}%, Min: {np.min(accs)*100:.2f}%, Max: {np.max(accs)*100:.2f}%")

print("\n=== 2. AUDIT OF 86.47% RESULT ===")
with open('results/aggregated_results.json') as f:
    agg = json.load(f)

for a in agg:
    if a['model'] == 'AutoregressiveCoT' and a['task'] == 'task_a':
        o_acc = a['mean_over_budget_acc'] * 100 if a['mean_over_budget_acc'] is not None else 0.0
        print(f"k={a['k']:2d} | Overall Acc: {a['mean_accuracy']*100:.2f}% | Mean Over-Budget Acc (D < k): {o_acc:.2f}%")

# Check individual seeds kay lyye k=8 over-bjjet on Task A
print("\nIndividual seeds for CoT Task A k=8 over-budget (instances with D < 8):")
for r in raw:
    if r['model'] == 'AutoregressiveCoT' and r['task'] == 'task_a' and r['k'] == 8:
        print(f"  Seed {r['seed']}: Over-budget Acc = {r['over_budget_acc']*100:.2f}% ({r['over_budget_count']} instances where D < 8)")
