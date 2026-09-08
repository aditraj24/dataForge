import React, { useState, useMemo } from 'react';
import { Calculator, RotateCcw, SkipForward, AlertCircle, ChevronDown, ChevronUp, Plus, Minus, X } from 'lucide-react';
import { TASK_B_ACCS } from '../data/precomputed';
import { EvidenceBadge } from './EvidenceBadge';

type OpType = 'ADD' | 'SUB' | 'MUL';

interface CustomOp {
  type: OpType;
  operand: number;
}

const DEFAULT_OPS: CustomOp[] = [
  { type: 'ADD', operand: 4 },
  { type: 'MUL', operand: 2 },
  { type: 'SUB', operand: 5 },
  { type: 'ADD', operand: 3 },
];

export const RegisterMachineTaskB: React.FC = () => {
  const [initialR0, setInitialR0] = useState<number>(3);
  const [modulus, setModulus] = useState<number>(10);
  const [operations, setOperations] = useState<CustomOp[]>(DEFAULT_OPS);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [showInspection, setShowInspection] = useState<boolean>(false);
  const [showTechnical, setShowTechnical] = useState<boolean>(false);

  // Compute actual modular arithmetic step-by-step
  const trace = useMemo(() => {
    const steps: { step: number; opName: string; prevR: number; nextR: number; formula: string }[] = [
      { step: 0, opName: 'INIT', prevR: initialR0, nextR: initialR0, formula: `r_0 = ${initialR0}` },
    ];

    let currentVal = initialR0;
    operations.forEach((op, idx) => {
      const prevVal = currentVal;
      let nextVal = currentVal;
      let formula = '';

      if (op.type === 'ADD') {
        nextVal = (prevVal + op.operand) % modulus;
        formula = `(${prevVal} + ${op.operand}) mod ${modulus} = ${nextVal}`;
      } else if (op.type === 'SUB') {
        nextVal = ((prevVal - op.operand) % modulus + modulus) % modulus;
        formula = `(${prevVal} - ${op.operand}) mod ${modulus} = ${nextVal}`;
      } else if (op.type === 'MUL') {
        nextVal = (prevVal * op.operand) % modulus;
        formula = `(${prevVal} × ${op.operand}) mod ${modulus} = ${nextVal}`;
      }

      currentVal = nextVal;
      steps.push({
        step: idx + 1,
        opName: `${op.type} ${op.operand}`,
        prevR: prevVal,
        nextR: nextVal,
        formula,
      });
    });

    return steps;
  }, [initialR0, operations, modulus]);

  const totalSteps = operations.length;
  const currentTraceStep = trace[currentStepIdx] ?? trace[0];
  const finalGroundTruth = trace[trace.length - 1].nextR;
  const isComplete = currentStepIdx === totalSteps;

  const stepForward = () => {
    if (currentStepIdx < totalSteps) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const resetMachine = () => {
    setCurrentStepIdx(0);
  };

  const updateOpType = (idx: number, type: OpType) => {
    const updated = [...operations];
    updated[idx].type = type;
    setOperations(updated);
    resetMachine();
  };

  const updateOpOperand = (idx: number, val: number) => {
    const updated = [...operations];
    updated[idx].operand = Math.max(0, Math.min(9, val));
    setOperations(updated);
    resetMachine();
  };

  return (
    <div className="workbench-viewport" style={{ border: '1px solid var(--border-medium)', background: 'var(--bg-surface)' }}>
      {/* Top Bar */}
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
          <Calculator size={15} style={{ color: 'var(--text-accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            EDITABLE MODULAR REGISTER CIRCUIT [TASK B]
          </span>
          <EvidenceBadge type="INCONCLUSIVE" />
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          CIRCUIT STEP: <span style={{ color: 'var(--text-accent)', fontWeight: 700 }}>{currentStepIdx} / {totalSteps}</span>
        </div>
      </div>

      {/* Main Register Workbench */}
      <div style={{
        padding: '1.25rem',
        background: 'var(--bg-viewport)',
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) 320px',
        gap: '1.25rem',
      }}>
        {/* Left: Interactive Modular Circuit */}
        <div>
          {/* Initial Register Configuration */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            padding: '0.6rem 0.8rem',
            borderRadius: '2px',
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>MODULUS M:</span>
              <select
                value={modulus}
                onChange={(e) => {
                  setModulus(Number(e.target.value));
                  resetMachine();
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
                {[7, 8, 10, 12, 16].map((m) => (
                  <option key={m} value={m}>mod {m}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>INITIAL r_0:</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                  <button
                    key={val}
                    onClick={() => { setInitialR0(val % modulus); resetMachine(); }}
                    style={{
                      background: initialR0 === val ? 'var(--text-accent)' : 'var(--bg-viewport)',
                      color: initialR0 === val ? '#000000' : 'var(--text-secondary)',
                      border: `1px solid ${initialR0 === val ? 'var(--text-accent)' : 'var(--border-subtle)'}`,
                      padding: '2px 5px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: initialR0 === val ? 700 : 400,
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Circuit Gates Display */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}>
            {operations.map((op, idx) => {
              const stepNumber = idx + 1;
              const isPast = stepNumber < currentStepIdx;
              const isCurrent = stepNumber === currentStepIdx;
              const stepResult = trace[stepNumber];

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.8rem',
                    background: isCurrent 
                      ? 'var(--bg-surface-elevated)' 
                      : isPast 
                      ? 'var(--bg-surface)' 
                      : 'var(--bg-surface-elevated)',
                    border: `1px solid ${isCurrent ? 'var(--text-accent)' : 'var(--border-subtle)'}`,
                    borderRadius: '3px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem', width: '32px' }}>
                      OP {stepNumber}:
                    </span>
                    <select
                      value={op.type}
                      onChange={(e) => updateOpType(idx, e.target.value as OpType)}
                      style={{
                        background: 'var(--bg-viewport)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-medium)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <option value="ADD">ADD (+)</option>
                      <option value="SUB">SUB (-)</option>
                      <option value="MUL">MUL (×)</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="9"
                      value={op.operand}
                      onChange={(e) => updateOpOperand(idx, Number(e.target.value))}
                      style={{
                        width: '38px',
                        background: 'var(--bg-viewport)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-medium)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                  </div>

                  <div style={{ color: isCurrent ? 'var(--text-accent)' : 'var(--text-secondary)', fontWeight: isCurrent ? 700 : 400 }}>
                    {isPast || isCurrent ? stepResult.formula : 'Pending execution'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stepper Execution Controls */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={stepForward}
              disabled={isComplete}
              style={{ flex: 1, padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <SkipForward size={13} />
              <span style={{ marginLeft: '4px' }}>EXECUTE NEXT OP</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={resetMachine}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <RotateCcw size={13} />
              <span style={{ marginLeft: '4px' }}>RESET</span>
            </button>
          </div>
        </div>

        {/* Right: Register Value & Empirical Inconclusive Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          padding: '1.25rem',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
        }}>
          <div>
            <div className="telemetry-label" style={{ marginBottom: '4px' }}>CURRENT ACCUMULATOR REGISTER</div>
            
            <div style={{
              background: 'var(--bg-viewport)',
              border: '1px solid var(--border-medium)',
              padding: '1rem',
              borderRadius: '2px',
              textAlign: 'center',
              marginBottom: '1rem',
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>REGISTER r_t (MOD {modulus})</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-accent)', margin: '4px 0' }}>
                {currentTraceStep.nextR}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {currentTraceStep.formula}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
              <span className="telemetry-label">GROUND TRUTH r_{totalSteps}:</span>
              <strong style={{ color: 'var(--ground-truth-primary)' }}>{finalGroundTruth}</strong>
            </div>

            {/* Empirical chkng Table */}
            <div className="telemetry-label" style={{ marginBottom: '4px' }}>BENCHMARK FINDINGS (TASK B)</div>
            <div style={{
              background: 'var(--bg-viewport)',
              border: '1px solid var(--border-subtle)',
              padding: '0.6rem',
              borderRadius: '2px',
              fontSize: '0.72rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Random Guess (1/10):</span>
                <strong style={{ color: 'var(--text-tertiary)' }}>10.0%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--cot-primary)' }}>CoT (5M Recovery, k=16):</span>
                <strong style={{ color: 'var(--cot-primary)' }}>{TASK_B_ACCS.recovery_5m.cot_k16.toFixed(1)}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--latent-primary)' }}>Latent (5M Recovery, k=16):</span>
                <strong style={{ color: 'var(--latent-primary)' }}>{TASK_B_ACCS.recovery_5m.latent_k16.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          {/* Inconclusive Guardrail Banner */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '0.6rem',
            borderRadius: '2px',
            marginTop: '0.75rem',
            fontSize: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning-color)', fontWeight: 700, marginBottom: '2px' }}>
              <AlertCircle size={13} />
              EMPIRICAL OUTCOME: INCONCLUSIVE
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.35 }}>
              Because both explicit and latent models scored near the 10% chance level, this experiment did NOT provide enough evidence to support the scratchpad superiority hypothesis on arithmetic.
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Benchmark Details */}
      <div className="disclosure-section" style={{ margin: 0, borderTop: '1px solid var(--border-medium)', borderRadius: 0 }}>
        <button
          className="disclosure-trigger"
          onClick={() => setShowInspection(!showInspection)}
        >
          <span>INSPECT EMPIRICAL ACCURACY TABLE ACROSS SCALES</span>
          {showInspection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showInspection && (
          <div className="disclosure-content">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-tertiary)', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>SCALE</th>
                  <th style={{ padding: '6px' }}>RANDOM CHANCE</th>
                  <th style={{ padding: '6px' }}>CoT (k=16)</th>
                  <th style={{ padding: '6px' }}>LATENT (k=16)</th>
                  <th style={{ padding: '6px' }}>EMPIRICAL STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px', fontWeight: 600 }}>126K Baseline</td>
                  <td style={{ padding: '6px' }}>10.0%</td>
                  <td style={{ padding: '6px', color: 'var(--cot-primary)' }}>{TASK_B_ACCS.baseline_126k.cot_k16.toFixed(1)}%</td>
                  <td style={{ padding: '6px', color: 'var(--latent-primary)' }}>{TASK_B_ACCS.baseline_126k.latent_k16.toFixed(1)}%</td>
                  <td style={{ padding: '6px', color: 'var(--warning-color)' }}>Chance Level</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px', fontWeight: 600 }}>1M Scaled</td>
                  <td style={{ padding: '6px' }}>10.0%</td>
                  <td style={{ padding: '6px', color: 'var(--cot-primary)' }}>{TASK_B_ACCS.scaling_1m.cot_k16.toFixed(1)}%</td>
                  <td style={{ padding: '6px', color: 'var(--latent-primary)' }}>{TASK_B_ACCS.scaling_1m.latent_k16.toFixed(1)}%</td>
                  <td style={{ padding: '6px', color: 'var(--warning-color)' }}>Chance Level</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', fontWeight: 600 }}>5M Recovery</td>
                  <td style={{ padding: '6px' }}>10.0%</td>
                  <td style={{ padding: '6px', color: 'var(--cot-primary)' }}>{TASK_B_ACCS.recovery_5m.cot_k16.toFixed(1)}%</td>
                  <td style={{ padding: '6px', color: 'var(--latent-primary)' }}>{TASK_B_ACCS.recovery_5m.latent_k16.toFixed(1)}%</td>
                  <td style={{ padding: '6px', color: 'var(--warning-color)' }}>Inconclusive (~15-18%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
