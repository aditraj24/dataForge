import React from 'react';
import { ParetoChart } from '../components/ParetoChart';
import { EvidenceBadge } from '../components/EvidenceBadge';

export const ParetoSection: React.FC = () => {
  return (
    <section id="section-pareto" className="section-wrapper">
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 06</span>
            <span>&bull;</span>
            <span>The Empirical Frontier</span>
          </div>
          <h2 className="section-title">The Observed Accuracy–Compute Frontier</h2>
          <p className="section-lead">
            Comparing architectures fairly requires plotting accuracy directly against physical compute resources. This chart plots GPU wall-clock latency (ms) on an NVIDIA RTX 4060 against Task A accuracy across 1,000 deterministic test instances.
          </p>
        </div>

        <ParetoChart initialScale="126k" />

        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ color: 'var(--latent-primary)', marginBottom: '0.5rem' }}>
              Low-Budget Advantage ($k \le 2$)
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              At $k=2$, the 126K latent model achieved <strong>32.30% accuracy</strong> in <strong>0.130 ms</strong>, whereas CoT achieved 29.70% in 0.190 ms. When compute is tightly bounded, updating a continuous hidden state was both faster and slightly more accurate.
            </p>
          </div>

          <div className="card">
            <h4 style={{ color: 'var(--cot-primary)', marginBottom: '0.5rem' }}>
              Mid-to-High Budget Saturation ($k \ge 4$)
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Beyond $k=2$, latent accuracy plateaus near ~33% ($33.14\% \to 33.06\%$). In contrast, autoregressive scratchpad generation scales monotonically, reaching <strong>73.36% at 126K</strong> and <strong>99.74% at 5M</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
