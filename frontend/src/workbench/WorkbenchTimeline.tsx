import React from 'react';
import { useWorkbench } from './workbenchContext';
import { StateSnapshot } from './types';
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';

export const WorkbenchTimeline: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    maxSteps,
    history,
    setSelectedState,
    isPlaying,
    setIsPlaying,
    resetExperiment,
    stepForward,
    stepBackward,
  } = useWorkbench();

  // If history h empty, synthesize a basic step array up ko maxSteps
  const steps: StateSnapshot[] = history.length > 0 
    ? history 
    : Array.from({ length: maxSteps + 1 }, (_, i): StateSnapshot => ({
        step: i,
        label: `S${i}`,
        value: `Step ${i}`,
      }));

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    if (history[index]) {
      setSelectedState(history[index]);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-medium)',
      padding: '0.5rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.75rem',
      overflowX: 'auto',
    }}>
      {/* Mini Scrubber Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '3px 6px', fontSize: '0.7rem' }}
          onClick={stepBackward}
          disabled={currentStep === 0}
          title="Previous Step"
        >
          <SkipBack size={11} />
        </button>
        <button
          className="btn btn-secondary"
          style={{ padding: '3px 8px', fontSize: '0.7rem' }}
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={11} /> : <Play size={11} />}
        </button>
        <button
          className="btn btn-secondary"
          style={{ padding: '3px 6px', fontSize: '0.7rem' }}
          onClick={stepForward}
          disabled={currentStep >= maxSteps}
          title="Next Step"
        >
          <SkipForward size={11} />
        </button>
        <button
          className="btn btn-secondary"
          style={{ padding: '3px 6px', fontSize: '0.7rem' }}
          onClick={resetExperiment}
          title="Reset"
        >
          <RotateCcw size={11} />
        </button>
      </div>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-medium)', flexShrink: 0 }} />

      {/* Timeline Steps Track */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flex: 1,
        minWidth: '400px',
        position: 'relative',
      }}>
        {steps.map((item, idx) => {
          const isSelected = idx === currentStep;
          const isPast = idx < currentStep;
          return (
            <React.Fragment key={idx}>
              <button
                onClick={() => handleStepClick(idx)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
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
                  padding: '3px 7px',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.7rem',
                  transition: 'all 0.1s ease',
                  flexShrink: 0,
                }}
                title={`State S${idx}: ${item.value}`}
              >
                <span>S{idx}</span>
                {item.isCorrect !== undefined && (
                  <span style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: item.isCorrect ? 'var(--accent-color)' : 'var(--danger-color)',
                  }} />
                )}
              </button>

              {idx < steps.length - 1 && (
                <div style={{
                  height: '2px',
                  flex: 1,
                  minWidth: '12px',
                  background: isPast ? 'var(--text-accent)' : 'var(--border-subtle)',
                  transition: 'background 0.2s ease',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Counter Indicator */}
      <div style={{
        color: 'var(--text-secondary)',
        fontSize: '0.72rem',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        STEP <strong>{currentStep}</strong> / {maxSteps}
      </div>
    </div>
  );
};
