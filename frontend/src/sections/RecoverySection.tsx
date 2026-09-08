import React from 'react';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export const RecoverySection: React.FC = () => {
  return (
    <section id="section-recovery" className="section-wrapper">
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 08</span>
            <span>&bull;</span>
            <span>The Optimization Audit</span>
          </div>
          <h2 className="section-title">Wait. What Happened to the Original 5M Experiment?</h2>
          <p className="section-lead">
            When scaling to 5M parameters, the initial experiment appeared catastrophic: both models stalled at ~13% accuracy (barely above the 12.5% chance baseline). Was this an architectural failure or an optimization failure?
          </p>
        </div>

        {/* Side-by-side Comparison Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Confounded chelao */}
          <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#ef4444" />
                <h4 style={{ color: '#ef4444' }}>5M Original (Confounded)</h4>
              </div>
              <EvidenceBadge level="HISTORICAL" />
            </div>

            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Trained using the fixed 20-epoch (2,500 step) static AdamW recipe from the 126K baseline without warmup or decay.
            </p>

            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem'
            }}>
              <div>CoT Task A (k=16): <strong style={{ color: '#ef4444' }}>13.64% &plusmn; 0.94%</strong></div>
              <div>Latent Task A (k=16): <strong style={{ color: '#ef4444' }}>12.46% &plusmn; 0.49%</strong></div>
              <div>Final CoT Loss: <span style={{ color: 'var(--text-tertiary)' }}>1.35 &ndash; 1.57</span></div>
              <div>Final Latent Loss: <span style={{ color: 'var(--text-tertiary)' }}>~2.079 (Chance entropy ln 8)</span></div>
            </div>
          </div>

          {/* Recovery chelao */}
          <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="#3b82f6" />
                <h4 style={{ color: '#3b82f6' }}>5M Recovery (Controlled Recovery Condition)</h4>
              </div>
              <EvidenceBadge level="RECOVERY" />
            </div>

            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Re-trained under a controlled 50-epoch (6,250 step) schedule with 5-epoch linear warmup and cosine decay to $10^{-5}$.
            </p>

            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem'
            }}>
              <div>CoT Task A (k=16): <strong style={{ color: 'var(--cot-primary)' }}>99.74% &plusmn; 0.48%</strong></div>
              <div>Latent Task A (k=16): <strong style={{ color: 'var(--latent-primary)' }}>33.92% &plusmn; 0.84%</strong></div>
              <div>Final CoT Loss: <span style={{ color: 'var(--text-tertiary)' }}>0.6069 &plusmn; 0.0057</span></div>
              <div>Final Latent Loss: <span style={{ color: 'var(--text-tertiary)' }}>1.8890 &plusmn; 0.0129</span></div>
            </div>
          </div>
        </div>

        {/* Epistemological Breakdown */}
        <div className="card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ color: 'var(--text-primary)' }}>Scientific Takeaways &amp; Claim Boundaries</h4>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <EvidenceBadge level="OBSERVED" />
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              The original 5M result was poor (~13%). The recovery condition restored CoT Task-A accuracy to <strong>99.74%</strong>, while Latent stabilized at <strong>33.92%</strong> (matching 126K and 1M plateaus).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <EvidenceBadge level="HYPOTHESIS" />
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              The original 5M breakdown was strongly attributable to inadequate optimization budget and lack of a learning rate schedule for the wider ($d=544$) parameter space, rather than an architectural scaling collapse.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <EvidenceBadge level="INCONCLUSIVE" />
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              Because multiple training variables changed simultaneously (epochs: 20 &rarr; 50; lr: 1e-3 &rarr; 5e-4; schedule: static &rarr; warmup+cosine), the experiment does <em>not</em> isolate which individual variable was the primary driver of recovery.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
