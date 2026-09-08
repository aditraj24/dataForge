import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  RotateCcw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Grid,
  Activity,
  Layers,
  Info,
  HelpCircle,
  Database
} from 'lucide-react';
import { EvidenceBadge } from './EvidenceBadge';

// Pre-defined synthetic associative patterns (representing 8 key-value pairs stored in fast weights)
const ASSOCIATIVE_PATTERNS = [
  { id: 0, label: 'Pair 0 (A → X)', keyDim: 64, valDim: 64, targetSim: 0.98, energy: 1.12 },
  { id: 1, label: 'Pair 1 (B → Y)', keyDim: 64, valDim: 64, targetSim: 0.94, energy: 1.45 },
  { id: 2, label: 'Pair 2 (C → Z)', keyDim: 64, valDim: 64, targetSim: 0.91, energy: 1.88 },
  { id: 3, label: 'Pair 3 (D → W)', keyDim: 64, valDim: 64, targetSim: 0.88, energy: 2.15 },
  { id: 4, label: 'Pair 4 (E → V)', keyDim: 64, valDim: 64, targetSim: 0.84, energy: 2.52 },
  { id: 5, label: 'Pair 5 (F → U)', keyDim: 64, valDim: 64, targetSim: 0.79, energy: 2.91 },
  { id: 6, label: 'Pair 6 (G → T)', keyDim: 64, valDim: 64, targetSim: 0.73, energy: 3.24 },
  { id: 7, label: 'Pair 7 (H → S)', keyDim: 64, valDim: 64, targetSim: 0.68, energy: 3.55 },
];

export const BdhSynapticWorkbench: React.FC = () => {
  // Toy Model Parameters (matches models_hebbian_model.py)
  const [lr, setLr] = useState<number>(0.01); // η (learning rate / plasticity strength)
  const [decay, setDecay] = useState<number>(0.99); // λ (damping factor per update)
  const [activationThreshold, setActivationThreshold] = useState<number>(0.10); // Sparsity threshold
  const [activeStep, setActiveStep] = useState<number>(3); // Number of stored pairs [0..7]
  const [viewMode, setViewMode] = useState<'matrix' | 'flow' | 'accounting'>('matrix');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [matrixBlockRow, setMatrixBlockRow] = useState<number>(0);

  // Exact Model Accounting (models_hebbian_model.py)
  const ACCOUNTING = {
    encoderTrainable: 8320, // 64 -> 128 (64*128 + 128)
    decoderTrainable: 4160, // 64 -> 64 (64*64 + 64)
    trainableTotal: 12480,  // 8320 + 4160
    synapticState: 8192,    // 128 * 64 non-trainable parameter tensor (sigma)
    totalElements: 20672,   // 12480 + 8192
    neurons: 128,
    stateDim: 64,
  };

  // Playback timer for sequential writing
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % ASSOCIATIVE_PATTERNS.length);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Dynamically compute synaptic state metrics based on toy parameters
  const synapticMetrics = useMemo(() => {
    // Effective scale of outer-product accumulation: sum_{i=0}^step (lr * decay^(step-i))
    let accumulatedStrength = 0;
    for (let i = 0; i <= activeStep; i++) {
      accumulatedStrength += lr * Math.pow(decay, activeStep - i);
    }
    const frobeniusNorm = Math.sqrt(ACCOUNTING.neurons * ACCOUNTING.stateDim) * accumulatedStrength * 0.42;
    const maxWeight = accumulatedStrength * 0.85;
    const avgSparsity = Math.max(0.02, Math.min(0.15, 0.05 + (0.10 - activationThreshold) * 0.4));
    const currentPattern = ASSOCIATIVE_PATTERNS[activeStep];
    const recallCosine = Math.max(0.20, Math.min(0.99, currentPattern.targetSim * (1 - (activeStep * 0.035 * (0.01 / lr)))));

    return {
      accumulatedStrength,
      frobeniusNorm,
      maxWeight,
      avgSparsity,
      currentPattern,
      recallCosine,
    };
  }, [lr, decay, activationThreshold, activeStep]);

  // Generate 8x8 representative block from the 128x64 synaptic matrix σ
  const matrixSample = useMemo(() => {
    const rows = 8;
    const cols = 8;
    const grid: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowVals: number[] = [];
      for (let c = 0; c < cols; c++) {
        const actualRow = matrixBlockRow * 8 + r;
        // Pseudo-hash based on coordinates, stored patterns, and plasticity
        const hash = Math.sin((actualRow + 1) * 12.9898 + (c + 1) * 78.233 + activeStep * 37.719);
        const val = hash * synapticMetrics.maxWeight;
        rowVals.push(val);
      }
      grid.push(rowVals);
    }
    return grid;
  }, [activeStep, synapticMetrics.maxWeight, matrixBlockRow]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem 2rem' }}>
      {/* 1. Header with Breadcrumbs, Badges, and Accounting Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: '#38bdf8' }}>Lab</span>
            <span>&gt;</span>
            <span style={{ color: '#94a3b8' }}>BDH Synaptic Lab</span>
            <span>&gt;</span>
            <EvidenceBadge type="ILLUSTRATIVE" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
              BDH Synaptic Workbench
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '3px',
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                color: '#facc15',
                fontWeight: 700,
              }}
            >
              TOY MODEL • STANDALONE ARTIFACT
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.35rem 0 0 0', maxWidth: '820px', lineHeight: 1.45 }}>
            Standalone educational toy model inspired by fast-weight associative memory (<code style={{ color: '#38bdf8' }}>HebbianMemory</code>). Demonstrates outer-product plasticity (<code style={{ color: '#f59e0b' }}>Δσ = η(x ⊗ y)</code>). Retained as an exploratory demonstration; <strong>did not participate in the multi-seed CoT-vs-Latent benchmark</strong>.
          </p>
        </div>

        {/* Top-Right Architecture Accounting Card */}
        <div
          style={{
            backgroundColor: '#0a101d',
            border: '1px solid #1e293b',
            padding: '0.6rem 0.9rem',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={13} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>HEBBIAN MEMORY ACCOUNTING</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <span>Trainable Weights:</span>
            <strong style={{ color: '#38bdf8' }}>12,480</strong>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <span>Synaptic State (σ):</span>
            <strong style={{ color: '#f59e0b' }}>8,192 (128×64)</strong>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#cbd5e1', borderTop: '1px solid #172234', paddingTop: '2px', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <span>Total State Elements:</span>
            <strong style={{ color: '#10b981' }}>20,672</strong>
          </div>
        </div>
      </div>

      {/* 2. Main 3-Column Instrument Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr 310px',
          gap: '1rem',
          alignItems: 'stretch',
        }}
      >
        {/* Left Column: Supported Toy Parameters & Controls */}
        <div
          style={{
            backgroundColor: '#090e17',
            border: '1px solid #172234',
            borderRadius: '6px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sliders size={13} style={{ color: '#38bdf8' }} />
            TOY MODEL PARAMETERS
          </div>

          {/* View Mode Selector */}
          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              INSTRUMENT VIEW
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {(['matrix', 'flow', 'accounting'] as const).map((vm) => (
                <button
                  key={vm}
                  onClick={() => setViewMode(vm)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: viewMode === vm ? '#0284c7' : '#070b12',
                    color: viewMode === vm ? '#ffffff' : '#94a3b8',
                    border: '1px solid #172234',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {vm === 'matrix' && <Grid size={13} />}
                  {vm === 'flow' && <Activity size={13} />}
                  {vm === 'accounting' && <Layers size={13} />}
                  <span>{vm === 'matrix' ? 'Synaptic Matrix σ' : vm === 'flow' ? 'Outer-Product Flow' : 'Parameter Breakdown'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Plasticity Learning Rate Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
              <span>PLASTICITY (η):</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{lr.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.002"
              max="0.040"
              step="0.002"
              value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#0284c7' }}
            />
            <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '2px' }}>
              Baseline default in repo: 0.010
            </div>
          </div>

          {/* Synaptic Decay Factor Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
              <span>DECAY FACTOR (λ):</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>{decay.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.90"
              max="0.999"
              step="0.005"
              value={decay}
              onChange={(e) => setDecay(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#f59e0b' }}
            />
            <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '2px' }}>
              Damping per step: σ *= 0.99
            </div>
          </div>

          {/* Sparsity Threshold */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
              <span>ACTIVATION THRESHOLD:</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{activationThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.30"
              step="0.02"
              value={activationThreshold}
              onChange={(e) => setActivationThreshold(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981' }}
            />
            <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '2px' }}>
              Repo default: 0.10 (~5% firing)
            </div>
          </div>

          {/* Reset Synaptic State */}
          <button
            onClick={() => {
              setActiveStep(0);
              setLr(0.01);
              setDecay(0.99);
            }}
            style={{
              marginTop: 'auto',
              background: 'transparent',
              border: '1px solid #1e293b',
              borderRadius: '4px',
              color: '#94a3b8',
              fontSize: '0.74rem',
              padding: '0.45rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} />
            Reset Synaptic State (σ = 0)
          </button>
        </div>

        {/* Center Column: Dominant Viewport */}
        <div
          style={{
            backgroundColor: '#090e17',
            border: '1px solid #172234',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Viewport Top Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.65rem 1rem',
              borderBottom: '1px solid #172234',
              backgroundColor: '#070b12',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {viewMode === 'matrix' ? 'Synaptic Fast-Weight Matrix σ ∈ ℝ¹²⁸ˣ⁶⁴' : viewMode === 'flow' ? 'Outer-Product Associative Recall Pipeline' : 'Hebbian Memory Parameter Accounting'}
                <span style={{ fontSize: '0.65rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                  STEP t={activeStep}
                </span>
              </div>
              <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
                {viewMode === 'matrix'
                  ? 'Displays values in the non-trainable fast weight matrix σ updated via outer-product plasticity.'
                  : viewMode === 'flow'
                  ? 'Sequential execution flow from key-value pair encoding to sparse readout.'
                  : 'Explicit breakdown of trainable vs non-trainable parameter elements.'}
              </div>
            </div>

            {viewMode === 'matrix' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: '#64748b' }}>
                <span>Sub-block:</span>
                <select
                  value={matrixBlockRow}
                  onChange={(e) => setMatrixBlockRow(parseInt(e.target.value))}
                  style={{ background: '#06090e', border: '1px solid #1e293b', color: '#cbd5e1', fontSize: '0.68rem', padding: '2px 4px', borderRadius: '3px' }}
                >
                  {Array.from({ length: 16 }).map((_, i) => (
                    <option key={i} value={i}>
                      Rows {i * 8}–{i * 8 + 7}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* View Content */}
          <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#06090e' }}>
            {viewMode === 'matrix' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 48px)', gap: '4px' }}>
                    {matrixSample.map((row, rIdx) =>
                      row.map((val, cIdx) => {
                        const isPos = val > 0;
                        const intensity = Math.min(1, Math.abs(val) / (synapticMetrics.maxWeight || 0.001));
                        return (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            title={`σ[${matrixBlockRow * 8 + rIdx}, ${cIdx}] = ${val.toFixed(4)}`}
                            style={{
                              height: '38px',
                              background: isPos
                                ? `rgba(56, 189, 248, ${0.1 + intensity * 0.7})`
                                : `rgba(239, 68, 68, ${0.1 + intensity * 0.7})`,
                              border: isPos ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.65rem',
                              color: isPos ? '#e0f2fe' : '#fee2e2',
                              cursor: 'pointer',
                            }}
                          >
                            {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Matrix Scale Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 700 }}>SYNAPTIC COLOR SCALE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '14px', height: '14px', background: 'rgba(56, 189, 248, 0.8)', borderRadius: '2px' }} />
                      <span>+{synapticMetrics.maxWeight.toFixed(3)} (Max Potentiation)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '14px', height: '14px', background: 'rgba(56, 189, 248, 0.2)', borderRadius: '2px' }} />
                      <span>0.000 (Unactivated)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '14px', height: '14px', background: 'rgba(239, 68, 68, 0.8)', borderRadius: '2px' }} />
                      <span>-{synapticMetrics.maxWeight.toFixed(3)} (Depression)</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid #1e293b', paddingTop: '0.4rem', fontSize: '0.64rem', color: '#64748b' }}>
                      Displaying 8×8 slice of full 128×64 matrix (8,192 cells total).
                    </div>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'flow' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '640px', margin: '0 auto' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.45 }}>
                  The core BDH mechanism in <code style={{ color: '#38bdf8' }}>models_hebbian_model.py</code> updates fast synaptic weights via outer-product and retrieves associative memory using sparse activation:
                </div>

                <div style={{ background: '#090e17', border: '1px solid #1e293b', borderRadius: '4px', padding: '0.8rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700 }}>1. WRITE PHASE (Outer-product plasticity):</div>
                  <div style={{ paddingLeft: '1rem', color: '#94a3b8' }}>
                    encoded_key = ReLU(W_encoder @ key) &nbsp;&nbsp;[dim: 128]<br />
                    outer = encoded_key ⊗ value &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[dim: 128 × 64]<br />
                    <strong style={{ color: '#f59e0b' }}>σ_t = 0.99 · σ_(t-1) + η · outer</strong>
                  </div>

                  <div style={{ color: '#10b981', fontWeight: 700, marginTop: '0.3rem' }}>2. READ PHASE (Sparse synaptic projection):</div>
                  <div style={{ paddingLeft: '1rem', color: '#94a3b8' }}>
                    encoded_query = ReLU(W_encoder @ query) &nbsp;[dim: 128]<br />
                    sparse_query = encoded_query · (encoded_query &gt; 0.1) &nbsp;[~5% active]<br />
                    retrieved = sparse_query @ σ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[dim: 64]<br />
                    output = W_decoder @ retrieved &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[dim: 64]
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'accounting' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '580px', margin: '0 auto' }}>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Verifiable parameter and state element accounting matching repo codebase:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: '#090e17', border: '1px solid #1e293b', borderRadius: '4px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>TRAINABLE PARAMETERS</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>12,480</div>
                    <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
                      • Encoder Linear(64, 128): 8,320<br />
                      • Decoder Linear(64, 64): 4,160
                    </div>
                  </div>
                  <div style={{ background: '#090e17', border: '1px solid #1e293b', borderRadius: '4px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>SYNAPTIC FAST-WEIGHT STATE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>8,192</div>
                    <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
                      • Matrix σ (128 × 64): 8,192 elements<br />
                      • Non-trainable (updated via Hebbian rule)
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '0.6rem 0.85rem', fontSize: '0.7rem', color: '#a7f3d0' }}>
                  Total system state: <strong>20,672 elements</strong>. Retained as educational artifact; excluded from 20-run benchmark.
                </div>
              </div>
            )}
          </div>

          {/* Scientific Honesty Disclaimer Banner */}
          <div
            style={{
              padding: '0.4rem 1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.66rem',
              color: '#64748b',
              background: '#070b12',
              borderTop: '1px solid #172234',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>TOY MODEL • ILLUSTRATIVE • Not an official Dragon Hatchling implementation</span>
            <span style={{ color: '#f59e0b' }}>HebbianMemory (standalone module)</span>
          </div>
        </div>

        {/* Right Column: Contextual State Inspector */}
        <div
          style={{
            backgroundColor: '#090e17',
            border: '1px solid #172234',
            borderRadius: '6px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid #172234', paddingBottom: '0.4rem' }}>
            Associative State Inspector
          </div>

          {/* Stepper for Association Step */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
              {synapticMetrics.currentPattern.label}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
                style={{
                  background: '#0e1624',
                  border: '1px solid #1e293b',
                  color: activeStep === 0 ? '#475569' : '#e2e8f0',
                  borderRadius: '3px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: activeStep === 0 ? 'default' : 'pointer',
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setActiveStep((prev) => Math.min(ASSOCIATIVE_PATTERNS.length - 1, prev + 1))}
                disabled={activeStep === ASSOCIATIVE_PATTERNS.length - 1}
                style={{
                  background: '#0e1624',
                  border: '1px solid #1e293b',
                  color: activeStep === ASSOCIATIVE_PATTERNS.length - 1 ? '#475569' : '#e2e8f0',
                  borderRadius: '3px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: activeStep === ASSOCIATIVE_PATTERNS.length - 1 ? 'default' : 'pointer',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Properties Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.74rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Store Step</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>t = {activeStep} / 7</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Plasticity strength (η)</span>
              <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{lr.toFixed(3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Synaptic Fro. Norm ||σ||_F</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{synapticMetrics.frobeniusNorm.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Max Synaptic Weight</span>
              <span style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>{synapticMetrics.maxWeight.toFixed(4)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Activity Sparsity</span>
              <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>{(synapticMetrics.avgSparsity * 100).toFixed(1)}% (~5% target)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Recall Cosine Sim</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{synapticMetrics.recallCosine.toFixed(3)}</span>
            </div>
          </div>

          {/* Educational Note */}
          <div style={{ borderTop: '1px solid #172234', paddingTop: '0.65rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              MECHANISTIC PURPOSE
            </div>
            <div style={{ background: '#06090e', border: '1px solid #172234', borderRadius: '4px', padding: '0.55rem 0.65rem', fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Demonstrates how fast-changing synaptic connections can store association keys without backpropagation. The fast weights act as in-context memory cache.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Timeline Scrubber */}
      <div
        style={{
          backgroundColor: '#090e17',
          border: '1px solid #172234',
          borderRadius: '6px',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#0284c7',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: '2px' }} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative', padding: '0 0.5rem' }}>
          <div
            style={{
              position: 'absolute',
              left: '10px',
              right: '10px',
              height: '3px',
              background: 'linear-gradient(90deg, #38bdf8 0%, #f59e0b 50%, #10b981 100%)',
              zIndex: 1,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', zIndex: 2 }}>
            {ASSOCIATIVE_PATTERNS.map((pt, idx) => {
              const isSelected = idx === activeStep;
              return (
                <button
                  key={pt.id}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <div
                    style={{
                      width: isSelected ? '16px' : '10px',
                      height: isSelected ? '16px' : '10px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? '#f59e0b' : '#38bdf8',
                      boxShadow: isSelected ? '0 0 8px #f59e0b' : 'none',
                      border: isSelected ? '2px solid #ffffff' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      color: isSelected ? '#f59e0b' : '#64748b',
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    Pair {idx}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
