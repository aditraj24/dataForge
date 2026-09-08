import React, { useState } from 'react';
import { Award, HelpCircle, CheckCircle2, AlertTriangle, ArrowRight, Play, RotateCcw } from 'lucide-react';
import { EvidenceBadge } from './EvidenceBadge';
import { TaskId, ModelType, ScaleId } from '../workbench/types';

export const ChallengeTheClaimWorkbench: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<TaskId>('permutation');
  const [selectedScale, setSelectedScale] = useState<ScaleId>('1m');
  const [budgetK, setBudgetK] = useState<number>(16);
  const [prediction, setPrediction] = useState<'cot' | 'latent' | 'equal' | null>(null);
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);

  // Derive empirical ground truth from frozen benchmarks
  const evaluateClaim = () => {
    if (selectedTask === 'modular') {
      // Task B: both fail near chance (~10-18%)
      return {
        winner: 'equal',
        cotAcc: selectedScale === '5m_recovery' ? 18.2 : 10.4,
        latentAcc: selectedScale === '5m_recovery' ? 15.6 : 10.1,
        cotLat: 0.74,
        latentLat: 0.61,
        explanation: 'On Task B (Modular Register), BOTH models collapse near random chance (~10%). Neither architecture demonstrates effective arithmetic execution in our benchmark, making the outcome empirically inconclusive.',
      };
    }

    // Task A: Permutation Orbit
    if (budgetK <= 2) {
      // Low bjjet: Latent h competitive on deri aor sahi h comparable
      return {
        winner: 'latent',
        cotAcc: selectedScale === '5m_recovery' ? 42.1 : 37.4,
        latentAcc: selectedScale === '5m_recovery' ? 31.8 : 26.8,
        cotLat: 0.22,
        latentLat: 0.12,
        explanation: 'At low budget (k ≤ 2), Latent reasoning is Pareto-efficient on latency (0.12 ms vs 0.22 ms) while maintaining comparable accuracy in the small-computation regime.',
      };
    } else {
      // Higher bjjets: CoT scales strongly, Latent plateaus
      return {
        winner: 'cot',
        cotAcc: selectedScale === '5m_recovery' ? 99.74 : 76.7,
        latentAcc: selectedScale === '5m_recovery' ? 33.92 : 31.1,
        cotLat: selectedScale === '5m_recovery' ? 0.78 : 0.74,
        latentLat: selectedScale === '5m_recovery' ? 0.65 : 0.61,
        explanation: `At higher budgets (k=${budgetK}), CoT scales strongly to ${selectedScale === '5m_recovery' ? '99.74%' : '76.7%'}, whereas Latent hits an architectural ceiling around ~33%. CoT dominates accuracy, though at higher latency.`,
      };
    }
  };

  const outcome = evaluateClaim();
  const isPredictionCorrect = prediction === outcome.winner;

  const handleRun = () => {
    if (prediction !== null) {
      setHasExecuted(true);
    }
  };

  const handleReset = () => {
    setPrediction(null);
    setHasExecuted(false);
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
          <Award size={15} style={{ color: 'var(--text-accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            CAN YOU BREAK THE CLAIM? [FINAL EXPERIMENT]
          </span>
          <EvidenceBadge type="PRECOMPUTED" />
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          STAGE: <strong style={{ color: 'var(--text-accent)' }}>{hasExecuted ? 'VERIFICATION' : 'PREDICTION'}</strong>
        </div>
      </div>

      {/* Claim Proposition Banner */}
      <div style={{
        padding: '1rem 1.25rem',
        background: 'var(--bg-viewport)',
        borderBottom: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.82rem',
      }}>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', marginBottom: '2px' }}>CENTRAL SCIENTIFIC PROPOSITION:</div>
        <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
          &quot;The observed frontier favors different reasoning mechanisms at different budgets and tasks.&quot;
        </div>
      </div>

      {/* Main Interactive Arena */}
      <div style={{
        padding: '1.25rem',
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1fr) 340px',
        gap: '1.25rem',
        background: 'var(--bg-viewport)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
      }}>
        {/* Left: tesst Configuration & Prediction Deck */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Step 1: Configure tesst parmeters */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            padding: '1rem',
            borderRadius: '3px',
          }}>
            <div className="telemetry-label" style={{ marginBottom: '0.6rem' }}>1. CONFIGURE TEST BENCHMARK</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>TARGET TASK:</span>
                <select
                  value={selectedTask}
                  onChange={(e) => { setSelectedTask(e.target.value as TaskId); setHasExecuted(false); }}
                  style={{
                    width: '100%',
                    background: 'var(--bg-viewport)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-medium)',
                    padding: '3px 6px',
                    borderRadius: '2px',
                    marginTop: '2px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <option value="permutation">Task A: Permutation Orbit</option>
                  <option value="modular">Task B: Modular Register</option>
                </select>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>MODEL SCALE:</span>
                <select
                  value={selectedScale}
                  onChange={(e) => { setSelectedScale(e.target.value as ScaleId); setHasExecuted(false); }}
                  style={{
                    width: '100%',
                    background: 'var(--bg-viewport)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-medium)',
                    padding: '3px 6px',
                    borderRadius: '2px',
                    marginTop: '2px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <option value="126k">126K Baseline</option>
                  <option value="1m">1M Scaled</option>
                  <option value="5m_recovery">5M Recovery (Optimized)</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>THINKING BUDGET k:</span>
                <strong>k = {budgetK}</strong>
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[1, 2, 4, 8, 12, 16].map((k) => (
                  <button
                    key={k}
                    onClick={() => { setBudgetK(k); setHasExecuted(false); }}
                    style={{
                      flex: 1,
                      background: budgetK === k ? 'var(--text-accent)' : 'var(--bg-viewport)',
                      color: budgetK === k ? '#000000' : 'var(--text-secondary)',
                      border: `1px solid ${budgetK === k ? 'var(--text-accent)' : 'var(--border-subtle)'}`,
                      padding: '3px 0',
                      borderRadius: '2px',
                      fontSize: '0.7rem',
                      fontWeight: budgetK === k ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    k={k}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Make Your Prediction */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            padding: '1rem',
            borderRadius: '3px',
          }}>
            <div className="telemetry-label" style={{ marginBottom: '0.5rem' }}>2. PREDICT THE OUTCOME BEFORE RUNNING</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.6rem' }}>
              Under this exact configuration, which reasoning paradigm will perform best or achieve the frontier?
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem' }}>
              <button
                onClick={() => setPrediction('cot')}
                style={{
                  background: prediction === 'cot' ? 'var(--cot-bg)' : 'var(--bg-viewport)',
                  color: prediction === 'cot' ? 'var(--cot-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${prediction === 'cot' ? 'var(--cot-primary)' : 'var(--border-subtle)'}`,
                  padding: '8px 4px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                CoT WINS
              </button>

              <button
                onClick={() => setPrediction('latent')}
                style={{
                  background: prediction === 'latent' ? 'var(--latent-bg)' : 'var(--bg-viewport)',
                  color: prediction === 'latent' ? 'var(--latent-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${prediction === 'latent' ? 'var(--latent-primary)' : 'var(--border-subtle)'}`,
                  padding: '8px 4px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                LATENT WINS
              </button>

              <button
                onClick={() => setPrediction('equal')}
                style={{
                  background: prediction === 'equal' ? 'var(--ground-truth-bg)' : 'var(--bg-viewport)',
                  color: prediction === 'equal' ? 'var(--warning-color)' : 'var(--text-secondary)',
                  border: `1px solid ${prediction === 'equal' ? 'var(--warning-color)' : 'var(--border-subtle)'}`,
                  padding: '8px 4px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                ABOUT EQUAL
              </button>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleRun}
                disabled={prediction === null}
                style={{ flex: 1, padding: '5px 12px', fontSize: '0.75rem' }}
              >
                <Play size={12} />
                <span style={{ marginLeft: '4px' }}>EXECUTE VERIFICATION RUN</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleReset}
                style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Verification Findings & Pedagogical Feedback */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          padding: '1.25rem',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div className="telemetry-label" style={{ marginBottom: '4px' }}>VERIFICATION RESULTS</div>

            {hasExecuted ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '8px 0',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: isPredictionCorrect ? 'var(--accent-color)' : 'var(--warning-color)',
                }}>
                  {isPredictionCorrect ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{isPredictionCorrect ? 'PREDICTION CONFIRMED' : 'PREDICTION REVISED BY DATA'}</span>
                </div>

                <div style={{
                  background: 'var(--bg-viewport)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.75rem',
                  borderRadius: '2px',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--cot-primary)' }}>CoT Accuracy:</span>
                    <strong>{outcome.cotAcc.toFixed(1)}% ({outcome.cotLat.toFixed(2)} ms)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--latent-primary)' }}>Latent Accuracy:</span>
                    <strong>{outcome.latentAcc.toFixed(1)}% ({outcome.latentLat.toFixed(2)} ms)</strong>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.45 }}>
                  {outcome.explanation}
                </p>
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-viewport)',
                border: '1px dashed var(--border-subtle)',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                marginTop: '0.5rem',
                borderRadius: '2px',
              }}>
                Select your prediction on the left and click &quot;EXECUTE VERIFICATION RUN&quot; to test your hypothesis against measured benchmarks.
              </div>
            )}
          </div>

          <div style={{
            background: 'var(--bg-viewport)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '0.75rem',
            marginTop: '0.75rem',
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)',
            lineHeight: 1.35,
          }}>
            *Note: Observed frontiers show that compute efficiency depends on budget scale, task structure, and optimization schedule.
          </div>
        </div>
      </div>
    </div>
  );
};
