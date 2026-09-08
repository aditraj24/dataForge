"""
~5M Capacity-Scaling Recovery Experiment — Result Processing & Analysis
======================================================================
Processes raw 5M recovery benchmark results into aggregated statistics,
Pareto frontiers, paired statistical tests, and threshold analysis.

Reads from results_5m_recovery/raw_benchmark_results.json.
Writes to results_5m_recovery/{aggregated,pareto,statistical,threshold}.json.
"""

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)
import json
import numpy as np
from pathlib import Path
from collections import defaultdict
from scipy import stats

RESULTS_DIR = Path('results_5m_recovery')
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

with open(RESULTS_DIR / 'raw_benchmark_results.json') as f:
    raw = json.load(f)

print(f"Loaded {len(raw)} raw 5M recovery evaluation records.")

# ── 1. Aggregate per seed ────────────────────────────────────────────────
grouped = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

for r in raw:
    task = r['task']
    model = r['model']
    k = r['k']
    grouped[task][model][k].append(r)

aggregated = []
pareto_data = {}

for task, models in grouped.items():
    pareto_data[task] = {}
    for model, k_dict in models.items():
        pareto_data[task][model] = []
        for k, records in sorted(k_dict.items()):
            accs = [rec['accuracy'] for rec in records]
            lats = [rec['latency_ms'] for rec in records]
            flops = [rec['analytical_flops'] for rec in records]

            agg_entry = {
                'task': task,
                'model': model,
                'k': k,
                'scale': '5m_recovery',
                'seeds': [rec['seed'] for rec in records],
                'per_seed_accuracy': accs,
                'mean_accuracy': float(np.mean(accs)),
                'std_accuracy': float(np.std(accs, ddof=1)),
                'min_accuracy': float(np.min(accs)),
                'max_accuracy': float(np.max(accs)),
                'sem_accuracy': float(np.std(accs, ddof=1) / np.sqrt(len(accs))),

                'per_seed_latency_ms': lats,
                'mean_latency_ms': float(np.mean(lats)),
                'std_latency_ms': float(np.std(lats, ddof=1)),

                'per_seed_flops': flops,
                'mean_flops': float(np.mean(flops)),
            }
            aggregated.append(agg_entry)
            pareto_data[task][model].append({
                'k': k,
                'mean_accuracy': float(np.mean(accs)),
                'std_accuracy': float(np.std(accs, ddof=1)),
                'mean_latency_ms': float(np.mean(lats)),
                'mean_flops': float(np.mean(flops))
            })

with open(RESULTS_DIR / 'aggregated_results.json', 'w') as f:
    json.dump(aggregated, f, indent=2)

with open(RESULTS_DIR / 'pareto_frontiers.json', 'w') as f:
    json.dump(pareto_data, f, indent=2)

# ── 2. Statistical tessts: Paired t-tessts between CoT aor Latent at each k ──
statistical_results = {}
for task in ['task_a', 'task_b']:
    statistical_results[task] = {}
    for k in [1, 2, 4, 8, 12, 16]:
        cot_accs = [r['accuracy'] for r in grouped[task]['cot'][k]]
        lat_accs = [r['accuracy'] for r in grouped[task]['latent'][k]]

        t_stat, p_val = stats.ttest_rel(cot_accs, lat_accs)
        diff = np.array(cot_accs) - np.array(lat_accs)
        d_val = float(np.mean(diff) / np.std(diff, ddof=1)) if np.std(diff, ddof=1) > 0 else 0.0

        statistical_results[task][f'k_{k}'] = {
            'cot_mean': float(np.mean(cot_accs)),
            'latent_mean': float(np.mean(lat_accs)),
            'mean_diff': float(np.mean(diff)),
            't_statistic': float(t_stat) if not np.isnan(t_stat) else 0.0,
            'p_value': float(p_val) if not np.isnan(p_val) else 1.0,
            'cohens_d': d_val,
            'statistically_significant': bool(p_val < 0.05) if not np.isnan(p_val) else False
        }

with open(RESULTS_DIR / 'statistical_tests.json', 'w') as f:
    json.dump(statistical_results, f, indent=2)

# ── 3. Threshold Analysh ────────────────────────────────────────────────
thresholds = [0.10, 0.25, 0.50, 0.70, 0.80]
threshold_results = {}
for task in ['task_a', 'task_b']:
    threshold_results[task] = {}
    for model in ['cot', 'latent']:
        threshold_results[task][model] = {}
        for th in thresholds:
            achieved = False
            achieved_k = None
            for p in pareto_data[task][model]:
                if p['mean_accuracy'] >= th:
                    achieved = True
                    achieved_k = p['k']
                    break
            threshold_results[task][model][f'threshold_{int(th*100)}%'] = {
                'achieved': achieved,
                'min_k_needed': achieved_k
            }

with open(RESULTS_DIR / 'threshold_analysis.json', 'w') as f:
    json.dump(threshold_results, f, indent=2)

print("[OK] Results processed successfully:")
print(f"  -> {RESULTS_DIR / 'aggregated_results.json'}")
print(f"  -> {RESULTS_DIR / 'pareto_frontiers.json'}")
print(f"  -> {RESULTS_DIR / 'statistical_tests.json'}")
print(f"  -> {RESULTS_DIR / 'threshold_analysis.json'}")
