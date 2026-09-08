export type ProvenanceType = 
  | 'LIVE'
  | 'PRECOMPUTED'
  | 'SYNTHETIC'
  | 'PROJECTED'
  | 'ILLUSTRATIVE'
  | 'HISTORICAL'
  | 'RECOVERY';

export type TaskId = 'permutation' | 'modular' | 'associative';
export type ModelType = 'cot' | 'latent' | 'hebbian';
export type ScaleId = '126k' | '1m' | '5m' | '5m_recovery';

export type DisclosureLevel = 'learn' | 'inspect' | 'technical';

export interface StateSnapshot {
  step: number;
  label: string;
  value: string | number;
  previousValue?: string | number;
  transition?: string;
  groundTruth?: string | number;
  isCorrect?: boolean;
  deltaNorm?: number;
  cosSim?: number;
  l2Norm?: number;
  notes?: string;
}

export interface TelemetryData {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  budgetK: number;
  currentStep: number;
  totalSteps: number;
  latencyMs?: number;
  analyticalFlops?: number;
  accuracy?: number;
  groundTruth?: string | number;
  modelPrediction?: string | number;
  provenance: ProvenanceType;
}

export interface WorkbenchObjectItem {
  id: string;
  title: string;
  category: 'task' | 'model' | 'instrument' | 'diagnostic';
  description: string;
  badge?: string;
}
