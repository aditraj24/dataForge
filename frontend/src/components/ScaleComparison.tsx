import React from 'react';
import { SCALE_TRAJECTORY_K16 } from '../data/precomputed';
import { EvidenceBadge } from './EvidenceBadge';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ScaleComparison: React.FC = () => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1.25rem'
    }}>
      {SCALE_TRAJECTORY_K16.map((item, idx) => {
        const isRecovery = item.scale.includes('Recovery');
        const isConfounded = item.scale.includes('Original');

        return (
          <div
            key={idx}
            className="card"
            style={{
              backgroundColor: isRecovery
                ? 'rgba(59, 130, 246, 0.05)'
                : isConfounded
                ? 'rgba(239, 68, 68, 0.04)'
                : 'var(--bg-surface)',
              borderColor: isRecovery
                ? 'var(--cot-border)'
                : isConfounded
                ? 'rgba(239, 68, 68, 0.3)'
                : 'var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                {item.status}
              </span>
              {isRecovery ? (
                <EvidenceBadge level="RECOVERY" />
              ) : isConfounded ? (
                <EvidenceBadge level="HISTORICAL" />
              ) : (
                <EvidenceBadge level="OBSERVED" />
              )}
            </div>

            <h4 style={{ color: 'var(--text-primary)' }}>{item.scale}</h4>

            {/* CoT Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--cot-primary)', fontWeight: 600 }}>Autoregressive CoT</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.cot.toFixed(2)}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${item.cot}%`,
                  backgroundColor: 'var(--cot-primary)',
                  borderRadius: '4px',
                  transition: 'width var(--transition-normal)'
                }} />
              </div>
            </div>

            {/* Latent Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--latent-primary)', fontWeight: 600 }}>Recurrent Latent</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.latent.toFixed(2)}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${item.latent}%`,
                  backgroundColor: 'var(--latent-primary)',
                  borderRadius: '4px',
                  transition: 'width var(--transition-normal)'
                }} />
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'auto', paddingTop: '0.5rem' }}>
              {isRecovery ? (
                <span style={{ color: 'var(--text-accent)' }}>&bull; Warmup + cosine decay resolved underfitting.</span>
              ) : isConfounded ? (
                <span style={{ color: 'var(--incorrect-color)' }}>&bull; Static AdamW underfit wider d=544 transformer.</span>
              ) : (
                <span>&bull; Task A tested across 5 seeds at max budget k=16.</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
