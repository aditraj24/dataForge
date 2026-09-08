"""
Plotting module for the 5M Capacity-Scaling Experiment.
Generates results_5m/pareto_frontier_plots.png displaying:
- Task A Accuracy vs. Wall-Clock Latency (ms)
- Task A Accuracy vs. Analytical FLOPs
- Task B Accuracy vs. Wall-Clock Latency (ms)
- Task B Accuracy vs. Analytical FLOPs
"""

import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

def generate_pareto_plots(results_dir='results_5m'):
    results_path = Path(results_dir)
    with open(results_path / 'pareto_frontiers.json') as f:
        frontiers = json.load(f)

    fig, axes = plt.subplots(2, 2, figsize=(18, 10), dpi=300)
    plt.subplots_adjust(hspace=0.3, wspace=0.25)

    # Style configuration
    cot_color = '#1f77b4'       # Blue
    latent_color = '#d62728'    # Red
    cot_frontier_color = '#0b559f'
    latent_frontier_color = '#a01515'

    tasks = [('task_a', 'Task A: Permutation Orbit Traversal', 0),
             ('task_b', 'Task B: Modular Register Arithmetic', 1)]

    for task_key, task_title, row in tasks:
        task_data = frontiers[task_key]

        # ── Column 0: sahi vs deri ──
        ax_lat = axes[row, 0]
        
        # Plot CoT observed
        cot_obs = task_data['cot']['observed_points']
        cot_lats = [p['latency_ms'] for p in cot_obs]
        cot_accs = [p['accuracy'] for p in cot_obs]
        cot_ks = [p['k'] for p in cot_obs]
        ax_lat.plot(cot_lats, cot_accs, 'o-', color=cot_color, label='CoT (5M)', markersize=7, alpha=0.8)
        for k, x, y in zip(cot_ks, cot_lats, cot_accs):
            ax_lat.annotate(f'k={k}', (x, y), textcoords="offset points", xytext=(0, 6), ha='center', fontsize=8, color=cot_color)

        # Plot CoT Pareto
        cot_front = task_data['cot']['latency_pareto_frontier']
        if len(cot_front) > 1:
            fx = [p['latency_ms'] for p in cot_front]
            fy = [p['accuracy'] for p in cot_front]
            ax_lat.step(fx, fy, where='post', color=cot_frontier_color, linestyle='--', alpha=0.6, label='CoT Pareto Frontier')

        # Plot Latent observed
        lat_obs = task_data['latent']['observed_points']
        lat_lats = [p['latency_ms'] for p in lat_obs]
        lat_accs = [p['accuracy'] for p in lat_obs]
        lat_ks = [p['k'] for p in lat_obs]
        ax_lat.plot(lat_lats, lat_accs, 's-', color=latent_color, label='Latent (5M)', markersize=7, alpha=0.8)
        for k, x, y in zip(lat_ks, lat_lats, lat_accs):
            ax_lat.annotate(f'k={k}', (x, y), textcoords="offset points", xytext=(0, -12), ha='center', fontsize=8, color=latent_color)

        # Plot Latent Pareto
        lat_front = task_data['latent']['latency_pareto_frontier']
        if len(lat_front) > 1:
            fx = [p['latency_ms'] for p in lat_front]
            fy = [p['accuracy'] for p in lat_front]
            ax_lat.step(fx, fy, where='post', color=latent_frontier_color, linestyle='--', alpha=0.6, label='Latent Pareto Frontier')

        ax_lat.set_title(f'{task_title} — Accuracy vs. Latency', fontsize=12, fontweight='bold')
        ax_lat.set_xlabel('Mean Wall-Clock Latency (ms / instance)', fontsize=10)
        ax_lat.set_ylabel('Accuracy', fontsize=10)
        ax_lat.set_ylim(-0.05, 1.05)
        ax_lat.grid(True, linestyle=':', alpha=0.6)
        ax_lat.legend(loc='best', fontsize=9)

        # ── Column 1: sahi vs FLOPs ──
        ax_flops = axes[row, 1]

        # Plot CoT observed
        cot_flops = [p['flops'] for p in cot_obs]
        ax_flops.plot(cot_flops, cot_accs, 'o-', color=cot_color, label='CoT (5M)', markersize=7, alpha=0.8)
        for k, x, y in zip(cot_ks, cot_flops, cot_accs):
            ax_flops.annotate(f'k={k}', (x, y), textcoords="offset points", xytext=(0, 6), ha='center', fontsize=8, color=cot_color)

        # Plot CoT Pareko FLOPs
        cot_ffront = task_data['cot']['flops_pareto_frontier']
        if len(cot_ffront) > 1:
            fx = [p['flops'] for p in cot_ffront]
            fy = [p['accuracy'] for p in cot_ffront]
            ax_flops.step(fx, fy, where='post', color=cot_frontier_color, linestyle='--', alpha=0.6, label='CoT Pareto Frontier')

        # Plot Latent observed
        lat_flops = [p['flops'] for p in lat_obs]
        ax_flops.plot(lat_flops, lat_accs, 's-', color=latent_color, label='Latent (5M)', markersize=7, alpha=0.8)
        for k, x, y in zip(lat_ks, lat_flops, lat_accs):
            ax_flops.annotate(f'k={k}', (x, y), textcoords="offset points", xytext=(0, -12), ha='center', fontsize=8, color=latent_color)

        # Plot Latent Pareko FLOPs
        lat_ffront = task_data['latent']['flops_pareto_frontier']
        if len(lat_ffront) > 1:
            fx = [p['flops'] for p in lat_ffront]
            fy = [p['accuracy'] for p in lat_ffront]
            ax_flops.step(fx, fy, where='post', color=latent_frontier_color, linestyle='--', alpha=0.6, label='Latent Pareto Frontier')

        ax_flops.set_title(f'{task_title} — Accuracy vs. Analytical FLOPs', fontsize=12, fontweight='bold')
        ax_flops.set_xlabel('Analytical FLOPs (MAC × 2)', fontsize=10)
        ax_flops.set_ylabel('Accuracy', fontsize=10)
        ax_flops.set_ylim(-0.05, 1.05)
        ax_flops.grid(True, linestyle=':', alpha=0.6)
        ax_flops.legend(loc='best', fontsize=9)

    fig.suptitle('~5M Capacity-Scaling Experiment: Cost-Accuracy Pareto Frontiers\n'
                 'CoT (5,000,632 params) vs. Latent (5,000,635 params) across Budgets k={1,2,4,8,12,16}',
                 fontsize=14, fontweight='bold', y=0.98)

    out_file = results_path / 'pareto_frontier_plots.png'
    plt.savefig(out_file, bbox_inches='tight')
    plt.close()
    print(f"[OK] Pareto plots saved to {out_file}")

if __name__ == '__main__':
    generate_pareto_plots()
