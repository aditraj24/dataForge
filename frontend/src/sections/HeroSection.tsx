import React from 'react';
import { ArrowDown, Cpu, Sparkles, Terminal, RefreshCw } from 'lucide-react';
import { EvidenceBadge } from '../components/EvidenceBadge';

interface HeroSectionProps {
  onExploreClick: () => void;
  onLabClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick, onLabClick }) => {
  return (
    <section className="section-wrapper" style={{ paddingTop: '4rem' }}>
      <div className="essay-container" style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <EvidenceBadge level="OBSERVED" />
          <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            EMPIRICAL REASONING FRONTIER STUDY
          </span>
        </div>

        <h1 style={{ fontSize: '3.25rem', marginBottom: '1.25rem', lineHeight: 1.15 }}>
          THE THINKING BUDGET
        </h1>

        <p style={{
          fontSize: '1.35rem',
          color: 'var(--text-secondary)',
          maxWidth: '780px',
          margin: '0 auto 2.5rem auto',
          lineHeight: 1.6
        }}>
          When we give an artificial intelligence extra computation at inference time to solve multi-step algorithmic problems, <strong style={{ color: 'var(--text-primary)' }}>how should that compute be spent?</strong>
        </p>

        {/* Dual Computational Paths Comparison Graphic */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          maxWidth: '860px',
          margin: '0 auto 2.5rem auto',
          textAlign: 'left'
        }}>
          {/* Path A: Explicit Reasoning (CoT) */}
          <div className="card" style={{
            borderTop: '4px solid var(--cot-primary)',
            backgroundColor: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={18} color="var(--cot-primary)" />
                <h3 style={{ color: 'var(--cot-primary)', fontSize: '1.15rem' }}>Explicit Scratchpad</h3>
              </div>
              <EvidenceBadge level="ILLUSTRATION" />
            </div>

            <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
              Autoregressive Chain-of-Thought generates sequential, discrete reasoning tokens before emitting an answer.
            </p>

            {/* Visual Token Stream */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem'
            }}>
              <div style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}>
                Problem Input
              </div>
              <ArrowDown size={14} color="var(--cot-primary)" />
              <div style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--cot-primary)', border: '1px solid var(--cot-border)' }}>
                token_1 &nbsp;(v_1)
              </div>
              <ArrowDown size={14} color="var(--cot-primary)" />
              <div style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--cot-primary)', border: '1px solid var(--cot-border)' }}>
                token_2 &nbsp;(v_2)
              </div>
              <ArrowDown size={14} color="var(--cot-primary)" />
              <div style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--cot-primary)', border: '1px solid var(--cot-border)' }}>
                token_k &nbsp;(v_k)
              </div>
              <ArrowDown size={14} color="var(--cot-primary)" />
              <div style={{ padding: '0.3rem 0.8rem', borderRadius: '4px', backgroundColor: 'var(--cot-primary)', color: '#ffffff', fontWeight: 700 }}>
                Answer Token
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.75rem', textAlign: 'center' }}>
              Conceptual illustration: O(k) forward passes, expanding KV cache
            </div>
          </div>

          {/* Path B: Latent Reasoning */}
          <div className="card" style={{
            borderTop: '4px solid var(--latent-primary)',
            backgroundColor: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={18} color="var(--latent-primary)" />
                <h3 style={{ color: 'var(--latent-primary)', fontSize: '1.15rem' }}>Latent State Recurrence</h3>
              </div>
              <EvidenceBadge level="ILLUSTRATION" />
            </div>

            <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
              Recurrent Latent Reasoner updates a continuous hidden state vector across recurrent steps without verbalizing.
            </p>

            {/* Visual Latent Loop */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem'
            }}>
              <div style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}>
                Problem Input
              </div>
              <ArrowDown size={14} color="var(--latent-primary)" />
              <div style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--latent-primary)', border: '1px solid var(--latent-border)' }}>
                State h_1 &nbsp;= f(h_0, M)
              </div>
              <ArrowDown size={14} color="var(--latent-primary)" />
              <div style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--latent-primary)', border: '1px solid var(--latent-border)' }}>
                State h_2 &nbsp;= f(h_1, M)
              </div>
              <ArrowDown size={14} color="var(--latent-primary)" />
              <div style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--latent-primary)', border: '1px solid var(--latent-border)' }}>
                State h_k &nbsp;= f(h_&#123;k-1&#125;, M)
              </div>
              <ArrowDown size={14} color="var(--latent-primary)" />
              <div style={{ padding: '0.3rem 0.8rem', borderRadius: '4px', backgroundColor: 'var(--latent-primary)', color: '#ffffff', fontWeight: 700 }}>
                Answer Readout
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.75rem', textAlign: 'center' }}>
              Conceptual illustration: Constant memory footprint, no emitted tokens
            </div>
          </div>
        </div>

        {/* Call ko Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={onExploreClick} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            <span>Start Interactive Visual Essay</span>
            <ArrowDown size={16} />
          </button>
          <button onClick={onLabClick} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            <Cpu size={16} />
            <span>Jump to Simulation Lab</span>
          </button>
        </div>
      </div>
    </section>
  );
};
