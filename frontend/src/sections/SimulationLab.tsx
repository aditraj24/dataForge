import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';
import { ModelInfo, TaskInfo, SimulationResult, TaskExample } from '../types';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { TraceViewerCoT } from '../components/TraceViewerCoT';
import { TraceViewerLatent } from '../components/TraceViewerLatent';
import { Beaker, Play, RotateCcw, Sliders, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

export const SimulationLab: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('autoregressive_cot_5m');
  const [selectedTask, setSelectedTask] = useState<string>('permutation_orbit');
  const [selectedBudget, setSelectedBudget] = useState<number>(16);
  const [seed, setSeed] = useState<number>(42);
  const [depth, setDepth] = useState<number>(6);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [sweepResults, setSweepResults] = useState<SimulationResult[] | null>(null);
  const [mode, setMode] = useState<'single' | 'sweep'>('single');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // laod kro metadetta from aeepeeai
    ApiClient.getModels().then(setModels).catch(() => {});
    ApiClient.getTasks().then(setTasks).catch(() => {});
  }, []);

  const handleRunSimulation = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSweepResults(null);
    try {
      if (mode === 'single') {
        const res = await ApiClient.simulate(
          selectedModel,
          selectedTask,
          selectedBudget,
          seed,
          undefined,
          depth
        );
        setResult(res);
      } else {
        const res = await ApiClient.sweep(
          selectedModel,
          selectedTask,
          [1, 2, 4, 8, 12, 16],
          seed,
          undefined,
          depth
        );
        setSweepResults(res.results);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Simulation execution error. Ensure FastAPI service is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="section-lab" className="section-wrapper" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 12</span>
            <span>&bull;</span>
            <span>Interactive Sandbox</span>
          </div>
          <h2 className="section-title">Simulation Lab</h2>
          <p className="section-lead">
            Now explore the system yourself. Run individual inferences, sweep test-time compute budgets k &isin; &#123;1, 2, 4, 8, 12, 16&#125;, and inspect step-by-step reasoning traces directly from the trained PyTorch checkpoints.
          </p>
        </div>

        {/* Lab Control Surface */}
        <div className="card-elevated" style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            {/* maadal Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Reasoning Model Architecture
              </label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="autoregressive_cot">Autoregressive CoT (126K Baseline)</option>
                <option value="recurrent_latent">Recurrent Latent (126K Baseline)</option>
                <option value="autoregressive_cot_1m">Autoregressive CoT (1M Scaling)</option>
                <option value="recurrent_latent_1m">Recurrent Latent (1M Scaling)</option>
                <option value="autoregressive_cot_5m">Autoregressive CoT (5M Controlled Recovery Condition)</option>
                <option value="recurrent_latent_5m">Recurrent Latent (5M Controlled Recovery Condition)</option>
                <option value="hebbian_synaptic">BDH Hebbian Synaptic Memory (Standalone Demo)</option>
              </select>
            </div>

            {/* Task Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Algorithmic Task
              </label>
              <select
                value={selectedTask}
                onChange={e => setSelectedTask(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="permutation_orbit">Task A: Permutation Orbit Traversal (S_8)</option>
                <option value="modular_register">Task B: Modular Register Arithmetic (Z_10)</option>
                {selectedModel === 'hebbian_synaptic' && (
                  <option value="associative">Continuous Vector Association (Hebbian)</option>
                )}
              </select>
            </div>

            {/* bjjet Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Reasoning Budget (k)
              </label>
              <select
                value={selectedBudget}
                disabled={mode === 'sweep'}
                onChange={e => setSelectedBudget(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  opacity: mode === 'sweep' ? 0.5 : 1
                }}
              >
                <option value="1">k = 1 token / step</option>
                <option value="2">k = 2 tokens / steps</option>
                <option value="4">k = 4 tokens / steps</option>
                <option value="8">k = 8 tokens / steps</option>
                <option value="12">k = 12 tokens / steps</option>
                <option value="16">k = 16 tokens / steps</option>
              </select>
            </div>

            {/* Depth & Seed */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Difficulty Depth (D) &amp; Seed
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="2"
                  max="16"
                  value={depth}
                  onChange={e => setDepth(Number(e.target.value))}
                  placeholder="Depth D"
                  style={{
                    width: '50%',
                    padding: '0.65rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-medium)',
                    fontFamily: 'var(--font-mono)'
                  }}
                  title="Hop Depth D in [2, 16]"
                />
                <input
                  type="number"
                  value={seed}
                  onChange={e => setSeed(Number(e.target.value))}
                  placeholder="Seed"
                  style={{
                    width: '50%',
                    padding: '0.65rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-medium)',
                    fontFamily: 'var(--font-mono)'
                  }}
                  title="Random seed for problem generation"
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setMode('single')}
                className="btn btn-pill"
                style={{
                  backgroundColor: mode === 'single' ? 'var(--cot-primary)' : 'var(--bg-surface)',
                  color: mode === 'single' ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem'
                }}
              >
                Single Inference
              </button>
              <button
                onClick={() => setMode('sweep')}
                className="btn btn-pill"
                style={{
                  backgroundColor: mode === 'sweep' ? 'var(--cot-primary)' : 'var(--bg-surface)',
                  color: mode === 'sweep' ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem'
                }}
              >
                Sweep Budgets [1..16]
              </button>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem' }}
            >
              <Play size={16} />
              <span>{loading ? 'Running PyTorch Inference...' : 'Execute Simulation'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="callout callout-warning" style={{ marginBottom: '1.5rem' }}>
            <strong style={{ color: '#ef4444' }}>Simulation Notice:</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{errorMsg}</p>
          </div>
        )}

        {/* Results Display */}
        {result && mode === 'single' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* chelao summary badge card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem'
            }}>
              <div>
                Model: <strong style={{ color: 'var(--text-primary)' }}>{result.model_name}</strong> &nbsp;|&nbsp;
                Parameters: <strong style={{ color: 'var(--text-accent)' }}>{result.total_parameters.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <EvidenceBadge level="LIVE" />
                <span>Checkpoint: {result.checkpoint_path.split('/').pop()}</span>
              </div>
            </div>

            {result.paradigm === 'autoregressive_cot' ? (
              <TraceViewerCoT
                trace={result.trace}
                latencyMs={result.latency_ms}
                analyticalFlops={result.analytical_flops}
                correct={result.correct}
                predictedAnswer={result.predicted_answer_str}
                expectedAnswer={result.expected_answer_str}
                budgetK={result.budget_k}
              />
            ) : (
              <TraceViewerLatent
                trace={result.trace}
                latencyMs={result.latency_ms}
                analyticalFlops={result.analytical_flops}
                correct={result.correct}
                predictedAnswer={result.predicted_answer_str}
                expectedAnswer={result.expected_answer_str}
                budgetK={result.budget_k}
              />
            )}
          </div>
        )}

        {/* Sweep Table Display */}
        {sweepResults && mode === 'sweep' && (
          <div className="card" style={{ overflowX: 'auto' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Budget Sweep Evolution Across k &isin; &#123;1, 2, 4, 8, 12, 16&#125; (Same Instance)
            </h4>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem' }}>Budget k</th>
                  <th style={{ padding: '0.6rem' }}>Prediction</th>
                  <th style={{ padding: '0.6rem' }}>Ground Truth</th>
                  <th style={{ padding: '0.6rem' }}>Correct?</th>
                  <th style={{ padding: '0.6rem' }}>Latency</th>
                  <th style={{ padding: '0.6rem' }}>FLOPs</th>
                </tr>
              </thead>
              <tbody>
                {sweepResults.map(r => (
                  <tr key={r.budget_k} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>k = {r.budget_k}</td>
                    <td style={{ padding: '0.6rem', color: r.correct ? 'var(--latent-primary)' : '#ef4444', fontWeight: 700 }}>
                      {r.predicted_answer_str}
                    </td>
                    <td style={{ padding: '0.6rem' }}>{r.expected_answer_str}</td>
                    <td style={{ padding: '0.6rem' }}>
                      {r.correct ? (
                        <span style={{ color: 'var(--latent-primary)', fontWeight: 600 }}>&check; Correct</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>&cross; Incorrect</span>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem' }}>{r.latency_ms.toFixed(3)} ms</td>
                    <td style={{ padding: '0.6rem' }}>{r.analytical_flops.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
