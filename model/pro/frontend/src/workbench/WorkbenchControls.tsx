import React from 'react';
import { useWorkbench } from './workbenchContext';
import { Play, Pause, SkipForward, RotateCcw, Sliders } from 'lucide-react';
import { TaskId, ModelType, ScaleId } from './types';

interface Props {
  selectedTask?: TaskId;
  onTaskChange?: (task: TaskId) => void;
  selectedModel?: ModelType;
  onModelChange?: (model: ModelType) => void;
  selectedScale?: ScaleId;
  onScaleChange?: (scale: ScaleId) => void;
  depthD?: number;
  onDepthChange?: (d: number) => void;
  startNode?: string;
  onStartNodeChange?: (node: string) => void;
}

export const WorkbenchControls: React.FC<Props> = ({
  selectedTask = 'permutation',
  onTaskChange,
  selectedModel = 'cot',
  onModelChange,
  selectedScale = '126k',
  onScaleChange,
  depthD = 8,
  onDepthChange,
  startNode = 'v0',
  onStartNodeChange,
}) => {
  const {
    budgetK,
    setBudgetK,
    isPlaying,
    setIsPlaying,
    stepForward,
    resetExperiment,
  } = useWorkbench();

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-medium)',
      padding: '0.6rem 0.8rem',
      borderRadius: '3px',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.75rem',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.75rem',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Parameters cluster */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sliders size={12} style={{ color: 'var(--text-accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>CONFIG:</span>
        </div>

        {/* Task selector */}
        {onTaskChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>TASK:</span>
            <select
              value={selectedTask}
              onChange={(e) => onTaskChange(e.target.value as TaskId)}
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
              <option value="permutation">Permutation Orbit (Task A)</option>
              <option value="modular">Modular Register (Task B)</option>
              <option value="associative">Associative Matrix (BDH)</option>
            </select>
          </div>
        )}

        {/* Start Node selector (for Task A) */}
        {onStartNodeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>START:</span>
            <select
              value={startNode}
              onChange={(e) => onStartNodeChange(e.target.value)}
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
              {['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        )}

        {/* Depth D selector */}
        {onDepthChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>DEPTH D:</span>
            <select
              value={depthD}
              onChange={(e) => onDepthChange(Number(e.target.value))}
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
              {[2, 4, 8, 12, 16].map((d) => (
                <option key={d} value={d}>D = {d}</option>
              ))}
            </select>
          </div>
        )}

        {/* Budget k slider / selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>BUDGET k:</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 4, 8, 12, 16].map((k) => (
              <button
                key={k}
                onClick={() => setBudgetK(k)}
                style={{
                  background: budgetK === k ? 'var(--text-accent)' : 'var(--bg-viewport)',
                  color: budgetK === k ? '#000000' : 'var(--text-secondary)',
                  border: `1px solid ${budgetK === k ? 'var(--text-accent)' : 'var(--border-subtle)'}`,
                  padding: '2px 5px',
                  borderRadius: '2px',
                  fontSize: '0.7rem',
                  fontWeight: budgetK === k ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Model selector */}
        {onModelChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>MODEL:</span>
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value as ModelType)}
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
              <option value="cot">CoT (Autoregressive Scratchpad)</option>
              <option value="latent">Latent (Recurrent Core)</option>
              <option value="hebbian">Hebbian (Plastic Fast-Weight)</option>
            </select>
          </div>
        )}

        {/* Scale selector */}
        {onScaleChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>SCALE:</span>
            <select
              value={selectedScale}
              onChange={(e) => onScaleChange(e.target.value as ScaleId)}
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
              <option value="126k">126K Parameters</option>
              <option value="1m">1M Parameters</option>
              <option value="5m_recovery">5M Recovery (Optimized)</option>
            </select>
          </div>
        )}
      </div>

      {/* Action triggers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          className="btn btn-primary"
          style={{ padding: '3px 10px', fontSize: '0.72rem' }}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          <span style={{ marginLeft: '4px' }}>{isPlaying ? 'PAUSE' : 'RUN EXPERIMENT'}</span>
        </button>
        <button
          className="btn btn-secondary"
          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          onClick={stepForward}
        >
          <SkipForward size={12} />
          <span style={{ marginLeft: '4px' }}>STEP</span>
        </button>
        <button
          className="btn btn-secondary"
          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          onClick={resetExperiment}
        >
          <RotateCcw size={12} />
          <span style={{ marginLeft: '4px' }}>RESET</span>
        </button>
      </div>
    </div>
  );
};
