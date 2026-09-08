import React, { useState } from 'react';
import { Crosshair, Sliders, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
import { TASK_A_126K, TASK_A_1M, TASK_A_5M_RECOVERY, TASK_A_5M_ORIGINAL, BenchmarkRecord } from '../data/precomputed';

interface ParetoPoint {
  id: string;
  model: 'cot' | 'latent';
  modelName: string;
  scale: string;
  k: number;
  accuracy: number;
  sem: number;
  latencyMs: number;
  flops: number;
  isParetoOptimal: boolean;
}

export const ParetoInstrument: React.FC = () => {
  const [activeScale, setActiveScale] = useState<'all' | '126k' | '1m' | '5m_recovery' | '5m_original'>('5m_recovery');
  const [latencyCursor, setLatencyCursor] = useState<number>(0.60); // ms
  const [selectedPoint, setSelectedPoint] = useState<ParetoPoint | null>(null);
  const [showInspection, setShowInspection] = useState<boolean>(false);
  const [showTechnical, setShowTechnical] = useState<boolean>(false);

  // Build points array from authoritative benchmarks
  const buildPoints = (): ParetoPoint[] => {
    const rawData: { scale: string; records: BenchmarkRecord[] }[] = [];
    
    if (activeScale === 'all' || activeScale === '126k') {
      rawData.push({ scale: '126K', records: TASK_A_126K });
    }
    if (activeScale === 'all' || activeScale === '1m') {
      rawData.push({ scale: '1M', records: TASK_A_1M });
    }
    if (activeScale === 'all' || activeScale === '5m_recovery') {
      rawData.push({ scale: '5M Recovery', records: TASK_A_5M_RECOVERY });
    }
    if (activeScale === '5m_original') {
      rawData.push({ scale: '5M Original (Confounded)', records: TASK_A_5M_ORIGINAL });
    }

    const points: ParetoPoint[] = [];

    rawData.forEach(({ scale, records }) => {
      records.forEach((r) => {
        // CoT point
        points.push({
          id: `cot-${scale}-k${r.k}`,
          model: 'cot',
          modelName: 'Autoregressive Scratchpad',
          scale,
          k: r.k,
          accuracy: r.cot_acc,
          sem: r.cot_sem,
          latencyMs: r.cot_latency_ms,
          flops: r.cot_flops,
          isParetoOptimal: false,
        });

        // Latent point
        points.push({
          id: `latent-${scale}-k${r.k}`,
          model: 'latent',
          modelName: 'Recurrent Latent Core',
          scale,
          k: r.k,
          accuracy: r.latent_acc,
          sem: r.latent_sem,
          latencyMs: r.latent_latency_ms,
          flops: r.latent_flops,
          isParetoOptimal: false,
        });
      });
    });

    // Compute empirical Pareko optimality (non-dominated points within d active sett)
    // Point A dominates Point B if deri(A) <= deri(B) aor acc(A) >= acc(B), sath at least one strict inequality.
    points.forEach((pA) => {
      const dominated = points.some((pB) => 
        pB.id !== pA.id &&
        pB.latencyMs <= pA.latencyMs &&
        pB.accuracy >= pA.accuracy &&
        (pB.latencyMs < pA.latencyMs || pB.accuracy > pA.accuracy)
      );
      pA.isParetoOptimal = !dominated;
    });

    return points;
  };

  const points = buildPoints();

  // Find points available within current deri bjjet cursor
  const pointsUnderBudget = points.filter((p) => p.latencyMs <= latencyCursor);
  const bestUnderBudget = pointsUnderBudget.length > 0
    ? pointsUnderBudget.reduce((prev, curr) => (curr.accuracy > prev.accuracy ? curr : prev))
    : null;

  // Viewport dimensions kay lyye SVG Coordinate Plane
  const svgWidth = 720;
  const svgHeight = 360;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 45;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Domain: deri 0.0 ko 1.3 ms, sahi 0% ko 105%
  const maxLat = 1.30;
  const maxAcc = 105;

  const scaleX = (lat: number) => padLeft + (lat / maxLat) * plotWidth;
  const scaleY = (acc: number) => padTop + (1 - acc / maxAcc) * plotHeight;

  return (
    <div className="workbench-viewport" style={{ border: '1px solid var(--border-medium)' }}>
      {/* Instrument Header Bar */}
      <div className="workbench-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Crosshair size={15} style={{ color: 'var(--text-accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            PARETO TRADEOFF INSTRUMENT
          </span>
          <span className="badge badge-observed">EMPIRICAL MEASURED POINTS ONLY</span>
        </div>

        {/* Scale Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            SCALE:
          </span>
          {(['5m_recovery', '1m', '126k', 'all', '5m_original'] as const).map((sc) => (
            <button
              key={sc}
              className={`btn-instrument ${activeScale === sc ? 'active' : ''}`}
              onClick={() => {
                setActiveScale(sc);
                setSelectedPoint(null);
              }}
              style={{ padding: '2px 7px', fontSize: '0.72rem' }}
            >
              {sc === '5m_recovery' ? '5M RECOVERY' : sc === '5m_original' ? '5M ORIG [HIST]' : sc.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Coordinate Viewport (Oscilloscope Plane) */}
      <div style={{ position: 'relative', background: 'var(--bg-viewport)' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          aria-label="Pareto frontier coordinate plane plotting latency vs accuracy"
        >
          {/* Background Grid Lines */}
          {[0, 20, 40, 60, 80, 100].map((acc) => (
            <g key={`grid-y-${acc}`}>
              <line
                x1={padLeft}
                y1={scaleY(acc)}
                x2={svgWidth - padRight}
                y2={scaleY(acc)}
                stroke={acc === 0 || acc === 100 ? 'rgba(255, 255, 255, 0.15)' : 'var(--grid-line)'}
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={scaleY(acc) + 4}
                textAnchor="end"
                fill="var(--text-tertiary)"
                fontFamily="var(--font-mono)"
                fontSize="10"
              >
                {acc}%
              </text>
            </g>
          ))}

          {[0.2, 0.4, 0.6, 0.8, 1.0, 1.2].map((lat) => (
            <g key={`grid-x-${lat}`}>
              <line
                x1={scaleX(lat)}
                y1={padTop}
                x2={scaleX(lat)}
                y2={svgHeight - padBottom}
                stroke="var(--grid-line)"
                strokeWidth="1"
              />
              <text
                x={scaleX(lat)}
                y={svgHeight - padBottom + 16}
                textAnchor="middle"
                fill="var(--text-tertiary)"
                fontFamily="var(--font-mono)"
                fontSize="10"
              >
                {lat.toFixed(1)}ms
              </text>
            </g>
          ))}

          {/* Axh Labels */}
          <text
            x={padLeft + plotWidth / 2}
            y={svgHeight - 10}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontFamily="var(--font-mono)"
            fontSize="11"
            fontWeight="600"
          >
            GPU WALL-CLOCK LATENCY (ms) →
          </text>

          <text
            x={-svgHeight / 2}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontFamily="var(--font-mono)"
            fontSize="11"
            fontWeight="600"
          >
            ACCURACY (%) →
          </text>

          {/* Interactive deri Hairline Cursor */}
          <line
            x1={scaleX(latencyCursor)}
            y1={padTop}
            x2={scaleX(latencyCursor)}
            y2={svgHeight - padBottom}
            stroke="var(--crosshair)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <circle
            cx={scaleX(latencyCursor)}
            cy={svgHeight - padBottom}
            r="4"
            fill="var(--text-accent)"
          />
          <text
            x={scaleX(latencyCursor)}
            y={padTop - 8}
            textAnchor="middle"
            fill="var(--text-accent)"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fontWeight="700"
          >
            BUDGET: {latencyCursor.toFixed(2)} ms
          </text>

          {/* Observed Points */}
          {points.map((p) => {
            const cx = scaleX(p.latencyMs);
            const cy = scaleY(p.accuracy);
            const isSelected = selectedPoint?.id === p.id;
            const isCoT = p.model === 'cot';

            return (
              <g
                key={p.id}
                onClick={() => setSelectedPoint(p)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pareko Frontier Gold Aura */}
                {p.isParetoOptimal && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? "14" : "10"}
                    fill="none"
                    stroke="var(--warning-color)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point Shape: Blue Squhn kay lyye CoT, Green Circle kay lyye Latent */}
                {isCoT ? (
                  <rect
                    x={cx - (isSelected ? 6 : 4.5)}
                    y={cy - (isSelected ? 6 : 4.5)}
                    width={isSelected ? 12 : 9}
                    height={isSelected ? 12 : 9}
                    fill={isSelected ? 'var(--text-primary)' : 'var(--cot-primary)'}
                    stroke="var(--bg-primary)"
                    strokeWidth="1.5"
                  />
                ) : (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6 : 4.5}
                    fill={isSelected ? 'var(--text-primary)' : 'var(--latent-primary)'}
                    stroke="var(--bg-primary)"
                    strokeWidth="1.5"
                  />
                )}

                {/* bjjet Label */}
                <text
                  x={cx + (isCoT ? 7 : -7)}
                  y={cy - 6}
                  textAnchor={isCoT ? 'start' : 'end'}
                  fill={isCoT ? 'var(--cot-primary)' : 'var(--latent-primary)'}
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                  fontWeight="600"
                >
                  k={p.k}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Draggable deri Hairline Slider */}
        <div style={{
          padding: '0.6rem 1.25rem',
          background: 'var(--bg-surface-elevated)',
          borderTop: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
            <Sliders size={14} style={{ color: 'var(--text-accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              SWEEP LATENCY BUDGET:
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-accent)' }}>
              {latencyCursor.toFixed(2)} ms
            </span>
          </div>

          <input
            type="range"
            min="0.08"
            max="1.25"
            step="0.01"
            value={latencyCursor}
            onChange={(e) => setLatencyCursor(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--text-accent)' }}
          />
        </div>
      </div>

      {/* deri bjjet Interrogation Deck */}
      <div style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-medium)',
        padding: '1rem 1.25rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        {/* Left: What does d cursor find? */}
        <div style={{
          background: 'var(--bg-viewport)',
          border: '1px solid var(--border-subtle)',
          padding: '0.75rem',
          borderRadius: '2px'
        }}>
          <div className="telemetry-label" style={{ color: 'var(--text-accent)' }}>
            QUERY AT BUDGET ≤ {latencyCursor.toFixed(2)} ms
          </div>
          {bestUnderBudget ? (
            <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              <div>
                <strong>Non-Dominated Choice:</strong>{' '}
                <span style={{ color: bestUnderBudget.model === 'cot' ? 'var(--cot-primary)' : 'var(--latent-primary)' }}>
                  {bestUnderBudget.modelName} ({bestUnderBudget.scale}, k={bestUnderBudget.k})
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                Achieved Accuracy: <strong>{bestUnderBudget.accuracy.toFixed(1)}%</strong> | Latency: <strong>{bestUnderBudget.latencyMs.toFixed(3)} ms</strong>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
              No measured configuration runs under {latencyCursor.toFixed(2)} ms.
            </div>
          )}
        </div>

        {/* Right: Selected Measured Point Telemetry */}
        <div style={{
          background: 'var(--bg-viewport)',
          border: '1px solid var(--border-subtle)',
          padding: '0.75rem',
          borderRadius: '2px'
        }}>
          <div className="telemetry-label">
            MEASURED POINT INSPECTION {selectedPoint ? `(${selectedPoint.scale})` : '— SELECT A POINT'}
          </div>
          {selectedPoint ? (
            <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Model: <strong style={{ color: selectedPoint.model === 'cot' ? 'var(--cot-primary)' : 'var(--latent-primary)' }}>{selectedPoint.modelName}</strong></span>
                <span>Budget: <strong>k={selectedPoint.k}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', color: 'var(--text-secondary)' }}>
                <span>Accuracy: <strong>{selectedPoint.accuracy.toFixed(2)}%</strong> ± {selectedPoint.sem.toFixed(2)}%</span>
                <span>Latency: <strong>{selectedPoint.latencyMs.toFixed(3)} ms</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', color: 'var(--text-tertiary)' }}>
                <span>FLOPs: {selectedPoint.flops.toLocaleString()}</span>
                <span style={{ color: selectedPoint.isParetoOptimal ? 'var(--warning-color)' : 'var(--text-tertiary)' }}>
                  {selectedPoint.isParetoOptimal ? '★ NON-DOMINATED' : 'Sub-optimal'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
              SELECT A POINT: Click any measured empirical pin (circle or square) to inspect accuracy, latency, and frontier status.
            </div>
          )}
        </div>
      </div>

      {/* Progressive Disclosure: Inspect Table */}
      <div className="disclosure-section" style={{ margin: 0, borderTop: '1px solid var(--border-medium)', borderRadius: 0 }}>
        <button
          className="disclosure-trigger"
          onClick={() => setShowInspection(!showInspection)}
        >
          <span>INSPECT EMPIRICAL PARETO DATA (TABULAR BENCHMARK)</span>
          {showInspection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showInspection && (
          <div className="disclosure-content" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-tertiary)', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>MODEL</th>
                  <th style={{ padding: '6px' }}>SCALE</th>
                  <th style={{ padding: '6px' }}>k</th>
                  <th style={{ padding: '6px' }}>ACCURACY (%)</th>
                  <th style={{ padding: '6px' }}>LATENCY (ms)</th>
                  <th style={{ padding: '6px' }}>FLOPs</th>
                  <th style={{ padding: '6px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPoint(p)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: selectedPoint?.id === p.id ? 'var(--bg-surface-elevated)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '6px', color: p.model === 'cot' ? 'var(--cot-primary)' : 'var(--latent-primary)', fontWeight: 600 }}>
                      {p.model.toUpperCase()}
                    </td>
                    <td style={{ padding: '6px' }}>{p.scale}</td>
                    <td style={{ padding: '6px' }}>{p.k}</td>
                    <td style={{ padding: '6px' }}>{p.accuracy.toFixed(2)}%</td>
                    <td style={{ padding: '6px' }}>{p.latencyMs.toFixed(3)}</td>
                    <td style={{ padding: '6px' }}>{p.flops.toLocaleString()}</td>
                    <td style={{ padding: '6px', color: p.isParetoOptimal ? 'var(--warning-color)' : 'var(--text-tertiary)' }}>
                      {p.isParetoOptimal ? '★ Pareto' : 'Dominated'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Progressive Disclosure: Technical Definition */}
      <div className="disclosure-section" style={{ margin: 0, borderTop: '1px solid var(--border-subtle)', borderRadius: 0 }}>
        <button
          className="disclosure-trigger"
          onClick={() => setShowTechnical(!showTechnical)}
        >
          <span>TECHNICAL DETAILS: PARETO DOMINANCE IN REASONING INFERENCE</span>
          {showTechnical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnical && (
          <div className="disclosure-content">
            <p>
              In multi-objective optimization with objectives (Accuracy, -Latency), a configuration A <strong>dominates</strong> B (A &succ; B) if:
            </p>
            <div style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-surface-elevated)', padding: '0.6rem', margin: '0.5rem 0' }}>
              Acc(A) &ge; Acc(B) &nbsp;&amp;&nbsp; Lat(A) &le; Lat(B)
            </div>
            <p>
              with at least one strict inequality. A point is <em>Pareto-optimal (non-dominated)</em> if no measured configuration achieves higher accuracy in equal or less latency.
              Only empirically observed points are shown; zero curve interpolation is performed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
