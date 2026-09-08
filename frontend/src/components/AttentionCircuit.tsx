import React, { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Link2, Sliders } from 'lucide-react';
import { EvidenceBadge } from './EvidenceBadge';

interface MemoryPin {
  pos: number;
  label: string;
  tokenType: string;
  value: string;
  weight: number;
}

// Empirical attention weights recorded from Task A diagnostic audit across heads & steps
// Format: [step][head] -> weight array kay lyye memory positions
const AUDIT_DATA: Record<number, Record<number, number[]>> = {
  1: {
    1: [0.08, 0.05, 0.03, 0.12, 0.04, 0.02, 0.03, 0.06, 0.45, 0.12],
    2: [0.04, 0.06, 0.05, 0.18, 0.03, 0.02, 0.04, 0.08, 0.38, 0.12],
    3: [0.02, 0.03, 0.02, 0.05, 0.02, 0.01, 0.02, 0.04, 0.72, 0.07],
    4: [0.05, 0.04, 0.03, 0.10, 0.04, 0.02, 0.03, 0.05, 0.52, 0.12],
  },
  2: {
    1: [0.05, 0.04, 0.03, 0.08, 0.03, 0.02, 0.02, 0.05, 0.58, 0.10],
    2: [0.03, 0.05, 0.04, 0.12, 0.03, 0.01, 0.03, 0.06, 0.55, 0.08],
    3: [0.01, 0.02, 0.01, 0.04, 0.01, 0.01, 0.01, 0.03, 0.81, 0.05],
    4: [0.04, 0.03, 0.02, 0.07, 0.03, 0.02, 0.02, 0.04, 0.64, 0.09],
  },
  4: {
    1: [0.03, 0.04, 0.02, 0.06, 0.02, 0.01, 0.01, 0.05, 0.68, 0.08],
    2: [0.02, 0.03, 0.02, 0.07, 0.02, 0.01, 0.02, 0.04, 0.71, 0.06],
    3: [0.01, 0.01, 0.01, 0.02, 0.01, 0.00, 0.01, 0.02, 0.88, 0.03],
    4: [0.03, 0.02, 0.02, 0.05, 0.02, 0.01, 0.01, 0.03, 0.74, 0.07],
  },
  8: {
    1: [0.02, 0.02, 0.01, 0.03, 0.01, 0.01, 0.01, 0.03, 0.80, 0.06],
    2: [0.01, 0.02, 0.01, 0.04, 0.01, 0.01, 0.01, 0.02, 0.82, 0.05],
    3: [0.00, 0.01, 0.00, 0.01, 0.00, 0.00, 0.00, 0.01, 0.94, 0.03],
    4: [0.02, 0.01, 0.01, 0.02, 0.01, 0.01, 0.01, 0.02, 0.83, 0.06],
  },
};

const BASE_PINS = [
  { pos: 1, label: 'π(0)', tokenType: 'Table Entry', value: '1' },
  { pos: 2, label: 'π(1)', tokenType: 'Table Entry', value: '7' },
  { pos: 3, label: 'π(2)', tokenType: 'Table Entry', value: '5' },
  { pos: 4, label: 'π(3)', tokenType: 'Table Entry', value: '0' },
  { pos: 5, label: 'π(4)', tokenType: 'Table Entry', value: '2' },
  { pos: 6, label: 'π(5)', tokenType: 'Table Entry', value: '4' },
  { pos: 7, label: 'π(6)', tokenType: 'Table Entry', value: '6' },
  { pos: 8, label: 'π(7)', tokenType: 'Table Entry', value: '3' },
  { pos: 10, label: 'START v0', tokenType: 'Start Position', value: '3' },
  { pos: 11, label: 'HOPS D', tokenType: 'Target Depth', value: '4' },
];

export const AttentionCircuit: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<number>(4);
  const [selectedHead, setSelectedHead] = useState<number>(1);
  const [selectedPinPos, setSelectedPinPos] = useState<number>(10); // Start v0 default
  const [showTechnical, setShowTechnical] = useState<boolean>(false);

  // Derive pins sath weights kay lyye current step & head
  const pins: MemoryPin[] = useMemo(() => {
    const weights = AUDIT_DATA[selectedStep]?.[selectedHead] ?? AUDIT_DATA[4][1];
    return BASE_PINS.map((p, idx) => ({
      ...p,
      weight: weights[idx] ?? 0.05,
    }));
  }, [selectedStep, selectedHead]);

  const selectedPin = pins.find((p) => p.pos === selectedPinPos) ?? pins[8];

  // SVG Geometry
  const svgWidth = 680;
  const svgHeight = 270;
  const queryPin = { x: svgWidth / 2, y: 220, label: `Query (h_${selectedStep}, Head ${selectedHead})` };
  const memoryY = 45;
  const pinStartX = 40;
  const pinGap = (svgWidth - 2 * pinStartX) / (pins.length - 1);

  return (
    <div className="workbench-viewport" style={{ border: '1px solid var(--border-medium)', background: 'var(--bg-surface)' }}>
      {/* Top Bar sath Head/Step Selectors */}
      <div className="workbench-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 1rem',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-medium)',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Link2 size={15} style={{ color: 'var(--text-accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            ATTENTION ADDRESSING CIRCUIT INSPECTOR
          </span>
          <EvidenceBadge type="PRECOMPUTED" />
        </div>

        {/* Head aor Step Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>RECURRENT STEP:</span>
            {[1, 2, 4, 8].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStep(st)}
                style={{
                  background: selectedStep === st ? 'var(--text-accent)' : 'var(--bg-viewport)',
                  color: selectedStep === st ? '#000000' : 'var(--text-secondary)',
                  border: `1px solid ${selectedStep === st ? 'var(--text-accent)' : 'var(--border-subtle)'}`,
                  padding: '2px 5px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: selectedStep === st ? 700 : 400,
                }}
              >
                h{st}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>HEAD:</span>
            {[1, 2, 3, 4].map((h) => (
              <button
                key={h}
                onClick={() => setSelectedHead(h)}
                style={{
                  background: selectedHead === h ? 'var(--latent-primary)' : 'var(--bg-viewport)',
                  color: selectedHead === h ? '#000000' : 'var(--text-secondary)',
                  border: `1px solid ${selectedHead === h ? 'var(--latent-primary)' : 'var(--border-subtle)'}`,
                  padding: '2px 5px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: selectedHead === h ? 700 : 400,
                }}
              >
                H{h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Spatial Circuit Canvas */}
      <div style={{ position: 'relative', background: 'var(--bg-viewport)' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          aria-label="Attention addressing circuit diagram showing connections from recurrent query to memory positions."
        >
          {/* Connection Lines */}
          {pins.map((pin, idx) => {
            const pinX = pinStartX + idx * pinGap;
            const isSelected = selectedPin.pos === pin.pos;
            const isDominant = pin.weight > 0.5;
            const strokeWidth = Math.max(1, pin.weight * 14);
            const strokeColor = isSelected
              ? 'var(--warning-color)'
              : isDominant
              ? 'var(--text-accent)'
              : 'rgba(255, 255, 255, 0.12)';

            return (
              <g key={`conn-${pin.pos}`}>
                <path
                  d={`M ${queryPin.x} ${queryPin.y} C ${queryPin.x} ${(queryPin.y + memoryY) / 2}, ${pinX} ${(queryPin.y + memoryY) / 2}, ${pinX} ${memoryY}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isSelected ? '4 2' : undefined}
                />
              </g>
            );
          })}

          {/* Memory Position Pins */}
          {pins.map((pin, idx) => {
            const pinX = pinStartX + idx * pinGap;
            const isSelected = selectedPin.pos === pin.pos;
            const isDominant = pin.weight > 0.5;

            return (
              <g
                key={`pin-${pin.pos}`}
                onClick={() => setSelectedPinPos(pin.pos)}
                style={{ cursor: 'pointer' }}
              >
                {(isSelected || isDominant) && (
                  <circle
                    cx={pinX}
                    cy={memoryY}
                    r="20"
                    fill="none"
                    stroke={isSelected ? 'var(--warning-color)' : 'var(--text-accent)'}
                    strokeWidth="1.5"
                    strokeDasharray={isSelected ? '3 3' : undefined}
                  />
                )}

                <circle
                  cx={pinX}
                  cy={memoryY}
                  r="14"
                  fill={isSelected ? 'var(--warning-color)' : isDominant ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)'}
                  stroke={isSelected ? 'var(--text-primary)' : isDominant ? 'var(--text-accent)' : 'var(--border-medium)'}
                  strokeWidth="2"
                />

                <text
                  x={pinX}
                  y={memoryY + 4}
                  textAnchor="middle"
                  fill={isSelected ? 'var(--bg-primary)' : 'var(--text-primary)'}
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                  fontWeight="700"
                >
                  {pin.value}
                </text>

                <text
                  x={pinX}
                  y={memoryY - 18}
                  textAnchor="middle"
                  fill={isDominant ? 'var(--text-accent)' : 'var(--text-tertiary)'}
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                  fontWeight={isDominant ? '700' : '400'}
                >
                  {pin.label}
                </text>

                <text
                  x={pinX}
                  y={memoryY + 28}
                  textAnchor="middle"
                  fill={isDominant ? 'var(--text-accent)' : 'var(--text-muted)'}
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                  fontWeight={isDominant ? '700' : '400'}
                >
                  {(pin.weight * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Query Node */}
          <g>
            <rect
              x={queryPin.x - 120}
              y={queryPin.y - 14}
              width="240"
              height="28"
              rx="3"
              fill="var(--bg-surface-elevated)"
              stroke="var(--latent-primary)"
              strokeWidth="1.5"
            />
            <circle cx={queryPin.x - 95} cy={queryPin.y} r="4" fill="var(--latent-primary)" />
            <text
              x={queryPin.x + 10}
              y={queryPin.y + 4}
              textAnchor="middle"
              fill="var(--text-primary)"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fontWeight="700"
            >
              QUERY: h_{selectedStep} (Head {selectedHead})
            </text>
          </g>
        </svg>
      </div>

      {/* Selected Memory Pin Telemetry */}
      <div style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-medium)',
        padding: '0.8rem 1.25rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
      }}>
        <div className="telemetry-cell">
          <div className="telemetry-label" style={{ fontSize: '0.65rem' }}>INSPECTED POSITION</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
            Pos {selectedPin.pos} ({selectedPin.label})
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-label" style={{ fontSize: '0.65rem' }}>TOKEN VALUE</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-accent)' }}>
            &quot;{selectedPin.value}&quot; ({selectedPin.tokenType})
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-label" style={{ fontSize: '0.65rem' }}>ATTENTION WEIGHT (&alpha;)</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedPin.weight > 0.5 ? 'var(--text-accent)' : 'var(--text-primary)' }}>
            {(selectedPin.weight * 100).toFixed(1)}% ({selectedPin.weight.toFixed(3)})
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-label" style={{ fontSize: '0.65rem' }}>DIAGNOSTIC STATUS</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: selectedPin.weight > 0.5 ? 'var(--warning-color)' : 'var(--text-secondary)' }}>
            {selectedPin.weight > 0.5 ? 'START-TOKEN COLLAPSE' : 'Dispersed Weight'}
          </div>
        </div>
      </div>

      {/* Scientific Honesty Callout */}
      <div style={{
        padding: '0.65rem 1.25rem',
        background: 'var(--bg-surface-elevated)',
        borderTop: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
      }}>
        <HelpCircle size={15} style={{ color: 'var(--warning-color)', flexShrink: 0 }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          <strong>Empirical Diagnostic Observation:</strong> For Task A, <em>cross-attention output shows the earliest and largest observed contraction</em>, preceding contraction in the recurrent state. The 1M model increasingly attends up to <strong>{(pins[8].weight * 100).toFixed(0)}%</strong> to the start token <code>v0</code>. This is an observed diagnostic pattern, not proof of sole causation; underlying mechanisms remain hypotheses.
        </span>
      </div>

      {/* Progressive Disclosure: Technical Details */}
      <div className="disclosure-section" style={{ margin: 0, borderTop: '1px solid var(--border-subtle)', borderRadius: 0 }}>
        <button
          className="disclosure-trigger"
          onClick={() => setShowTechnical(!showTechnical)}
        >
          <span>TECHNICAL DETAILS: CROSS-ATTENTION FORMULATION</span>
          {showTechnical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnical && (
          <div className="disclosure-content" style={{ fontSize: '0.78rem' }}>
            <p>
              In recurrent latent reasoning, cross-attention weights $\alpha_{'{t, i}'}$ are computed as:
            </p>
            <div style={{ background: 'var(--bg-viewport)', padding: '0.5rem', fontFamily: 'var(--font-mono)', margin: '0.4rem 0' }}>
              &alpha;_{'{t, i}'} = \text{'{Softmax}'}\left(\frac{'{q_t^T k_i}'}{'{\\sqrt{d_k}}'}\right)
            </div>
            <p>
              When $q_t$ fails to update its directional vector away from $v_0$, cross-attention collapses back to the start token at every recurrent step $t$, preventing the model from dereferencing subsequent hops.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
