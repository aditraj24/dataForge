import json
import numpy as np
from pathlib import Path
from collections import defaultdict
from scipy import stats

results_dir = Path('results')
results_dir.mkdir(parents=True, exist_ok=True)

with open(results_dir / 'raw_benchmark_results.json') as f:
    raw = json.load(f)

print(f"Loaded {len(raw)} raw evaluation records.")

# 1. Aggregate per seed and compute Mean, SD, Min, Max
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
            
            under_accs = [rec['under_budget_acc'] for rec in records if rec['under_budget_acc'] is not None]
            matched_accs = [rec['matched_budget_acc'] for rec in records if rec['matched_budget_acc'] is not None]
            over_accs = [rec['over_budget_acc'] for rec in records if rec['over_budget_acc'] is not None]
            
            agg_entry = {
                'task': task,
                'model': model,
                'k': k,
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
                
                'mean_under_budget_acc': float(np.mean(under_accs)) if under_accs else None,
                'mean_matched_budget_acc': float(np.mean(matched_accs)) if matched_accs else None,
                'mean_over_budget_acc': float(np.mean(over_accs)) if over_accs else None,
            }
            aggregated.append(agg_entry)
            
            pareto_data[task][model].append({
                'k': k,
                'latency_ms': float(np.mean(lats)),
                'flops': float(np.mean(flops)),
                'accuracy': float(np.mean(accs))
            })

with open(results_dir / 'aggregated_results.json', 'w') as f:
    json.dump(aggregated, f, indent=2)

# 2. Extract Strict Empirical Non-Dominated Pareto Frontiers
pareto_frontiers = {}
for task in pareto_data:
    pareto_frontiers[task] = {}
    for model in pareto_data[task]:
        pts = pareto_data[task][model]
        # Latency-based frontier
        sorted_by_lat = sorted(pts, key=lambda p: (p['latency_ms'], -p['accuracy']))
        lat_frontier = []
        max_acc = -1.0
        for p in sorted_by_lat:
            if p['accuracy'] > max_acc:
                lat_frontier.append(p)
                max_acc = p['accuracy']
                
        # FLOPs-based frontier
        sorted_by_flops = sorted(pts, key=lambda p: (p['flops'], -p['accuracy']))
        flops_frontier = []
        max_acc_flops = -1.0
        for p in sorted_by_flops:
            if p['accuracy'] > max_acc_flops:
                flops_frontier.append(p)
                max_acc_flops = p['accuracy']
                
        pareto_frontiers[task][model] = {
            'observed_points': pts,
            'latency_pareto_frontier': lat_frontier,
            'flops_pareto_frontier': flops_frontier
        }

with open(results_dir / 'pareto_frontiers.json', 'w') as f:
    json.dump(pareto_frontiers, f, indent=2)

# 3. Paired Statistical Testing across Seeds (n=5)
paired_stats = []
for task in ['task_a', 'task_b']:
    for k in [1, 2, 4, 8, 12, 16]:
        cot_accs = [r['accuracy'] for r in raw if r['task'] == task and r['model'] == 'AutoregressiveCoT' and r['k'] == k]
        latent_accs = [r['accuracy'] for r in raw if r['task'] == task and r['model'] == 'RecurrentLatentReasoner' and r['k'] == k]
        
        diffs = np.array(cot_accs) - np.array(latent_accs)
        mean_diff = float(np.mean(diffs))
        std_diff = float(np.std(diffs, ddof=1))
        
        t_stat, p_val = stats.ttest_rel(cot_accs, latent_accs)
        try:
            w_stat, w_pval = stats.wilcoxon(diffs)
        except Exception:
            w_stat, w_pval = None, None
            
        paired_stats.append({
            'task': task,
            'k': k,
            'cot_mean_acc': float(np.mean(cot_accs)),
            'latent_mean_acc': float(np.mean(latent_accs)),
            'mean_diff_cot_minus_latent': mean_diff,
            'std_diff': std_diff,
            't_stat': float(t_stat),
            'p_value': float(p_val),
            'wilcoxon_p_value': float(w_pval) if w_pval is not None else None
        })

with open(results_dir / 'statistical_comparison.json', 'w') as f:
    json.dump(paired_stats, f, indent=2)

# 4. Secondary Threshold Analysis
thresholds = [0.50, 0.60, 0.70, 0.80, 0.90]
threshold_results = {}
for task in pareto_data:
    threshold_results[task] = {}
    for model in pareto_data[task]:
        pts = sorted(pareto_data[task][model], key=lambda p: p['latency_ms'])
        t_entry = {}
        for tau in thresholds:
            qualifying = [p for p in pts if p['accuracy'] >= tau]
            if qualifying:
                min_pt = min(qualifying, key=lambda p: p['latency_ms'])
                t_entry[f"{int(tau*100)}%"] = {
                    'min_observed_latency_ms': min_pt['latency_ms'],
                    'min_observed_flops': min_pt['flops'],
                    'at_k': min_pt['k'],
                    'observed_accuracy': min_pt['accuracy']
                }
            else:
                t_entry[f"{int(tau*100)}%"] = "not reached"
        threshold_results[task][model] = t_entry

with open(results_dir / 'threshold_analysis.json', 'w') as f:
    json.dump(threshold_results, f, indent=2)

print("Statistical processing complete! Artifacts written to results/")
