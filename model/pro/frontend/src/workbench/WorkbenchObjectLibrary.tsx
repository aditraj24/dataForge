import React from 'react';
import { useWorkbench } from './workbenchContext';
import { 
  Activity, 
  Cpu, 
  Layers, 
  GitFork, 
  HardDrive, 
  Search, 
  Link2, 
  Calculator, 
  Network, 
  Beaker, 
  Sparkles,
  Award,
  LucideIcon
} from 'lucide-react';

export interface LibraryItem {
  id: string;
  title: string;
  category: 'TASK' | 'MODEL' | 'INSTRUMENT' | 'DEBUG' | 'LAB';
  icon: LucideIcon;
  description: string;
}

export const WORKBENCH_OBJECTS: LibraryItem[] = [
  {
    id: 'task_a_orbit',
    title: 'Task A: Permutation Builder',
    category: 'TASK',
    icon: Activity,
    description: 'Construct permutations, enforce uniqueness, step through orbits.',
  },
  {
    id: 'dual_machines',
    title: 'Two Machines: CoT vs Latent',
    category: 'MODEL',
    icon: Cpu,
    description: 'Compare discrete token generation vs continuous state recurrence.',
  },
  {
    id: 'latent_trajectory',
    title: '3D Latent Trajectory',
    category: 'INSTRUMENT',
    icon: Layers,
    description: 'Inspect numerical stabilization and contraction in vector space.',
  },
  {
    id: 'pareto_instrument',
    title: 'Pareto Scientific Instrument',
    category: 'INSTRUMENT',
    icon: GitFork,
    description: 'Analyze observed latency-accuracy non-dominated boundaries.',
  },
  {
    id: 'scale_machine',
    title: 'Scale Machine: 126K → 1M → 5M',
    category: 'INSTRUMENT',
    icon: HardDrive,
    description: 'Examine capacity growth and compute footprint effects.',
  },
  {
    id: 'recovery_lab',
    title: '5M Recovery Debugging Lab',
    category: 'DEBUG',
    icon: Search,
    description: 'Diagnose optimization confounding vs architecture capacity.',
  },
  {
    id: 'attention_circuit',
    title: 'Attention Circuit Inspector',
    category: 'INSTRUMENT',
    icon: Link2,
    description: 'Probe query-key weights and the start-token addressing bottleneck.',
  },
  {
    id: 'task_b_register',
    title: 'Task B: Modular Register Circuit',
    category: 'TASK',
    icon: Calculator,
    description: 'Manipulate modular arithmetic steps under inconclusive evidence.',
  },
  {
    id: 'bdh_synaptic',
    title: 'BDH Synaptic Matrix',
    category: 'MODEL',
    icon: Network,
    description: 'Manipulate fast-weight plastic synapses in educational toy model.',
  },
  {
    id: 'simulation_lab',
    title: 'Central Simulation Lab',
    category: 'LAB',
    icon: Beaker,
    description: 'Dispatch on-demand inferences to live PyTorch models.',
  },
  {
    id: 'free_experiment',
    title: 'Free Experiment Sandbox',
    category: 'LAB',
    icon: Sparkles,
    description: 'Unconstrained experimentation: customize mapping, D, and budget k.',
  },
  {
    id: 'challenge_claim',
    title: 'Challenge the Claim Finale',
    category: 'LAB',
    icon: Award,
    description: 'Predict whether CoT or Latent wins before running tests.',
  },
];

export const WorkbenchObjectLibrary: React.FC = () => {
  const { activeObjectId, setActiveObjectId } = useWorkbench();

  return (
    <div style={{
      width: '260px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-medium)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.8rem',
      flexShrink: 0,
    }}>
      <div style={{
        padding: '0.6rem 0.75rem',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '0.72rem',
        color: 'var(--text-tertiary)',
        letterSpacing: '0.05em',
        fontWeight: 700,
      }}>
        OBJECT &amp; TASK LIBRARY
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {WORKBENCH_OBJECTS.map((item) => {
          const Icon = item.icon;
          const isActive = activeObjectId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveObjectId(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '0.5rem 0.6rem',
                marginBottom: '4px',
                background: isActive ? 'var(--bg-viewport)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border-strong)' : 'transparent'}`,
                borderLeft: isActive ? '3px solid var(--text-accent)' : '3px solid transparent',
                borderRadius: '2px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
                marginTop: '2px',
              }}>
                <Icon size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '4px',
                }}>
                  <span style={{
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.title}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-tertiary)',
                  }}>
                    {item.category}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-tertiary)',
                  marginTop: '2px',
                  lineHeight: 1.25,
                }}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
