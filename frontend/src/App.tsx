import React, { useState, useEffect } from 'react';
import { useAutoRenderMath } from './hooks/useAutoRenderMath';
import { WorkbenchNavbar } from './components/WorkbenchNavbar';
import { WorkbenchSidebar, ToolViewId } from './components/WorkbenchSidebar';
import { PermutationMachine } from './components/PermutationMachine';
import { DualReasoningWorkbench } from './components/DualReasoningWorkbench';
import { ThreeStateTrajectory } from './components/ThreeStateTrajectory';
import { ParetoInstrument } from './components/ParetoInstrument';
import { ScaleMachineProgression } from './components/ScaleMachineProgression';
import { RecoveryInvestigation } from './components/RecoveryInvestigation';
import { AttentionCircuit } from './components/AttentionCircuit';
import { RegisterMachineTaskB } from './components/RegisterMachineTaskB';
import { BdhSynapticWorkbench } from './components/BdhSynapticWorkbench';
import { SimulationLabBench } from './components/SimulationLabBench';
import { FreeExperimentWorkbench } from './components/FreeExperimentWorkbench';
import { ExplainBackWorkbench } from './components/ExplainBackWorkbench';
import { MethodsWorkbench } from './components/MethodsWorkbench';

export const App: React.FC = () => {
  useAutoRenderMath();

  const [activeView, setActiveView] = useState<ToolViewId>('latent');
  const [topTab, setTopTab] = useState<string>('Lab');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTopTabChange = (tab: string) => {
    setTopTab(tab);
    if (tab === 'Lab') setActiveView('sim-lab');
    else if (tab === 'Experiments') setActiveView('free');
    else if (tab === 'Models') setActiveView('scale');
    else if (tab === 'Analysis') setActiveView('pareto');
    else if (tab === 'Documentation') setActiveView('methods');
  };

  const getFooterQuote = (view: ToolViewId) => {
    switch (view) {
      case 'latent': return '"Same task. Different perspectives. Deeper understanding."';
      case 'bdh': return '"Memory is not storage, but structure."';
      case 'scale': return '"Bigger models. Deeper insights."';
      case 'recovery': return '"Information is not lost, just harder to find."';
      case 'free': return '"Your questions. Our playground."';
      case 'task-a': return '"One permutation step at a time. Trace the discrete cycle."';
      case 'task-b': return '"Modular arithmetic: empirical evidence remains strictly inconclusive."';
      case 'cot': return '"Two computational mechanisms: autoregressive scratchpad vs. recurrent latent core."';
      case 'attention': return '"Inspect the addressing mechanism. Trace the 68% bottleneck."';
      case 'pareto': return '"Empirical frontier: observed wall-clock latency vs. exact accuracy."';
      case 'sim-lab': return '"Digital Simulation Lab: configure forward passes and sweep inference budgets."';
      case 'methods': return '"Scientific rigor: reproducibility protocols, GPU hardware and citations."';
      case 'explain': return '"Audit your understanding: test-time compute allocation and mechanisms."';
      default: return '"DataForge 2026: The Thinking Budget."';
    }
  };

  // Helper kay lyye consistent headers
  const ViewHeader = ({ title, subtitle, breadcrumb }: { title: string, subtitle: string, breadcrumb: string }) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: 'var(--text-accent)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setActiveView('sim-lab')}>Lab</span>
        <span>/</span>
        <span>{breadcrumb}</span>
      </div>
      <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h1>
      <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>{subtitle}</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Precision Top Bar */}
      <WorkbenchNavbar
        activeTopTab={topTab}
        onTopTabChange={handleTopTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 2. Application Shell: Sidebar + Active Central Instrument */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Persistent Left Sidebar - Responsive */}
        <div style={{
          width: isMobile ? '100%' : '260px',
          borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          position: isMobile ? 'absolute' : 'relative',
          top: 0,
          bottom: 0,
          left: isMobile ? (isSidebarOpen ? 0 : '-100%') : 0,
          zIndex: 40,
          transition: 'left 0.3s ease',
          overflowY: 'auto'
        }}>
          <WorkbenchSidebar
            activeView={activeView}
            onSelectView={(v) => {
              setActiveView(v);
              if (isMobile) setIsSidebarOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            backendConnected={true}
          />
        </div>

        {/* Central Workspace */}
        <main
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-primary)',
            overflowY: 'auto',
            minWidth: 0,
            paddingBottom: '2rem',
            paddingTop: isMobile && isSidebarOpen ? '0' : '0', // Adjust if needed
          }}
        >
          {/* Overlay kay lyye mobile sidebar */}
          {isMobile && isSidebarOpen && (
            <div 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 30 }}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
            {activeView === 'sim-lab' && <SimulationLabBench onNavigateTool={(id) => setActiveView(id as ToolViewId)} />}
            
            {activeView === 'task-a' && (
              <>
                <ViewHeader title="Task A: Permutation Orbit Builder" subtitle="Construct and execute a permutation orbit. Modify mappings and follow state transitions." breadcrumb="Task A" />
                <PermutationMachine />
              </>
            )}

            {activeView === 'task-b' && (
              <>
                <ViewHeader title="Task B: Modular Register Machine" subtitle="Build and execute modular arithmetic programs. Note: Empirical outcome remains inconclusive." breadcrumb="Task B" />
                <RegisterMachineTaskB />
              </>
            )}

            {activeView === 'cot' && (
              <>
                <ViewHeader title="CoT vs Latent Dual Reasoning Workbench" subtitle="Side-by-side comparison of explicit scratchpad generation vs. recurrent continuous latent state updates." breadcrumb="CoT Workbench" />
                <DualReasoningWorkbench />
              </>
            )}

            {activeView === 'latent' && <ThreeStateTrajectory />}

            {activeView === 'attention' && (
              <>
                <ViewHeader title="Attention Addressing Circuit" subtitle="Inspect attention matrix allocations across layers and heads. Labeled PRECOMPUTED empirical measurements." breadcrumb="Attention Inspector" />
                <AttentionCircuit />
              </>
            )}

            {activeView === 'bdh' && <BdhSynapticWorkbench />}

            {activeView === 'pareto' && (
              <>
                <ViewHeader title="Cost–Accuracy Pareto Instrument" subtitle="Empirical trade-offs in inference latency (ms) vs. task accuracy (%). Only observed points are plotted." breadcrumb="Pareto Instrument" />
                <ParetoInstrument />
              </>
            )}

            {activeView === 'scale' && <ScaleMachineProgression />}
            {activeView === 'recovery' && <RecoveryInvestigation />}
            {activeView === 'free' && <FreeExperimentWorkbench />}

            {activeView === 'methods' && (
              <>
                <ViewHeader title="Methods & Sources" subtitle="Full experimental protocols, PyTorch architecture definitions, GPU profiling benchmarks, and bibliography." breadcrumb="Methods" />
                <MethodsWorkbench />
              </>
            )}

            {activeView === 'explain' && (
              <>
                <ViewHeader title="Comprehension Self-Audit Workbench" subtitle="Audit your conceptual model of the thinking budget, test-time compute, and empirical Pareto boundaries." breadcrumb="Explain It Back" />
                <ExplainBackWorkbench />
              </>
            )}
          </div>
        </main>
      </div>

      {/* 3. Persistent Global Footer Status Bar */}
      <footer
        style={{
          height: '36px',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 1.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
          zIndex: 60,
          userSelect: 'none',
        }}
      >
        <div style={{ fontStyle: 'italic' }}>
          {getFooterQuote(activeView)}
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            <span>DataForge 2026</span>
            <span>•</span>
            <span>Educational research project</span>
            <span>•</span>
            <span style={{ color: 'var(--text-accent)' }}>Observed results only</span>
          </div>
        )}
      </footer>
    </div>
  );
};
