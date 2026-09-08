import React from 'react';
import { ScaleComparison } from '../components/ScaleComparison';
import { EvidenceBadge } from '../components/EvidenceBadge';

export const CapacitySection: React.FC = () => {
  return (
    <section id="section-capacity" className="section-wrapper">
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 07</span>
            <span>&bull;</span>
            <span>Capacity Scaling</span>
          </div>
          <h2 className="section-title">Does Model Capacity Change the Story?</h2>
          <p className="section-lead">
            Could the ~33% latent ceiling simply be a consequence of parameter starvation? To test this, model capacity was expanded 8&times; (~1M parameters) and 40&times; (~5M parameters) under strictly matched parameter budgets.
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <ScaleComparison />
        </div>

        {/* Strict Parameter Matching Table */}
        <div className="card" style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              PROGRAMMATIC PARAMETER MATCHING PROTOCOL
            </span>
            <EvidenceBadge level="OBSERVED" />
          </div>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Regime</th>
                <th style={{ padding: '0.5rem' }}>Hidden Dim (d)</th>
                <th style={{ padding: '0.5rem' }}>CoT Parameters</th>
                <th style={{ padding: '0.5rem' }}>Latent Parameters</th>
                <th style={{ padding: '0.5rem' }}>Parameter Delta (&Delta;)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>126K Baseline</td>
                <td style={{ padding: '0.5rem' }}>d = 80</td>
                <td style={{ padding: '0.5rem', color: 'var(--cot-primary)' }}>126,168</td>
                <td style={{ padding: '0.5rem', color: 'var(--latent-primary)' }}>125,688</td>
                <td style={{ padding: '0.5rem' }}>-480 params (-0.38%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>1M Scaling</td>
                <td style={{ padding: '0.5rem' }}>d = 224</td>
                <td style={{ padding: '0.5rem', color: 'var(--cot-primary)' }}>998,520</td>
                <td style={{ padding: '0.5rem', color: 'var(--latent-primary)' }}>998,523</td>
                <td style={{ padding: '0.5rem' }}>+3 params (+0.0003%)</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>5M Recovery</td>
                <td style={{ padding: '0.5rem' }}>d = 544</td>
                <td style={{ padding: '0.5rem', color: 'var(--cot-primary)' }}>5,000,632</td>
                <td style={{ padding: '0.5rem', color: 'var(--latent-primary)' }}>5,000,635</td>
                <td style={{ padding: '0.5rem' }}>+3 params (+0.00006%)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="callout callout-success">
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            Core Scaling Observation
          </strong>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Under the tested training conditions, the latent implementation remains near the same Task-A accuracy regime (33.06% &rarr; 31.12% &rarr; 33.92%) while Autoregressive CoT improves strongly with capacity (73.36% &rarr; 76.70% &rarr; 99.74%).
          </p>
        </div>
      </div>
    </section>
  );
};
