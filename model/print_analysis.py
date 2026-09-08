import json

with open('results/aggregated_results.json') as f:
    agg = json.load(f)

with open('results/statistical_comparison.json') as f:
    stats_list = json.load(f)

with open('results/pareto_frontiers.json') as f:
    frontiers = json.load(f)

with open('results/threshold_analysis.json') as f:
    thresholds = json.load(f)

print('=== TASK A (Permutation Orbit) AGGREGATED SUMMARY ===')
for x in agg:
    if x['task'] == 'task_a':
        m_name = x['model']
        k = x['k']
        acc = x['mean_accuracy'] * 100
        sem = x['sem_accuracy'] * 100
        lat = x['mean_latency_ms']
        flops = x['mean_flops']
        u_acc = x['mean_under_budget_acc'] * 100 if x['mean_under_budget_acc'] is not None else 0.0
        o_acc = x['mean_over_budget_acc'] * 100 if x['mean_over_budget_acc'] is not None else 0.0
        print(f"{m_name:25s} | k={k:2d} | Acc: {acc:5.2f}% +- {sem:4.2f}% | Lat: {lat:.2f}ms | FLOPs: {flops:8.0f} | Under: {u_acc:5.2f}% | Over: {o_acc:5.2f}%")

print('\n=== TASK B (Modular Registers) AGGREGATED SUMMARY ===')
for x in agg:
    if x['task'] == 'task_b':
        m_name = x['model']
        k = x['k']
        acc = x['mean_accuracy'] * 100
        sem = x['sem_accuracy'] * 100
        lat = x['mean_latency_ms']
        flops = x['mean_flops']
        u_acc = x['mean_under_budget_acc'] * 100 if x['mean_under_budget_acc'] is not None else 0.0
        o_acc = x['mean_over_budget_acc'] * 100 if x['mean_over_budget_acc'] is not None else 0.0
        print(f"{m_name:25s} | k={k:2d} | Acc: {acc:5.2f}% +- {sem:4.2f}% | Lat: {lat:.2f}ms | FLOPs: {flops:8.0f} | Under: {u_acc:5.2f}% | Over: {o_acc:5.2f}%")

print('\n=== PAIRED T-TESTS (n=5 independent seeds) ===')
for s in stats_list:
    task = s['task']
    k = s['k']
    c_acc = s['cot_mean_acc'] * 100
    l_acc = s['latent_mean_acc'] * 100
    diff = s['mean_diff_cot_minus_latent'] * 100
    t_stat = s['t_stat']
    p_val = s['p_value']
    sig = '***' if p_val < 0.001 else '**' if p_val < 0.01 else '*' if p_val < 0.05 else 'ns'
    print(f"{task:6s} k={k:2d} | CoT: {c_acc:5.2f}% vs Latent: {l_acc:5.2f}% | Diff: {diff:+6.2f}% | t={t_stat:6.2f} | p={p_val:.4f} ({sig})")

print('\n=== EMPIRICAL NON-DOMINATED PARETO FRONTIERS ===')
for task in frontiers:
    print(f"\n--- {task.upper()} ---")
    for model in frontiers[task]:
        print(f"Model: {model}")
        f_pts = frontiers[task][model]['latency_pareto_frontier']
        for p in f_pts:
            print(f"  k={p['k']:2d} -> Latency: {p['latency_ms']:.2f} ms | Accuracy: {p['accuracy']*100:.2f}% | FLOPs: {p['flops']:.0f}")

print('\n=== SECONDARY THRESHOLD ANALYSIS ===')
print(json.dumps(thresholds, indent=2))
