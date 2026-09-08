import React from 'react';
import { useWorkbench } from './workbenchContext';
import { Layers, Info, Code, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';
import { EvidenceBadge } from '../components/EvidenceBadge';

export const WorkbenchInspector: React.FC = () => {
  const {
    activeObjectId,
    disclosureLevel,
    setDisclosureLevel,
    selectedState,
    telemetry,
    currentStep,
  } = useWorkbench();

  return (
    <div style={{
      width: '320px',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-medium)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.8rem',
      flexShrink: 0,
    }}>
      {/* Header & Tabs */}
      <div style={{
        padding: '0.6rem 0.75rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.05em',
          fontWeight: 700,
        }}>
          STATE &amp; OBJECT INSPECTOR
        </div>
        <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-viewport)', padding: '2px', borderRadius: '2px' }}>
          <button
            onClick={() => setDisclosureLevel('learn')}
            style={{
              background: disclosureLevel === 'learn' ? 'var(--text-accent)' : 'transparent',
              color: disclosureLevel === 'learn' ? '#000000' : 'var(--text-secondary)',
              border: 'none',
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: disclosureLevel === 'learn' ? 700 : 400,
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            LEARN
          </button>
          <button
            onClick={() => setDisclosureLevel('inspect')}
            style={{
              background: disclosureLevel === 'inspect' ? 'var(--text-accent)' : 'transparent',
              color: disclosureLevel === 'inspect' ? '#000000' : 'var(--text-secondary)',
              border: 'none',
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: disclosureLevel === 'inspect' ? 700 : 400,
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            INSPECT
          </button>
          <button
            onClick={() => setDisclosureLevel('technical')}
            style={{
              background: disclosureLevel === 'technical' ? 'var(--text-accent)' : 'transparent',
              color: disclosureLevel === 'technical' ? '#000000' : 'var(--text-secondary)',
              border: 'none',
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: disclosureLevel === 'technical' ? 700 : 400,
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            TECH
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
        {/* Active Object Banner */}
        <div style={{
          background: 'var(--bg-viewport)',
          border: '1px solid var(--border-subtle)',
          padding: '0.6rem',
          borderRadius: '2px',
          marginBottom: '0.75rem',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>ACTIVE INSTRUMENT</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {activeObjectId.toUpperCase().replace(/_/g, ' ')}
          </div>
          <div style={{ marginTop: '4px' }}>
            <EvidenceBadge type={telemetry.provenance} />
          </div>
        </div>

        {/* Selected haaalat Card if Available */}
        {selectedState ? (
          <div style={{
            background: 'var(--bg-viewport)',
            border: '1px solid var(--border-medium)',
            padding: '0.6rem',
            borderRadius: '2px',
            marginBottom: '0.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-accent)' }}>
                {selectedState.label} (STEP {selectedState.step})
              </span>
              {selectedState.isCorrect !== undefined && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  color: selectedState.isCorrect ? 'var(--accent-color)' : 'var(--danger-color)',
                }}>
                  {selectedState.isCorrect ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                  {selectedState.isCorrect ? 'MATCH' : 'MISMATCH'}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.72rem' }}>
              <div>
                <div style={{ color: 'var(--text-tertiary)' }}>CURRENT VALUE</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {String(selectedState.value)}
                </div>
              </div>
              {selectedState.previousValue !== undefined && (
                <div>
                  <div style={{ color: 'var(--text-tertiary)' }}>PREVIOUS</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {String(selectedState.previousValue)}
                  </div>
                </div>
              )}
            </div>

            {selectedState.transition && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.72rem' }}>
                <div style={{ color: 'var(--text-tertiary)' }}>TRANSITION</div>
                <code style={{ background: 'var(--bg-primary)', padding: '2px 4px', borderRadius: '2px', display: 'block', marginTop: '2px' }}>
                  {selectedState.transition}
                </code>
              </div>
            )}

            {selectedState.deltaNorm !== undefined && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.72rem' }}>
                <div>
                  <div style={{ color: 'var(--text-tertiary)' }}>||&Delta;h|| CONTRACTION</div>
                  <div style={{ fontWeight: 700, color: 'var(--latent-primary)' }}>
                    {selectedState.deltaNorm.toFixed(4)}
                  </div>
                </div>
                {selectedState.cosSim !== undefined && (
                  <div>
                    <div style={{ color: 'var(--text-tertiary)' }}>cos(h_t, h_t-1)</div>
                    <div style={{ fontWeight: 700, color: 'var(--latent-primary)' }}>
                      {selectedState.cosSim.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-viewport)',
            border: '1px dashed var(--border-subtle)',
            padding: '0.75rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            marginBottom: '0.75rem',
          }}>
            Select a state or node in the viewport to inspect its runtime tensor values.
          </div>
        )}

        {/* Dynamic Layer Content */}
        {disclosureLevel === 'learn' && (
          <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              <Info size={13} /> PEDAGOGICAL SUMMARY
            </div>
            <p>
              In inference-time compute scaling, reasoning is not static. Spreading computation across discrete steps or recurrent iterations transforms representations incrementally.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              Observe whether the state transitions track the ground truth trajectory or contract into an uninformative fixed point.
            </p>
          </div>
        )}

        {disclosureLevel === 'inspect' && (
          <div style={{ fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              <Layers size={13} /> TELEMETRY METRICS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '3px 0', color: 'var(--text-tertiary)' }}>BUDGET k</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 700 }}>{telemetry.budgetK}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '3px 0', color: 'var(--text-tertiary)' }}>CURRENT STEP</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 700 }}>{currentStep} / {telemetry.totalSteps}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '3px 0', color: 'var(--text-tertiary)' }}>LATENCY (PROFILED)</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 700 }}>{telemetry.latencyMs !== undefined ? `${telemetry.latencyMs.toFixed(3)} ms` : '—'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '3px 0', color: 'var(--text-tertiary)' }}>ANALYTICAL FLOPS</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 700 }}>{telemetry.analyticalFlops !== undefined ? telemetry.analyticalFlops.toLocaleString() : '—'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '3px 0', color: 'var(--text-tertiary)' }}>OBSERVED ACCURACY</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 700, color: 'var(--text-accent)' }}>
                    {telemetry.accuracy !== undefined ? `${telemetry.accuracy.toFixed(2)}%` : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: 'var(--text-tertiary)' }}>TARGET PREDICTION</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 700 }}>
                    {telemetry.modelPrediction ?? '—'} (GT: {telemetry.groundTruth ?? '—'})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {disclosureLevel === 'technical' && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              <Code size={13} /> FORMAL SPECIFICATION
            </div>
            <div style={{ background: 'var(--bg-viewport)', padding: '0.5rem', borderRadius: '2px', border: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem' }}>RECURRENCE EQUATION:</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', marginTop: '2px' }}>
                h_(t) = LN(h_(t-1) + CrossAttn(q=h_(t-1), kv=M))
              </div>
            </div>
            <div style={{ background: 'var(--bg-viewport)', padding: '0.5rem', borderRadius: '2px', border: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem' }}>SCRATCHPAD AUTOREGRESSION:</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--cot-primary)', marginTop: '2px' }}>
                P(y_t | y_(&lt;t), x) = Softmax(W_u · TF([x, y_(&lt;t)]))
              </div>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
              *Note on compute equivalence: Same-k does NOT mean equal latency. CoT invokes full autoregressive decoding passes with quadratic context expansion, whereas Latent maintains a constant internal memory buffer.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
