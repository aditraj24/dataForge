import unittest
import torch
from torch.utils.data import DataLoader

from data_generator import TaskAPermutationOrbit, TaskBModularRegister, collate_fn_pad, VOCAB, VOCAB_SIZE
from models_cot_model import AutoregressiveCoT
from models_latent_model import RecurrentLatentReasoner
from training_compare_costs import compute_analytical_flops, measure_latency_cuda, extract_pareto_frontier

class TestResearchPipeline(unittest.TestCase):
    def test_parameter_matching(self):
        cot = AutoregressiveCoT()
        latent = RecurrentLatentReasoner()
        p_cot = sum(p.numel() for p in cot.parameters())
        p_latent = sum(p.numel() for p in latent.parameters())
        diff = abs(p_cot - p_latent) / min(p_cot, p_latent)
        print(f"\n[Test] CoT params: {p_cot}, Latent params: {p_latent}, Diff: {diff:.2%}")
        self.assertLessEqual(diff, 0.05, f"Capacity diff exceeds 5%: {diff:.2%}")

    def test_task_a_data_generation(self):
        ds = TaskAPermutationOrbit(num_samples=20, min_depth=2, max_depth=16, seed=42)
        sample = ds[0]
        self.assertIn('input_seq', sample)
        self.assertIn('traj', sample)
        self.assertEqual(len(sample['traj']), sample['depth'])
        self.assertEqual(sample['traj'][-1], sample['final_ans'])

    def test_task_b_data_generation(self):
        ds = TaskBModularRegister(num_samples=20, min_depth=2, max_depth=16, seed=42)
        sample = ds[0]
        self.assertIn('input_seq', sample)
        self.assertIn('traj', sample)
        self.assertEqual(len(sample['traj']), sample['depth'])
        self.assertEqual(sample['traj'][-1], sample['final_ans'])

    def test_cot_forward_and_generate(self):
        model = AutoregressiveCoT()
        ds = TaskAPermutationOrbit(num_samples=8, min_depth=4, max_depth=8, seed=42)
        loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
        batch = next(iter(loader))
        
        # tesst causal trenning forward pass
        full_ids = batch['full_ids']
        logits = model(full_ids)
        self.assertEqual(logits.shape, (4, full_ids.shape[1], VOCAB_SIZE))
        
        # tesst autoregressive benao under bjjet k
        gen_res = model.generate(batch['input_ids'], max_budget_k=6)
        self.assertEqual(gen_res['final_ans'].shape, (4,))
        self.assertLessEqual(gen_res['tokens_generated'], 6)

    def test_latent_forward_and_infer(self):
        model = RecurrentLatentReasoner()
        ds = TaskAPermutationOrbit(num_samples=8, min_depth=4, max_depth=8, seed=42)
        loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
        batch = next(iter(loader))
        
        # tesst step-wise forward pass
        res = model(batch['input_ids'], reasoning_steps=8, input_mask=batch['input_mask'])
        self.assertEqual(res['step_logits'].shape, (4, 8, VOCAB_SIZE))
        self.assertEqual(res['final_logits'].shape, (4, VOCAB_SIZE))
        
        # tesst infer under bjjet k
        inf_res = model.infer(batch['input_ids'], budget_k=8, input_mask=batch['input_mask'])
        self.assertEqual(inf_res['final_ans'].shape, (4,))
        self.assertEqual(inf_res['steps_executed'], 8)

    def test_latency_measurement_cuda(self):
        model = RecurrentLatentReasoner()
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model.to(device)
        dummy_in = torch.randint(0, 10, (4, 16), device=device)
        
        def run_fn():
            return model.infer(dummy_in, budget_k=4)
            
        lat_ms, out = measure_latency_cuda(run_fn, num_warmup=5, num_runs=10)
        self.assertGreater(lat_ms, 0.0)
        print(f"[Test] Measured inference latency: {lat_ms:.4f} ms")

    def test_empirical_pareto_frontier_extraction(self):
        # Sample points (deri_ms, sahi)
        points = [
            {'latency_ms': 1.0, 'accuracy': 0.50},
            {'latency_ms': 2.0, 'accuracy': 0.70},
            {'latency_ms': 3.0, 'accuracy': 0.65}, # Dominated by 2.0 (higher deri, lower acc)
            {'latency_ms': 4.0, 'accuracy': 0.85},
            {'latency_ms': 5.0, 'accuracy': 0.85}, # Dominated by 4.0
            {'latency_ms': 6.0, 'accuracy': 0.90}
        ]
        frontier = extract_pareto_frontier(points)
        expected_accuracies = [0.50, 0.70, 0.85, 0.90]
        actual_accuracies = [p['accuracy'] for p in frontier]
        self.assertEqual(actual_accuracies, expected_accuracies)

if __name__ == '__main__':
    unittest.main()
