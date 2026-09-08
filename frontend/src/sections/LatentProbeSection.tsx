import React from 'react';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { Eye, Search, AlertCircle } from 'lucide-react';

export const LatentProbeSection: React.FC = () => {
  return (
    <section id="section-diagnostics" className="section-wrapper">
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 09</span>
            <span>&bull;</span>
            <span>Mechanistic Interpretability</span>
          </div>
          <h2 className="section-title">Why Does the Latent Model Stop Gaining?</h2>
          <p className="section-lead">
            Probing inside the continuous hidden states of <code>RecurrentLatentReasoner</code> reveals specific numerical phenomena that correlate with the ~33% Task A ceiling.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Finding 1: Numerical Stabilization */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={18} color="var(--latent-primary)" />
                <h4 style={{ color: 'var(--text-primary)' }}>1. State Vector Contraction</h4>
              </div>
              <EvidenceBadge level="OBSERVED" />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              The update magnitude ||h<sub>t</sub> - h<sub>t-1</sub>|| contracts rapidly after steps 1&ndash;2. By step t=4, the cosine similarity between successive hidden vectors approaches &asymp; 0.99.
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Framing: Rapid numerical stabilization (not "proven mathematical fixed point").
            </div>
          </div>

          {/* Finding 2: Addressing Bottleneck */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={18} color="var(--text-accent)" />
                <h4 style={{ color: 'var(--text-primary)' }}>2. Initial Token Attention Bias</h4>
              </div>
              <EvidenceBadge level="OBSERVED" />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              In Task A, the input prompt places the permutation table at positions 1&ndash;8 and the starting node v<sub>0</sub> at position 10. Cross-attention heatmaps show persistent concentration on position 10 rather than dynamically querying position 1 + v<sub>t-1</sub>.
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Consistent with pointer addressing failure in continuous memory.
            </div>
          </div>

          {/* Finding 3: Readout Probe */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} color="var(--hebbian-primary)" />
                <h4 style={{ color: 'var(--text-primary)' }}>3. Evidence Against Readout-Only</h4>
              </div>
              <EvidenceBadge level="OBSERVED" />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              At step $k=1$, intermediate projection logits for the correct $v_1$ remain close to uniform. This indicates that the latent state does <em>not</em> already represent the answer with only the final readout linear head failing.
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Evidence against a simple readout-only bottleneck.
            </div>
          </div>
        </div>

        {/* Causal Boundary Alert */}
        <div className="callout callout-warning">
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            Diagnostic Observation &ne; Causal Proof
          </strong>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            "The largest observed contraction occurs in the cross-attention output, preceding contraction in the recurrent state. This is consistent with an addressing bottleneck, but the experiment does not establish causality." The exact interaction between GRU gating, LayerNorm, and cross-attention remains an open research question.
          </p>
        </div>
      </div>
    </section>
  );
};
