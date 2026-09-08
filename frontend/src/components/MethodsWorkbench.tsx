import React from 'react';
import { BookOpen, Cpu, ShieldCheck, FileText, AlertTriangle, Terminal } from 'lucide-react';

export const MethodsWorkbench: React.FC = () => {
  return (
    <div className="workbench-viewport" style={{ border: '1px solid var(--border-medium)' }}>
      {/* Top Bar */}
      <div className="workbench-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={15} style={{ color: 'var(--text-accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            METHODS, SPECIFICATIONS &amp; PRIMARY SOURCES
          </span>
          <span className="badge badge-observed">REPRODUCIBILITY SPECIFICATION</span>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          REVISION: <span style={{ color: 'var(--text-accent)' }}>PHASE 21 • PASS 2</span>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        padding: '1.5rem',
        background: 'var(--bg-viewport)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Module 1: Experimental Protocols */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <FileText size={15} style={{ color: 'var(--text-accent)' }} />
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              EXPERIMENTAL PROTOCOLS
            </h4>
          </div>
          <ul style={{ paddingLeft: '1.15rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.7' }}>
            <li><strong>Test Evaluation:</strong> 1,000 fixed deterministic test instances per task generated under <code>TEST_SEED = 999</code>.</li>
            <li><strong>Seeds:</strong> 5 independent training runs per scale (42, 43, 44, 45, 46) evaluating mean accuracy and standard error (&plusmn; SEM).</li>
            <li><strong>Inference Budgets:</strong> k &isin; &#123;1, 2, 4, 8, 12, 16&#125;.</li>
            <li><strong>Optimization (Baseline &amp; 1M):</strong> 20 epochs (2,500 steps), AdamW optimizer, &eta;=10^-3, cosine decay.</li>
            <li><strong>Optimization (5M Recovery):</strong> 50 epochs (6,250 steps), peak &eta;=5 &times; 10^-4, 5-epoch linear warmup, cosine annealing to 10^-5, gradient clipping &le; 1.0.</li>
          </ul>
        </div>

        {/* Module 2: Profiling & Hardwhn */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Cpu size={15} style={{ color: 'var(--text-accent)' }} />
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              HARDWARE &amp; TIMING SPECIFICATION
            </h4>
          </div>
          <ul style={{ paddingLeft: '1.15rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.7' }}>
            <li><strong>Compute Hardware:</strong> Dedicated NVIDIA GeForce RTX 4060 Laptop GPU (Ada Lovelace, 8GB VRAM).</li>
            <li><strong>Profiling Protocol:</strong> 5-batch GPU warmup, explicit <code>torch.cuda.synchronize()</code>, and microsecond-precision <code>torch.cuda.Event</code> elapsed timing.</li>
            <li><strong>Analytical FLOPs:</strong> Standard 2 &times; MACs calculated from layer matrix multiplications (Q, K, V, projection, and MLP feedforward).</li>
            <li><strong>Monetary Cost Boundary:</strong> Dollar / billing costs were not evaluated; compute is strictly measured in physical latency (ms) and analytical operations.</li>
          </ul>
        </div>

        {/* Module 3: Guardrails & Limitations */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={15} style={{ color: 'var(--warning-color)' }} />
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              RESEARCH BOUNDARIES &amp; LIMITATIONS
            </h4>
          </div>
          <ul style={{ paddingLeft: '1.15rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.7' }}>
            <li><strong>Task B Status:</strong> Inconclusive. Model accuracies between 10% and 18.6% on modular arithmetic are within noise of the 10% random chance baseline.</li>
            <li><strong>5M Confounding:</strong> Recovery confirmed optimization was the cause of original failure, but changing multiple variables prevents attributing recovery to a single hyperparameter.</li>
            <li><strong>State Contraction:</strong> Vanishing delta ||&Delta;h|| &rarr; 0 reflects numerical stabilization, not a formal mathematical contractive mapping.</li>
          </ul>
        </div>

        {/* Module 4: Literature Citations */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <BookOpen size={15} style={{ color: 'var(--text-accent)' }} />
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              PRIMARY LITERATURE CITATIONS
            </h4>
          </div>
          <ul style={{ paddingLeft: '1.15rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.7' }}>
            <li>Wei et al. (2022). <em>Chain-of-Thought Prompting Elicits Reasoning in Large Language Models.</em> NeurIPS.</li>
            <li>Snell et al. (2024). <em>Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Parameters.</em> arXiv:2408.03314.</li>
            <li>Banino et al. (2021). <em>PonderNet: Learning to Ponder.</em> arXiv:2107.05407.</li>
            <li>He et al. (2024). <em>Biological Dual-Hemisphere Architecture (BDH / BDH-CQ).</em> Independent educational illustration.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
