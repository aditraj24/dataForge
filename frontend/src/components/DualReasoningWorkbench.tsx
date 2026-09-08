import React, { useState } from 'react';
import { 
  Cpu, 
  Layers, 
  ArrowRight, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { EvidenceBadge } from './EvidenceBadge';

interface DualReasoningWorkbenchProps {
  initialBudget?: number;
}

interface SelectedCoTToken {
  type: 'token';
  index: number;
  label: string;
  step: number;
  groundTruth: string;
  prob: number;
  isCorrect: boolean;
}

interface SelectedLatentState {
  type: 'latent';
  step: number;
  label: string;
  l2Norm: number;
  deltaNorm: number;
  cosSim: number;
  topPrediction: string;
  groundTruth: string;
  isCorrect: boolean;
}

export const DualReasoningWorkbench: React.FC<DualReasoningWorkbenchProps> = ({
  initialBudget = 4,
}) => {
  const [budgetK, setBudgetK] = useState<number>(initialBudget);
  const [selectedItem, setSelectedItem] = useState<SelectedCoTToken | SelectedLatentState | null>(null);
  const [showInspection, setShowInspection] = useState<boolean>(false);
  const [showTechnical, setShowTechnical] = useState<boolean>(false);

  // Problem settup: v0 = 3, D = 4, pi = [1, 7, 5, 0, 2, 4, 6, 3]
  // Traversal: 3 -> 0 -> 1 -> 7 -> 3
  const groundTruthTarget = 'v3';

  // CoT Emitted Token Objects kay lyye bjjetK
  // Special tokens: [THINK] -> v0 -> v1 -> ... -> [END_THINK] -> [ANS v3]
  const cotTokensList = [
    { label: '<THINK>', step: 0, gt: '<THINK>', prob: 0.99 },
    { label: 'v0', step: 1, gt: 'v0', prob: 0.98 },
    { label: 'v1', step: 2, gt: 'v1', prob: 0.97 },
    { label: 'v7', step: 3, gt: 'v7', prob: 0.94 },
    { label: 'v3', step: 4, gt: 'v3', prob: 0.92 },
    { label: '</THINK>', step: 5, gt: '</THINK>', prob: 0.99 },
    { label: 'ANS: v3', step: 6, gt: 'v3', prob: 0.95 },
  ];

  // Active CoT tokens determined by bjjetK
  const activeCoTTokens = cotTokensList.slice(0, Math.min(budgetK + 2, cotTokensList.length));
  const finalCoTPrediction = budgetK >= 4 ? 'v3' : activeCoTTokens[activeCoTTokens.length - 1].label;
  const isCoTCorrect = finalCoTPrediction.includes('v3');

  // Latent Continuous Recurrent haaalat Objects kay lyye bjjetK
  const latentStatesList = Array.from({ length: budgetK + 1 }, (_, i) => {
    const l2Norm = Number((8.42 - i * 0.12).toFixed(3));
    const deltaNorm = i === 0 ? 0 : Number((1.75 / Math.pow(1.58, i)).toFixed(4));
    const cosSim = i === 0 ? 1.0 : Number((0.82 + Math.min(i * 0.035, 0.17)).toFixed(4));
    const topPrediction = i >= 3 ? 'v3' : i === 1 ? 'v0' : 'v1';
    return {
      step: i,
      label: `S${i}`,
      l2Norm,
      deltaNorm,
      cosSim,
      topPrediction,
      groundTruth: groundTruthTarget,
      isCorrect: topPrediction === groundTruthTarget,
    };
  });

  const finalLatentState = latentStatesList[latentStatesList.length - 1];
  const isLatentCorrect = finalLatentState.isCorrect;

  // Profiled telemetry per bjjet k
  const getMetrics = (k: number) => {
    switch (k) {
      case 1:
        return {
          cot: { acc: 21.5, lat: 0.14, flops: 42000, tokens: 2 },
          latent: { acc: 15.7, lat: 0.08, flops: 28000, tokens: 0 },
        };
      case 2:
        return {
          cot: { acc: 37.4, lat: 0.22, flops: 78000, tokens: 3 },
          latent: { acc: 26.8, lat: 0.12, flops: 49000, tokens: 0 },
        };
      case 4:
        return {
          cot: { acc: 62.1, lat: 0.38, flops: 148000, tokens: 5 },
          latent: { acc: 31.5, lat: 0.19, flops: 91000, tokens: 0 },
        };
      case 8:
        return {
          cot: { acc: 74.8, lat: 0.44, flops: 184000, tokens: 9 },
          latent: { acc: 31.2, lat: 0.33, flops: 175000, tokens: 0 },
        };
      case 12:
        return {
          cot: { acc: 76.2, lat: 0.58, flops: 242000, tokens: 13 },
          latent: { acc: 31.1, lat: 0.47, flops: 259000, tokens: 0 },
        };
      case 16:
        return {
          cot: { acc: 76.7, lat: 0.74, flops: 310000, tokens: 17 },
          latent: { acc: 31.1, lat: 0.61, flops: 343000, tokens: 0 },
        };
      default:
        return {
          cot: { acc: 50.0, lat: 0.35, flops: 150000, tokens: 5 },
          latent: { acc: 25.0, lat: 0.25, flops: 100000, tokens: 0 },
        };
    }
  };

  const currentMetrics = getMetrics(budgetK);

  return (
    <div className="workbench-viewport" style={{ border: '1px solid var(--border-medium)', background: 'var(--bg-surface)' }}>
      {/* Viewport Top Bar */}
      <div className="workbench-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 1rem',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-medium)',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Cpu size={15} style={{ color: 'var(--text-accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            DUAL REASONING WORKBENCH: PARALLEL COMPUTATION
          </span>
          <EvidenceBadge type="PRECOMPUTED" />
        </div>

        {/* Synchronized bjjet Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--font-mono)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            SYNCHRONIZED BUDGET k:
          </span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 4, 8, 12, 16].map((k) => (
              <button
                key={k}
                className={`btn-instrument ${budgetK === k ? 'active' : ''}`}
                onClick={() => {
                  setBudgetK(k);
                  setSelectedItem(null);
                }}
                style={{
                  padding: '2px 7px',
                  fontSize: '0.72rem',
                  fontWeight: budgetK === k ? 700 : 400,
                  background: budgetK === k ? 'var(--text-accent)' : 'var(--bg-viewport)',
                  color: budgetK === k ? '#000000' : 'var(--text-secondary)',
                  border: `1px solid ${budgetK === k ? 'var(--text-accent)' : 'var(--border-subtle)'}`,
                }}
              >
                k={k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Synchronized Computational Readout Bar */}
      <div style={{
        padding: '0.4rem 1rem',
        background: 'var(--bg-viewport)',
        borderBottom: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        color: 'var(--text-secondary)',
      }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div>
            CoT: <strong>{currentMetrics.cot.acc}% acc</strong> | {currentMetrics.cot.lat} ms | {currentMetrics.cot.flops.toLocaleString()} FLOPs | {currentMetrics.cot.tokens} tokens
          </div>
          <div style={{ width: '1px', height: '12px', background: 'var(--border-medium)' }} />
          <div>
            Latent: <strong>{currentMetrics.latent.acc}% acc</strong> | {currentMetrics.latent.lat} ms | {currentMetrics.latent.flops.toLocaleString()} FLOPs | 0 tokens
          </div>
        </div>
        <div style={{ color: 'var(--warning-color)', fontSize: '0.68rem', fontWeight: 600 }}>
          *Same nominal k; not latency-matched compute.
        </div>
      </div>

      {/* Split Workbench: Machine 1 vs Machine 2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        background: 'var(--bg-viewport)',
        gap: '1px',
      }}>
        {/* ======================================================== */}
        {/* LEFT MACHINE: AUTOREGRESSIVE SCRATCHPAD                 */}
        {/* ======================================================== */}
        <div style={{
          background: 'var(--bg-surface)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--border-subtle)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cot-primary)', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--cot-primary)' }}>
                  1. AUTOREGRESSIVE SCRATCHPAD
                </span>
              </div>
              <span className="badge" style={{ background: 'var(--cot-bg)', color: 'var(--cot-primary)', border: '1px solid var(--cot-border)', fontSize: '0.68rem' }}>
                DISCRETE TOKEN GENERATION
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.35 }}>
              Generates discrete reasoning tokens step-by-step. Each token is appended to the KV-cache and provides external context.
            </p>

            {/* Architecture Flow Diagram */}
            <div style={{
              background: 'var(--bg-viewport)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '2px',
              padding: '0.5rem 0.75rem',
              marginBottom: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
            }}>
              <span>INPUT</span> &rarr;
              <span>EMBED</span> &rarr;
              <span>TRANSFORMER</span> &rarr;
              <span style={{ color: 'var(--cot-primary)', fontWeight: 700 }}>GENERATE TOKEN</span> &rarr;
              <span>ANSWER</span>
            </div>

            {/* Selectable Token Emission Machine */}
            <div style={{
              background: 'var(--bg-viewport)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                GENERATED REASONING TOKENS (CLICK TO INSPECT):
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                {activeCoTTokens.map((tok, idx) => {
                  const isSelected = selectedItem?.type === 'token' && selectedItem.index === idx;
                  return (
                    <button
                      key={`cot-tok-${idx}`}
                      onClick={() => setSelectedItem({
                        type: 'token',
                        index: idx,
                        label: tok.label,
                        step: tok.step,
                        groundTruth: tok.gt,
                        prob: tok.prob,
                        isCorrect: true,
                      })}
                      style={{
                        background: isSelected 
                          ? 'var(--text-accent)' 
                          : 'var(--cot-bg)',
                        color: isSelected 
                          ? '#000000' 
                          : 'var(--cot-primary)',
                        border: `1px solid ${isSelected ? 'var(--text-accent)' : 'var(--cot-border)'}`,
                        borderRadius: '2px',
                        padding: '4px 7px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transition: 'all 0.1s ease',
                      }}
                      title={`Inspect token #${idx + 1}: ${tok.label}`}
                    >
                      <span style={{ fontSize: '0.6rem', fontWeight: 400, opacity: 0.8 }}>
                        #{idx + 1}
                      </span>
                      <span>{tok.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Machine Output Deck */}
          <div style={{
            background: 'var(--bg-viewport)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '2px',
            padding: '0.6rem 0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span className="telemetry-label" style={{ fontSize: '0.68rem' }}>TARGET GROUND TRUTH:</span>
              <strong style={{ color: 'var(--ground-truth-primary)' }}>{groundTruthTarget}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span className="telemetry-label" style={{ fontSize: '0.68rem' }}>SCRATCHPAD PREDICTION:</span>
              <strong style={{ color: isCoTCorrect ? 'var(--accent-color)' : 'var(--danger-color)' }}>
                {finalCoTPrediction} ({isCoTCorrect ? 'CORRECT' : 'INCOMPLETE'})
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="telemetry-label" style={{ fontSize: '0.68rem' }}>POPULATION ACCURACY (1M):</span>
              <strong style={{ color: 'var(--cot-primary)' }}>{currentMetrics.cot.acc.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT MACHINE: RECURRENT LATENT REASONER                 */}
        {/* ======================================================== */}
        <div style={{
          background: 'var(--bg-surface)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--latent-primary)', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--latent-primary)' }}>
                  2. RECURRENT LATENT REASONER
                </span>
              </div>
              <span className="badge" style={{ background: 'var(--latent-bg)', color: 'var(--latent-primary)', border: '1px solid var(--latent-border)', fontSize: '0.68rem' }}>
                CONTINUOUS INTERNAL VECTOR
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.35 }}>
              Spends budget by recurrently transforming continuous state $h_t$ in-place. No visible scratchpad tokens are generated.
            </p>

            {/* Architecture Flow Diagram */}
            <div style={{
              background: 'var(--bg-viewport)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '2px',
              padding: '0.5rem 0.75rem',
              marginBottom: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
            }}>
              <span>INPUT</span> &rarr;
              <span>MEMORY</span> &rarr;
              <span style={{ color: 'var(--latent-primary)', fontWeight: 700 }}>RECURRENT S_t</span> &rarr;
              <span>UPDATE</span> &rarr;
              <span>READOUT</span> &rarr;
              <span>ANSWER</span>
            </div>

            {/* Selectable Continuous Latent Recurrent haaalats */}
            <div style={{
              background: 'var(--bg-viewport)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                RECURRENT LATENT STATES (CLICK TO INSPECT):
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                {latentStatesList.map((state) => {
                  const isSelected = selectedItem?.type === 'latent' && selectedItem.step === state.step;
                  const isStabilized = state.deltaNorm < 0.05 && state.step > 0;
                  return (
                    <button
                      key={`latent-st-${state.step}`}
                      onClick={() => setSelectedItem({
                        type: 'latent',
                        step: state.step,
                        label: state.label,
                        l2Norm: state.l2Norm,
                        deltaNorm: state.deltaNorm,
                        cosSim: state.cosSim,
                        topPrediction: state.topPrediction,
                        groundTruth: state.groundTruth,
                        isCorrect: state.isCorrect,
                      })}
                      style={{
                        background: isSelected 
                          ? 'var(--text-accent)' 
                          : 'var(--latent-bg)',
                        color: isSelected 
                          ? '#000000' 
                          : 'var(--latent-primary)',
                        border: `1px solid ${isSelected ? 'var(--text-accent)' : isStabilized ? 'rgba(16, 185, 129, 0.4)' : 'var(--latent-border)'}`,
                        borderRadius: '2px',
                        padding: '4px 7px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transition: 'all 0.1s ease',
                      }}
                      title={`Inspect latent state ${state.label}`}
                    >
                      <span style={{ fontSize: '0.6rem', fontWeight: 400, opacity: 0.8 }}>
                        {state.label}
                      </span>
                      <span style={{ fontSize: '0.65rem' }}>
                        {state.step === 0 ? 'init' : `Δ${state.deltaNorm.toFixed(2)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Machine Output Deck */}
          <div style={{
            background: 'var(--bg-viewport)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '2px',
            padding: '0.6rem 0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span className="telemetry-label" style={{ fontSize: '0.68rem' }}>TARGET GROUND TRUTH:</span>
              <strong style={{ color: 'var(--ground-truth-primary)' }}>{groundTruthTarget}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span className="telemetry-label" style={{ fontSize: '0.68rem' }}>LATENT READOUT HEAD:</span>
              <strong style={{ color: isLatentCorrect ? 'var(--accent-color)' : 'var(--danger-color)' }}>
                {finalLatentState.topPrediction} ({isLatentCorrect ? 'CORRECT' : 'MISMATCH'})
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="telemetry-label" style={{ fontSize: '0.68rem' }}>POPULATION ACCURACY (1M):</span>
              <strong style={{ color: 'var(--latent-primary)' }}>{currentMetrics.latent.acc.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Floating haaalat Inspector if an Item h Selected */}
      {selectedItem && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--bg-viewport)',
          borderTop: '1px solid var(--border-medium)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          {selectedItem.type === 'token' ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--cot-primary)' }}>
                INSPECTED TOKEN: {selectedItem.label} (STEP {selectedItem.step})
              </div>
              <div>Ground Truth: <strong>{selectedItem.groundTruth}</strong></div>
              <div>Softmax Prob: <strong>{(selectedItem.prob * 100).toFixed(1)}%</strong></div>
              <div style={{ color: 'var(--accent-color)' }}>[MATCH]</div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--latent-primary)' }}>
                INSPECTED LATENT STATE: {selectedItem.label} (STEP {selectedItem.step})
              </div>
              <div>||H_t||_2: <strong>{selectedItem.l2Norm}</strong></div>
              <div>||&Delta;(H_t, H_(t-1))||: <strong>{selectedItem.deltaNorm}</strong></div>
              <div>cos(H_t, H_(t-1)): <strong>{selectedItem.cosSim}</strong></div>
              <div>Top Readout: <strong>{selectedItem.topPrediction}</strong></div>
            </div>
          )}

          <button
            onClick={() => setSelectedItem(null)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-tertiary)',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '0.68rem',
            }}
          >
            CLOSE
          </button>
        </div>
      )}

      {/* Divergence Learning Callout */}
      <div style={{
        padding: '0.75rem 1.25rem',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
      }}>
        <AlertTriangle size={15} style={{ color: 'var(--warning-color)', flexShrink: 0 }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          <strong>The Divergence Phenomenon:</strong> When budget $k$ increases from $1$ to $16$, CoT scales from <strong>{getMetrics(1).cot.acc}%</strong> to <strong>{getMetrics(16).cot.acc}%</strong>, while Latent saturates around <strong>{getMetrics(16).latent.acc}%</strong>. More compute does not guarantee the same scaling mechanism.
        </span>
      </div>

      {/* Progressive Disclosure: Inspect Traces */}
      <div className="disclosure-section" style={{ margin: 0, borderTop: '1px solid var(--border-subtle)', borderRadius: 0 }}>
        <button
          className="disclosure-trigger"
          onClick={() => setShowInspection(!showInspection)}
        >
          <span>INSPECT COMPUTATION: MECHANISTIC CONTRAST</span>
          {showInspection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showInspection && (
          <div className="disclosure-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', fontSize: '0.78rem' }}>
              <div>
                <h4 style={{ color: 'var(--cot-primary)', marginBottom: '0.4rem' }}>
                  Autoregressive Scratchpad Mechanism
                </h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  Every generated token $y_t$ extends the input sequence length, allowing full multi-head self-attention over historical scratchpad positions.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--latent-primary)', marginBottom: '0.4rem' }}>
                  Recurrent Latent Core Mechanism
                </h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  The internal state vector $h_t$ is updated in-place via recurrent layers. In our tests, recurrent updates rapidly contract ($\|\Delta h\| \to 0$), producing saturation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progressive Disclosure: Technical Details */}
      <div className="disclosure-section" style={{ margin: 0, borderTop: '1px solid var(--border-subtle)', borderRadius: 0 }}>
        <button
          className="disclosure-trigger"
          onClick={() => setShowTechnical(!showTechnical)}
        >
          <span>TECHNICAL DETAILS: FORMAL SPECIFICATIONS</span>
          {showTechnical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnical && (
          <div className="disclosure-content" style={{ fontSize: '0.78rem' }}>
            <p>
              <strong>Autoregressive Scratchpad:</strong>
            </p>
            <div style={{ background: 'var(--bg-viewport)', padding: '0.5rem', fontFamily: 'var(--font-mono)', margin: '0.4rem 0' }}>
              p(y_1, \dots, y_k \mid x) = \prod_{'{t=1}'}^k p(y_t \mid x, y_{'{<t}'})
            </div>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>Recurrent Latent Reasoner:</strong>
            </p>
            <div style={{ background: 'var(--bg-viewport)', padding: '0.5rem', fontFamily: 'var(--font-mono)', margin: '0.4rem 0' }}>
              h_t = f_\theta(h_{'{t-1}'}, x), \quad t = 1, \dots, k
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
