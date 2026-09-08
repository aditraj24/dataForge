import React, { useState } from 'react';
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

const SidebarButton = ({
  item,
  isSelected,
  onClick
}: {
  item: any;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      data-testid={`nav-${item.id}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: item.sublabel ? '0.5rem 0.75rem' : '0.625rem 0.75rem',
        background: isSelected ? 'var(--bg-surface-elevated)' : isHovered ? 'var(--bg-surface-hover)' : 'transparent',
        border: 'none',
        borderLeft: isSelected ? '2px solid var(--text-accent)' : '2px solid transparent',
        borderRadius: '0 4px 4px 0',
        color: isSelected ? 'var(--text-accent)' : 'var(--text-secondary)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all var(--transition-fast)',
        width: '100%',
        marginBottom: '2px',
      }}
    >
      <div style={{ color: isSelected ? 'var(--text-accent)' : isHovered ? 'var(--text-primary)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
        {item.icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: isSelected ? 600 : 500,
            color: isSelected ? 'var(--text-primary)' : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
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
              fontSize: '0.75rem',
              color: isSelected ? 'var(--text-accent)' : 'var(--text-tertiary)',
              lineHeight: 1.2,
              marginTop: '0.125rem'
            }}
          >
            {item.sublabel}
          </span>
        )}
      </div>
    </button>
  );
};

export const WorkbenchSidebar: React.FC<WorkbenchSidebarProps> = ({
  activeView,
  onSelectView,
  backendConnected = true,
}) => {
  const experimentItems: { id: ToolViewId; label: string; sublabel?: string; icon: React.ReactNode }[] = [
    { id: 'sim-lab', label: 'Simulation Lab', icon: <Layers size={16} /> },
    { id: 'task-a', label: 'Task A', sublabel: 'Permutation Orbit', icon: <Crosshair size={16} /> },
    { id: 'task-b', label: 'Task B', sublabel: 'Modular Register', icon: <Calculator size={16} /> },
    { id: 'cot', label: 'CoT Workbench', icon: <Terminal size={16} /> },
    { id: 'latent', label: 'Latent Workbench', icon: <Grid size={16} /> },
    { id: 'attention', label: 'Attention Inspector', icon: <Eye size={16} /> },
    { id: 'bdh', label: 'BDH Synaptic Lab', icon: <Sparkles size={16} /> },
    { id: 'pareto', label: 'Pareto Instrument', icon: <TrendingUp size={16} /> },
    { id: 'scale', label: 'Scale Machine', icon: <Sliders size={16} /> },
    { id: 'recovery', label: 'Recovery Lab (5M)', icon: <RotateCcw size={16} /> },
    { id: 'free', label: 'Free Experiment', icon: <FlaskConical size={16} /> },
  ];

  const resourceItems: { id: ToolViewId; label: string; icon: React.ReactNode }[] = [
    { id: 'methods', label: 'Methods & Sources', icon: <FileText size={16} /> },
    { id: 'explain', label: 'Explain It Back', icon: <HelpCircle size={16} /> },
  ];

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* Upper Navigation Sections */}
      <div style={{ padding: '1.5rem 0.75rem' }}>
        {/* EXPERIMENTS HEADER */}
        <div
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-tertiary)',
            padding: '0 0.75rem 0.75rem 0.75rem',
            fontWeight: 600,
          }}
        >
          Experiments
        </div>

        {/* Experiment Items */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '2rem' }}>
          {experimentItems.map((item) => (
            <SidebarButton
              key={item.id}
              item={item}
              isSelected={activeView === item.id}
              onClick={() => onSelectView(item.id)}
            />
          ))}
        </div>

        {/* RESOURCES HEADER */}
        <div
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-tertiary)',
            padding: '0 0.75rem 0.75rem 0.75rem',
            fontWeight: 600,
          }}
        >
          Resources
        </div>

        {/* Resource Items */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {resourceItems.map((item) => (
            <SidebarButton
              key={item.id}
              item={item}
              isSelected={activeView === item.id}
              onClick={() => onSelectView(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Status / Diagnostics Box */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-elevated)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Circle
            size={8}
            style={{
              fill: backendConnected ? 'var(--correct-color)' : 'var(--warning-color)',
              color: backendConnected ? 'var(--correct-color)' : 'var(--warning-color)',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {backendConnected ? 'Backend Connected' : 'Local Fallback'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Circle
            size={8}
            style={{
              fill: 'var(--correct-color)',
              color: 'var(--correct-color)',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Precomputed Data
          </span>
        </div>

        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.5rem',
          }}
        >
          v0.2.0
        </div>
      </div>
    </aside>
  );
};
