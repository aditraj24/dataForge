/**
 * Typed aeepeeai kalaint kay lyye d Thinking bjjet Fastaeepeeai Backend.
 * Seamlessly sbhalos live aeepeeai execution sath automatic fallbacks kay lyye static demonstration.
 */

import {
  HealthResponse,
  ModelInfo,
  TaskInfo,
  ScaleInfo,
  TaskExample,
  SimulationResult,
  CompareResponse,
  SweepResponse,
  ParetoResponse,
  ScaleId
} from '../types';
import { PRESET_TASK_A_EXAMPLE } from '../data/precomputed';

const API_BASE_URL = import.meta.env.VITE_API_URL || ''; // Relative path uses Vite proxy; or direct if configured

export class ApiClient {
  private static async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      ...options
    });

    if (!res.ok) {
      const errorText = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(errorText);
      } catch {
        parsed = { detail: errorText || `HTTP ${res.status} error` };
      }
      throw new Error(parsed.detail || `Request failed with status ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  static async getHealth(): Promise<HealthResponse> {
    try {
      return await this.fetchJson<HealthResponse>(`${API_BASE_URL}/api/health`);
    } catch {
      return {
        status: 'offline_fallback',
        service: 'thinking-budget-api (fallback)',
        device_info: { device_type: 'cpu', device_name: 'Local Browser (Offline)', cuda_available: false }
      };
    }
  }

  static async getModels(): Promise<ModelInfo[]> {
    return this.fetchJson<ModelInfo[]>(`${API_BASE_URL}/api/models`);
  }

  static async getTasks(): Promise<TaskInfo[]> {
    return this.fetchJson<TaskInfo[]>(`${API_BASE_URL}/api/tasks`);
  }

  static async getScales(): Promise<ScaleInfo[]> {
    return this.fetchJson<ScaleInfo[]>(`${API_BASE_URL}/api/scales`);
  }

  static async generateExample(task: string = 'permutation_orbit', depth?: number, seed?: number): Promise<TaskExample> {
    try {
      return await this.fetchJson<TaskExample>(`${API_BASE_URL}/api/examples`, {
        method: 'POST',
        body: JSON.stringify({ task, depth, seed })
      });
    } catch {
      return PRESET_TASK_A_EXAMPLE;
    }
  }

  static async simulate(
    model: string,
    task: string = 'permutation_orbit',
    budget_k: number = 8,
    seed: number = 42,
    example?: TaskExample,
    depth?: number
  ): Promise<SimulationResult> {
    return this.fetchJson<SimulationResult>(`${API_BASE_URL}/api/simulate`, {
      method: 'POST',
      body: JSON.stringify({ model, task, budget_k, seed, example, depth })
    });
  }

  static async compare(
    models: string[] = ['cot', 'latent'],
    task: string = 'permutation_orbit',
    budget_k: number = 2,
    seed: number = 42,
    example?: TaskExample,
    depth?: number
  ): Promise<CompareResponse> {
    return this.fetchJson<CompareResponse>(`${API_BASE_URL}/api/compare`, {
      method: 'POST',
      body: JSON.stringify({ models, task, budget_k, seed, example, depth })
    });
  }

  static async sweep(
    model: string,
    task: string = 'permutation_orbit',
    budgets: number[] = [1, 2, 4, 8, 12, 16],
    seed: number = 42,
    example?: TaskExample,
    depth?: number
  ): Promise<SweepResponse> {
    return this.fetchJson<SweepResponse>(`${API_BASE_URL}/api/sweep`, {
      method: 'POST',
      body: JSON.stringify({ model, task, budgets, seed, example, depth })
    });
  }

  static async getPareto(task?: string, scale: ScaleId | string = '126k'): Promise<ParetoResponse> {
    const params = new URLSearchParams();
    if (task) params.append('task', task);
    params.append('scale', scale);
    return this.fetchJson<ParetoResponse>(`${API_BASE_URL}/api/pareto?${params.toString()}`);
  }
}
