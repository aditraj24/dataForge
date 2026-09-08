"""
tst krny wali file FastAPI backed ki.
ssab chk krtee hy k endpoints chalra hy ya nai.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app


class TestThinkingBudgetAPI(unittest.TestCase):
    """intgrastion test h fastappi k liye."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "thinking-budget-api")
        self.assertIn("device_info", data)
        self.assertIn("device_type", data["device_info"])

    def test_models_endpoint(self):
        response = self.client.get("/api/models")
        self.assertEqual(response.status_code, 200)
        models = response.json()
        self.assertGreaterEqual(len(models), 7)
        model_ids = {m["model_id"] for m in models}
        self.assertIn("autoregressive_cot", model_ids)
        self.assertIn("recurrent_latent", model_ids)
        self.assertIn("hebbian_synaptic", model_ids)
        self.assertIn("autoregressive_cot_1m", model_ids)
        self.assertIn("recurrent_latent_1m", model_ids)
        self.assertIn("autoregressive_cot_5m", model_ids)
        self.assertIn("recurrent_latent_5m", model_ids)

    def test_tasks_endpoint(self):
        response = self.client.get("/api/tasks")
        self.assertEqual(response.status_code, 200)
        tasks = response.json()
        task_ids = {t["task_id"] for t in tasks}
        self.assertIn("permutation_orbit", task_ids)
        self.assertIn("modular_register", task_ids)
        self.assertIn("associative", task_ids)

    def test_scales_endpoint(self):
        response = self.client.get("/api/scales")
        self.assertEqual(response.status_code, 200)
        scales = response.json()
        scale_ids = {s["scale_id"] for s in scales}
        self.assertIn("126k", scale_ids)
        self.assertIn("1m", scale_ids)
        self.assertIn("5m_recovery", scale_ids)
        self.assertIn("5m_original", scale_ids)

        # chkk maroo 5m recovvry asllli hy ki nahi
        recovery = next(s for s in scales if s["scale_id"] == "5m_recovery")
        self.assertTrue(recovery["is_authoritative"])
        orig = next(s for s in scales if s["scale_id"] == "5m_original")
        self.assertFalse(orig["is_authoritative"])

    def test_generate_example(self):
        payload = {"task": "permutation_orbit", "depth": 4, "seed": 42}
        response = self.client.post("/api/examples", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["task_name"], "permutation_orbit")
        self.assertEqual(data["depth"], 4)
        self.assertEqual(len(data["input_ids"]), 13)
        self.assertIsInstance(data["expected_answer"], int)
        self.assertEqual(len(data["ground_truth_trajectory"]), 4)

    def test_simulate_cot_success(self):
        payload = {
            "model": "autoregressive_cot",
            "task": "permutation_orbit",
            "budget_k": 4,
            "seed": 42,
            "depth": 4
        }
        response = self.client.post("/api/simulate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["model_id"], "autoregressive_cot")
        self.assertEqual(data["paradigm"], "autoregressive_cot")
        self.assertEqual(data["budget_k"], 4)
        self.assertIn("trace", data)
        self.assertIn("latency_ms", data)
        self.assertIn("analytical_flops", data)
        self.assertGreater(data["analytical_flops"], 0)

    def test_simulate_latent_success(self):
        payload = {
            "model": "recurrent_latent",
            "task": "permutation_orbit",
            "budget_k": 4,
            "seed": 42,
            "depth": 4
        }
        response = self.client.post("/api/simulate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["model_id"], "recurrent_latent")
        self.assertEqual(data["paradigm"], "recurrent_latent")
        self.assertEqual(data["budget_k"], 4)
        self.assertIn("steps", data["trace"])
        self.assertEqual(len(data["trace"]["steps"]), 4)

    def test_simulate_invalid_budget_rejected(self):
        payload = {
            "model": "autoregressive_cot",
            "task": "permutation_orbit",
            "budget_k": 7,  # nai he list mien
            "seed": 42
        }
        response = self.client.post("/api/simulate", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_compare_guarantees_same_instance(self):
        payload = {
            "models": ["cot", "latent"],
            "task": "permutation_orbit",
            "budget_k": 2,
            "seed": 42,
            "depth": 5
        }
        response = self.client.post("/api/compare", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("task_example", data)
        self.assertEqual(len(data["models_evaluated"]), 2)

        cot_res = data["models_evaluated"][0]
        latent_res = data["models_evaluated"][1]

        # dekhlo dooono nsame input paay hy k nai
        self.assertEqual(cot_res["input_representation"]["input_ids"], latent_res["input_representation"]["input_ids"])
        self.assertEqual(cot_res["expected_answer"], latent_res["expected_answer"])
        self.assertEqual(cot_res["input_representation"]["ground_truth_trajectory"],
                         latent_res["input_representation"]["ground_truth_trajectory"])

    def test_sweep_endpoint(self):
        payload = {
            "model": "latent",
            "task": "permutation_orbit",
            "budgets": [1, 2, 4],
            "seed": 42,
            "depth": 4
        }
        response = self.client.post("/api/sweep", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 3)
        budgets_run = [r["budget_k"] for r in data["results"]]
        self.assertEqual(budgets_run, [1, 2, 4])

    def test_pareto_126k(self):
        response = self.client.get("/api/pareto?scale=126k&task=task_a")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["scale"], "126k")
        self.assertEqual(data["task"], "task_a")
        self.assertIn("pareto_frontiers", data)
        self.assertIn("aggregated_conditions", data)
        self.assertIn("statistical_comparison", data)

    def test_pareto_5m_recovery(self):
        response = self.client.get("/api/pareto?scale=5m_recovery&task=task_a")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["scale"], "5m_recovery")
        self.assertEqual(data["task"], "task_a")
        self.assertIn("pareto_frontiers", data)

    def test_pareto_5m_original(self):
        response = self.client.get("/api/pareto?scale=5m_original&task=task_a")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["scale"], "5m_original")
        self.assertEqual(data["task"], "task_a")


if __name__ == "__main__":
    unittest.main()
