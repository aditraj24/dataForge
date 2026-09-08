import React from 'react';
import { TraceContainer, LatentTraceStep } from '../types';
import { RefreshCw, Check, X, Clock, Zap, Activity } from 'lucide-react';

interface TraceViewerLatentProps {
  trace: TraceContainer;
  latencyMs: number;
  analyticalFlops: number;
  correct: boolean;
  predictedAnswer: string;
  expectedAnswer: string;
  budgetK: number;
}

export const TraceViewerLatent: React.FC<TraceViewerLatentProps> = ({
  trace,
  latencyMs,
  analyticalFlops,
  correct,
  predictedAnswer,
  expectedAnswer,
  budgetK
}) => {
  const steps = (trace.steps || []) as LatentTraceStep[];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '1.25rem'
    }}>
      {/* Header with Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'var(--latent-bg)',
            color: 'var(--latent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RefreshCw size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--latent-primary)' }}>
              Recurrent Latent Reasoner
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Continuous recurrent hidden state updates (Exact k={budgetK} steps)
            </div>
          </div>
        </div>

        {/* Prediction vs Truth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '6px',
            backgroundColor: correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: correct ? '1px solid #10b981' : '1px solid #ef4444',
            color: correct ? '#10b981' : '#ef4444',
            fontSize: '0.85rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)'
          }}>
            {correct ? <Check size={14} /> : <X size={14} />}
            <span>Prediction: {predictedAnswer}</span>
          </div>

          <div style={{
            padding: '0.3rem 0.65rem',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)'
          }}>
            Truth: {expectedAnswer}
          </div>
        </div>
      </div>

      {/* Profiling telemetry */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        fontSize: '0.8rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-tertiary)',
        padding: '0.5rem 0.75rem',
        backgroundColor: 'var(--bg-surface-elevated)',
        borderRadius: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={14} color="var(--text-accent)" />
          <span>Latency: <strong style={{ color: 'var(--text-primary)' }}>{latencyMs.toFixed(3)} ms</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={14} color="var(--hebbian-primary)" />
          <span>Compute: <strong style={{ color: 'var(--text-primary)' }}>{analyticalFlops.toLocaleString()} FLOPs</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Activity size={14} color="var(--latent-primary)" />
          <span>Recurrent updates: <strong style={{ color: 'var(--text-primary)' }}>{steps.length} steps</strong></span>
        </div>
      </div>

      {/* State Dynamics Table */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '0.85rem',
        overflowX: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-tertiary)',
          marginBottom: '0.5rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)'
        }}>
          <span>RECURRENT STATE VECTOR EVOLUTION (h_1 &rarr; h_k)</span>
          <span>RAPID NUMERICAL STABILIZATION OBSERVED</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '460px' }}>
          {steps.map((s, idx) => {
            const isLast = idx === steps.length - 1;
            const topLogitsStr = s.top_logits
              ? Object.entries(s.top_logits).map(([tok, val]) => `${tok}:${val.toFixed(1)}`).join(', ')
              : '';

            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 100px 100px 1fr',
                  gap: '0.5rem',
                  alignItems: 'center',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  backgroundColor: isLast ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-elevated)',
                  border: isLast ? '1px solid var(--latent-border)' : '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem'
                }}
              >
                <span style={{ color: 'var(--text-tertiary)' }}>Step {s.step_index}</span>
                <span style={{ color: 'var(--text-secondary)' }}>||h||: {s.hidden_norm.toFixed(2)}</span>
                <span style={{ color: isLast ? 'var(--latent-primary)' : 'var(--text-primary)', fontWeight: 700 }}>
                  Head &rarr; {s.predicted_token_str}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Top: [{topLogitsStr}]
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
