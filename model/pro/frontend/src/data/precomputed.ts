/**
 * Authoritative empirical benchmark numbers from frozen research results:
 * - 126K Baseline (results/)
 * - 1M Scaling (results_1m/)
 * - 5M Original Confounded (results_5m/)
 * - 5M Recovery Authoritative (results_5m_recovery/)
 *
 * Compute metrics:
 * - Isolated GPU wall-clock latency (ms) via CUDA events on RTX 4060
 * - Analytical FLOPs (2 * MACs)
 * - 1,000 fixed test instances (TEST_SEED = 999) across 5 seeds (42..46)
 */

export interface BenchmarkRecord {
  k: number;
  cot_acc: number;
  cot_sem: number;
  latent_acc: number;
  latent_sem: number;
  cot_latency_ms: number;
  latent_latency_ms: number;
  cot_flops: number;
  latent_flops: number;
  p_value: number;
}

export const TASK_A_126K: BenchmarkRecord[] = [
  { k: 1,  cot_acc: 21.54, cot_sem: 2.43,  latent_acc: 15.68, latent_sem: 0.73, cot_latency_ms: 0.150, latent_latency_ms: 0.080, cot_flops: 229120,   latent_flops: 225280,   p_value: 0.0760 },
  { k: 2,  cot_acc: 29.70, cot_sem: 2.89,  latent_acc: 32.30, latent_sem: 0.52, cot_latency_ms: 0.190, latent_latency_ms: 0.130, cot_flops: 458240,   latent_flops: 450560,   p_value: 0.4470 },
  { k: 4,  cot_acc: 38.64, cot_sem: 4.92,  latent_acc: 33.14, latent_sem: 0.56, cot_latency_ms: 0.260, latent_latency_ms: 0.230, cot_flops: 916480,   latent_flops: 901120,   p_value: 0.3540 },
  { k: 8,  cot_acc: 50.84, cot_sem: 7.60,  latent_acc: 33.08, latent_sem: 0.57, cot_latency_ms: 0.420, latent_latency_ms: 0.440, cot_flops: 1832960,  latent_flops: 1802240,  p_value: 0.0890 },
  { k: 12, cot_acc: 63.18, cot_sem: 10.38, latent_acc: 33.04, latent_sem: 0.65, cot_latency_ms: 0.570, latent_latency_ms: 0.640, cot_flops: 2749440,  latent_flops: 2703360,  p_value: 0.0380 },
  { k: 16, cot_acc: 73.36, cot_sem: 15.83, latent_acc: 33.06, latent_sem: 0.59, cot_latency_ms: 0.720, latent_latency_ms: 0.850, cot_flops: 3665920,  latent_flops: 3604480,  p_value: 0.0047 }
];

export const TASK_A_1M: BenchmarkRecord[] = [
  { k: 1,  cot_acc: 24.32, cot_sem: 7.48,  latent_acc: 15.36, latent_sem: 0.70, cot_latency_ms: 0.165, latent_latency_ms: 0.081, cot_flops: 1772640,  latent_flops: 1768416,  p_value: 0.2870 },
  { k: 2,  cot_acc: 33.72, cot_sem: 0.56,  latent_acc: 30.68, latent_sem: 1.06, cot_latency_ms: 0.218, latent_latency_ms: 0.134, cot_flops: 3545280,  latent_flops: 3536832,  p_value: 0.0710 },
  { k: 4,  cot_acc: 41.52, cot_sem: 5.88,  latent_acc: 31.14, latent_sem: 1.02, cot_latency_ms: 0.323, latent_latency_ms: 0.244, cot_flops: 7090560,  latent_flops: 7073664,  p_value: 0.1610 },
  { k: 8,  cot_acc: 53.64, cot_sem: 13.78, latent_acc: 31.12, latent_sem: 1.01, cot_latency_ms: 0.536, latent_latency_ms: 0.457, cot_flops: 14181120, latent_flops: 14147328, p_value: 0.1980 },
  { k: 12, cot_acc: 64.36, cot_sem: 23.30, latent_acc: 31.12, latent_sem: 1.01, cot_latency_ms: 0.751, latent_latency_ms: 0.672, cot_flops: 21271680, latent_flops: 21220992, p_value: 0.2480 },
  { k: 16, cot_acc: 76.70, cot_sem: 29.57, latent_acc: 31.12, latent_sem: 1.01, cot_latency_ms: 0.965, latent_latency_ms: 0.887, cot_flops: 28362240, latent_flops: 28294656, p_value: 0.0261 }
];

export const TASK_A_5M_RECOVERY: BenchmarkRecord[] = [
  { k: 1,  cot_acc: 22.48, cot_sem: 3.32,  latent_acc: 15.46, latent_sem: 0.96, cot_latency_ms: 0.136, latent_latency_ms: 0.120, cot_flops: 9835776,  latent_flops: 9815040,  p_value: 0.0449 },
  { k: 2,  cot_acc: 33.94, cot_sem: 0.14,  latent_acc: 31.44, latent_sem: 0.45, cot_latency_ms: 0.179, latent_latency_ms: 0.079, cot_flops: 19671552, latent_flops: 19630080, p_value: 0.0044 },
  { k: 4,  cot_acc: 44.54, cot_sem: 0.17,  latent_acc: 33.38, latent_sem: 0.13, cot_latency_ms: 0.289, latent_latency_ms: 0.140, cot_flops: 39343104, latent_flops: 39260160, p_value: 0.000000462 },
  { k: 8,  cot_acc: 63.34, cot_sem: 0.14,  latent_acc: 33.94, latent_sem: 0.37, cot_latency_ms: 0.549, latent_latency_ms: 0.279, cot_flops: 78686208, latent_flops: 78520320, p_value: 0.000000164 },
  { k: 12, cot_acc: 80.26, cot_sem: 0.22,  latent_acc: 33.98, latent_sem: 0.37, cot_latency_ms: 0.849, latent_latency_ms: 0.386, cot_flops: 118029312, latent_flops: 117780480, p_value: 0.0000000183 },
  { k: 16, cot_acc: 99.74, cot_sem: 0.21,  latent_acc: 33.92, latent_sem: 0.37, cot_latency_ms: 1.168, latent_latency_ms: 0.512, cot_flops: 157372416, latent_flops: 157040640, p_value: 0.00000000471 }
];

export const TASK_A_5M_ORIGINAL: BenchmarkRecord[] = [
  { k: 1,  cot_acc: 13.66, cot_sem: 1.31,  latent_acc: 12.08, latent_sem: 0.55, cot_latency_ms: 0.140, latent_latency_ms: 0.118, cot_flops: 9835776,  latent_flops: 9815040,  p_value: 0.180 },
  { k: 2,  cot_acc: 13.52, cot_sem: 1.09,  latent_acc: 12.46, latent_sem: 0.49, cot_latency_ms: 0.185, latent_latency_ms: 0.082, cot_flops: 19671552, latent_flops: 19630080, p_value: 0.220 },
  { k: 4,  cot_acc: 13.28, cot_sem: 0.97,  latent_acc: 12.46, latent_sem: 0.49, cot_latency_ms: 0.295, latent_latency_ms: 0.145, cot_flops: 39343104, latent_flops: 39260160, p_value: 0.240 },
  { k: 8,  cot_acc: 13.44, cot_sem: 0.94,  latent_acc: 12.46, latent_sem: 0.49, cot_latency_ms: 0.555, latent_latency_ms: 0.285, cot_flops: 78686208, latent_flops: 78520320, p_value: 0.210 },
  { k: 12, cot_acc: 13.56, cot_sem: 0.94,  latent_acc: 12.46, latent_sem: 0.49, cot_latency_ms: 0.855, latent_latency_ms: 0.395, cot_flops: 118029312, latent_flops: 117780480, p_value: 0.190 },
  { k: 16, cot_acc: 13.64, cot_sem: 0.94,  latent_acc: 12.46, latent_sem: 0.49, cot_latency_ms: 1.175, latent_latency_ms: 0.520, cot_flops: 157372416, latent_flops: 157040640, p_value: 0.170 }
];

export const TASK_B_ACCS = {
  baseline_126k: { cot_k16: 12.80, latent_k16: 12.98, random_baseline: 10.0 },
  scaling_1m:    { cot_k16: 14.18, latent_k16: 13.84, random_baseline: 10.0 },
  recovery_5m:   { cot_k16: 18.58, latent_k16: 14.56, random_baseline: 10.0 }
};

export const SCALE_TRAJECTORY_K16 = [
  { scale: '126K', cot: 73.36, latent: 33.06, status: 'Baseline' },
  { scale: '1M',   cot: 76.70, latent: 31.12, status: '8x Capacity' },
  { scale: '5M Original (Confounded)', cot: 13.64, latent: 12.46, status: 'Underfit static AdamW' },
  { scale: '5M Recovery (Controlled Condition)', cot: 99.74, latent: 33.92, status: '50-ep Warmup + Cosine' }
];

export const PRESET_TASK_A_EXAMPLE = {
  task_name: "permutation_orbit",
  depth: 6,
  input_ids: [13, 3, 7, 0, 6, 2, 1, 5, 4, 14, 0, 15, 6],
  input_tokens: ["MAP", "3", "7", "0", "6", "2", "1", "5", "4", "START", "0", "HOPS", "6"],
  expected_answer: 5,
  expected_answer_str: "5",
  ground_truth_trajectory: [3, 6, 1, 7, 4, 5],
  ground_truth_trajectory_str: ["3", "6", "1", "7", "4", "5"],
  raw_metadata: {
    pi: [3, 7, 0, 6, 2, 1, 5, 4],
    v0: 0,
    depth: 6
  }
};
