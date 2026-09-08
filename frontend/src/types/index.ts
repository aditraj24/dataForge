/**
 * TypeScript definitions kay lyye d Thinking bjjet Visual Essay & Simulation Lab.
 * Matches backend Pydantic schemas sath strict typing.
 */

export type ModelParadigm = 'autoregressive_cot' | 'recurrent_latent' | 'hebbian_synaptic';

export type ScaleId = '126k' | '1m' | '5m_recovery' | '5m_original';

export type TaskId = 'permutation_orbit' | 'modular_register' | 'associative';

export type EvidenceLevel =
  | 'OBSERVED'
  | 'HYPOTHESIS'
  | 'INCONCLUSIVE'
  | 'LIVE'
  | 'PRECOMPUTED'
  | 'SYNTHETIC'
  | 'ILLUSTRATION'
  | 'HISTORICAL'
  | 'RECOVERY';

export interface DeviceInfo {
  device_type: string;
  device_name: string;
  cuda_available: boolean;
}

export interface HealthResponse {
  status: string;
  service: string;
  device_info: DeviceInfo;
}

export interface ModelInfo {
  model_id: string;
  display_name: string;
  paradigm: ModelParadigm;
  description: string;
  total_parameters: number;
  trainable_parameters: number;
  supported_budgets: number[];
  supported_tasks: string[];
  available_seeds: number[];
}

export interface TaskInfo {
  task_id: string;
  display_name: string;
  description: string;
  aliases: string[];
  answer_domain_size: number;
}

export interface ScaleInfo {
  scale_id: ScaleId;
  display_name: string;
  description: string;
  parameter_regime: string;
  optimization_protocol: string;
  status: string;
  is_authoritative: boolean;
}

export interface TaskExample {
  task_name: string;
  depth: number;
  input_ids: number[];
  input_tokens: string[];
  expected_answer: number;
  expected_answer_str: string;
  ground_truth_trajectory: number[];
  ground_truth_trajectory_str: string[];
  raw_metadata: Record<string, any>;
}

export interface TokenTraceStep {
  step_index: number;
  token_id: number;
  token_str: string;
  token_type: 'prompt' | 'think_start' | 'reasoning_step' | 'think_end' | 'ans_prefix' | 'answer';
  cumulative_tokens: number;
}

export interface LatentTraceStep {
  step_index: number;
  hidden_norm: number;
  hidden_mean: number;
  hidden_std: number;
  predicted_token_id: number;
  predicted_token_str: string;
  top_logits: Record<string, number>;
}

export interface HebbianTraceStep {
  phase: string;
  sparsity: number;
  sigma_norm: number;
  retrieved_norm: number;
  output_norm: number;
}

export interface TraceContainer {
  paradigm: ModelParadigm;
  description: string;
  steps: Array<TokenTraceStep | LatentTraceStep | HebbianTraceStep>;
  raw_summary: Record<string, any>;
}

export interface SimulationResult {
  model_id: string;
  model_name: string;
  paradigm: ModelParadigm;
  task_id: string;
  task_name: string;
  budget_k: number;
  seed: number;
  checkpoint_path: string;
  expected_answer: number;
  expected_answer_str: string;
  predicted_answer: number;
  predicted_answer_str: string;
  correct: boolean;
  latency_ms: number;
  analytical_flops: number;
  total_parameters: number;
  trainable_parameters: number;
  device: string;
  input_representation: {
    input_ids: number[];
    input_tokens: string[];
    depth: number;
    ground_truth_trajectory: number[];
    ground_truth_trajectory_str: string[];
  };
  trace: TraceContainer;
}

export interface CompareResponse {
  task_example: TaskExample;
  budget_k: number;
  models_evaluated: SimulationResult[];
}

export interface SweepResponse {
  model_id: string;
  task_id: string;
  seed: number;
  results: SimulationResult[];
}

export interface ParetoPoint {
  model: string;
  k: number;
  mean_accuracy: number;
  mean_latency_ms: number;
  mean_analytical_flops: number;
  sem_accuracy: number;
  is_pareto_efficient?: boolean;
}

export interface ParetoResponse {
  scale: string;
  task?: string;
  pareto_frontiers: {
    cot?: ParetoPoint[];
    latent?: ParetoPoint[];
    combined_frontier?: ParetoPoint[];
    [key: string]: any;
  };
  aggregated_conditions: any[];
  statistical_comparison: any;
}
