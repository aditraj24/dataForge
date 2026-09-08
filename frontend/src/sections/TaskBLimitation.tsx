import React from 'react';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { TASK_B_ACCS } from '../data/precomputed';
import { HelpCircle } from 'lucide-react';

export const TaskBLimitation: React.FC = () => {
  return (
    <section id="section-task-b" className="section-wrapper">
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 10</span>
            <span>&bull;</span>
            <span>Negative &amp; Inconclusive Results</span>
          </div>
          <h2 className="section-title">Task B: Modular Register Arithmetic (Inconclusive)</h2>
          <p className="section-lead">
            In addition to permutation orbits, the study tested multi-step modular register arithmetic modulo 10 (applying <code>ADD</code>, <code>MUL</code>, <code>SUB</code> sequences).
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <EvidenceBadge level="INCONCLUSIVE" />
              <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                RANDOM CHANCE BASELINE = 10.00%
              </span>
            </div>

            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              On Task B, across all budgets $k$ and all parameter scales (126K, 1M, 5M), <strong>both models performed between 10.0% and 18.6% accuracy</strong>.
            </p>

            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              While CoT reached 18.58% at 5M $k=16$, and Latent showed slight advantages at low budget $k=2$ (15.34% vs 12.16%), neither architecture successfully mastered multi-step modular arithmetic under these training conditions.
            </p>

            <div className="callout callout-warning">
              <strong style={{ color: 'var(--text-primary)' }}>Scientific Honesty Policy:</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                "Task B was inconclusive for the scratchpad hypothesis because both systems remained near the 10% random baseline." We do not claim Task B validates explicit symbolic scratchpads.
              </p>
            </div>
          </div>

          {/* Task B sahi Summary Card */}
          <div className="card-elevated">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Task B Accuracy at k=16 vs. Chance</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Chance */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--hebbian-primary)' }}>Uniform Guess (1 in 10)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>10.00%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '10%', backgroundColor: 'var(--hebbian-primary)' }} />
                </div>
              </div>

              {/* 126K */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>126K CoT / Latent</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>12.80% / 12.98%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '13%', backgroundColor: 'var(--border-prominent)' }} />
                </div>
              </div>

              {/* 1M */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>1M CoT / Latent</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>14.18% / 13.84%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '14%', backgroundColor: 'var(--border-prominent)' }} />
                </div>
              </div>

              {/* 5M Recovery */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--cot-primary)' }}>5M Recovery CoT / Latent</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>18.58% / 14.56%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '18.58%', backgroundColor: 'var(--cot-primary)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
