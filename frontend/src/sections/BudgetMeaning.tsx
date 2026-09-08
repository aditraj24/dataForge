import React from 'react';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { Clock, Zap, Terminal, RefreshCw, AlertCircle } from 'lucide-react';

export const BudgetMeaning: React.FC = () => {
  return (
    <section id="section-budget" className="section-wrapper">
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 05</span>
            <span>&bull;</span>
            <span>Methodological Precision</span>
          </div>
          <h2 className="section-title">What Does $k$ Actually Mean?</h2>
          <p className="section-lead">
            In reasoning research, "inference compute budget" is controlled by a test-time hyperparameter k &isin; &#123;1, 2, 4, 8, 12, 16&#125;. But what physical computation does k represent in each paradigm?
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* CoT bjjet Semantics */}
          <div className="card" style={{ borderLeft: '4px solid var(--cot-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Terminal size={18} color="var(--cot-primary)" />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--cot-primary)' }}>In Autoregressive CoT: Max Token Limit</h3>
            </div>
            <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
              $k$ represents the <strong>maximum reasoning tokens</strong> allocated before forcing answer emission.
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <li>Generation proceeds greedily token-by-token.</li>
              <li><strong>Adaptive Halting</strong>: If the model emits <code>END_THINK</code> before step $k$, generation terminates early.</li>
              <li>Compute scales with the <em>actual</em> number of emitted tokens ($s \le k$).</li>
            </ul>
          </div>

          {/* Latent bjjet Semantics */}
          <div className="card" style={{ borderLeft: '4px solid var(--latent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <RefreshCw size={18} color="var(--latent-primary)" />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--latent-primary)' }}>In Recurrent Latent: Recurrent Step Count</h3>
            </div>
            <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
              k represents the <strong>exact number of recurrent updates</strong> applied to the hidden state h<sub>0</sub>.
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <li>Each step executes: Cross-Attention $\to$ GRUCell $\to$ Residual MLP.</li>
              <li><strong>No Adaptive Halting</strong>: The primary model does not have an ACT halting head; it always executes exactly $k$ iterations.</li>
              <li>Compute is strictly deterministic for a given $k$.</li>
            </ul>
          </div>
        </div>

        {/* Warning Callout on deri Matching */}
        <div className="callout callout-warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={18} color="#f59e0b" />
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Non-Negotiable Boundary: Same Nominal $k \neq$ Same Wall-Clock Latency
            </strong>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Because the transformer decoder and the recurrent cross-attention cell have different computational structures, evaluating both models at nominal budget $k=8$ does not mean they consume identical hardware time or FLOPs. Any fair comparison must plot accuracy against actual measured execution latency and FLOPs.
          </p>
        </div>
      </div>
    </section>
  );
};
