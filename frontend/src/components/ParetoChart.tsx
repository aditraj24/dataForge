import React, { useState } from 'react';
import { ScaleId } from '../types';
import {
  TASK_A_126K,
  TASK_A_1M,
  TASK_A_5M_RECOVERY,
  TASK_A_5M_ORIGINAL,
  BenchmarkRecord
} from '../data/precomputed';
import { EvidenceBadge } from './EvidenceBadge';
import { Layers } from 'lucide-react';

interface ParetoChartProps {
  initialScale?: ScaleId;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({ initialScale = '126k' }) => {
  const [scale, setScale] = useState<ScaleId>(initialScale);
  const [activeK, setActiveK] = useState<number | null>(null);

  const getRecords = (): { records: BenchmarkRecord[]; isRecovery: boolean; isHistorical: boolean } => {
    switch (scale) {
      case '1m':
        return { records: TASK_A_1M, isRecovery: false, isHistorical: false };
      case '5m_recovery':
        return { records: TASK_A_5M_RECOVERY, isRecovery: true, isHistorical: false };
      case '5m_original':
        return { records: TASK_A_5M_ORIGINAL, isRecovery: false, isHistorical: true };
      case '126k':
      default:
        return { records: TASK_A_126K, isRecovery: false, isHistorical: false };
    }
  };

  const { records, isRecovery, isHistorical } = getRecords();

  // Chart coordinate mapping
  const width = 640;
  const height = 360;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };

  // Calculate max deri kay lyye dynamic scaling
  const maxLatency = Math.max(
    ...records.map(r => Math.max(r.cot_latency_ms, r.latent_latency_ms))
  ) * 1.15;

  const scaleX = (latency: number) => {
    const usableW = width - padding.left - padding.right;
    return padding.left + (latency / maxLatency) * usableW;
  };

  const scaleY = (acc: number) => {
    const usableH = height - padding.top - padding.bottom;
    // Y axh from 0% ko 105%
    return height - padding.bottom - (acc / 105) * usableH;
  };

  // Find non-dominated points among observed points
  // Point A dominates B if deri_A <= deri_B aor acc_A >= acc_B (sath at least one strict)
  interface PlotPoint {
    model: 'cot' | 'latent';
    k: number;
    latency: number;
    acc: number;
    sem: number;
    flops: number;
  }

  const allPoints: PlotPoint[] = [
    ...records.map(r => ({ model: 'cot' as const, k: r.k, latency: r.cot_latency_ms, acc: r.cot_acc, sem: r.cot_sem, flops: r.cot_flops })),
    ...records.map(r => ({ model: 'latent' as const, k: r.k, latency: r.latent_latency_ms, acc: r.latent_acc, sem: r.latent_sem, flops: r.latent_flops }))
  ];

  const paretoPoints = allPoints.filter(p1 => {
    return !allPoints.some(p2 => {
      if (p1 === p2) return false;
      return (p2.latency <= p1.latency && p2.acc >= p1.acc) &&
             (p2.latency < p1.latency || p2.acc > p1.acc);
    });
  }).sort((a, b) => a.latency - b.latency);

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
      {/* Header & Scale Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>THE ACCURACY–COMPUTE FRONTIER</span>
            <EvidenceBadge level="OBSERVED" />
            <EvidenceBadge level="PRECOMPUTED" />
            {isRecovery && <EvidenceBadge level="RECOVERY" />}
            {isHistorical && <EvidenceBadge level="HISTORICAL" />}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
            Task A: Permutation Orbit Traversal &nbsp;|&nbsp; 1,000 test cases across 5 independent seeds
          </div>
        </div>

        {/* Scale Toggle Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface-elevated)',
          padding: '0.25rem',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setScale('126k')}
            className="btn btn-pill"
            style={{
              backgroundColor: scale === '126k' ? 'var(--bg-surface)' : 'transparent',
              color: scale === '126k' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: scale === '126k' ? '1px solid var(--border-medium)' : 'none',
              fontSize: '0.8rem',
              padding: '0.35rem 0.75rem'
            }}
          >
            126K Baseline
          </button>
          <button
            onClick={() => setScale('1m')}
            className="btn btn-pill"
            style={{
              backgroundColor: scale === '1m' ? 'var(--bg-surface)' : 'transparent',
              color: scale === '1m' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: scale === '1m' ? '1px solid var(--border-medium)' : 'none',
              fontSize: '0.8rem',
              padding: '0.35rem 0.75rem'
            }}
          >
            1M Scaling
          </button>
          <button
            onClick={() => setScale('5m_recovery')}
            className="btn btn-pill"
            style={{
              backgroundColor: scale === '5m_recovery' ? 'var(--cot-bg)' : 'transparent',
              color: scale === '5m_recovery' ? 'var(--cot-primary)' : 'var(--text-tertiary)',
              border: scale === '5m_recovery' ? '1px solid var(--cot-border)' : 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.35rem 0.75rem'
            }}
          >
            5M Recovery (Controlled Recovery Condition)
          </button>
          <button
            onClick={() => setScale('5m_original')}
            className="btn btn-pill"
            style={{
              backgroundColor: scale === '5m_original' ? 'var(--bg-surface)' : 'transparent',
              color: scale === '5m_original' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: scale === '5m_original' ? '1px solid var(--border-medium)' : 'none',
              fontSize: '0.8rem',
              padding: '0.35rem 0.75rem'
            }}
          >
            5M Original (Confounded)
          </button>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div style={{ position: 'relative', overflowX: 'auto', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', padding: '0.5rem' }}>
        <svg width={width} height={height} style={{ margin: '0 auto', display: 'block' }}>
          {/* Grid lines aor ticks */}
          {[0, 20, 40, 60, 80, 100].map(acc => {
            const y = scaleY(acc);
            return (
              <g key={`y-${acc}`}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">
                  {acc}%
                </text>
              </g>
            );
          })}

          {/* Random Baseline Line (12.5% kay lyye Task A) */}
          <line
            x1={padding.left}
            y1={scaleY(12.5)}
            x2={width - padding.right}
            y2={scaleY(12.5)}
            stroke="rgba(245, 158, 11, 0.4)"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text
            x={width - padding.right - 5}
            y={scaleY(12.5) - 6}
            textAnchor="end"
            fontSize="10"
            fill="var(--hebbian-primary)"
            fontFamily="var(--font-mono)"
          >
            Chance Guess (12.50%)
          </text>

          {/* X Axh Ticks */}
          {[0.2, 0.4, 0.6, 0.8, 1.0, 1.2].filter(l => l <= maxLatency).map(lat => {
            const x = scaleX(lat);
            return (
              <g key={`x-${lat}`}>
                <line x1={x} y1={height - padding.bottom} x2={x} y2={height - padding.bottom + 5} stroke="var(--border-medium)" />
                <text x={x} y={height - padding.bottom + 18} textAnchor="middle" fontSize="11" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">
                  {lat.toFixed(1)}ms
                </text>
              </g>
            );
          })}

          {/* Observed Non-Dominated Pareko Segments */}
          {paretoPoints.length > 1 && (
            <polyline
              points={paretoPoints.map(p => `${scaleX(p.latency)},${scaleY(p.acc)}`).join(' ')}
              fill="none"
              stroke="var(--text-accent)"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              opacity="0.75"
            />
          )}

          {/* CoT Points */}
          {records.map(r => {
            const x = scaleX(r.cot_latency_ms);
            const y = scaleY(r.cot_acc);
            const isHovered = activeK === r.k;

            return (
              <g
                key={`cot-${r.k}`}
                onMouseEnter={() => setActiveK(r.k)}
                onMouseLeave={() => setActiveK(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* ghlati bar */}
                <line
                  x1={x}
                  y1={scaleY(Math.max(0, r.cot_acc - r.cot_sem))}
                  x2={x}
                  y2={scaleY(Math.min(100, r.cot_acc + r.cot_sem))}
                  stroke="var(--cot-primary)"
                  strokeWidth="1.5"
                  opacity="0.5"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 7 : 5}
                  fill="var(--cot-primary)"
                  stroke="var(--text-primary)"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--cot-primary)"
                  fontFamily="var(--font-mono)"
                >
                  k={r.k}
                </text>
              </g>
            );
          })}

          {/* Latent Points */}
          {records.map(r => {
            const x = scaleX(r.latent_latency_ms);
            const y = scaleY(r.latent_acc);
            const isHovered = activeK === r.k;

            return (
              <g
                key={`latent-${r.k}`}
                onMouseEnter={() => setActiveK(r.k)}
                onMouseLeave={() => setActiveK(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* ghlati bar */}
                <line
                  x1={x}
                  y1={scaleY(Math.max(0, r.latent_acc - r.latent_sem))}
                  x2={x}
                  y2={scaleY(Math.min(100, r.latent_acc + r.latent_sem))}
                  stroke="var(--latent-primary)"
                  strokeWidth="1.5"
                  opacity="0.5"
                />
                <rect
                  x={x - (isHovered ? 6 : 4.5)}
                  y={y - (isHovered ? 6 : 4.5)}
                  width={isHovered ? 12 : 9}
                  height={isHovered ? 12 : 9}
                  fill="var(--latent-primary)"
                  stroke="var(--text-primary)"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />
                <text
                  x={x}
                  y={y + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--latent-primary)"
                  fontFamily="var(--font-mono)"
                >
                  k={r.k}
                </text>
              </g>
            );
          })}

          {/* Axh Labels */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="var(--text-secondary)"
            fontFamily="var(--font-mono)"
          >
            GPU Wall-Clock Latency (ms) [CUDA Events, RTX 4060]
          </text>

          <text
            transform={`rotate(-90) translate(-${height / 2}, 18)`}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="var(--text-secondary)"
            fontFamily="var(--font-mono)"
          >
            Task A Accuracy (%)
          </text>
        </svg>
      </div>

      {/* Chart Legend & Empirical Boundary Note */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--cot-primary)' }} />
            <strong style={{ color: 'var(--text-primary)' }}>Autoregressive CoT</strong>
            <span style={{ color: 'var(--text-tertiary)' }}>(Circles)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--latent-primary)' }} />
            <strong style={{ color: 'var(--text-primary)' }}>Recurrent Latent</strong>
            <span style={{ color: 'var(--text-tertiary)' }}>(Squares)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '18px', height: '2px', borderTop: '2px dashed #38bdf8' }} />
            <span style={{ color: 'var(--text-accent)' }}>Observed Non-Dominated Frontier</span>
          </div>
        </div>

        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
          Observed non-dominated configurations; no interpolation or theoretical frontier is assumed.
        </span>
      </div>

      {/* Screen-Reader aor Accessible Numerical Summary Table */}
      <div style={{ marginTop: '0.5rem', overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Budget k</th>
              <th style={{ padding: '0.5rem' }}>CoT Acc (&plusmn;SEM)</th>
              <th style={{ padding: '0.5rem' }}>CoT Latency</th>
              <th style={{ padding: '0.5rem' }}>Latent Acc (&plusmn;SEM)</th>
              <th style={{ padding: '0.5rem' }}>Latent Latency</th>
              <th style={{ padding: '0.5rem' }}>Same-k p-value</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr
                key={r.k}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: activeK === r.k ? 'var(--bg-surface-elevated)' : 'transparent'
                }}
              >
                <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>k = {r.k}</td>
                <td style={{ padding: '0.5rem', color: 'var(--cot-primary)', fontWeight: 600 }}>
                  {r.cot_acc.toFixed(2)}% &plusmn; {r.cot_sem.toFixed(2)}%
                </td>
                <td style={{ padding: '0.5rem' }}>{r.cot_latency_ms.toFixed(3)} ms</td>
                <td style={{ padding: '0.5rem', color: 'var(--latent-primary)', fontWeight: 600 }}>
                  {r.latent_acc.toFixed(2)}% &plusmn; {r.latent_sem.toFixed(2)}%
                </td>
                <td style={{ padding: '0.5rem' }}>{r.latent_latency_ms.toFixed(3)} ms</td>
                <td style={{ padding: '0.5rem', color: r.p_value < 0.05 ? 'var(--text-accent)' : 'var(--text-tertiary)' }}>
                  {r.p_value < 0.0001 ? r.p_value.toExponential(2) : r.p_value.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
