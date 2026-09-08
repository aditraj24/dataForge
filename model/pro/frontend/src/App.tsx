import React, { useState } from 'react';
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

  // Default active view: Latent Workbench (or can be any instrument)
  const [activeView, setActiveView] = useState<ToolViewId>('latent');
  const [topTab, setTopTab] = useState<string>('Lab');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle Top Nav Tab clicks
  const handleTopTabChange = (tab: string) => {
    setTopTab(tab);
    if (tab === 'Lab') setActiveView('sim-lab');
    else if (tab === 'Experiments') setActiveView('free');
    else if (tab === 'Models') setActiveView('scale');
    else if (tab === 'Analysis') setActiveView('pareto');
    else if (tab === 'Documentation') setActiveView('methods');
  };

  // Quotes per active tool (Matching the reference screenshots)
  const getFooterQuote = (view: ToolViewId) => {
    switch (view) {
      case 'latent':
        return '"Same task. Different perspectives. Deeper understanding."';
      case 'bdh':
        return '"Memory is not storage, but structure."';
      case 'scale':
        return '"Bigger models. Deeper insights."';
      case 'recovery':
        return '"Information is not lost, just harder to find."';
      case 'free':
        return '"Your questions. Our playground."';
      case 'task-a':
        return '"One permutation step at a time. Trace the discrete cycle."';
      case 'task-b':
        return '"Modular arithmetic: empirical evidence remains strictly inconclusive."';
      case 'cot':
        return '"Two computational mechanisms: autoregressive scratchpad vs. recurrent latent core."';
      case 'attention':
        return '"Inspect the addressing mechanism. Trace the 68% bottleneck."';
      case 'pareto':
        return '"Empirical frontier: observed wall-clock latency vs. exact accuracy."';
      case 'sim-lab':
        return '"Digital Simulation Lab: configure forward passes and sweep inference budgets."';
      case 'methods':
        return '"Scientific rigor: reproducibility protocols, GPU hardware and citations."';
      case 'explain':
        return '"Audit your understanding: test-time compute allocation and mechanisms."';
      default:
        return '"DataForge 2026: The Thinking Budget."';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#06090e',
        color: '#f8fafc',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* 1. Precision Top Bar */}
      <WorkbenchNavbar
        activeTopTab={topTab}
        onTopTabChange={handleTopTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Application Shell: Sidebar + Active Central Instrument */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 52px - 34px)', position: 'relative' }}>
        {/* Persistent Left Sidebar */}
        <WorkbenchSidebar
          activeView={activeView}
          onSelectView={(v) => {
            setActiveView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          backendConnected={true}
        />

        {/* Central Workspace: Single Dominant Instrument Viewport */}
        <main
          style={{
            flex: 1,
            backgroundColor: '#070b12',
            overflowY: 'auto',
            minWidth: 0,
            paddingBottom: '2rem',
          }}
        >
          {activeView === 'sim-lab' && (
            <div style={{ padding: '1.25rem 2rem' }}>
              <SimulationLabBench onNavigateTool={(id) => setActiveView(id as ToolViewId)} />
            </div>
          )}

          {activeView === 'task-a' && (
            <div style={{ padding: '1.25rem 2rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => setActiveView('sim-lab')}>Lab</span>
                  <span>&gt;</span>
                  <span style={{ color: '#94a3b8' }}>Task A</span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                  Task A: Permutation Orbit Builder
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Construct and execute a permutation orbit. Modify mappings π(v0)..π(v7) and follow state transitions.
                </p>
              </div>
              <PermutationMachine />
            </div>
          )}

          {activeView === 'task-b' && (
            <div style={{ padding: '1.25rem 2rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => setActiveView('sim-lab')}>Lab</span>
                  <span>&gt;</span>
                  <span style={{ color: '#94a3b8' }}>Task B</span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                  Task B: Modular Register Machine
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Build and execute modular arithmetic programs. Note: Empirical outcome remains inconclusive (~10% chance).
                </p>
              </div>
              <RegisterMachineTaskB />
            </div>
          )}

          {activeView === 'cot' && (
            <div style={{ padding: '1.25rem 2rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => setActiveView('sim-lab')}>Lab</span>
                  <span>&gt;</span>
                  <span style={{ color: '#94a3b8' }}>CoT Workbench</span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                  CoT vs Latent Dual Reasoning Workbench
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Side-by-side comparison of explicit scratchpad generation vs. recurrent continuous latent state updates.
                </p>
              </div>
              <DualReasoningWorkbench />
            </div>
          )}

          {activeView === 'latent' && <ThreeStateTrajectory />}

          {activeView === 'attention' && (
            <div style={{ padding: '1.25rem 2rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => setActiveView('sim-lab')}>Lab</span>
                  <span>&gt;</span>
                  <span style={{ color: '#94a3b8' }}>Attention Inspector</span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                  Attention Addressing Circuit
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Inspect attention matrix allocations across layers and heads. Labeled PRECOMPUTED empirical measurements.
                </p>
              </div>
              <AttentionCircuit />
            </div>
          )}

          {activeView === 'bdh' && <BdhSynapticWorkbench />}

          {activeView === 'pareto' && (
            <div style={{ padding: '1.25rem 2rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => setActiveView('sim-lab')}>Lab</span>
                  <span>&gt;</span>
                  <span style={{ color: '#94a3b8' }}>Pareto Instrument</span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                  Cost–Accuracy Pareto Instrument
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Empirical trade-offs in inference latency (ms) vs. task accuracy (%). Only observed points are plotted.
                </p>
              </div>
              <ParetoInstrument />
            </div>
          )}

          {activeView === 'scale' && <ScaleMachineProgression />}

          {activeView === 'recovery' && <RecoveryInvestigation />}

          {activeView === 'free' && <FreeExperimentWorkbench />}

          {activeView === 'methods' && (
            <div style={{ padding: '1.25rem 2rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => setActiveView('sim-lab')}>Lab</span>
                  <span>&gt;</span>
                  <span style={{ color: '#94a3b8' }}>Methods &amp; Sources</span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                  Methods &amp; Sources
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Full experimental protocols, PyTorch architecture definitions, GPU profiling benchmarks, and bibliography.
                </p>
              </div>
              <MethodsWorkbench />
            </div>
          )}

          {activeView === 'explain' && (
            <div style={{ padding: '1.25rem 2rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => setActiveView('sim-lab')}>Lab</span>
                  <span>&gt;</span>
                  <span style={{ color: '#94a3b8' }}>Explain It Back</span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                  Comprehension Self-Audit Workbench
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Audit your conceptual model of the thinking budget, test-time compute, and empirical Pareto boundaries.
                </p>
              </div>
              <ExplainBackWorkbench />
            </div>
          )}
        </main>
      </div>

      {/* 3. Persistent Global Footer Status Bar (Matching reference screenshots) */}
      <footer
        style={{
          height: '34px',
          backgroundColor: '#05080e',
          borderTop: '1px solid #162032',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 1.5rem',
          fontSize: '0.7rem',
          color: '#64748b',
          zIndex: 60,
          userSelect: 'none',
        }}
      >
        <div style={{ fontStyle: 'italic', color: '#94a3b8', letterSpacing: '0.01em' }}>
          {getFooterQuote(activeView)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.67rem' }}>
          <span>DataForge 2026</span>
          <span>•</span>
          <span>Educational research project</span>
          <span>•</span>
          <span style={{ color: '#38bdf8' }}>Observed results only</span>
          <span>•</span>
          <span>No fabricated measurements</span>
        </div>
      </footer>
    </div>
  );
};
