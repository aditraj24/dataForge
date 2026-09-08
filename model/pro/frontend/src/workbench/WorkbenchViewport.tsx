import React from 'react';
import { useWorkbench } from './workbenchContext';
import { Box, Layers, Maximize2, RotateCcw, Compass } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  cameraPreset?: 'perspective' | 'top' | 'side';
  onCameraPresetChange?: (preset: 'perspective' | 'top' | 'side') => void;
  onResetCamera?: () => void;
}

export const WorkbenchViewport: React.FC<Props> = ({
  children,
  title,
  subtitle,
  cameraPreset = 'perspective',
  onCameraPresetChange,
  onResetCamera,
}) => {
  const { is3DMode, setIs3DMode } = useWorkbench();

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-viewport)',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid var(--border-medium)',
      borderRadius: '2px',
    }}>
      {/* Viewport Floating Header / Gizmo Bar */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        right: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        {/* Title overlay */}
        <div style={{
          background: 'rgba(10, 14, 20, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--border-subtle)',
          padding: '4px 8px',
          borderRadius: '2px',
          pointerEvents: 'auto',
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title ?? 'COMPUTATIONAL VIEWPORT'}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Camera & Mode Gizmo Controls */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(10, 14, 20, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--border-subtle)',
          padding: '3px 6px',
          borderRadius: '2px',
          pointerEvents: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
        }}>
          {is3DMode && onCameraPresetChange && (
            <>
              <button
                onClick={() => onCameraPresetChange('perspective')}
                style={{
                  background: cameraPreset === 'perspective' ? 'var(--text-accent)' : 'transparent',
                  color: cameraPreset === 'perspective' ? '#000000' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '2px 5px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '0.65rem',
                }}
                title="Orbit 3D Perspective"
              >
                ORBIT
              </button>
              <button
                onClick={() => onCameraPresetChange('top')}
                style={{
                  background: cameraPreset === 'top' ? 'var(--text-accent)' : 'transparent',
                  color: cameraPreset === 'top' ? '#000000' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '2px 5px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '0.65rem',
                }}
                title="Top-Down Orthographic View"
              >
                TOP
              </button>
              <button
                onClick={() => onCameraPresetChange('side')}
                style={{
                  background: cameraPreset === 'side' ? 'var(--text-accent)' : 'transparent',
                  color: cameraPreset === 'side' ? '#000000' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '2px 5px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '0.65rem',
                }}
                title="Side Profile View"
              >
                SIDE
              </button>
              <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)', margin: '0 2px' }} />
            </>
          )}

          {onResetCamera && (
            <button
              onClick={onResetCamera}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
                padding: '2px 4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.65rem',
              }}
              title="Reset Camera Coordinates"
            >
              <RotateCcw size={10} /> RESET CAM
            </button>
          )}

          <button
            onClick={() => setIs3DMode(!is3DMode)}
            style={{
              background: 'transparent',
              color: is3DMode ? 'var(--text-accent)' : 'var(--text-secondary)',
              border: 'none',
              padding: '2px 4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.65rem',
            }}
            title="Toggle 3D spatial / 2D data fallback"
          >
            {is3DMode ? <Box size={10} /> : <Layers size={10} />}
            {is3DMode ? '3D' : '2D'}
          </button>
        </div>
      </div>

      {/* Viewport Core Render Canvas Container */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: '380px',
      }}>
        {children}
      </div>

      {/* Axis coordinate / grid watermark */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        fontSize: '0.65rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-tertiary)',
        pointerEvents: 'none',
      }}>
        [X: &plusmn;1.0, Y: &plusmn;1.0, Z: &plusmn;1.0] • COMPUTATIONAL GRID 10px
      </div>
    </div>
  );
};
