import React from 'react';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { ShieldCheck, BookOpen, Cpu, Info } from 'lucide-react';

export const MethodsSection: React.FC = () => {
  return (
    <section id="section-methods" className="section-wrapper" style={{ borderBottom: 'none' }}>
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 14</span>
            <span>&bull;</span>
            <span>Methodology &amp; Provenance</span>
          </div>
          <h2 className="section-title">Methods, Limitations &amp; Sources</h2>
          <p className="section-lead">
            Full experimental specifications, hardware profiling boundaries, primary literature citations, and research disclosures.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Experimental Setup Card */}
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Experimental Protocols
            </h4>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              <li><strong>Test Dataset</strong>: 1,000 fixed deterministic test instances per task generated with <code>TEST_SEED = 999</code>.</li>
              <li><strong>Seeds</strong>: 5 independent training seeds ($42, 43, 44, 45, 46$).</li>
              <li><strong>Budgets</strong>: k &isin; &#123;1, 2, 4, 8, 12, 16&#125;.</li>
              <li><strong>Baseline / 1M</strong>: 20 epochs (2,500 steps), AdamW $\eta=10^{-3}$.</li>
              <li><strong>5M Recovery</strong>: 50 epochs (6,250 steps), peak $\eta=5 \times 10^{-4}$, 5-epoch linear warmup, cosine decay to $10^{-5}$, gradient clipping $\le 1.0$.</li>
            </ul>
          </div>

          {/* Compute Profiling Card */}
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Compute Profiling &amp; Hardware
            </h4>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              <li><strong>Hardware</strong>: Dedicated NVIDIA GeForce RTX 4060 Laptop GPU.</li>
              <li><strong>Timing Protocol</strong>: 5-batch warmup, explicit <code>torch.cuda.synchronize()</code>, and microsecond-resolution <code>torch.cuda.Event</code> elapsed timing.</li>
              <li><strong>Analytical FLOPs</strong>: 2 &times; MACs calculated from architectural matrix dimensions.</li>
              <li><strong>Cost Boundary</strong>: Financial cloud billing / dollar metrics were not measured.</li>
            </ul>
          </div>
        </div>

        {/* Limitations */}
        <div className="card-elevated" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Info size={18} color="var(--text-accent)" />
            <h4 style={{ color: 'var(--text-primary)' }}>Explicit Research Limitations</h4>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <div>&bull; <strong>Micro-benchmark scope</strong>: Evaluated on synthetic algorithmic tasks (S_8, Z_10), not broad open-domain natural language.</div>
            <div>&bull; <strong>Capacity scale</strong>: Models span 126K to 5M parameters; findings do not establish empirical laws for billion-parameter LLMs.</div>
            <div>&bull; <strong>Fixed-depth recurrence</strong>: The primary latent model lacks an Adaptive Computation Time (ACT) halting head.</div>
            <div>&bull; <strong>Correlation vs Causality</strong>: Attention bias and update contraction are observed behavioral patterns, not causally proven sole failure mechanisms.</div>
          </div>
        </div>

        {/* Primary Literature Sources & AI Disclosure */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Primary Literature &amp; Sources
            </h4>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              <li>Pathway / DataForge 2026: Reasoning &amp; Compute Allocation Track Problem Statement.</li>
              <li>Vaswani et al. (2017): <em>Attention Is All You Need</em>. (Transformer causal decoder architecture).</li>
              <li>Wei et al. (2022): <em>Chain-of-Thought Prompting Elicits Reasoning in Large Language Models</em>.</li>
              <li>Schlag et al. / BDH foundational papers on fast-weight Hebbian associative memory and continuous query state recurrence.</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              AI Assistance &amp; Research Integrity Disclosure
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              In accordance with Pathway / DataForge competition rules, this project discloses that AI coding assistance (Antigravity IDE / Gemini 3.8) was utilized in developing the frontend visual essay, API wrapper, and test suites. All underlying ML models, training schedules, checkpoints, and benchmark results were independently created and frozen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
