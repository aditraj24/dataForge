import React from 'react';
import { TraceContainer, TokenTraceStep } from '../types';
import { Terminal, Check, X, Clock, Zap } from 'lucide-react';

interface TraceViewerCoTProps {
  trace: TraceContainer;
  latencyMs: number;
  analyticalFlops: number;
  correct: boolean;
  predictedAnswer: string;
  expectedAnswer: string;
  budgetK: number;
}

export const TraceViewerCoT: React.FC<TraceViewerCoTProps> = ({
  trace,
  latencyMs,
  analyticalFlops,
  correct,
  predictedAnswer,
  expectedAnswer,
  budgetK
}) => {
  const steps = (trace.steps || []) as TokenTraceStep[];
  const reasoningSteps = steps.filter(s => s.token_type === 'reasoning_step');
  const earlyTerminated = steps.some(s => s.token_type === 'think_end');

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
            backgroundColor: 'var(--cot-bg)',
            color: 'var(--cot-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Terminal size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--cot-primary)' }}>
              Autoregressive CoT Scratchpad
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Explicit discrete token emission (Budget max k={budgetK})
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
        <div>
          <span>Emitted tokens: <strong style={{ color: 'var(--text-primary)' }}>{reasoningSteps.length}</strong></span>
          {earlyTerminated && <span style={{ color: 'var(--latent-primary)', marginLeft: '0.35rem' }}>(Halted at END_THINK)</span>}
        </div>
      </div>

      {/* Token Stream Container */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '1rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        overflowX: 'auto'
      }}>
        <div style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
          GENERATED SCRATCHPAD TOKEN SEQUENCE:
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          {steps.map((step, idx) => {
            const isReasoning = step.token_type === 'reasoning_step';
            const isMarker = step.token_type === 'think_start' || step.token_type === 'think_end' || step.token_type === 'ans_prefix';
            const isAnswer = step.token_type === 'answer';

            return (
              <div
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: isAnswer
                    ? (correct ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)')
                    : isReasoning
                    ? 'rgba(59, 130, 246, 0.2)'
                    : isMarker
                    ? 'var(--bg-surface-elevated)'
                    : 'var(--bg-surface)',
                  border: isAnswer
                    ? (correct ? '1px solid #10b981' : '1px solid #ef4444')
                    : isReasoning
                    ? '1px solid var(--cot-primary)'
                    : '1px solid var(--border-medium)',
                  color: isAnswer
                    ? (correct ? '#10b981' : '#ef4444')
                    : isReasoning
                    ? 'var(--cot-primary)'
                    : 'var(--text-tertiary)',
                  fontSize: '0.85rem',
                  fontWeight: isReasoning || isAnswer ? 700 : 400
                }}
                title={`Token: ${step.token_str} (ID: ${step.token_id}, Type: ${step.token_type})`}
              >
                {step.token_str}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
