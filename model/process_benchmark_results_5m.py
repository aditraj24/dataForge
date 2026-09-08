"""
~5M Capacity-Scaling Experiment — Result Processing & Analysis
==============================================================
Processes raw 5M benchmark results into aggregated statistics,
Pareto frontiers, paired statistical tests, and threshold analysis.

Reads from results_5m/raw_benchmark_results.json.
Writes to results_5m/{aggregated,pareto,statistical,threshold,RESULTS_5M.md}.
"""

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import json
import numpy as np
from pathlib import Path
from collections import defaultdict
from scipy import stats
from plot_pareto_frontiers_5m import generate_pareto_plots

RESULTS_DIR = Path('results_5m')
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

with open(RESULTS_DIR / 'raw_benchmark_results.json') as f:
    raw = json.load(f)

print(f"Loaded {len(raw)} raw 5M evaluation records.")

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
                'scale': '5m',
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
                'latency_ms': float(np.mean(lats)),
                'flops': float(np.mean(flops)),
                'accuracy': float(np.mean(accs))
            })

with open(RESULTS_DIR / 'aggregated_results.json', 'w') as f:
    json.dump(aggregated, f, indent=2)

# ── 2. Pareko Frontiers ─────────────────────────────────────────────────
pareto_frontiers = {}
for task in pareto_data:
    pareto_frontiers[task] = {}
    for model in pareto_data[task]:
        pts = pareto_data[task][model]
        # deri-based frontier
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

with open(RESULTS_DIR / 'pareto_frontiers.json', 'w') as f:
    json.dump(pareto_frontiers, f, indent=2)

# ── 3. Statistical Comparison ───────────────────────────────────────────
paired_stats = []
for task in ['task_a', 'task_b']:
    for k in [1, 2, 4, 8, 12, 16]:
        cot_accs = [r['accuracy'] for r in raw if r['task'] == task and r['model'] == 'cot' and r['k'] == k]
        latent_accs = [r['accuracy'] for r in raw if r['task'] == task and r['model'] == 'latent' and r['k'] == k]

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
            'scale': '5m',
            'cot_mean_acc': float(np.mean(cot_accs)),
            'latent_mean_acc': float(np.mean(latent_accs)),
            'mean_diff_cot_minus_latent': mean_diff,
            'std_diff': std_diff,
            't_stat': float(t_stat),
            'p_value': float(p_val),
            'wilcoxon_p_value': float(w_pval) if w_pval is not None else None
        })

with open(RESULTS_DIR / 'statistical_comparison.json', 'w') as f:
    json.dump(paired_stats, f, indent=2)

# ── 4. Threshold Analysh ───────────────────────────────────────────────
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

with open(RESULTS_DIR / 'threshold_analysis.json', 'w') as f:
    json.dump(threshold_results, f, indent=2)

# ── 5. Human-Readable Report ────────────────────────────────────────────
report_lines = []
report_lines.append("# Results — 5M Capacity-Scaling Experiment")
report_lines.append("")
report_lines.append("## Architecture")
report_lines.append("| Model | d_model | num_layers | dim_feedforward | Parameters |")
report_lines.append("|-------|---------|------------|-----------------|------------|")
report_lines.append("| AutoregressiveCoT (5M) | 544 | 2 | 1,168 | 5,000,632 |")
report_lines.append("| RecurrentLatentReasoner (5M) | 544 | — | 1,795 | 5,000,635 |")
report_lines.append(f"| Parameter difference | | | | 3 (0.000060%) |")
report_lines.append("")

for task in ['task_a', 'task_b']:
    task_label = "Task A: Permutation Orbit Traversal" if task == 'task_a' else "Task B: Modular Register Arithmetic"
    report_lines.append(f"## {task_label}")
    report_lines.append("")
    report_lines.append("| k | CoT Mean Acc | CoT SEM | Latent Mean Acc | Latent SEM | CoT Latency (ms) | Latent Latency (ms) | p-value (paired t) |")
    report_lines.append("|---|---|---|---|---|---|---|---|")

    for k in [1, 2, 4, 8, 12, 16]:
        cot_entry = [e for e in aggregated if e['task'] == task and e['k'] == k and e['model'] == 'cot'][0]
        lat_entry = [e for e in aggregated if e['task'] == task and e['k'] == k and e['model'] == 'latent'][0]
        stat_entry = [s for s in paired_stats if s['task'] == task and s['k'] == k][0]
        report_lines.append(
            f"| {k} | {cot_entry['mean_accuracy']:.4f} | ±{cot_entry['sem_accuracy']:.4f} | "
            f"{lat_entry['mean_accuracy']:.4f} | ±{lat_entry['sem_accuracy']:.4f} | "
            f"{cot_entry['mean_latency_ms']:.3f} | {lat_entry['mean_latency_ms']:.3f} | "
            f"{stat_entry['p_value']:.4f} |"
        )
    report_lines.append("")

# Per-seed detail
report_lines.append("## Per-Seed sahi Detail")
report_lines.append("")
for task in ['task_a', 'task_b']:
    task_label = "Task A" if task == 'task_a' else "Task B"
    report_lines.append(f"### {task_label}")
    report_lines.append("")
    report_lines.append("| Model | k | s42 | s43 | s44 | s45 | s46 |")
    report_lines.append("|---|---|---|---|---|---|---|")
    for entry in aggregated:
        if entry['task'] != task:
            continue
        accs = entry['per_seed_accuracy']
        report_lines.append(
            f"| {entry['model']} | {entry['k']} | "
            f"{accs[0]:.4f} | {accs[1]:.4f} | {accs[2]:.4f} | {accs[3]:.4f} | {accs[4]:.4f} |"
        )
    report_lines.append("")

report_lines.append("## Threshold Analysis")
report_lines.append("")
report_lines.append("Minimum budget k required to reach accuracy thresholds (mean across seeds):")
report_lines.append("")
with open(RESULTS_DIR / 'threshold_analysis.json') as f:
    thresh = json.load(f)
for task in thresh:
    task_label = "Task A" if task == 'task_a' else "Task B"
    report_lines.append(f"### {task_label}")
    for model in thresh[task]:
        report_lines.append(f"**{model}**:")
        for pct, val in thresh[task][model].items():
            if val == "not reached":
                report_lines.append(f"  - {pct}: not reached")
            else:
                report_lines.append(f"  - {pct}: k={val['at_k']} (accuracy={val['observed_accuracy']:.4f}, latency={val['min_observed_latency_ms']:.3f}ms)")
        report_lines.append("")

report_md = "\n".join(report_lines)
with open(RESULTS_DIR / 'RESULTS_5M.md', 'w', encoding='utf-8') as f:
    f.write(report_md)

print("Generating Pareto frontier plots...")
generate_pareto_plots(RESULTS_DIR)

print("Statistical processing complete! Artifacts written to results_5m/")
print(f"Files: aggregated_results.json, pareto_frontiers.json, statistical_comparison.json, threshold_analysis.json, RESULTS_5M.md, pareto_frontier_plots.png")
