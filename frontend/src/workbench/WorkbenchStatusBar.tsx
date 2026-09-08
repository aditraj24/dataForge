import React from 'react';
import { useWorkbench } from './workbenchContext';
import { Activity, Clock, Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';
import { EvidenceBadge } from '../components/EvidenceBadge';

export const WorkbenchStatusBar: React.FC = () => {
  const { telemetry, currentStep } = useWorkbench();

  return (
    <div style={{
      background: 'var(--bg-viewport)',
      borderTop: '1px solid var(--border-medium)',
      padding: '0.35rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.72rem',
      color: 'var(--text-secondary)',
      flexWrap: 'wrap',
      gap: '0.75rem',
    }}>
      {/* Left telemetry cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: telemetry.status === 'running' 
              ? 'var(--accent-color)' 
              : telemetry.status === 'paused' 
              ? 'var(--warning-color)' 
              : 'var(--text-tertiary)',
            display: 'inline-block',
          }} />
          <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>
            STATUS: {telemetry.status}
          </span>
        </div>

        <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />

        <div>
          BUDGET <strong>k = {telemetry.budgetK}</strong>
        </div>

        <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />

        <div>
          STEP <strong>{currentStep} / {telemetry.totalSteps}</strong>
        </div>

        <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} />
          LATENCY: <strong>{telemetry.latencyMs !== undefined ? `${telemetry.latencyMs.toFixed(2)} ms` : '—'}</strong>
        </div>

        <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Cpu size={11} />
          FLOPs: <strong>{telemetry.analyticalFlops !== undefined ? telemetry.analyticalFlops.toLocaleString() : '—'}</strong>
        </div>

        <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Activity size={11} />
          ACCURACY: <strong style={{ color: 'var(--text-accent)' }}>
            {telemetry.accuracy !== undefined ? `${telemetry.accuracy.toFixed(1)}%` : '—'}
          </strong>
        </div>

        {telemetry.groundTruth !== undefined && (
          <>
            <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={11} />
              GT: <strong>{String(telemetry.groundTruth)}</strong>
              {telemetry.modelPrediction !== undefined && (
                <span>(PRED: <strong>{String(telemetry.modelPrediction)}</strong>)</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right telemetry cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>DATA HONESTY:</span>
        <EvidenceBadge level={telemetry.provenance} />
      </div>
    </div>
  );
};
