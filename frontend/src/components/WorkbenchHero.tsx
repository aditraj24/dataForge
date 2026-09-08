import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ArrowRight, Check, Activity, Terminal } from 'lucide-react';

export const WorkbenchHero: React.FC = () => {
  const [budgetK, setBudgetK] = useState<number>(4);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isAutoStepping, setIsAutoStepping] = useState<boolean>(true);

  // Canonical chelaoning Task A problem
  // pi = [1, 7, 5, 0, 2, 4, 6, 3], v0 = 3, D = 4
  const steps = [
    { hop: 0, node: 3, label: 'Start Node v0 = 3', next: 0 },
    { hop: 1, node: 0, label: 'π(3) → 0', next: 1 },
    { hop: 2, node: 1, label: 'π(0) → 1', next: 7 },
    { hop: 3, node: 7, label: 'π(1) → 7', next: 3 },
    { hop: 4, node: 3, label: 'π(7) → 3 [Target reached]', next: 0 },
  ];

  const maxSteps = Math.min(budgetK, 4);

  // Auto-stepping loop kay lyye d hero machine
  useEffect(() => {
    if (!isAutoStepping) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev >= maxSteps ? 0 : prev + 1));
    }, 1100);
    return () => clearInterval(interval);
  }, [isAutoStepping, maxSteps]);

  const currentStepData = steps[activeStep] || steps[0];
  const isComplete = activeStep === maxSteps;
  const prediction = isComplete ? currentStepData.node : (activeStep < 4 ? currentStepData.node : 3);
  const groundTruth = 3;
  const isCorrect = prediction === groundTruth;

  return (
    <div style={{ padding: '2.5rem 0 3.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="lab-container">
        {/* Editorial Masthead */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-accent)',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '4px 10px',
            borderRadius: '2px',
            marginBottom: '1rem'
          }}>
            <Terminal size={13} />
            COMPUTATIONAL RESEARCH INSTRUMENT • VERSION 2.0
          </div>

          <h1 style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
            THE THINKING BUDGET
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            HOW SHOULD AN AI SPEND TIME?
          </p>
        </div>

        {/* ALREADY-chelaoNING COMPUTATIONAL MACHINE VIEWPORT */}
        <div className="workbench-viewport" style={{ border: '1px solid var(--border-prominent)' }}>
          {/* Machine Header */}
          <div className="workbench-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isAutoStepping ? 'var(--correct-color)' : 'var(--warning-color)',
                boxShadow: 'none'}} />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                ACTIVE REASONING MACHINE [ONLINE]
              </span>
              <span className="badge badge-observed">REAL-TIME EXECUTION</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className={`btn-instrument ${isAutoStepping ? 'active' : ''}`}
                onClick={() => setIsAutoStepping(!isAutoStepping)}
                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              >
                {isAutoStepping ? <Pause size={12} /> : <Play size={12} />}
                {isAutoStepping ? 'PAUSE' : 'RUN'}
              </button>
              <button
                className="btn-instrument"
                onClick={() => setActiveStep(0)}
                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              >
                <RotateCcw size={12} />
                RESET
              </button>
            </div>
          </div>

          {/* chelaoning Machine Chamber */}
          <div style={{
            padding: '2rem 1.5rem',
            background: 'var(--bg-viewport)',
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1fr) 280px',
            gap: '1.5rem',
            alignItems: 'center'
          }}>
            {/* Left: Visible Circuit ka Computing Nodes */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
                INPUT: π = (1, 7, 5, 0, 2, 4, 6, 3), v0 = 3, Target Hops D = 4
              </div>

              {/* Dynamic Step Sequence */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                flexWrap: 'wrap',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                padding: '1.25rem',
                borderRadius: '3px'
              }}>
                {steps.map((st, idx) => {
                  const isCurrent = activeStep === idx;
                  const isPast = activeStep > idx;

                  return (
                    <React.Fragment key={idx}>
                      <div style={{
                        background: isCurrent
                          ? 'var(--bg-surface-elevated)'
                          : isPast
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'var(--bg-viewport)',
                        border: isCurrent
                          ? '2px solid var(--text-accent)'
                          : isPast
                          ? '1px solid var(--latent-primary)'
                          : '1px solid var(--border-subtle)',
                        borderRadius: '3px',
                        padding: '8px 12px',
                        textAlign: 'center',
                        minWidth: '60px',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                          {idx === 0 ? 'START' : `HOP ${idx}`}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          color: isCurrent ? 'var(--text-accent)' : isPast ? 'var(--latent-primary)' : 'var(--text-primary)'
                        }}>
                          {st.node}
                        </div>
                      </div>
                      {idx < steps.length - 1 && (
                        <ArrowRight
                          size={14}
                          style={{
                            color: isPast ? 'var(--latent-primary)' : 'var(--border-prominent)',
                            transition: 'color 0.2s ease'
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginTop: '0.85rem'
              }}>
                Current Status: <strong>{currentStepData.label}</strong> (Step {activeStep} of {maxSteps})
              </div>
            </div>

            {/* Right: Real-time Telemetry & Prediction Readout */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div className="telemetry-cell">
                <div className="telemetry-label">CURRENT MACHINE OUTPUT</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="telemetry-value" style={{ color: isCorrect ? 'var(--correct-color)' : 'var(--warning-color)' }}>
                    Node {prediction}
                  </span>
                  {isComplete ? (
                    <span className="status-match"><Check size={11} /> TARGET MET</span>
                  ) : (
                    <span className="badge badge-observed">TRAVERSING</span>
                  )}
                </div>
              </div>

              <div className="telemetry-cell">
                <div className="telemetry-label">GROUND TRUTH TARGET (D=4)</div>
                <div className="telemetry-value" style={{ color: 'var(--ground-truth-primary)' }}>
                  v_4 = {groundTruth}
                </div>
              </div>

              {/* bjjet Controller Dial */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span className="telemetry-label">COMPUTE BUDGET (k)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-accent)' }}>
                    k = {budgetK}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[1, 2, 4, 8, 16].map((k) => (
                    <button
                      key={k}
                      className={`btn-instrument ${budgetK === k ? 'active' : ''}`}
                      onClick={() => {
                        setBudgetK(k);
                        setActiveStep(0);
                      }}
                      style={{ flex: 1, padding: '3px 0', fontSize: '0.72rem' }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Call ko Action Bar */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            borderTop: '1px solid var(--border-medium)',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              You are looking inside a reasoning machine. Take control of the experiment below.
            </span>

            <a
              href="#scene-follow-orbit"
              className="btn-instrument btn-instrument-primary"
              style={{ textDecoration: 'none' }}
            >
              TAKE CONTROL ↓
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
