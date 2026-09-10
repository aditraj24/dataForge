import torch
from torch.utils.data import DataLoader
from models_cot_model import AutoregressiveCoT
from models_latent_model import RecurrentLatentReasoner
from data_generator import TaskAPermutationOrbit, collate_fn_pad
from training_compare_costs import evaluate_model_at_budget, extract_pareto_frontier

device = 'cuda' if torch.cuda.is_available() else 'cpu'

# laod kro trained smoke models
cot = AutoregressiveCoT().to(device)
cot.load_state_dict(torch.load('export/models/cot_task_a_s42_aligned/weights.pth'))

latent = RecurrentLatentReasoner().to(device)
latent.load_state_dict(torch.load('export/models/latent_task_a_s42_aligned/weights.pth'))

test_ds = TaskAPermutationOrbit(num_samples=32, min_depth=2, max_depth=16, seed=999)
loader = DataLoader(test_ds, batch_size=16, collate_fn=collate_fn_pad)

cot_pts = []
latent_pts = []

for k in [2, 4, 8]:
    res_c = evaluate_model_at_budget(cot, 'cot', loader, budget_k=k, device=device)
    cot_pts.append(res_c)
    res_l = evaluate_model_at_budget(latent, 'latent', loader, budget_k=k, device=device)
    latent_pts.append(res_l)

print('CoT Points:', [(p['budget_k'], f"{p['latency_ms']:.2f}ms", f"{p['accuracy']:.2%}") for p in cot_pts])
print('Latent Points:', [(p['budget_k'], f"{p['latency_ms']:.2f}ms", f"{p['accuracy']:.2%}") for p in latent_pts])

frontier_c = extract_pareto_frontier(cot_pts)
frontier_l = extract_pareto_frontier(latent_pts)
print('CoT Pareto Frontier:', [(p['budget_k'], f"{p['latency_ms']:.2f}ms", f"{p['accuracy']:.2%}") for p in frontier_c])
print('Latent Pareto Frontier:', [(p['budget_k'], f"{p['latency_ms']:.2f}ms", f"{p['accuracy']:.2%}") for p in frontier_l])
print('Benchmark evaluation pipeline verified successfully!')
