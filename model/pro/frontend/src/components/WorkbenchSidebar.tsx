import React from 'react';
import {
  Layers,
  Crosshair,
  Calculator,
  Terminal,
  Grid,
  Eye,
  Sparkles,
  TrendingUp,
  Sliders,
  RotateCcw,
  FlaskConical,
  FileText,
  HelpCircle,
  Circle
} from 'lucide-react';

export type ToolViewId =
  | 'sim-lab'
  | 'task-a'
  | 'task-b'
  | 'cot'
  | 'latent'
  | 'attention'
  | 'bdh'
  | 'pareto'
  | 'scale'
  | 'recovery'
  | 'free'
  | 'methods'
  | 'explain';

interface WorkbenchSidebarProps {
  activeView: ToolViewId;
  onSelectView: (viewId: ToolViewId) => void;
  backendConnected?: boolean;
}

export const WorkbenchSidebar: React.FC<WorkbenchSidebarProps> = ({
  activeView,
  onSelectView,
  backendConnected = true,
}) => {
  const experimentItems: { id: ToolViewId; label: string; sublabel?: string; icon: React.ReactNode }[] = [
    { id: 'sim-lab', label: 'Simulation Lab', icon: <Layers size={15} /> },
    { id: 'task-a', label: 'Task A', sublabel: 'Permutation Orbit', icon: <Crosshair size={15} /> },
    { id: 'task-b', label: 'Task B', sublabel: 'Modular Register', icon: <Calculator size={15} /> },
    { id: 'cot', label: 'CoT Workbench', icon: <Terminal size={15} /> },
    { id: 'latent', label: 'Latent Workbench', icon: <Grid size={15} /> },
    { id: 'attention', label: 'Attention Inspector', icon: <Eye size={15} /> },
    { id: 'bdh', label: 'BDH Synaptic Lab', icon: <Sparkles size={15} /> },
    { id: 'pareto', label: 'Pareto Instrument', icon: <TrendingUp size={15} /> },
    { id: 'scale', label: 'Scale Machine', icon: <Sliders size={15} /> },
    { id: 'recovery', label: 'Recovery Lab (5M)', icon: <RotateCcw size={15} /> },
    { id: 'free', label: 'Free Experiment', icon: <FlaskConical size={15} /> },
  ];

  const resourceItems: { id: ToolViewId; label: string; icon: React.ReactNode }[] = [
    { id: 'methods', label: 'Methods & Sources', icon: <FileText size={15} /> },
    { id: 'explain', label: 'Explain It Back', icon: <HelpCircle size={15} /> },
  ];

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: '#070b12',
        borderRight: '1px solid #162032',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: 'calc(100vh - 52px)',
        position: 'sticky',
        top: '52px',
        userSelect: 'none',
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      {/* Upper Navigation Sections */}
      <div style={{ padding: '1rem 0.6rem' }}>
        {/* EXPERIMENTS HEADER */}
        <div
          style={{
            fontSize: '0.66rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#64748b',
            padding: '0 0.6rem 0.5rem 0.6rem',
            fontWeight: 700,
          }}
        >
          EXPERIMENTS
        </div>

        {/* Experiment Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '1.25rem' }}>
          {experimentItems.map((item) => {
            const isSelected = activeView === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => onSelectView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: item.sublabel ? '0.38rem 0.65rem' : '0.45rem 0.65rem',
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: isSelected ? '2px solid #38bdf8' : '2px solid transparent',
                  borderRadius: isSelected ? '0 4px 4px 0' : '4px',
                  color: isSelected ? '#38bdf8' : '#cbd5e1',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease, color 0.12s ease',
                  width: '100%',
                }}
              >
                <div style={{ color: isSelected ? '#38bdf8' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '0.81rem',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? '#f8fafc' : '#cbd5e1',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.label}
                  </span>
                  {item.sublabel && (
                    <span
                      style={{
                        fontSize: '0.67rem',
                        color: isSelected ? '#7dd3fc' : '#64748b',
                        lineHeight: 1.1,
                      }}
                    >
                      {item.sublabel}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* RESOURCES HEADER */}
        <div
          style={{
            fontSize: '0.66rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#64748b',
            padding: '0 0.6rem 0.5rem 0.6rem',
            fontWeight: 700,
          }}
        >
          RESOURCES
        </div>

        {/* Resource Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {resourceItems.map((item) => {
            const isSelected = activeView === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => onSelectView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.45rem 0.65rem',
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: isSelected ? '2px solid #38bdf8' : '2px solid transparent',
                  borderRadius: isSelected ? '0 4px 4px 0' : '4px',
                  color: isSelected ? '#38bdf8' : '#cbd5e1',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease, color 0.12s ease',
                  width: '100%',
                }}
              >
                <div style={{ color: isSelected ? '#38bdf8' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </div>
                <span
                  style={{
                    fontSize: '0.81rem',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#f8fafc' : '#cbd5e1',
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Status / Diagnostics Box */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid #162032',
          backgroundColor: '#05080e',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Circle
            size={7}
            style={{
              fill: backendConnected ? '#10b981' : '#f59e0b',
              color: backendConnected ? '#10b981' : '#f59e0b',
            }}
          />
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            {backendConnected ? 'Backend Connected' : 'Local Fallback'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Circle
            size={7}
            style={{
              fill: '#10b981',
              color: '#10b981',
            }}
          />
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            Precomputed Data Loaded
          </span>
        </div>

        <div
          style={{
            fontSize: '0.67rem',
            color: '#475569',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.2rem',
          }}
        >
          v0.2.0
        </div>
      </div>
    </aside>
  );
};
