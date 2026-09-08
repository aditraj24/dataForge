import React from 'react';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { MathBlock } from '../components/MathBlock';

export const ConceptSection: React.FC = () => {
  return (
    <section id="section-concept" className="section-wrapper">
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 02</span>
            <span>&bull;</span>
            <span>The Core Question</span>
          </div>
          <h2 className="section-title">Where Should Test-Time Compute Go?</h2>
          <p className="section-lead">
            Frontier reasoning models (e.g. OpenAI o1/o3, DeepSeek R1) "think" before answering. Standard practice allocates compute by generating explicit reasoning tokens. But is continuous internal state recurrence a viable alternative?
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>The Token Generation Bottleneck</h3>
            <p style={{ marginBottom: '1rem' }}>
              Autoregressive generation incurs real hardware costs: every emitted token requires a sequential forward pass through all model layers, key-value (KV) caches grow linearly with sequence length ($O(L)$ memory, $O(L^2)$ attention), and GPU execution is frequently bound by memory bandwidth.
            </p>
            <p>
              In theory, thinking inside a compact recurrent cell could scale test-time compute across $k$ iterations with constant memory overhead and zero external tokens.
            </p>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>The Measured Finding</h3>
            <div className="card" style={{ borderLeft: '4px solid var(--text-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <EvidenceBadge level="OBSERVED" />
                <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  CONTROLLED EMPIRICAL SUMMARY
                </span>
              </div>
              <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                "Across the tested 126K, 1M, and 5M configurations, recurrent latent computation was competitive at very low budgets ($k \le 2$) but remained near a ~33% Task-A accuracy plateau, while autoregressive scratchpad generation continued to improve with additional computation and model capacity, reaching 99.74% at 5M under the controlled recovery condition."
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                Observed within the tested micro-benchmark; not a universal claim for all architectures or tasks.
              </div>
            </div>
          </div>
        </div>

        <MathBlock
          formula="C_1 \le C_2 \quad \text{and} \quad A_1 \ge A_2 \quad (\text{with at least one strict inequality})"
          explanation="Pareto Dominance: An observed configuration dominates another if it achieves equal or higher accuracy while consuming less or equal compute (measured in milliseconds of isolated GPU latency and analytical FLOPs)."
        />
      </div>
    </section>
  );
};
