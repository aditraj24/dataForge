import React, { useState, useEffect } from 'react';
import { Beaker, BookOpen, Sun, Moon, Cpu, CheckCircle } from 'lucide-react';

interface NavbarProps {
  currentView: 'essay' | 'lab';
  onViewChange: (view: 'essay' | 'lab') => void;
  activeDevice?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange, activeDevice = 'Ready' }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentScroll = window.scrollY;
      setScrollProgress(totalScroll > 0 ? (currentScroll / totalScroll) * 100 : 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'background-color var(--transition-normal)'
    }}>
      {/* Scroll Progress Bar */}
      <div style={{
        height: '3px',
        width: `${scrollProgress}%`,
        backgroundColor: 'var(--cot-primary)',
        transition: 'width 50ms linear'
      }} />

      <div className="essay-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.5rem'
      }}>
        {/* Braor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => onViewChange('essay')}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: 'var(--cot-bg)',
            border: '1px solid var(--cot-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cot-primary)'
          }}>
            <Cpu size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              The Thinking Budget
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Pareto Frontiers in AI Reasoning
            </div>
          </div>
        </div>

        {/* Center / Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            onClick={() => onViewChange('essay')}
            className={`btn ${currentView === 'essay' ? 'btn-secondary' : 'btn-pill'}`}
            style={{
              background: currentView === 'essay' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: currentView === 'essay' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: currentView === 'essay' ? '1px solid var(--border-medium)' : 'none',
              padding: '0.45rem 0.85rem'
            }}
          >
            <BookOpen size={16} />
            <span>Visual Essay</span>
          </button>

          <button
            onClick={() => onViewChange('lab')}
            className={`btn ${currentView === 'lab' ? 'btn-primary' : 'btn-pill'}`}
            style={{
              padding: '0.45rem 1rem'
            }}
          >
            <Beaker size={16} />
            <span>Simulation Lab</span>
          </button>
        </nav>

        {/* Right tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--correct-color)' }} />
            <span>{activeDevice}</span>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className="btn btn-secondary btn-pill"
            style={{ padding: '0.45rem', width: '34px', height: '34px' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
};
