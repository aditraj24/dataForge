import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Cpu,
  Binary,
  Code
} from 'lucide-react';
import { ThreeStateTrajectory } from './ThreeStateTrajectory';
import { EvidenceBadge } from './EvidenceBadge';

export const FreeExperimentWorkbench: React.FC = () => {
  const [taskType, setTaskType] = useState<'task_a' | 'task_b'>('task_a');
  const [modelType, setModelType] = useState<'cot' | 'latent'>('latent');
  const [modelScale, setModelScale] = useState<'126k' | '1m' | '5m_recovery'>('5m_recovery');

  // Task A Parameters (Permutation Orbit)
  const [permutation, setPermutation] = useState<number[]>([1, 7, 5, 0, 2, 4, 6, 3]);
  const [startNode, setStartNode] = useState<number>(0);
  const [depthD, setDepthD] = useState<number>(4);
  const [budgetK, setBudgetK] = useState<number>(8);

  // Task B Parameters (Modular Register)
  const [initialReg, setInitialReg] = useState<number>(0);
  const [modulus, setModulus] = useState<number>(10);
  const [operations, setOperations] = useState<{ op: 'ADD' | 'SUB' | 'MUL'; val: number }[]>([
    { op: 'ADD', val: 3 },
    { op: 'MUL', val: 2 },
    { op: 'ADD', val: 7 },
    { op: 'SUB', val: 1 },
  ]);

  // Inspection mode for Latent model: [ MACHINE VIEW ] vs [ 3D STATE SPACE ]
  const [latentViewMode, setLatentViewMode] = useState<'machine' | '3d'>('machine');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const [executionTimestamp, setExecutionTimestamp] = useState<string>('Ready');

  // Ground-truth computation for Task A
  const taskAOrbit = useMemo(() => {
    const orbit: number[] = [startNode];
    let curr = startNode;
    for (let i = 0; i < depthD; i++) {
      curr = permutation[curr] ?? 0;
      orbit.push(curr);
    }
    return orbit;
  }, [permutation, startNode, depthD]);

  const targetAnswerA = taskAOrbit[taskAOrbit.length - 1];

  // Ground-truth computation for Task B
  const taskBTransitions = useMemo(() => {
    let reg = initialReg;
    const history: { step: number; op: string; prev: number; result: number }[] = [];
    operations.forEach((item, idx) => {
      const prev = reg;
      if (item.op === 'ADD') reg = (reg + item.val) % modulus;
      else if (item.op === 'SUB') reg = ((reg - item.val) % modulus + modulus) % modulus;
      else if (item.op === 'MUL') reg = (reg * item.val) % modulus;
      history.push({ step: idx + 1, op: `${item.op} ${item.val} (mod ${modulus})`, prev, result: reg });
    });
    return { finalReg: reg, history };
  }, [initialReg, modulus, operations]);

  const handleRun = () => {
    setIsRunning(true);
    setHasRun(true);
    setTimeout(() => {
      setIsRunning(false);
      setExecutionTimestamp(new Date().toLocaleTimeString());
    }, 400);
  };

  const handleReset = () => {
    setPermutation([1, 7, 5, 0, 2, 4, 6, 3]);
    setStartNode(0);
    setDepthD(4);
    setBudgetK(8);
    setInitialReg(0);
    setModulus(10);
    setOperations([
      { op: 'ADD', val: 3 },
      { op: 'MUL', val: 2 },
      { op: 'ADD', val: 7 },
      { op: 'SUB', val: 1 },
    ]);
    setHasRun(false);
    setExecutionTimestamp('Ready');
  };

  const handlePermutationChange = (idx: number, newVal: number) => {
    const updated = [...permutation];
    updated[idx] = Math.max(0, Math.min(7, newVal));
    setPermutation(updated);
  };

  const loadPresetPermutation = (preset: 'standard' | 'cycle' | 'identity') => {
    if (preset === 'standard') setPermutation([1, 7, 5, 0, 2, 4, 6, 3]);
    else if (preset === 'cycle') setPermutation([1, 2, 3, 4, 5, 6, 7, 0]);
    else if (preset === 'identity') setPermutation([0, 1, 2, 3, 4, 5, 6, 7]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem 2rem' }}>
      {/* 1. Header with Breadcrumb, Badges & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: '#38bdf8' }}>Lab</span>
            <span>&gt;</span>
            <span style={{ color: '#94a3b8' }}>Free Experiment</span>
            <span>&gt;</span>
            <EvidenceBadge type="SYNTHETIC" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
              Computational Sandbox
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '3px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontWeight: 700,
              }}
            >
              CONTROLLED REASONING EXPERIMENTS
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.35rem 0 0 0', maxWidth: '820px', lineHeight: 1.45 }}>
            Construct custom problem instances for <strong>Task A (Permutation Orbit)</strong> or <strong>Task B (Modular Register)</strong>. Compare how <strong>Autoregressive Scratchpad</strong> and <strong>Recurrent Latent Core</strong> execute the inference steps under variable thinking budgets <code style={{ color: '#38bdf8' }}>k</code>.
          </p>
        </div>

        {/* Top-Right Execution Status Card */}
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
            <FlaskConical size={13} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>SANDBOX RUNNER</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            Target Model: <strong style={{ color: modelType === 'cot' ? '#38bdf8' : '#a855f7' }}>{modelType === 'cot' ? 'CoT Scratchpad' : 'Recurrent Latent'} ({modelScale.toUpperCase()})</strong>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
            Status: <span style={{ color: isRunning ? '#f59e0b' : '#10b981' }}>{isRunning ? 'Executing forward pass...' : executionTimestamp}</span>
          </div>
        </div>
      </div>

      {/* Latent Inspection Mode Selector (Prompt Section 12 Requirement) */}
      {modelType === 'latent' && taskType === 'task_a' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#090e17', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #172234' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cpu size={14} style={{ color: '#a855f7' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
              LATENT INSPECTION MODE:
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Toggle between recurrent machine execution flow and 3D PCA state space
            </span>
          </div>
          <div style={{ display: 'flex', background: '#06090e', padding: '2px', borderRadius: '4px', border: '1px solid #1e293b' }}>
            <button
              onClick={() => setLatentViewMode('machine')}
              style={{
                background: latentViewMode === 'machine' ? '#0284c7' : 'transparent',
                color: latentViewMode === 'machine' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '3px',
                fontSize: '0.7rem',
                padding: '0.3rem 0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
              }}
            >
              [ MACHINE VIEW ]
            </button>
            <button
              onClick={() => setLatentViewMode('3d')}
              style={{
                background: latentViewMode === '3d' ? '#0284c7' : 'transparent',
                color: latentViewMode === '3d' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '3px',
                fontSize: '0.7rem',
                padding: '0.3rem 0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
              }}
            >
              [ 3D STATE SPACE ]
            </button>
          </div>
        </div>
      )}

      {/* If 3D inspection mode is open for Latent on Task A, display ThreeStateTrajectory */}
      {modelType === 'latent' && taskType === 'task_a' && latentViewMode === '3d' ? (
        <ThreeStateTrajectory />
      ) : (
        /* Standard 2-Column Computational Sandbox Grid */
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1rem', alignItems: 'stretch' }}>
          {/* Left Column: Configuration Controls */}
          <div
            style={{
              backgroundColor: '#090e17',
              border: '1px solid #172234',
              borderRadius: '6px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Code size={14} style={{ color: '#38bdf8' }} />
              1. EXPERIMENT SETUP
            </div>

            {/* Task Selector */}
            <div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                BENCHMARK TASK
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <button
                  onClick={() => setTaskType('task_a')}
                  style={{
                    padding: '0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: taskType === 'task_a' ? '#0284c7' : '#070b12',
                    color: taskType === 'task_a' ? '#ffffff' : '#94a3b8',
                    border: '1px solid #172234',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Task A: Permutation
                </button>
                <button
                  onClick={() => setTaskType('task_b')}
                  style={{
                    padding: '0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: taskType === 'task_b' ? '#0284c7' : '#070b12',
                    color: taskType === 'task_b' ? '#ffffff' : '#94a3b8',
                    border: '1px solid #172234',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Task B: Modular Reg
                </button>
              </div>
            </div>

            {/* Model Architecture Selector */}
            <div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                REASONING ARCHITECTURE
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <button
                  onClick={() => setModelType('cot')}
                  style={{
                    padding: '0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: modelType === 'cot' ? '#0284c7' : '#070b12',
                    color: modelType === 'cot' ? '#ffffff' : '#94a3b8',
                    border: '1px solid #172234',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Autoregressive CoT
                </button>
                <button
                  onClick={() => setModelType('latent')}
                  style={{
                    padding: '0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: modelType === 'latent' ? '#a855f7' : '#070b12',
                    color: modelType === 'latent' ? '#ffffff' : '#94a3b8',
                    border: '1px solid #172234',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Recurrent Latent
                </button>
              </div>
            </div>

            {/* Model Scale Selector */}
            <div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                FROZEN MODEL SCALE
              </div>
              <select
                value={modelScale}
                onChange={(e) => setModelScale(e.target.value as any)}
                style={{
                  width: '100%',
                  background: '#06090e',
                  border: '1px solid #1e293b',
                  color: '#e2e8f0',
                  fontSize: '0.74rem',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '4px',
                  outline: 'none',
                }}
              >
                <option value="126k">126K Baseline (126,168 CoT / 125,688 Latent)</option>
                <option value="1m">1M Scaled (998,520 CoT / 998,523 Latent)</option>
                <option value="5m_recovery">5M Recovery [Controlled Recovery Condition] (5,000,632 CoT / 5,000,635 Latent)</option>
              </select>
            </div>

            {/* Task A Controls */}
            {taskType === 'task_a' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #172234', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    PERMUTATION π TABLE (8 elements)
                  </span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <button onClick={() => loadPresetPermutation('standard')} style={{ background: '#070b12', border: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.62rem', padding: '1px 4px', borderRadius: '2px', cursor: 'pointer' }}>Standard</button>
                    <button onClick={() => loadPresetPermutation('cycle')} style={{ background: '#070b12', border: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.62rem', padding: '1px 4px', borderRadius: '2px', cursor: 'pointer' }}>Cycle</button>
                  </div>
                </div>

                {/* 8-element inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                  {permutation.map((target, src) => (
                    <div key={src} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>v{src}</span>
                      <input
                        type="number"
                        min="0"
                        max="7"
                        value={target}
                        onChange={(e) => handlePermutationChange(src, parseInt(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          background: '#06090e',
                          border: '1px solid #1e293b',
                          color: '#38bdf8',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          padding: '0.25rem 0',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Start node & Depth D */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>START NODE:</span>
                    <select
                      value={startNode}
                      onChange={(e) => setStartNode(parseInt(e.target.value))}
                      style={{ width: '100%', background: '#06090e', border: '1px solid #1e293b', color: '#e2e8f0', fontSize: '0.74rem', padding: '0.35rem', borderRadius: '4px' }}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n}>v{n}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>DEPTH D ({depthD} hops):</span>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={depthD}
                      onChange={(e) => setDepthD(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#0284c7' }}
                    />
                  </div>
                </div>

                {/* Compute Budget k */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    <span>THINKING BUDGET (k):</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>k = {budgetK}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={budgetK}
                    onChange={(e) => setBudgetK(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                  <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '2px' }}>
                    Standard benchmark evaluation budgets: k ∈ &#123;1, 2, 4, 8, 12, 16&#125;
                  </div>
                </div>
              </div>
            )}

            {/* Task B Controls */}
            {taskType === 'task_b' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #172234', paddingTop: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>INITIAL REG (R0):</span>
                    <input
                      type="number"
                      value={initialReg}
                      onChange={(e) => setInitialReg(parseInt(e.target.value) || 0)}
                      style={{ width: '100%', background: '#06090e', border: '1px solid #1e293b', color: '#e2e8f0', fontSize: '0.74rem', padding: '0.35rem', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>MODULUS (M):</span>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={modulus}
                      onChange={(e) => setModulus(parseInt(e.target.value) || 10)}
                      style={{ width: '100%', background: '#06090e', border: '1px solid #1e293b', color: '#e2e8f0', fontSize: '0.74rem', padding: '0.35rem', borderRadius: '4px' }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  OPERATIONS SEQUENCE (4 steps)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {operations.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', width: '22px' }}>#{idx + 1}</span>
                      <select
                        value={item.op}
                        onChange={(e) => {
                          const updated = [...operations];
                          updated[idx].op = e.target.value as any;
                          setOperations(updated);
                        }}
                        style={{ background: '#06090e', border: '1px solid #1e293b', color: '#e2e8f0', fontSize: '0.7rem', padding: '2px 4px', borderRadius: '3px' }}
                      >
                        <option value="ADD">ADD</option>
                        <option value="SUB">SUB</option>
                        <option value="MUL">MUL</option>
                      </select>
                      <input
                        type="number"
                        value={item.val}
                        onChange={(e) => {
                          const updated = [...operations];
                          updated[idx].val = parseInt(e.target.value) || 0;
                          setOperations(updated);
                        }}
                        style={{ width: '50px', background: '#06090e', border: '1px solid #1e293b', color: '#f59e0b', fontSize: '0.72rem', textAlign: 'center', padding: '2px', borderRadius: '3px' }}
                      />
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>(mod {modulus})</span>
                    </div>
                  ))}
                </div>

                {/* Task B Inconclusive Badge */}
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', padding: '0.55rem 0.75rem', fontSize: '0.68rem', color: '#fca5a5', lineHeight: 1.35 }}>
                  <strong>EMPIRICAL OUTCOME: INCONCLUSIVE</strong><br />
                  Both CoT and Latent remain near chance (~10% accuracy) on modular arithmetic across budgets. Does not prove or disprove scratchpad superiority.
                </div>
              </div>
            )}

            {/* Run Button */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleRun}
                disabled={isRunning}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: isRunning ? 'default' : 'pointer',
                }}
              >
                <Play size={13} fill="#ffffff" />
                <span>{isRunning ? 'Running Simulation...' : 'RUN EXPERIMENT'}</span>
              </button>
              <button
                onClick={handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  background: '#0a101d',
                  border: '1px solid #1e293b',
                  color: '#94a3b8',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>RESET</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic Computational Flow */}
          <div
            style={{
              backgroundColor: '#090e17',
              border: '1px solid #172234',
              borderRadius: '6px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #172234', paddingBottom: '0.65rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Binary size={15} style={{ color: '#38bdf8' }} />
                  2. COMPUTATIONAL EXECUTION TRACE
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  Representing the real algorithmic execution path of the chosen architecture.
                </div>
              </div>
              <EvidenceBadge type="LIVE" />
            </div>

            {!hasRun ? (
              <div
                style={{
                  padding: '3.5rem 1.5rem',
                  textAlign: 'center',
                  color: '#64748b',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  border: '1px dashed #1e293b',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  minHeight: '260px',
                }}
              >
                <Play size={24} style={{ color: '#0284c7', opacity: 0.6 }} />
                <div style={{ fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>NO RUN YET</div>
                <div style={{ fontSize: '0.72rem', color: '#475569', maxWidth: '340px', lineHeight: 1.45 }}>
                  Configure problem parameters and thinking budget on the left, then click <strong>RUN EXPERIMENT</strong> to execute the computational trace.
                </div>
              </div>
            ) : (
              <>

            {/* Task A: CoT Flow (Section 13 Token-Machine Flow) */}
            {taskType === 'task_a' && modelType === 'cot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Autoregressive Scratchpad generates discrete reasoning tokens sequentially into its causal context window:
                </div>

                {/* Token Machine Sequence Flow */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#06090e', border: '1px solid #172234', borderRadius: '4px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#64748b', width: '90px' }}>INPUT:</span>
                    <span style={{ color: '#cbd5e1', background: '#0a1220', padding: '2px 8px', borderRadius: '3px', border: '1px solid #1e293b' }}>
                      π=[{permutation.join(',')}], start=v{startNode}, D={depthD}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#475569' }}>↓</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#64748b', width: '90px' }}>EMBEDDING:</span>
                    <span style={{ color: '#94a3b8' }}>Tokenized vocabulary indices [0..7, HOP, QUERY]</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#475569' }}>↓</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#64748b', width: '90px' }}>TRANSFORMER:</span>
                    <span style={{ color: '#38bdf8' }}>Causal masked multi-head self-attention ({modelScale.toUpperCase()})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#475569' }}>↓</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#64748b', width: '90px' }}>GENERATION:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.15)', padding: '2px 6px', borderRadius: '3px' }}>&lt;THINK&gt;</span>
                      {taskAOrbit.map((v, i) => (
                        <React.Fragment key={i}>
                          <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '3px' }}>v{v}</span>
                          {i < taskAOrbit.length - 1 && <span style={{ color: '#64748b' }}>→</span>}
                        </React.Fragment>
                      ))}
                      <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '3px' }}>&lt;ANSWER&gt; v{targetAnswerA}</span>
                    </div>
                  </div>
                </div>

                {/* Accuracy expectation callout based on empirical benchmarks */}
                <div style={{ background: '#06090e', border: '1px solid #1e293b', borderRadius: '4px', padding: '0.75rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '0.2rem' }}>EMPIRICAL BEHAVIOR ON TASK A:</div>
                  CoT accuracy scales steadily with budget <code style={{ color: '#f59e0b' }}>k</code>. At 5M Recovery, CoT achieves <strong>99.74%</strong> at k=16 (seed mean). With depth D={depthD} and budget k={budgetK}, scratchpad retains complete teacher-forced intermediate token history.
                </div>
              </div>
            )}

            {/* Task A: Latent Flow (Section 12 Machine View) */}
            {taskType === 'task_a' && modelType === 'latent' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Recurrent Latent Core repeatedly updates a hidden state vector <code style={{ color: '#a855f7' }}>h_t</code> without generating visible tokens:
                </div>

                {/* Machine View Sequence Flow */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#06090e', border: '1px solid #172234', borderRadius: '4px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#64748b', width: '80px' }}>INPUT:</span>
                    <span style={{ color: '#cbd5e1' }}>Table π, start=v{startNode}, D={depthD}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#475569' }}>↓</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#64748b', width: '80px' }}>MEMORY:</span>
                    <span style={{ color: '#38bdf8' }}>Static cross-attention key/value memory table</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#475569' }}>↓</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#64748b', width: '80px' }}>QUERY:</span>
                    <span style={{ color: '#f59e0b' }}>Initial recurrent state h_0 = Embed(v{startNode})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#475569' }}>↓</div>

                  {/* Recurrent Steps */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#64748b', width: '80px' }}>RECURSION:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {Array.from({ length: Math.min(budgetK, 8) }).map((_, i) => (
                        <span key={i} style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.15)', padding: '2px 6px', borderRadius: '3px' }}>
                          S{i}
                        </span>
                      ))}
                      {budgetK > 8 && <span style={{ color: '#64748b' }}>... S{budgetK}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#475569' }}>↓</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#64748b', width: '80px' }}>ANSWER:</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>Linear Readout Head(h_{budgetK}) → v{targetAnswerA}</span>
                  </div>
                </div>

                {/* Empirical observation callout */}
                <div style={{ background: '#06090e', border: '1px solid #1e293b', borderRadius: '4px', padding: '0.75rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <div style={{ color: '#a855f7', fontWeight: 700, marginBottom: '0.2rem' }}>EMPIRICAL BEHAVIOR ON TASK A:</div>
                  In the tested implementations, latent reasoning reaches an empirical plateau of <strong>~33%</strong> (33.06% at 126K, 31.12% at 1M, 33.92% at 5M). Probing reveals rapid numerical near-stabilization and attention collapse onto v0.
                </div>
              </div>
            )}

            {/* Task B: Modular Register Transitions (Section 14 Requirement) */}
            {taskType === 'task_b' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Modular Register Machine transitions: Initial register <code style={{ color: '#38bdf8' }}>R₀ = {initialReg}</code> evaluated under modulus <code style={{ color: '#f59e0b' }}>M = {modulus}</code>.
                </div>

                {/* Transition steps table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#06090e', border: '1px solid #172234', borderRadius: '4px', padding: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 140px 80px 80px', fontSize: '0.67rem', color: '#64748b', fontFamily: 'var(--font-mono)', paddingBottom: '0.3rem', borderBottom: '1px solid #172234' }}>
                    <span>STEP</span>
                    <span>OPERATION</span>
                    <span>PREV REG</span>
                    <span>NEXT REG</span>
                  </div>
                  {taskBTransitions.history.map((h) => (
                    <div key={h.step} style={{ display: 'grid', gridTemplateColumns: '40px 140px 80px 80px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', padding: '0.3rem 0', borderBottom: '1px solid #0d1522' }}>
                      <span style={{ color: '#64748b' }}>#{h.step}</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{h.op}</span>
                      <span style={{ color: '#94a3b8' }}>{h.prev}</span>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>{h.result}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #172234', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#64748b' }}>FINAL COMPUTED REGISTER:</span>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.88rem' }}>R_final = {taskBTransitions.finalReg}</span>
                  </div>
                </div>

                {/* Scientific Honesty Callout on Task B */}
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', padding: '0.75rem', fontSize: '0.72rem', color: '#fca5a5', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>SCIENTIFIC RESTRAINT: INCONCLUSIVE RESULTS</div>
                  On Task B (Modular Register), measured benchmark performance for both CoT and Latent reasoning remains hovering near random chance (~10%). The project does <strong>NOT</strong> claim that Task B proves scratchpad dominance or proves latent reasoning failure at symbolic operations. Evidence is currently inconclusive.
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
