import React, { useState } from 'react';
import {
  Sliders,
  TrendingUp,
  Download,
  FileText,
  Layers,
  Cpu,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  TASK_A_126K,
  TASK_A_1M,
  TASK_A_5M_RECOVERY,
  TASK_A_5M_ORIGINAL,
  SCALE_TRAJECTORY_K16
} from '../data/precomputed';

export type ScaleModelId = '126k' | '1m' | '5m_original' | '5m_recovery';

interface ModelScaleSpec {
  id: ScaleModelId;
  name: string;
  badge: string;
  badgeType: 'observed' | 'recovery' | 'historical';
  paramsCoT: number;
  paramsLatent: number;
  layers: number;
  hiddenDim: number;
  heads: number;
  optCondition: string;
  taskACoTk16: number;
  taskACoTSEM: number;
  taskALatentk16: number;
  taskALatentSEM: number;
  taskBCoTk16: number;
  taskBLatentk16: number;
  latencyCoTms: number;
  latencyLatentms: number;
  seed46OutlierNote?: string;
  scientificFinding: string;
}

const SCALE_SPECS: Record<ScaleModelId, ModelScaleSpec> = {
  '126k': {
    id: '126k',
    name: '126K Baseline',
    badge: 'PRECOMPUTED • EMPIRICAL',
    badgeType: 'observed',
    paramsCoT: 126168,
    paramsLatent: 125688,
    layers: 4,
    hiddenDim: 128,
    heads: 4,
    optCondition: '20 epochs / 2,500 steps (static AdamW η=1e-3)',
    taskACoTk16: 73.36,
    taskACoTSEM: 15.83,
    taskALatentk16: 33.06,
    taskALatentSEM: 0.59,
    taskBCoTk16: 12.80,
    taskBLatentk16: 12.98,
    latencyCoTms: 0.720,
    latencyLatentms: 0.850,
    seed46OutlierNote: 'Seed 46 outlier: 99.10% (Seeds 42-45: 58.90% - 76.20%, Median: 69.70%, SEM: ±7.08%). High variance observed in small baseline.',
    scientificFinding: 'At 126K, explicit scratchpad scales from 21.5% (k=1) to 73.4% (k=16). Recurrent latent states saturate at 33.1% by k=4.'
  },
  '1m': {
    id: '1m',
    name: '1M Scaled',
    badge: 'PRECOMPUTED • EMPIRICAL',
    badgeType: 'observed',
    paramsCoT: 998520,
    paramsLatent: 998523,
    layers: 6,
    hiddenDim: 256,
    heads: 8,
    optCondition: '20 epochs / 2,500 steps (static AdamW η=1e-3)',
    taskACoTk16: 76.70,
    taskACoTSEM: 29.57,
    taskALatentk16: 31.12,
    taskALatentSEM: 1.01,
    taskBCoTk16: 14.18,
    taskBLatentk16: 13.84,
    latencyCoTms: 0.965,
    latencyLatentms: 0.887,
    scientificFinding: '8x capacity increase produces marginal gain for CoT (76.7%) and leaves Latent reasoning flat at 31.1% (~33% empirical plateau).'
  },
  '5m_original': {
    id: '5m_original',
    name: '5M Original [HISTORICAL / CONFOUNDED]',
    badge: 'HISTORICAL • CONFOUNDED CONDITION',
    badgeType: 'historical',
    paramsCoT: 5000632,
    paramsLatent: 5000635,
    layers: 8,
    hiddenDim: 544,
    heads: 8,
    optCondition: '20 epochs / 2,500 steps (static AdamW η=1e-3, underfit)',
    taskACoTk16: 13.64,
    taskACoTSEM: 0.94,
    taskALatentk16: 12.46,
    taskALatentSEM: 0.49,
    taskBCoTk16: 11.20,
    taskBLatentk16: 10.90,
    latencyCoTms: 1.175,
    latencyLatentms: 0.520,
    scientificFinding: 'Confounded run: 5M model stalled with training loss 1.492 and near-random accuracy (~13%), associated with optimization starvation under the static schedule.'
  },
  '5m_recovery': {
    id: '5m_recovery',
    name: '5M Recovery [CONTROLLED RECOVERY CONDITION]',
    badge: 'CONTROLLED RECOVERY CONDITION',
    badgeType: 'recovery',
    paramsCoT: 5000632,
    paramsLatent: 5000635,
    layers: 8,
    hiddenDim: 544,
    heads: 8,
    optCondition: '50 epochs / 6,250 steps, 5-ep linear warmup (1e-6 → 5e-4), cosine decay to 1e-5, grad clip 1.0',
    taskACoTk16: 99.74,
    taskACoTSEM: 0.21,
    taskALatentk16: 33.92,
    taskALatentSEM: 0.37,
    taskBCoTk16: 18.58,
    taskBLatentk16: 14.56,
    latencyCoTms: 1.168,
    latencyLatentms: 0.512,
    scientificFinding: 'The recovery condition changed training duration, learning-rate schedule, warmup, and related optimization settings together. Under this multi-variable schedule, CoT reaches 99.74% while the recurrent latent model stabilizes at 33.92%.'
  }
};

export const ScaleMachineProgression: React.FC = () => {
  const [selectedScale, setSelectedScale] = useState<ScaleModelId>('5m_recovery');
  const [selectedBudgetK, setSelectedBudgetK] = useState<number>(16);
  const [activeTab, setActiveTab] = useState<'inspector' | 'seeds'>('inspector');

  const activeSpec = SCALE_SPECS[selectedScale];

  // Helper ko extract sahi kay lyye active maadal at selected bjjet k
  const getBenchmarkDataForScale = (scale: ScaleModelId) => {
    switch (scale) {
      case '126k':
        return TASK_A_126K;
      case '1m':
        return TASK_A_1M;
      case '5m_original':
        return TASK_A_5M_ORIGINAL;
      case '5m_recovery':
      default:
        return TASK_A_5M_RECOVERY;
    }
  };

  const records = getBenchmarkDataForScale(selectedScale);
  const currentRecord = records.find((r) => r.k === selectedBudgetK) || records[records.length - 1];

  // SVG Chart Dimensions
  const svgWidth = 620;
  const svgHeight = 270;
  const pad = { top: 30, right: 30, bottom: 40, left: 48 };
  const pWidth = svgWidth - pad.left - pad.right;
  const pHeight = svgHeight - pad.top - pad.bottom;

  // X axis: bjjets k in [1, 2, 4, 8, 12, 16]
  const kValues = [1, 2, 4, 8, 12, 16];
  const getX = (k: number) => {
    const idx = kValues.indexOf(k);
    return pad.left + (idx / (kValues.length - 1)) * pWidth;
  };

  const getY = (acc: number) => {
    return pad.top + pHeight - (Math.max(0, Math.min(100, acc)) / 100) * pHeight;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem 2rem' }}>
      {/* 1. Header sath Breadcrumbs, Title & Top-Right maadal Scale Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--text-accent)', cursor: 'pointer' }}>Lab</span>
            <span>&gt;</span>
            <span style={{ color: 'var(--text-secondary)' }}>Scale Machine</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Scale Machine: Observed Capacity Conditions
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Empirical measurements across tested conditions (126K, 1M, and 5M branches). Visual sequence between empirical points only; not a fitted scaling law.
          </p>
        </div>

        {/* Top-Right Badge Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: 'var(--bg-viewport)',
            border: '1px solid var(--border-medium)',
            padding: '0.45rem 0.85rem',
            borderRadius: '6px',
          }}
        >
          <div style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-accent)' }}>
            <BarChart3 size={13} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>OBSERVED CONDITIONS</div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>Controlled small-scale study (RTX 4060)</div>
          </div>
        </div>
      </div>

      {/* 2. Hierarchical maadal Scale Tree Selector (Prompt Section 3 & 4) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '0.85rem 1.15rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Tree Structure */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            CAPACITY TREE:
          </span>

          {/* 126K Baseline battan */}
          <button
            onClick={() => setSelectedScale('126k')}
            style={{
              background: selectedScale === '126k' ? 'var(--bg-surface-elevated)' : 'var(--bg-primary)',
              border: selectedScale === '126k' ? '1px solid var(--text-accent)' : '1px solid var(--border-medium)',
              color: selectedScale === '126k' ? 'var(--text-accent)' : 'var(--text-secondary)',
              borderRadius: '4px',
              padding: '0.4rem 0.75rem',
              fontSize: '0.74rem',
              fontWeight: selectedScale === '126k' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <span>126K Baseline</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Scaling condition</span>
          </button>

          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>→</span>

          {/* 1M Scaling battan */}
          <button
            onClick={() => setSelectedScale('1m')}
            style={{
              background: selectedScale === '1m' ? 'var(--bg-surface-elevated)' : 'var(--bg-primary)',
              border: selectedScale === '1m' ? '1px solid var(--text-accent)' : '1px solid var(--border-medium)',
              color: selectedScale === '1m' ? 'var(--text-accent)' : 'var(--text-secondary)',
              borderRadius: '4px',
              padding: '0.4rem 0.75rem',
              fontSize: '0.74rem',
              fontWeight: selectedScale === '1m' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <span>1M Scaled</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Scaling condition</span>
          </button>

          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>→</span>

          {/* 5M Architecture sath Sub-branches */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '6px',
              padding: '0.35rem 0.6rem',
            }}
          >
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              5M ARCHITECTURE (BRANCHES):
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSelectedScale('5m_original')}
                style={{
                  background: selectedScale === '5m_original' ? 'rgba(239, 68, 68, 0.18)' : 'var(--bg-viewport)',
                  border: selectedScale === '5m_original' ? '1px solid #f87171' : '1px solid #291515',
                  color: selectedScale === '5m_original' ? '#f87171' : 'var(--text-secondary)',
                  borderRadius: '3px',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.7rem',
                  fontWeight: selectedScale === '5m_original' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                ├── 5M Original <span style={{ fontSize: '0.62rem', color: '#f87171' }}>[Confounded]</span>
              </button>

              <button
                onClick={() => setSelectedScale('5m_recovery')}
                style={{
                  background: selectedScale === '5m_recovery' ? 'rgba(56, 189, 248, 0.18)' : 'var(--bg-viewport)',
                  border: selectedScale === '5m_recovery' ? '1px solid var(--text-accent)' : '1px solid #162a3f',
                  color: selectedScale === '5m_recovery' ? 'var(--text-accent)' : 'var(--text-secondary)',
                  borderRadius: '3px',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.7rem',
                  fontWeight: selectedScale === '5m_recovery' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                └── 5M Recovery <span style={{ fontSize: '0.62rem', color: 'var(--text-accent)' }}>[Controlled Recovery]</span>
              </button>
            </div>
          </div>
        </div>

        {/* bjjet k selector kay lyye d active scale */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>BUDGET k:</span>
          <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-medium)' }}>
            {kValues.map((k) => (
              <button
                key={k}
                onClick={() => setSelectedBudgetK(k)}
                style={{
                  background: selectedBudgetK === k ? 'var(--text-accent)' : 'transparent',
                  color: selectedBudgetK === k ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.45rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                k={k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Empirical sahi Curve (Left) aor Scale Inspector (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Empirical Scaling Chart + Scientific Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Chart Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Task A Performance across Budget k ({activeSpec.name})
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                  Observed empirical mean test accuracy (Line connects discrete budget conditions; not a fitted scaling curve).
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-accent)' }} />
                  <span>CoT (Scratchpad)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--correct-color)' }} />
                  <span>Latent (Recurrent)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '12px', borderTop: '1px dashed var(--text-tertiary)' }} />
                  <span>Random Chance (12.5%)</span>
                </div>
              </div>
            </div>

            {/* SVG Plot */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ overflow: 'visible' }}>
                {/* Horizontal Grid */}
                {[0, 20, 40, 60, 80, 100].map((val) => {
                  const y = getY(val);
                  return (
                    <g key={val}>
                      <line x1={pad.left} y1={y} x2={svgWidth - pad.right} y2={y} stroke="var(--border-subtle)" strokeWidth="1" />
                      <text x={pad.left - 8} y={y + 3} textAnchor="end" fill="var(--text-tertiary)" fontSize="9" fontFamily="var(--font-mono)">
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Random Chance Reference Line (12.5%) */}
                <line
                  x1={pad.left}
                  y1={getY(12.5)}
                  x2={svgWidth - pad.right}
                  y2={getY(12.5)}
                  stroke="var(--text-muted)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Vertical Grid kay lyye k */}
                {kValues.map((k) => {
                  const x = getX(k);
                  return (
                    <g key={k}>
                      <line x1={x} y1={pad.top} x2={x} y2={pad.top + pHeight} stroke="var(--border-subtle)" strokeWidth="1" />
                      <text x={x} y={pad.top + pHeight + 16} textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="var(--font-mono)">
                        k={k}
                      </text>
                    </g>
                  );
                })}

                {/* Axh Labels */}
                <text
                  x={-pad.top - pHeight / 2}
                  y={14}
                  transform="rotate(-90)"
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  Accuracy (%)
                </text>
                <text
                  x={pad.left + pWidth / 2}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  Thinking Budget k
                </text>

                {/* CoT Path */}
                <path
                  d={records.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(r.k)} ${getY(r.cot_acc)}`).join(' ')}
                  fill="none"
                  stroke="var(--text-accent)"
                  strokeWidth="2"
                />

                {/* Latent Path */}
                <path
                  d={records.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(r.k)} ${getY(r.latent_acc)}`).join(' ')}
                  fill="none"
                  stroke="var(--correct-color)"
                  strokeWidth="2"
                />

                {/* detta Points */}
                {records.map((r) => {
                  const x = getX(r.k);
                  const yCoT = getY(r.cot_acc);
                  const yLatent = getY(r.latent_acc);
                  const isSelectedK = r.k === selectedBudgetK;

                  return (
                    <g key={r.k} style={{ cursor: 'pointer' }} onClick={() => setSelectedBudgetK(r.k)}>
                      {/* CoT Circle */}
                      <circle
                        cx={x}
                        cy={yCoT}
                        r={isSelectedK ? 6 : 4}
                        fill="var(--text-accent)"
                        stroke={isSelectedK ? 'var(--text-primary)' : 'var(--bg-surface)'}
                        strokeWidth={isSelectedK ? 2 : 1}
                      />
                      {/* Latent Circle */}
                      <circle
                        cx={x}
                        cy={yLatent}
                        r={isSelectedK ? 6 : 4}
                        fill="var(--correct-color)"
                        stroke={isSelectedK ? 'var(--text-primary)' : 'var(--bg-surface)'}
                        strokeWidth={isSelectedK ? 2 : 1}
                      />

                      {/* Values at k=1 aor k=16 */}
                      {(r.k === 1 || r.k === 16 || isSelectedK) && (
                        <>
                          <text x={x} y={yCoT - 8} textAnchor="middle" fill="var(--text-accent)" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
                            {r.cot_acc.toFixed(1)}%
                          </text>
                          <text x={x} y={yLatent + 14} textAnchor="middle" fill="var(--correct-color)" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
                            {r.latent_acc.toFixed(1)}%
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Core Empirical Findings Card (Section 4 & 6 ka RESULTS_5M_RECOVERY.md) */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '1.25rem',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
              Observed Empirical Patterns (Under Tested Conditions)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  title: 'CoT scales with model capacity & budget within this benchmark',
                  desc: 'At k=16, Autoregressive CoT advances from 73.36% (126K) to 76.70% (1M) and reaches 99.74% in the 5M Recovery condition.',
                },
                {
                  title: 'Latent recurrence exhibits an empirical ~33% plateau',
                  desc: 'Under the tested conditions across all three scales (126K: 33.06%, 1M: 31.12%, 5M Recovery: 33.92%), recurrent continuous state updates saturate near ~33% on Task A.',
                },
                {
                  title: '5M Original was optimization-confounded',
                  desc: 'The historical 5M run stalled (13.64%) due to optimizer starvation under static AdamW (loss ~1.492). The recovery condition changed training duration, learning-rate schedule, warmup, and gradient clipping together, restoring convergence.',
                },
                {
                  title: 'Task B empirical outcome: inconclusive',
                  desc: 'Both architectures score near the 10% random chance baseline on Task B across all scales (126K: ~12.9%, 1M: ~14.0%, 5M: 14.6%-18.6%). The empirical outcome remains strictly inconclusive.',
                },
              ].map((obs, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'var(--text-accent)',
                      color: 'var(--text-primary)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>{obs.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{obs.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: maadal Inspector & Seed 46 Variance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* maadal Inspector Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {/* Header / Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <button
                onClick={() => setActiveTab('inspector')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'inspector' ? '2px solid var(--text-accent)' : '2px solid transparent',
                  color: activeTab === 'inspector' ? 'var(--text-accent)' : 'var(--text-tertiary)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.5rem',
                  cursor: 'pointer',
                }}
              >
                Model Architecture
              </button>
              <button
                onClick={() => setActiveTab('seeds')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'seeds' ? '2px solid var(--text-accent)' : '2px solid transparent',
                  color: activeTab === 'seeds' ? 'var(--text-accent)' : 'var(--text-tertiary)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.5rem',
                  cursor: 'pointer',
                }}
              >
                Seed Statistics
              </button>
            </div>

            {/* Scale Name & Status */}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {activeSpec.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: activeSpec.badgeType === 'historical' ? '#f87171' : 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
                {activeSpec.badge}
              </div>
            </div>

            {/* Readout Properties */}
            {activeTab === 'inspector' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.74rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>CoT Parameters</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{activeSpec.paramsCoT.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Latent Parameters</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{activeSpec.paramsLatent.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Layers</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{activeSpec.layers}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Hidden Dim $d_{'{model}'}$</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{activeSpec.hiddenDim}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Attention Heads</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{activeSpec.heads}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Task A (k={selectedBudgetK}) CoT</span>
                  <span style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{currentRecord.cot_acc.toFixed(2)}% (±{currentRecord.cot_sem.toFixed(2)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Task A (k={selectedBudgetK}) Latent</span>
                  <span style={{ color: 'var(--correct-color)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{currentRecord.latent_acc.toFixed(2)}% (±{currentRecord.latent_sem.toFixed(2)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Task B (k=16) CoT</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{activeSpec.taskBCoTk16.toFixed(2)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Task B (k=16) Latent</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{activeSpec.taskBLatentk16.toFixed(2)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Latency (k={selectedBudgetK}) CoT</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{currentRecord.cot_latency_ms.toFixed(3)} ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Latency (k={selectedBudgetK}) Latent</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{currentRecord.latent_latency_ms.toFixed(3)} ms</span>
                </div>
              </div>
            ) : (
              /* Seed Variance Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <strong>Sample Size:</strong> n = 5 independent seeds (42, 43, 44, 45, 46). High variance observed in small baseline models; does not imply high statistical certainty.
                </div>

                {selectedScale === '126k' && (
                  <div style={{ background: '#060a12', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '0.6rem', fontSize: '0.7rem' }}>
                    <div style={{ color: 'var(--text-accent)', fontWeight: 700, marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                      126K BASELINE — TASK A CoT (k=16) SEED VALUES:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ background: 'var(--bg-viewport)', padding: '4px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.62rem' }}>SEED 42</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>76.20%</div>
                      </div>
                      <div style={{ background: 'var(--bg-viewport)', padding: '4px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.62rem' }}>SEED 43</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>69.70%</div>
                      </div>
                      <div style={{ background: 'var(--bg-viewport)', padding: '4px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.62rem' }}>SEED 44</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>58.90%</div>
                      </div>
                      <div style={{ background: 'var(--bg-viewport)', padding: '4px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.62rem' }}>SEED 45</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>62.90%</div>
                      </div>
                      <div style={{ background: 'var(--ground-truth-bg)', padding: '4px', borderRadius: '3px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                        <div style={{ color: 'var(--warning-color)', fontSize: '0.62rem', fontWeight: 700 }}>SEED 46 ★</div>
                        <div style={{ color: '#fde68a', fontWeight: 800 }}>99.10%</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                      Cohort Mean: 73.36% | Median: 69.70% | SEM: ±7.08% | Outlier: Seed 46
                    </div>
                  </div>
                )}

                {activeSpec.seed46OutlierNote && selectedScale !== '126k' && (
                  <div style={{ background: 'var(--ground-truth-bg)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '4px', padding: '0.6rem', fontSize: '0.7rem', color: '#fde68a' }}>
                    <strong>Seed 46 Variance Note:</strong> {activeSpec.seed46OutlierNote}
                  </div>
                )}

                {selectedScale === '5m_recovery' && (
                  <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '0.6rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <strong>5M Recovery Seeds (k=16, n=5):</strong><br />
                    CoT: S42=100.0%, S43=98.9%, S44=100.0%, S45=99.8%, S46=100.0% (Mean: 99.74% ± 0.48%)<br />
                    Latent: S42=35.3%, S43=33.3%, S44=33.3%, S45=34.1%, S46=33.6% (Mean: 33.92% ± 0.84%)
                  </div>
                )}
              </div>
            )}

            {/* Optimization Schedule Card */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
                OPTIMIZATION CONDITION
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                {activeSpec.optCondition}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
