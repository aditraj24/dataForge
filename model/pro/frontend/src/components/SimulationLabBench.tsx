import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';
import { ModelInfo, TaskInfo, SimulationResult } from '../types';
import { Beaker, Play, RotateCcw, Clock, Zap, Check, X, ChevronDown, ChevronUp, Sliders } from 'lucide-react';

interface SimulationLabBenchProps {
  onNavigateTool?: (toolId: string) => void;
}

export const SimulationLabBench: React.FC<SimulationLabBenchProps> = ({ onNavigateTool }) => {
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
  const [showInspection, setShowInspection] = useState<boolean>(false);

  useEffect(() => {
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
      setErrorMsg(err.message || 'Simulation execution error. Ensure FastAPI service is running.');
    } finally {
      setLoading(false);
    }
  };

  const isCoT = selectedModel.includes('cot') || selectedModel.includes('autoregressive');

  return (
    <div className="workbench-viewport" style={{ border: '1px solid var(--border-medium)' }}>
      {/* Top Bar */}
      <div className="workbench-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Beaker size={15} style={{ color: 'var(--text-accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            DIGITAL LAB BENCH (FASTAPI SIMULATION ENGINE)
          </span>
          <span className="badge badge-observed">LIVE FORWARD PASS INSTRUMENT</span>
        </div>

        {/* Single vs Sweep Mode */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className={`btn-instrument ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
            style={{ fontSize: '0.75rem', padding: '2px 8px' }}
          >
            SINGLE RUN
          </button>
          <button
            className={`btn-instrument ${mode === 'sweep' ? 'active' : ''}`}
            onClick={() => setMode('sweep')}
            style={{ fontSize: '0.75rem', padding: '2px 8px' }}
          >
            BUDGET SWEEP
          </button>
        </div>
      </div>

      {/* Main Digital Lab Bench Surface */}
      <div style={{ padding: '1.25rem 1.25rem 0.5rem 1.25rem', background: 'var(--bg-viewport)' }}>
        <div className="telemetry-label" style={{ marginBottom: '0.6rem', color: 'var(--text-accent)' }}>
          SELECT COMPUTATIONAL OBJECT / BENCH
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.6rem',
          marginBottom: '1rem',
        }}>
          {[
            { name: 'Permutation Orbit', toolId: 'task-a', desc: 'S8 Orbit traversal & cycles', anchor: '#scene-follow-orbit' },
            { name: 'Modular Register', toolId: 'task-b', desc: 'Arithmetic modulo 10', anchor: '#scene-task-b' },
            { name: 'CoT Model', toolId: 'cot', desc: 'Explicit token scratchpad', anchor: '#scene-two-machines' },
            { name: 'Latent Model', toolId: 'latent', desc: 'Recurrent vector core', anchor: '#scene-watch-states' },
            { name: 'Attention Inspector', toolId: 'attention', desc: 'Addressing bottleneck query', anchor: '#scene-attention' },
            { name: 'BDH Synaptic Lab', toolId: 'bdh', desc: 'Fast-weight plasticity matrix', anchor: '#scene-bdh' },
          ].map((obj) => (
            <button
              key={obj.name}
              onClick={() => onNavigateTool ? onNavigateTool(obj.toolId) : undefined}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: '3px',
                padding: '0.6rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--text-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {obj.name}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                {obj.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{
        padding: '0 1.25rem 1.25rem 1.25rem',
        background: 'var(--bg-viewport)',
        display: 'grid',
        gridTemplateColumns: '280px minmax(320px, 1fr) 280px',
        gap: '1rem'
      }}>
        {/* PANEL 1: INPUT MACHINE (LEFT) */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <div className="telemetry-label" style={{ color: 'var(--text-accent)' }}>
            1. INPUT MACHINE CONFIG
          </div>

          <div>
            <label className="telemetry-label">TASK DOMAIN</label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                padding: '6px 8px',
                borderRadius: '2px',
                marginTop: '4px'
              }}
            >
              <option value="permutation_orbit">Task A: Permutation Orbit (S8)</option>
              <option value="modular_arithmetic">Task B: Modular Register Arithmetic</option>
            </select>
          </div>

          <div>
            <label className="telemetry-label">ARCHITECTURE & SCALE</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                padding: '6px 8px',
                borderRadius: '2px',
                marginTop: '4px'
              }}
            >
              <option value="autoregressive_cot_5m">CoT 5M (Controlled Recovery Condition)</option>
              <option value="recurrent_latent_5m">Latent 5M (Controlled Recovery Condition)</option>
              <option value="autoregressive_cot_1m">CoT 1M (Scaled)</option>
              <option value="recurrent_latent_1m">Latent 1M (Scaled)</option>
              <option value="autoregressive_cot">CoT 126K (Baseline)</option>
              <option value="recurrent_latent">Latent 126K (Baseline)</option>
              <option value="autoregressive_cot_5m_orig">CoT 5M Original (Confounded)</option>
              <option value="recurrent_latent_5m_orig">Latent 5M Original (Confounded)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="telemetry-label">TEST SEED</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  padding: '4px 6px',
                  borderRadius: '2px',
                  marginTop: '4px'
                }}
              />
            </div>
            <div>
              <label className="telemetry-label">HOPS (D)</label>
              <input
                type="number"
                min="1"
                max="8"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value) || 1)}
                style={{
                  width: '100%',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  padding: '4px 6px',
                  borderRadius: '2px',
                  marginTop: '4px'
                }}
              />
            </div>
          </div>

          <button
            className="btn-instrument btn-instrument-primary"
            onClick={handleRunSimulation}
            disabled={loading}
            style={{ marginTop: 'auto', padding: '0.65rem' }}
          >
            {loading ? 'EXECUTING FORWARD PASS...' : mode === 'single' ? 'DISPATCH INFERENCE' : 'EXECUTE FULL SWEEP'}
          </button>
        </div>

        {/* PANEL 2: COMPUTATION CHAMBER (CENTER) */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div className="telemetry-label" style={{ color: isCoT ? 'var(--cot-primary)' : 'var(--latent-primary)' }}>
              2. COMPUTATION CHAMBER ({isCoT ? 'AUTOREGRESSIVE TOKEN EMITTER' : 'RECURRENT STATE ENGINE'})
            </div>

            {/* Visual Chamber */}
            <div style={{
              background: 'var(--bg-viewport)',
              border: '1px solid var(--border-medium)',
              borderRadius: '2px',
              padding: '1.25rem',
              margin: '0.85rem 0',
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {result ? (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: '8px' }}>
                    INPUT SEQUENCE:
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    background: 'var(--bg-surface-elevated)',
                    padding: '6px 12px',
                    borderRadius: '2px',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    marginBottom: '12px'
                  }}>
                    {result.input_representation?.input_tokens?.join(' ') || 'Input Instance'}
                  </div>

                  {/* Chamber Execution Nodes */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {isCoT ? (
                      result.trace?.steps?.slice(0, 8).map((st: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--cot-bg)',
                            border: '1px solid var(--cot-primary)',
                            padding: '3px 7px',
                            borderRadius: '2px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            color: 'var(--cot-primary)'
                          }}
                        >
                          t{idx + 1}: {st.token_str || st.token_id || idx}
                        </div>
                      ))
                    ) : (
                      result.trace?.steps?.slice(0, 8).map((st: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--latent-bg)',
                            border: '1px solid var(--latent-primary)',
                            padding: '3px 7px',
                            borderRadius: '2px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            color: 'var(--latent-primary)'
                          }}
                        >
                          S{idx}: ||h||={st.hidden_norm ? st.hidden_norm.toFixed(1) : '8.5'}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                  Awaiting instruction. Select budget k and click DISPATCH INFERENCE.
                </div>
              )}
            </div>
          </div>

          {/* Budget Dial Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="telemetry-label">INFERENCE COMPUTE BUDGET (k)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-accent)' }}>
                k = {selectedBudget}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[1, 2, 4, 8, 12, 16].map((k) => (
                <button
                  key={k}
                  className={`btn-instrument ${selectedBudget === k ? 'active' : ''}`}
                  onClick={() => setSelectedBudget(k)}
                  style={{ flex: 1, padding: '4px 0', fontSize: '0.75rem' }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL 3: TELEMETRY & RESULTS (RIGHT) */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div className="telemetry-label" style={{ color: 'var(--text-accent)' }}>
              3. TELEMETRY & OUTCOME
            </div>

            {result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.75rem' }}>
                <div className="telemetry-cell">
                  <div className="telemetry-label">GROUND TRUTH TARGET</div>
                  <div className="telemetry-value" style={{ color: 'var(--ground-truth-primary)' }}>
                    {result.expected_answer_str || result.expected_answer}
                  </div>
                </div>

                <div className="telemetry-cell">
                  <div className="telemetry-label">MODEL PREDICTION</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="telemetry-value" style={{ color: result.correct ? 'var(--correct-color)' : 'var(--incorrect-color)' }}>
                      {result.predicted_answer_str || result.predicted_answer}
                    </span>
                    {result.correct ? (
                      <span className="status-match"><Check size={11} /> MATCH [CORRECT]</span>
                    ) : (
                      <span className="status-mismatch"><X size={11} /> MISMATCH [INCORRECT]</span>
                    )}
                  </div>
                </div>

                <div className="telemetry-cell">
                  <div className="telemetry-label">GPU WALL-CLOCK LATENCY</div>
                  <div className="telemetry-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} style={{ color: 'var(--text-tertiary)' }} />
                    {result.latency_ms.toFixed(3)} ms
                  </div>
                </div>

                <div className="telemetry-cell">
                  <div className="telemetry-label">ANALYTICAL FLOPS</div>
                  <div className="telemetry-value" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.95rem' }}>
                    <Zap size={13} style={{ color: 'var(--text-tertiary)' }} />
                    {result.analytical_flops.toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: '1rem' }}>
                No active inference result. Run simulation to populate telemetry metrics.
              </div>
            )}
          </div>

          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--incorrect-color)',
              color: 'var(--incorrect-color)',
              padding: '6px',
              borderRadius: '2px',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              marginTop: '0.5rem'
            }}>
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Sweep Results Display (If Sweep Mode Active) */}
      {sweepResults && (
        <div style={{
          background: 'var(--bg-surface-elevated)',
          borderTop: '1px solid var(--border-medium)',
          padding: '1rem',
          overflowX: 'auto'
        }}>
          <div className="telemetry-label" style={{ marginBottom: '0.5rem' }}>
            SWEEP TELEMETRY ACROSS BUDGETS k ∈ &#123;1, 2, 4, 8, 12, 16&#125;
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-tertiary)', textAlign: 'left' }}>
                <th style={{ padding: '6px' }}>BUDGET k</th>
                <th style={{ padding: '6px' }}>PREDICTION</th>
                <th style={{ padding: '6px' }}>GROUND TRUTH</th>
                <th style={{ padding: '6px' }}>RESULT</th>
                <th style={{ padding: '6px' }}>LATENCY (ms)</th>
                <th style={{ padding: '6px' }}>FLOPs</th>
              </tr>
            </thead>
            <tbody>
              {sweepResults.map((r) => (
                <tr key={r.budget_k} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px', fontWeight: 700 }}>k={r.budget_k}</td>
                  <td style={{ padding: '6px' }}>{r.predicted_answer_str || r.predicted_answer}</td>
                  <td style={{ padding: '6px', color: 'var(--ground-truth-primary)' }}>{r.expected_answer_str || r.expected_answer}</td>
                  <td style={{ padding: '6px' }}>
                    {r.correct ? (
                      <span style={{ color: 'var(--correct-color)', fontWeight: 700 }}>MATCH</span>
                    ) : (
                      <span style={{ color: 'var(--incorrect-color)', fontWeight: 700 }}>MISMATCH</span>
                    )}
                  </td>
                  <td style={{ padding: '6px' }}>{r.latency_ms.toFixed(3)}</td>
                  <td style={{ padding: '6px' }}>{r.analytical_flops.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Progressive Disclosure: Inspect Trace Data */}
      <div className="disclosure-section" style={{ margin: 0, borderTop: '1px solid var(--border-medium)', borderRadius: 0 }}>
        <button
          className="disclosure-trigger"
          onClick={() => setShowInspection(!showInspection)}
        >
          <span>INSPECT COMPUTATION: FORWARD PASS TRACE DUMP</span>
          {showInspection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showInspection && (
          <div className="disclosure-content">
            {result?.trace ? (
              <pre style={{
                background: 'var(--bg-viewport)',
                padding: '0.75rem',
                borderRadius: '2px',
                fontSize: '0.75rem',
                overflowX: 'auto',
                color: 'var(--text-accent)'
              }}>
                {JSON.stringify(result.trace, null, 2)}
              </pre>
            ) : (
              <p>Run a simulation pass above to inspect raw trace tokens or state tensors.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
