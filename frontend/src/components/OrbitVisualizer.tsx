import React, { useState } from 'react';
import { ArrowRight, Play, RotateCcw, ChevronRight } from 'lucide-react';

interface OrbitVisualizerProps {
  mapping: number[]; // length 8
  startNode: number;
  depth: number;
  trajectory: number[];
  finalAnswer: number;
}

export const OrbitVisualizer: React.FC<OrbitVisualizerProps> = ({
  mapping,
  startNode,
  depth,
  trajectory,
  finalAnswer
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Layout 8 nodes in a circle
  const radius = 110;
  const centerX = 160;
  const centerY = 160;
  const nodes = [0, 1, 2, 3, 4, 5, 6, 7];

  const getNodeCoords = (index: number) => {
    const angle = (index * 2 * Math.PI) / 8 - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const activeNode = currentStep === 0 ? startNode : trajectory[currentStep - 1];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', textTransform: 'uppercase' }}>
            Ground Truth Permutation Orbit
          </span>
          <h4 style={{ marginTop: '0.2rem' }}>
            Start Node: <span style={{ color: 'var(--cot-primary)' }}>{startNode}</span> &nbsp;|&nbsp;
            Depth (Hops): <span style={{ color: 'var(--text-accent)' }}>{depth}</span> &nbsp;|&nbsp;
            Final Target: <span style={{ color: 'var(--latent-primary)' }}>{finalAnswer}</span>
          </h4>
        </div>

        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setCurrentStep(0)}
            className="btn btn-secondary btn-pill"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            title="Reset trajectory to start"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={() => setCurrentStep(prev => Math.min(depth, prev + 1))}
            disabled={currentStep >= depth}
            className="btn btn-primary btn-pill"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
          >
            <span>Next Hop ({currentStep}/{depth})</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Orbit Visualization Layout: Circle Graph + Step Trail */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '1.5rem',
        alignItems: 'center'
      }}>
        {/* SVG Graph */}
        <div style={{ position: 'relative', width: '320px', height: '320px', margin: '0 auto' }}>
          <svg width="320" height="320" viewBox="0 0 320 320">
            {/* Background mapping arrows */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="var(--border-prominent)" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--latent-primary)" />
              </marker>
            </defs>

            {/* Inactive mapping arcs */}
            {nodes.map(src => {
              const tgt = mapping[src];
              if (src === tgt) return null;
              const p1 = getNodeCoords(src);
              const p2 = getNodeCoords(tgt);
              return (
                <path
                  key={`map-${src}-${tgt}`}
                  d={`M ${p1.x} ${p1.y} Q ${centerX} ${centerY} ${p2.x} ${p2.y}`}
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  markerEnd="url(#arrow)"
                />
              );
            })}

            {/* Visited path segments */}
            {trajectory.slice(0, currentStep).map((tgt, i) => {
              const src = i === 0 ? startNode : trajectory[i - 1];
              const p1 = getNodeCoords(src);
              const p2 = getNodeCoords(tgt);
              return (
                <path
                  key={`active-${i}-${src}-${tgt}`}
                  d={`M ${p1.x} ${p1.y} Q ${centerX} ${centerY} ${p2.x} ${p2.y}`}
                  fill="none"
                  stroke="var(--latent-primary)"
                  strokeWidth="3"
                  markerEnd="url(#arrow-active)"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const { x, y } = getNodeCoords(node);
              const isCurrent = activeNode === node;
              const isStart = node === startNode;
              const isTarget = node === finalAnswer && currentStep === depth;

              return (
                <g key={node} transform={`translate(${x}, ${y})`}>
                  <circle
                    r="18"
                    fill={isCurrent ? 'var(--cot-primary)' : isTarget ? 'var(--latent-primary)' : 'var(--bg-surface-elevated)'}
                    stroke={isCurrent ? 'var(--text-primary)' : isStart ? 'var(--cot-primary)' : 'var(--border-medium)'}
                    strokeWidth={isCurrent ? '3' : '2'}
                  />
                  <text
                    textAnchor="middle"
                    dy="5"
                    fontSize="13"
                    fontWeight="700"
                    fill={isCurrent ? 'var(--text-primary)' : 'var(--text-primary)'}
                    fontFamily="var(--font-mono)"
                  >
                    {node}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Trail breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            MATHEMATICAL TRAJECTORY: v_t = &pi;(v_&#123;t-1&#125;)
          </span>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Step 0: v0 */}
            <div style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: currentStep === 0 ? 'var(--cot-primary)' : 'var(--cot-bg)',
              color: currentStep === 0 ? 'var(--text-primary)' : 'var(--cot-primary)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              v0: {startNode}
            </div>

            {trajectory.map((val, idx) => {
              const stepNumber = idx + 1;
              const isVisited = currentStep >= stepNumber;
              const isCurrent = currentStep === stepNumber;

              return (
                <React.Fragment key={idx}>
                  <ArrowRight size={14} color="var(--text-tertiary)" />
                  <div style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: isCurrent
                      ? 'var(--latent-primary)'
                      : isVisited
                      ? 'var(--latent-bg)'
                      : 'var(--bg-surface)',
                    color: isCurrent
                      ? 'var(--text-primary)'
                      : isVisited
                      ? 'var(--latent-primary)'
                      : 'var(--text-tertiary)',
                    border: isVisited ? '1px solid rgba(16, 185, 129, 0.3)' : '1px dashed var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isVisited ? 700 : 400,
                    fontSize: '0.9rem'
                  }}>
                    v{stepNumber}: {val}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Each hop t executes one permutation lookup: v<sub>t</sub> = &pi;(v<sub>t-1</sub>).
            The final answer after D={depth} hops is v<sub>{depth}</sub> = <strong>{finalAnswer}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
