import React, { useState } from 'react';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { PermutationTable } from '../components/PermutationTable';
import { OrbitVisualizer } from '../components/OrbitVisualizer';
import { MathBlock } from '../components/MathBlock';
import { PRESET_TASK_A_EXAMPLE } from '../data/precomputed';

export const PuzzleSection: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  const mapping = PRESET_TASK_A_EXAMPLE.raw_metadata.pi;
  const startNode = PRESET_TASK_A_EXAMPLE.raw_metadata.v0;
  const depth = PRESET_TASK_A_EXAMPLE.raw_metadata.depth;
  const trajectory = PRESET_TASK_A_EXAMPLE.ground_truth_trajectory;
  const expectedAnswer = PRESET_TASK_A_EXAMPLE.expected_answer;

  return (
    <section id="section-puzzle" className="section-wrapper">
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 03</span>
            <span>&bull;</span>
            <span>The Algorithmic Substrate</span>
          </div>
          <h2 className="section-title">Task A: Permutation Orbit Traversal</h2>
          <p className="section-lead">
            To isolate multi-step reasoning without ambiguous natural language priors, the primary benchmark uses state-transition computation over the symmetric group $S_8$.
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <MathBlock
            formula="v_1 = \pi(v_0), \quad v_2 = \pi(v_1), \quad \dots \quad v_D = \pi(v_{D-1}) \implies \text{Predict } v_D = \pi^D(v_0)"
            explanation="A problem instance provides a full permutation mapping π over 8 nodes {0..7}, a starting element v0, and a hop depth D ∈ [2, 16]. The goal is to predict the final destination node v_D."
          />
        </div>

        {/* Permutation Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <PermutationTable
            mapping={mapping}
            activeSource={selectedNode}
            activeTarget={selectedNode !== null ? mapping[selectedNode] : null}
            onSelectNode={node => setSelectedNode(node)}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', textAlign: 'right' }}>
            Click any node above to inspect its direct mapping &pi;(v). Chance guess baseline = 12.50% (1 in 8).
          </div>
        </div>

        {/* Orbit Visualizer */}
        <OrbitVisualizer
          mapping={mapping}
          startNode={startNode}
          depth={depth}
          trajectory={trajectory}
          finalAnswer={expectedAnswer}
        />

        <div className="callout" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <EvidenceBadge level="OBSERVED" />
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              Ground Truth vs. Model Computation
            </strong>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            The mathematical trajectory ($0 \to 3 \to 6 \to 1 \to 7 \to 4 \to 5$) is the <em>objective ground truth</em>. The models do not observe this trajectory at test time; they receive only the prompt vector:
            <code style={{ marginLeft: '0.35rem', color: 'var(--text-accent)' }}>
              [MAP, 3, 7, 0, 6, 2, 1, 5, 4, START, 0, HOPS, 6]
            </code>
          </p>
        </div>
      </div>
    </section>
  );
};
