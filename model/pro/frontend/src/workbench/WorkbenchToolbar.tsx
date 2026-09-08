import React from 'react';
import { useWorkbench } from './workbenchContext';
import { Play, Pause, SkipForward, RotateCcw, Box, Eye, Layers, Terminal } from 'lucide-react';
import { EvidenceBadge } from '../components/EvidenceBadge';

interface Props {
  onRunClick?: () => void;
  onResetClick?: () => void;
  onStepClick?: () => void;
}

export const WorkbenchToolbar: React.FC<Props> = ({ onRunClick, onResetClick, onStepClick }) => {
  const {
    disclosureLevel,
    setDisclosureLevel,
    is3DMode,
    setIs3DMode,
    isPlaying,
    setIsPlaying,
    resetExperiment,
    stepForward,
    telemetry,
  } = useWorkbench();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 1rem',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-medium)',
      flexWrap: 'wrap',
      gap: '0.75rem',
      fontSize: '0.8rem',
      fontFamily: 'var(--font-mono)',
    }}>
      {/* Left: Workbench Identifier & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          color: 'var(--text-accent)',
          letterSpacing: '0.05em',
        }}>
          <Terminal size={14} />
          <span>COMPUTATIONAL LABORATORY</span>
        </div>
        <div style={{ width: '1px', height: '18px', background: 'var(--border-medium)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
            onClick={() => {
              if (onRunClick) onRunClick();
              else setIsPlaying(!isPlaying);
            }}
            title={isPlaying ? 'Pause simulation' : 'Run simulation'}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span style={{ marginLeft: '4px' }}>{isPlaying ? 'PAUSE' : 'RUN'}</span>
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
            onClick={() => {
              if (onStepClick) onStepClick();
              else stepForward();
            }}
            title="Step one transition"
          >
            <SkipForward size={12} />
            <span style={{ marginLeft: '4px' }}>STEP</span>
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
            onClick={() => {
              if (onResetClick) onResetClick();
              else resetExperiment();
            }}
            title="Reset to step 0"
          >
            <RotateCcw size={12} />
            <span style={{ marginLeft: '4px' }}>RESET</span>
          </button>
        </div>
      </div>

      {/* Center: Viewport Mode (3D vs 2D Fallback) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>RENDER:</span>
        <button
          onClick={() => setIs3DMode(true)}
          style={{
            background: is3DMode ? 'var(--bg-viewport)' : 'transparent',
            color: is3DMode ? 'var(--text-primary)' : 'var(--text-tertiary)',
            border: `1px solid ${is3DMode ? 'var(--border-strong)' : 'transparent'}`,
            padding: '2px 8px',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
          }}
        >
          <Box size={11} /> 3D SPATIAL
        </button>
        <button
          onClick={() => setIs3DMode(false)}
          style={{
            background: !is3DMode ? 'var(--bg-viewport)' : 'transparent',
            color: !is3DMode ? 'var(--text-primary)' : 'var(--text-tertiary)',
            border: `1px solid ${!is3DMode ? 'var(--border-strong)' : 'transparent'}`,
            padding: '2px 8px',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
          }}
        >
          <Layers size={11} /> 2D ACCESSIBLE
        </button>
      </div>

      {/* Right: Progressive Disclosure & Provenance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-viewport)', padding: '2px', borderRadius: '2px', border: '1px solid var(--border-subtle)' }}>
          {(['learn', 'inspect', 'technical'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setDisclosureLevel(level)}
              style={{
                background: disclosureLevel === level ? 'var(--text-accent)' : 'transparent',
                color: disclosureLevel === level ? '#000000' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                fontSize: '0.7rem',
                fontWeight: disclosureLevel === level ? 700 : 400,
                cursor: 'pointer',
                borderRadius: '2px',
                textTransform: 'uppercase',
              }}
            >
              {level}
            </button>
          ))}
        </div>

        <EvidenceBadge level={telemetry.provenance === 'HISTORICAL' ? 'HISTORICAL' : telemetry.provenance === 'RECOVERY' ? 'RECOVERY' : telemetry.provenance === 'LIVE' ? 'LIVE' : 'PRECOMPUTED'} />
      </div>
    </div>
  );
};
