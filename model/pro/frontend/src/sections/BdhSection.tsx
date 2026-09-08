import React from 'react';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { MathBlock } from '../components/MathBlock';
import { BrainCircuit, BookOpen, Layers } from 'lucide-react';

export const BdhSection: React.FC = () => {
  return (
    <section id="section-bdh" className="section-wrapper">
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 11</span>
            <span>&bull;</span>
            <span>Theoretical Foundations</span>
          </div>
          <h2 className="section-title">The BDH / BDH-CQ Connection</h2>
          <p className="section-lead">
            Why study internal recurrent states instead of tokens? Understanding biologically inspired continuous computation connects this micro-benchmark to broader frontiers in neuromorphic AI and fast-weight synaptic plasticity.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              What is BDH and Synaptic Plasticity?
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Biological intelligence does not execute reasoning by generating verbal monologue. Instead, neural circuits update <em>fast-weight synaptic connection matrices</em> on the fly during an episode.
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              In BDH architectures, synaptic state matrix &sigma; &isin; &reals;<sup>N &times; D</sup> evolves through outer-product Hebbian association: when pre-synaptic activation <strong>x</strong> and post-synaptic activation <strong>y</strong> co-occur, the connection strengthens.
            </p>

            <MathBlock
              formula="\mathbf{\sigma}_t = \gamma \mathbf{\sigma}_{t-1} + \eta \, (\mathbf{y}_{t-1} \otimes \mathbf{x}_t)"
              explanation="Hebbian outer-product update: Fast-weight synaptic memory accumulates associations dynamically without gradient backpropagation during inference."
            />
          </div>

          <div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              The BDH-CQ Perspective on Test-Time Compute
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <strong>BDH-CQ</strong> (Continuous Query) extends this principle to iterative inference: rather than storing past reasoning in an ever-growing sequence of discrete verbal tokens, inference computation updates an internal continuous state across $k$ recurrent steps.
            </p>

            <div className="card" style={{ borderLeft: '4px solid var(--hebbian-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <BrainCircuit size={18} color="var(--hebbian-primary)" />
                <strong style={{ color: 'var(--text-primary)' }}>Standalone Hebbian Demonstration</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                The repository includes a 20,672-parameter standalone <code>HebbianMemory</code> module demonstrating outer-product fast-weight associative recall in &reals;<sup>64</sup>. It is accessible in the Simulation Lab as an educational mechanism demonstration.
              </p>
            </div>
          </div>
        </div>

        {/* Explicit Non-Negotiable Disclaimer */}
        <div className="callout callout-warning" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <BookOpen size={18} color="#f59e0b" />
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Research Provenance &amp; Attribution Disclaimer
            </strong>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            "This project’s <code>RecurrentLatentReasoner</code> is an independent educational micro-benchmark model, not an official BDH or BDH-CQ implementation." It was designed specifically to contrast cross-attention GRU recurrence against causal transformer scratchpads under strictly capacity-matched conditions.
          </p>
        </div>
      </div>
    </section>
  );
};
