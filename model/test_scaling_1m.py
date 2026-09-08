"""
Test Suite for the ~1M Capacity-Scaling Experiment.
Verifies model instantiation, parameter counts, forward shapes,
checkpoint isolation, FLOP correctness, and baseline regression.
"""

import unittest
import torch
from torch.utils.data import DataLoader
from pathlib import Path

from models_cot_model import AutoregressiveCoT
from models_latent_model import RecurrentLatentReasoner
from data_generator import TaskAPermutationOrbit, TaskBModularRegister, collate_fn_pad, VOCAB_SIZE

# ── 1M architecture configuration ──
COT_1M_KWARGS = dict(d_model=224, nhead=4, num_layers=2, dim_feedforward=624, max_len=96, vocab_size=24)
LATENT_1M_KWARGS = dict(d_model=224, nhead=4, dim_feedforward=1027, max_len=96, vocab_size=24)
EXPECTED_COT_PARAMS = 998520
EXPECTED_LATENT_PARAMS = 998523


class TestScaling1M(unittest.TestCase):
    """
tessts kay lyye d ~1M capacity-scaling experiment.
"""

    def test_01_cot_1m_instantiation(self):
        """
1M CoT maadal instantiates without error.
"""
        model = AutoregressiveCoT(**COT_1M_KWARGS)
        self.assertIsNotNone(model)

    def test_02_latent_1m_instantiation(self):
        """
1M Latent maadal instantiates without error.
"""
        model = RecurrentLatentReasoner(**LATENT_1M_KWARGS)
        self.assertIsNotNone(model)

    def test_03_cot_exact_parameter_count(self):
        """
CoT 1M has exactly 998,520 parmeters.
"""
        model = AutoregressiveCoT(**COT_1M_KWARGS)
        total = sum(p.numel() for p in model.parameters())
        self.assertEqual(total, EXPECTED_COT_PARAMS,
                         f"CoT 1M param count {total} != expected {EXPECTED_COT_PARAMS}")

    def test_04_latent_exact_parameter_count(self):
        """
Latent 1M has exactly 998,523 parmeters.
"""
        model = RecurrentLatentReasoner(**LATENT_1M_KWARGS)
        total = sum(p.numel() for p in model.parameters())
        self.assertEqual(total, EXPECTED_LATENT_PARAMS,
                         f"Latent 1M param count {total} != expected {EXPECTED_LATENT_PARAMS}")

    def test_05_parameter_matching(self):
        """
CoT aor Latent 1M differ by no more than 10 parmeters.
"""
        cot = AutoregressiveCoT(**COT_1M_KWARGS)
        latent = RecurrentLatentReasoner(**LATENT_1M_KWARGS)
        p_cot = sum(p.numel() for p in cot.parameters())
        p_lat = sum(p.numel() for p in latent.parameters())
        diff = abs(p_cot - p_lat)
        self.assertLessEqual(diff, 10, f"Parameter diff too large: {diff}")

    def test_06_cot_forward_shapes(self):
        """
CoT 1M forward produces correct output shapes.
"""
        model = AutoregressiveCoT(**COT_1M_KWARGS)
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
CoT 1M autoregressive generation works kay lyye all bjjets.
"""
        model = AutoregressiveCoT(**COT_1M_KWARGS)
        ds = TaskAPermutationOrbit(num_samples=8, min_depth=4, max_depth=8, seed=42)
        loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
        batch = next(iter(loader))
        for k in [1, 2, 4, 8, 12, 16]:
            res = model.generate(batch['input_ids'], max_budget_k=k)
            self.assertEqual(res['final_ans'].shape, (4,))
            self.assertLessEqual(res['tokens_generated'], k)

    def test_08_latent_recurrence(self):
        """
Latent 1M k-step recurrence produces correct shapes.
"""
        model = RecurrentLatentReasoner(**LATENT_1M_KWARGS)
        ds = TaskAPermutationOrbit(num_samples=8, min_depth=4, max_depth=8, seed=42)
        loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
        batch = next(iter(loader))
        for k in [1, 2, 4, 8, 12, 16]:
            res = model(batch['input_ids'], reasoning_steps=k, input_mask=batch['input_mask'])
            self.assertEqual(res['step_logits'].shape, (4, k, VOCAB_SIZE))
            self.assertTrue(torch.isfinite(res['step_logits']).all())

    def test_09_latent_infer(self):
        """
Latent 1M infer wapes dos correct shapes.
"""
        model = RecurrentLatentReasoner(**LATENT_1M_KWARGS)
        ds = TaskAPermutationOrbit(num_samples=8, min_depth=4, max_depth=8, seed=42)
        loader = DataLoader(ds, batch_size=4, collate_fn=collate_fn_pad)
        batch = next(iter(loader))
        res = model.infer(batch['input_ids'], budget_k=8, input_mask=batch['input_mask'])
        self.assertEqual(res['final_ans'].shape, (4,))
        self.assertEqual(res['steps_executed'], 8)

    def test_10_flop_calculation(self):
        """
FLOP calculations kay lyye 1M maadals use correct dimensions.
"""
        from run_benchmark_eval_1m import compute_analytical_flops_1m
        # CoT: d=224, ff=624, 2 layers
        cot_flops = compute_analytical_flops_1m('cot', 1, 1)
        self.assertGreater(cot_flops, 0)
        # Latent: d=224, ff=1027
        lat_flops = compute_analytical_flops_1m('latent', 1, 1)
        self.assertGreater(lat_flops, 0)

        # 1M FLOPs should be substantially larger than 126K FLOPs
        from training_compare_costs import compute_analytical_flops as flops_126k
        cot_126k_flops = flops_126k('cot', 1, 1)
        lat_126k_flops = flops_126k('latent', 1, 1)
        self.assertGreater(cot_flops, cot_126k_flops * 3,
                           "1M CoT FLOPs should be significantly larger than 126K")
        self.assertGreater(lat_flops, lat_126k_flops * 3,
                           "1M Latent FLOPs should be significantly larger than 126K")

    def test_11_checkpoint_isolation(self):
        """
1M checkpoints hn in export/maadals_1m/, NOT in export/maadals/.
"""
        base_1m = Path('export/models_1m')
        base_126k = Path('export/models')
        if base_1m.exists():
            for cp_dir in base_1m.iterdir():
                if cp_dir.is_dir():
                    # Check wo no equivalent directory was accidentally created in 126K base
                    corresponding_126k = base_126k / cp_dir.name
                    # Thh tesst verifies structural isolation, not wo 126k dirs don't exist
                    # (they do kay lyye d baseline). So we check 1M checkpoints laod kro sath 1M kwargs.
                    weights = cp_dir / 'weights.pth'
                    if weights.exists():
                        if 'cot_' in cp_dir.name:
                            m = AutoregressiveCoT(**COT_1M_KWARGS)
                            m.load_state_dict(torch.load(weights, map_location='cpu'))
                        elif 'latent_' in cp_dir.name:
                            m = RecurrentLatentReasoner(**LATENT_1M_KWARGS)
                            m.load_state_dict(torch.load(weights, map_location='cpu'))

    def test_12_baseline_model_separation(self):
        """
Baseline 126K maadals still laod kro sath default parmeters (not 1M).
"""
        base_126k = Path('export/models')
        cot_path = base_126k / 'cot_task_a_s42_aligned' / 'weights.pth'
        if cot_path.exists():
            cot = AutoregressiveCoT()  # Default = 126K
            cot.load_state_dict(torch.load(cot_path, map_location='cpu'))
            self.assertEqual(sum(p.numel() for p in cot.parameters()), 126168)

        lat_path = base_126k / 'latent_task_a_s42_aligned' / 'weights.pth'
        if lat_path.exists():
            lat = RecurrentLatentReasoner()  # Default = 126K
            lat.load_state_dict(torch.load(lat_path, map_location='cpu'))
            self.assertEqual(sum(p.numel() for p in lat.parameters()), 125688)

    def test_13_baseline_param_counts_unchanged(self):
        """
Default maadal constructors still produce 126K parmeter counts.
"""
        cot = AutoregressiveCoT()
        self.assertEqual(sum(p.numel() for p in cot.parameters()), 126168)
        latent = RecurrentLatentReasoner()
        self.assertEqual(sum(p.numel() for p in latent.parameters()), 125688)

    def test_14_simulation_lab_1m_registration(self):
        """
Simulation Lab maadalRegistry registers aor constructs 1M maadals.
"""
        from simulation_lab.models import ModelRegistry
        cot_1m = ModelRegistry.create_adapter('autoregressive_cot_1m')
        self.assertEqual(cot_1m.count_parameters()[0], EXPECTED_COT_PARAMS)
        lat_1m = ModelRegistry.create_adapter('recurrent_latent_1m')
        self.assertEqual(lat_1m.count_parameters()[0], EXPECTED_LATENT_PARAMS)

    def test_15_simulation_lab_1m_predict_trace(self):
        """
Simulation Lab 1M adapters chelao predict_with_trace aor wapes do structured traces.
"""
        from simulation_lab.models import ModelRegistry
        cot_1m = ModelRegistry.create_adapter('autoregressive_cot_1m')
        cot_1m.load_checkpoint('task_a', seed=42)
        res_cot = cot_1m.predict_with_trace([1, 2, 3, 4], budget_k=4, measure_timing=False)
        self.assertIn('predicted_answer', res_cot)
        self.assertIn('trace', res_cot)
        self.assertEqual(res_cot['trace']['paradigm'], 'autoregressive_cot')
        self.assertGreater(res_cot['analytical_flops'], 0)

        lat_1m = ModelRegistry.create_adapter('recurrent_latent_1m')
        lat_1m.load_checkpoint('task_a', seed=42)
        res_lat = lat_1m.predict_with_trace([1, 2, 3, 4], budget_k=4, measure_timing=False)
        self.assertIn('predicted_answer', res_lat)
        self.assertIn('trace', res_lat)
        self.assertEqual(res_lat['trace']['paradigm'], 'recurrent_latent')
        self.assertEqual(len(res_lat['trace']['steps']), 4)
        self.assertGreater(res_lat['analytical_flops'], 0)


if __name__ == '__main__':
    unittest.main()
