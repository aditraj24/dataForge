"""
Test Suite for the ~5M Capacity-Scaling Experiment.
Verifies model instantiation, parameter counts, forward shapes,
checkpoint isolation, FLOP correctness, and baseline regression.
"""

import unittest
import torch
from torch.utils.data import DataLoader
from pathlib import Path

from models_cot_model import AutoregressiveCoT
from models_latent_model import RecurrentLatentReasoner
from data_generator import TaskAPermutationOrbit, collate_fn_pad, VOCAB_SIZE

# ── 5M architecture configuration ──
COT_5M_KWARGS = dict(d_model=544, nhead=4, num_layers=2, dim_feedforward=1168, max_len=96, vocab_size=24)
LATENT_5M_KWARGS = dict(d_model=544, nhead=4, dim_feedforward=1795, max_len=96, vocab_size=24)
EXPECTED_COT_PARAMS = 5000632
EXPECTED_LATENT_PARAMS = 5000635


class TestScaling5M(unittest.TestCase):
    """
tessts kay lyye d ~5M capacity-scaling experiment.
"""

    def test_01_cot_5m_instantiation(self):
        """
5M CoT maadal instantiates without error.
"""
        model = AutoregressiveCoT(**COT_5M_KWARGS)
        self.assertIsNotNone(model)

    def test_02_latent_5m_instantiation(self):
        """
5M Latent maadal instantiates without error.
"""
        model = RecurrentLatentReasoner(**LATENT_5M_KWARGS)
        self.assertIsNotNone(model)

    def test_03_cot_exact_parameter_count(self):
        """
CoT 5M has exactly 5,000,632 parmeters.
"""
        model = AutoregressiveCoT(**COT_5M_KWARGS)
        total = sum(p.numel() for p in model.parameters())
        self.assertEqual(total, EXPECTED_COT_PARAMS,
                         f"CoT 5M param count {total} != expected {EXPECTED_COT_PARAMS}")

    def test_04_latent_exact_parameter_count(self):
        """
Latent 5M has exactly 5,000,635 parmeters.
"""
        model = RecurrentLatentReasoner(**LATENT_5M_KWARGS)
        total = sum(p.numel() for p in model.parameters())
        self.assertEqual(total, EXPECTED_LATENT_PARAMS,
                         f"Latent 5M param count {total} != expected {EXPECTED_LATENT_PARAMS}")

    def test_05_parameter_matching(self):
        """
CoT aor Latent 5M differ by no more than 10 parmeters (<0.001%).
"""
        cot = AutoregressiveCoT(**COT_5M_KWARGS)
        latent = RecurrentLatentReasoner(**LATENT_5M_KWARGS)
        p_cot = sum(p.numel() for p in cot.parameters())
        p_lat = sum(p.numel() for p in latent.parameters())
        diff = abs(p_cot - p_lat)
        self.assertLessEqual(diff, 10, f"Parameter diff too large: {diff}")
        rel_diff = diff / max(p_cot, p_lat)
        self.assertLess(rel_diff, 0.01, f"Relative diff exceeds 1%: {rel_diff*100:.4f}%")

    def test_06_cot_forward_shapes(self):
        """
CoT 5M forward produces correct output shapes.
"""
        model = AutoregressiveCoT(**COT_5M_KWARGS)
        ds = TaskAPermutationOrbit(num_samples=8, min_depth=4, max_depth=8, seed=42)
        loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
        batch = next(iter(loader))
        full_ids = batch['full_ids']
        logits = model(full_ids)
        self.assertEqual(logits.shape[0], 4)
        self.assertEqual(logits.shape[2], VOCAB_SIZE)
        self.assertTrue(torch.isfinite(logits).all())

    def test_07_cot_generation(self):
        """
CoT 5M autoregressive generation works kay lyye all bjjets.
"""
        model = AutoregressiveCoT(**COT_5M_KWARGS)
        ds = TaskAPermutationOrbit(num_samples=8, min_depth=4, max_depth=8, seed=42)
        loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
        batch = next(iter(loader))
        for k in [1, 2, 4, 8, 12, 16]:
            res = model.generate(batch['input_ids'], max_budget_k=k)
            self.assertEqual(res['final_ans'].shape, (4,))
            self.assertLessEqual(res['tokens_generated'], k)

    def test_08_latent_recurrence(self):
        """
Latent 5M k-step recurrence produces correct shapes.
"""
        model = RecurrentLatentReasoner(**LATENT_5M_KWARGS)
        ds = TaskAPermutationOrbit(num_samples=8, min_depth=4, max_depth=8, seed=42)
        loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
        batch = next(iter(loader))
        for k in [1, 2, 4, 8, 12, 16]:
            res = model(batch['input_ids'], reasoning_steps=k, input_mask=batch['input_mask'])
            self.assertEqual(res['step_logits'].shape, (4, k, VOCAB_SIZE))
            self.assertTrue(torch.isfinite(res['step_logits']).all())

    def test_09_latent_infer(self):
        """
Latent 5M infer wapes dos correct shapes.
"""
        model = RecurrentLatentReasoner(**LATENT_5M_KWARGS)
        ds = TaskAPermutationOrbit(num_samples=8, min_depth=4, max_depth=8, seed=42)
        loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
        batch = next(iter(loader))
        res = model.infer(batch['input_ids'], budget_k=8, input_mask=batch['input_mask'])
        self.assertEqual(res['final_ans'].shape, (4,))
        self.assertEqual(res['steps_executed'], 8)

    def test_10_flop_calculation(self):
        """
FLOP calculations kay lyye 5M maadals use correct dimensions.
"""
        from run_benchmark_eval_5m import compute_analytical_flops_5m
        cot_flops = compute_analytical_flops_5m('cot', 1, 1)
        self.assertGreater(cot_flops, 0)
        lat_flops = compute_analytical_flops_5m('latent', 1, 1)
        self.assertGreater(lat_flops, 0)

        # 5M FLOPs should be significantly larger than 1M FLOPs
        from run_benchmark_eval_1m import compute_analytical_flops_1m
        cot_1m_flops = compute_analytical_flops_1m('cot', 1, 1)
        lat_1m_flops = compute_analytical_flops_1m('latent', 1, 1)
        self.assertGreater(cot_flops, cot_1m_flops * 4,
                           "5M CoT FLOPs should be significantly larger than 1M")
        self.assertGreater(lat_flops, lat_1m_flops * 4,
                           "5M Latent FLOPs should be significantly larger than 1M")

    def test_11_baseline_models_untouched(self):
        """
Baseline 126K aor 1M maadals retain exact parmeter counts.
"""
        cot_126k = AutoregressiveCoT()
        self.assertEqual(sum(p.numel() for p in cot_126k.parameters()), 126168)
        lat_126k = RecurrentLatentReasoner()
        self.assertEqual(sum(p.numel() for p in lat_126k.parameters()), 125688)

        from test_scaling_1m import COT_1M_KWARGS, LATENT_1M_KWARGS
        cot_1m = AutoregressiveCoT(**COT_1M_KWARGS)
        self.assertEqual(sum(p.numel() for p in cot_1m.parameters()), 998520)
        lat_1m = RecurrentLatentReasoner(**LATENT_1M_KWARGS)
        self.assertEqual(sum(p.numel() for p in lat_1m.parameters()), 998523)

    def test_12_simulation_lab_5m_registration(self):
        """
Simulation Lab maadalRegistry registers aor constructs 5M maadals.
"""
        from simulation_lab.models import ModelRegistry
        cot_5m = ModelRegistry.create_adapter('autoregressive_cot_5m')
        self.assertEqual(cot_5m.count_parameters()[0], EXPECTED_COT_PARAMS)
        lat_5m = ModelRegistry.create_adapter('recurrent_latent_5m')
        self.assertEqual(lat_5m.count_parameters()[0], EXPECTED_LATENT_PARAMS)


if __name__ == '__main__':
    unittest.main()
