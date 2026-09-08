import React from 'react';
import { WorkbenchProvider, useWorkbench } from './workbenchContext';
import { WorkbenchToolbar } from './WorkbenchToolbar';
import { WorkbenchObjectLibrary } from './WorkbenchObjectLibrary';
import { WorkbenchInspector } from './WorkbenchInspector';
import { WorkbenchTimeline } from './WorkbenchTimeline';
import { WorkbenchStatusBar } from './WorkbenchStatusBar';

interface Props {
  children?: React.ReactNode;
}

const WorkbenchShellInner: React.FC<Props> = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '820px',
      maxHeight: '90vh',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-medium)',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* 1. Master Menu / Action Toolbar */}
      <WorkbenchToolbar />

      {/* 2. Middle Tri-Pane: Object Library (Left), Viewport (Center), Inspector (Right) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left Object & Tool Library */}
        <WorkbenchObjectLibrary />

        {/* Center: Dynamic Active Computational Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {children}
        </div>

        {/* Right Inspector & Progressive Disclosure Dock */}
        <WorkbenchInspector />
      </div>

      {/* 3. Real Step-by-Step Computational State Timeline */}
      <WorkbenchTimeline />

      {/* 4. Telemetry Status Bar */}
      <WorkbenchStatusBar />
    </div>
  );
};

export const ComputationalWorkbench: React.FC<Props> = ({ children }) => {
  return (
    <WorkbenchProvider>
      <WorkbenchShellInner>
        {children}
      </WorkbenchShellInner>
    </WorkbenchProvider>
  );
};
