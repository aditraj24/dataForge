import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  Sliders, 
  Layers
} from 'lucide-react';
import { EvidenceBadge } from './EvidenceBadge';

interface PermutationMachineProps {
  initialPermutation?: number[];
  initialStart?: number;
  initialHops?: number;
}

// Canonical Task A permutation over S_8:
// 0->1, 1->7, 2->5, 3->0, 4->2, 5->4, 6->6, 7->3
// Cycles: (0 1 7 3), (2 5 4), (6)
const CANONICAL_PI = [1, 7, 5, 0, 2, 4, 6, 3];

const PRESETS: { name: string; pi: number[]; desc: string }[] = [
  {
    name: 'Canonical (Paper Benchmark)',
    pi: CANONICAL_PI,
    desc: 'Two main cycles (0 1 7 3) and (2 5 4), plus one fixed point (6)',
  },
  {
    name: 'Full 8-Cycle',
    pi: [1, 2, 3, 4, 5, 6, 7, 0],
    desc: 'Single maximal orbit visiting all 8 vertices sequentially',
  },
  {
    name: 'Four Transpositions',
    pi: [1, 0, 3, 2, 5, 4, 7, 6],
    desc: 'Involution consisting of 4 disjoint pairwise swaps',
  },
  {
    name: 'Two 4-Cycles',
    pi: [1, 2, 3, 0, 5, 6, 7, 4],
    desc: 'Two decoupled equal-length orbits {0,1,2,3} and {4,5,6,7}',
  },
];

export const PermutationMachine: React.FC<PermutationMachineProps> = ({
  initialPermutation = CANONICAL_PI,
  initialStart = 3,
  initialHops = 4,
}) => {
  // Mode: PRESET vs BUILD
  const [mode, setMode] = useState<'preset' | 'build'>('preset');
  
  // Computational Definition
  const [pi, setPi] = useState<number[]>(initialPermutation);
  const [v0, setV0] = useState<number>(initialStart);
  const [totalHops, setTotalHops] = useState<number>(initialHops);

  // Stepping State
  const [currentHop, setCurrentHop] = useState<number>(0);
  const [currentNode, setCurrentNode] = useState<number>(initialStart);
  const [history, setHistory] = useState<number[]>([initialStart]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Progressive Disclosure
  const [showInspection, setShowInspection] = useState<boolean>(false);
  const [showTechnical, setShowTechnical] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Validate Permutation (must be a bijection over {0..7})
  const validation = useMemo(() => {
    const destinations = new Set<number>();
    const duplicates = new Set<number>();
    const missing: number[] = [];

    for (let i = 0; i < 8; i++) {
      const dest = pi[i];
      if (destinations.has(dest)) {
        duplicates.add(dest);
      }
      destinations.add(dest);
    }

    for (let i = 0; i < 8; i++) {
      if (!destinations.has(i)) {
        missing.push(i);
      }
    }

    const isValid = duplicates.size === 0 && missing.length === 0;
    return {
      isValid,
      duplicates: Array.from(duplicates),
      missing,
    };
  }, [pi]);

  // Compute Ground Truth sequence ahead of time for any configuration
  const groundTruthSequence: number[] = useMemo(() => {
    const seq = [v0];
    let curr = v0;
    for (let i = 0; i < totalHops; i++) {
      curr = pi[curr] ?? curr;
      seq.push(curr);
    }
    return seq;
  }, [pi, v0, totalHops]);

  const groundTruthFinal = groundTruthSequence[totalHops] ?? v0;

  // Step Forward One Hop
  const stepForward = () => {
    if (currentHop >= totalHops) {
      setIsPlaying(false);
      return;
    }
    const nextHop = currentHop + 1;
    const nextNode = groundTruthSequence[nextHop];
    setCurrentHop(nextHop);
    setCurrentNode(nextNode);
    setHistory((prev) => [...prev, nextNode]);
  };

  // Jump to specific step from timeline
  const jumpToStep = (hopIndex: number) => {
    if (hopIndex < 0 || hopIndex > totalHops) return;
    setIsPlaying(false);
    setCurrentHop(hopIndex);
    setCurrentNode(groundTruthSequence[hopIndex]);
    setHistory(groundTruthSequence.slice(0, hopIndex + 1));
  };

  // Reset Machine
  const resetMachine = (startNode?: number) => {
    const node = typeof startNode === 'number' ? startNode : v0;
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentHop(0);
    setCurrentNode(node);
    setHistory([node]);
  };

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(900 / speed);
      timerRef.current = window.setInterval(() => {
        setCurrentHop((prevHop) => {
          if (prevHop >= totalHops) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return prevHop;
          }
          const nextHop = prevHop + 1;
          const nextNode = groundTruthSequence[nextHop];
          setCurrentNode(nextNode);
          setHistory((prev) => [...prev, nextNode]);
          return nextHop;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalHops, speed, groundTruthSequence]);

  // Update a single destination in BUILD mode
  const handleDestinationChange = (sourceNode: number, targetNode: number) => {
    const updated = [...pi];
    updated[sourceNode] = targetNode;
    setPi(updated);
    resetMachine();
  };

  // Spatial Node Layout (Circular Circuit in 2D Viewport)
  const nodeCount = 8;
  const radius = 130;
  const centerX = 240;
  const centerY = 180;

  const nodePositions = useMemo(() => {
    return Array.from({ length: nodeCount }, (_, i) => {
      const angle = (i * (2 * Math.PI) / nodeCount) - (Math.PI / 2);
      return {
        id: i,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [nodeCount, radius, centerX, centerY]);

  const nextTargetNode = validation.isValid ? pi[currentNode] : null;
  const isComplete = currentHop >= totalHops;

  return (
    <div className="workbench-viewport" style={{ border: '1px solid var(--border-medium)', background: 'var(--bg-surface)' }}>
      {/* Viewport Top Bar */}
      <div className="workbench-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-medium)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={15} style={{ color: 'var(--text-accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            PERMUTATION ORBIT MACHINE [TASK A]
          </span>
          <EvidenceBadge type="LIVE" />
        </div>

        {/* Mode Selector [PRESET] vs [BUILD] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-viewport)', padding: '2px', borderRadius: '2px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setMode('preset')}
            style={{
              background: mode === 'preset' ? 'var(--text-accent)' : 'transparent',
              color: mode === 'preset' ? '#000000' : 'var(--text-secondary)',
              border: 'none',
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: mode === 'preset' ? 700 : 500,
              cursor: 'pointer',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            PRESET
          </button>
          <button
            onClick={() => setMode('build')}
            style={{
              background: mode === 'build' ? 'var(--text-accent)' : 'transparent',
              color: mode === 'build' ? '#000000' : 'var(--text-secondary)',
              border: 'none',
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: mode === 'build' ? 700 : 500,
              cursor: 'pointer',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            BUILD (EDIT $\pi$)
          </button>
        </div>
      </div>

      {/* Validation Warning Alert if mapping is not a valid bijection */}
      {!validation.isValid && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          borderBottom: '1px solid var(--danger-color)',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#f87171',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
        }}>
          <AlertTriangle size={15} />
          <span>
            <strong>INVALID PERMUTATION:</strong> Each destination must be unique. 
            Duplicate target(s): {validation.duplicates.join(', ')}. 
            Missing target(s): {validation.missing.join(', ')}.
          </span>
        </div>
      )}

      {/* Main Spatial Workbench Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) 300px',
        background: 'var(--bg-viewport)',
      }}>
        {/* Left: Spatial 2D/Circuit Canvas */}
        <div style={{
          position: 'relative',
          height: '380px',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <svg width="480" height="380" style={{ overflow: 'visible' }}>
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="20"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(148, 163, 184, 0.35)" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="20"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Permutation Directed Edges */}
            {nodePositions.map((src) => {
              const targetIdx = pi[src.id];
              const tgt = nodePositions[targetIdx] ?? src;
              const isCurrentEdge = src.id === currentNode && !isComplete && validation.isValid;
              const isTraversed = history.slice(0, -1).some((h, idx) => h === src.id && history[idx + 1] === tgt.id);

              return (
                <g key={`edge-${src.id}`}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isCurrentEdge ? '#38bdf8' : isTraversed ? '#10b981' : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth={isCurrentEdge ? 2.5 : isTraversed ? 2 : 1}
                    strokeDasharray={isCurrentEdge ? '4 2' : undefined}
                    markerEnd={isCurrentEdge ? 'url(#arrow-active)' : 'url(#arrow)'}
                    style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease' }}
                  />
                </g>
              );
            })}

            {/* Spatial Nodes (v0..v7) */}
            {nodePositions.map((node) => {
              const isCurrent = node.id === currentNode;
              const isStart = node.id === v0;
              const isFinalTarget = isComplete && node.id === groundTruthFinal && validation.isValid;
              const isInHistory = history.includes(node.id);

              let fillColor = '#0e131d';
              let strokeColor = '#334155';
              let strokeWidth = 1.5;

              if (isCurrent) {
                fillColor = '#38bdf8';
                strokeColor = '#f8fafc';
                strokeWidth = 3;
              } else if (isFinalTarget) {
                fillColor = '#10b981';
                strokeColor = '#f8fafc';
                strokeWidth = 2.5;
              } else if (isStart) {
                fillColor = '#1e293b';
                strokeColor = '#f59e0b';
                strokeWidth = 2;
              } else if (isInHistory) {
                strokeColor = '#10b981';
              }

              return (
                <g
                  key={`node-${node.id}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setV0(node.id);
                    resetMachine();
                  }}
                >
                  {isCurrent && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="22"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="15"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill={isCurrent ? '#080b11' : '#f1f5f9'}
                    fontFamily="var(--font-mono)"
                    fontSize="11"
                    fontWeight="700"
                  >
                    v{node.id}
                  </text>
                  {isStart && (
                    <text
                      x={node.x}
                      y={node.y - 19}
                      textAnchor="middle"
                      fill="#f59e0b"
                      fontFamily="var(--font-mono)"
                      fontSize="9"
                      fontWeight="700"
                    >
                      START
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Contextual Annotation Box */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(14, 19, 29, 0.88)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 10px',
            borderRadius: '2px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}>
            {!validation.isValid ? (
              <span style={{ color: '#f87171' }}>Fix conflicting destination targets in BUILD mode to run.</span>
            ) : currentHop === 0 ? (
              <span>Start node <strong style={{ color: '#f59e0b' }}>v{v0}</strong>. Press STEP or RUN ORBIT.</span>
            ) : !isComplete ? (
              <span>
                Traversing: &pi;(v{history[history.length - 2]}) &rarr; <strong style={{ color: 'var(--text-accent)' }}>v{currentNode}</strong> (Hop {currentHop}/{totalHops})
              </span>
            ) : (
              <span style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={13} /> Target reached: <strong>v_{totalHops} = v{currentNode}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Right: Telemetry & Interactive Config Deck */}
        <div style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background: 'var(--bg-surface)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          overflowY: 'auto',
          maxHeight: '380px',
        }}>
          {/* Preset Selector */}
          {mode === 'preset' ? (
            <div>
              <div className="telemetry-label" style={{ marginBottom: '4px' }}>PRESET PERMUTATION</div>
              <select
                style={{
                  width: '100%',
                  background: 'var(--bg-viewport)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                  padding: '4px 6px',
                  borderRadius: '2px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                }}
                onChange={(e) => {
                  const selected = PRESETS.find((p) => p.name === e.target.value);
                  if (selected) {
                    setPi(selected.pi);
                    resetMachine();
                  }
                }}
              >
                {PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : (
            /* BUILD Mode: Edit Mappings v0..v7 */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className="telemetry-label">BUILD MAPPING: &pi;(v)</span>
                <button
                  onClick={() => {
                    setPi(CANONICAL_PI);
                    setV0(3);
                    setTotalHops(4);
                    resetMachine(3);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-accent)', cursor: 'pointer', fontSize: '0.68rem' }}
                >
                  RESET PRESET
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4px',
                background: 'var(--bg-viewport)',
                padding: '6px',
                borderRadius: '2px',
                border: '1px solid var(--border-subtle)',
              }}>
                {pi.map((target, src) => (
                  <div key={src} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>v{src} &rarr;</span>
                    <select
                      value={target}
                      onChange={(e) => handleDestinationChange(src, Number(e.target.value))}
                      style={{
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.7rem',
                        padding: '1px 2px',
                        borderRadius: '2px',
                        width: '100%',
                        textAlign: 'center',
                      }}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <option key={num} value={num}>v{num}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stepper Status Readouts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div className="telemetry-cell" style={{ padding: '0.4rem' }}>
              <div className="telemetry-label" style={{ fontSize: '0.65rem' }}>CURRENT NODE</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-accent)' }}>
                v{currentNode}
              </div>
            </div>
            <div className="telemetry-cell" style={{ padding: '0.4rem' }}>
              <div className="telemetry-label" style={{ fontSize: '0.65rem' }}>NEXT: &pi;(v)</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                {isComplete ? 'END' : nextTargetNode !== null ? `v${nextTargetNode}` : '—'}
              </div>
            </div>
          </div>

          <div className="telemetry-cell" style={{ padding: '0.4rem' }}>
            <div className="telemetry-label" style={{ fontSize: '0.65rem' }}>GROUND TRUTH TARGET (D = {totalHops})</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ground-truth-primary)' }}>
              v_{totalHops} = v{groundTruthFinal}
            </div>
          </div>

          {/* Stepper Buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn-instrument"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!validation.isValid || (isComplete && !isPlaying)}
              style={{ flex: 1, padding: '4px' }}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              {isPlaying ? 'PAUSE' : 'RUN ORBIT'}
            </button>
            <button
              className="btn-instrument"
              onClick={stepForward}
              disabled={!validation.isValid || isComplete || isPlaying}
              style={{ flex: 1, padding: '4px' }}
            >
              <SkipForward size={12} />
              STEP
            </button>
            <button
              className="btn-instrument"
              onClick={() => resetMachine()}
              style={{ padding: '4px 8px' }}
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Depth D Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span className="telemetry-label" style={{ fontSize: '0.68rem' }}>DEPTH D (HOPS)</span>
              <strong style={{ color: 'var(--text-primary)' }}>D = {totalHops}</strong>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              value={totalHops}
              onChange={(e) => {
                setTotalHops(Number(e.target.value));
                resetMachine();
              }}
              style={{ width: '100%', accentColor: 'var(--text-accent)' }}
            />
          </div>

          {/* Starting Node v0 Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="telemetry-label" style={{ fontSize: '0.68rem' }}>STARTING NODE v0:</span>
            <select
              value={v0}
              onChange={(e) => {
                const newV0 = Number(e.target.value);
                setV0(newV0);
                resetMachine(newV0);
              }}
              style={{
                background: 'var(--bg-viewport)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                padding: '2px 6px',
                borderRadius: '2px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                <option key={num} value={num}>v{num}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Real Step-by-Step Computational State Timeline Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-medium)',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        overflowX: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
      }}>
        <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, fontWeight: 700 }}>
          ORBIT TIMELINE:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
          {Array.from({ length: totalHops + 1 }, (_, hopIdx) => {
            const isSelected = hopIdx === currentHop;
            const isPast = hopIdx < currentHop;
            const nodeVal = groundTruthSequence[hopIdx] ?? '—';
            return (
              <React.Fragment key={hopIdx}>
                <button
                  onClick={() => jumpToStep(hopIdx)}
                  style={{
                    background: isSelected 
                      ? 'var(--text-accent)' 
                      : isPast 
                      ? 'var(--bg-viewport)' 
                      : 'transparent',
                    color: isSelected 
                      ? '#000000' 
                      : isPast 
                      ? 'var(--text-primary)' 
                      : 'var(--text-tertiary)',
                    border: `1px solid ${isSelected ? 'var(--text-accent)' : isPast ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                    borderRadius: '2px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    fontWeight: isSelected ? 700 : 500,
                  }}
                  title={`Hop ${hopIdx}: node v${nodeVal}`}
                >
                  S{hopIdx}: v{nodeVal}
                </button>
                {hopIdx < totalHops && (
                  <div style={{
                    height: '2px',
                    width: '12px',
                    background: isPast ? 'var(--text-accent)' : 'var(--border-subtle)',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
          {currentHop === totalHops ? 'REACHED TARGET' : `${totalHops - currentHop} HOPS REMAINING`}
        </div>
      </div>

      {/* Progressive Disclosure: Inspect Permutation Mapping */}
      <div className="disclosure-section" style={{ margin: 0, borderTop: '1px solid var(--border-medium)', borderRadius: 0 }}>
        <button
          className="disclosure-trigger"
          onClick={() => setShowInspection(!showInspection)}
        >
          <span>INSPECT COMPUTATION: PERMUTATION TABLE &amp; CYCLE STRUCTURE</span>
          {showInspection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showInspection && (
          <div className="disclosure-content">
            <p style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
              Task A requires evaluating the composite function $v_D = \pi^D(v_0)$ over the symmetric group $S_8$. 
              Every valid permutation decomposes into disjoint permutation cycles.
            </p>

            <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-tertiary)' }}>
                    <th style={{ padding: '4px', textAlign: 'left' }}>x</th>
                    {pi.map((_, idx) => (
                      <th key={idx} style={{ padding: '4px', textAlign: 'center' }}>v{idx}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ color: 'var(--text-accent)' }}>
                    <td style={{ padding: '4px', fontWeight: 700, color: 'var(--text-secondary)' }}>&pi;(x)</td>
                    {pi.map((val, idx) => (
                      <td
                        key={idx}
                        style={{
                          padding: '4px',
                          textAlign: 'center',
                          background: idx === currentNode ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                          fontWeight: idx === currentNode ? 700 : 400,
                        }}
                      >
                        v{val}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Progressive Disclosure: Technical Details */}
      <div className="disclosure-section" style={{ margin: 0, borderTop: '1px solid var(--border-subtle)', borderRadius: 0 }}>
        <button
          className="disclosure-trigger"
          onClick={() => setShowTechnical(!showTechnical)}
        >
          <span>TECHNICAL DETAILS: FORMAL PROBLEM SPECIFICATION</span>
          {showTechnical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnical && (
          <div className="disclosure-content" style={{ fontSize: '0.78rem' }}>
            <p>
              Let $S_8$ denote the symmetric group on 8 elements &#123;0, &hellip;, 7&#125;. An input instance is specified by:
            </p>
            <div style={{
              background: 'var(--bg-viewport)',
              padding: '0.5rem 0.75rem',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              margin: '0.5rem 0',
            }}>
              x = (&pi;(0), &pi;(1), \dots, &pi;(7), v_0, D)
            </div>
            <p>
              The target output is $y = \pi^D(v_0)$. An autoregressive scratchpad produces intermediate tokens $v_1, v_2, \dots, v_D$. 
              A recurrent latent reasoner computes $k$ updates of an internal vector without emitting intermediate tokens.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
