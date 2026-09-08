import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, Terminal, Moon, Sun, User, Sparkles } from 'lucide-react';
import { ApiClient } from '../api/client';

interface WorkbenchNavbarProps {
  activeTopTab?: string;
  onTopTabChange?: (tab: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const WorkbenchNavbar: React.FC<WorkbenchNavbarProps> = ({
  activeTopTab = 'Lab',
  onTopTabChange,
  searchQuery = '',
  onSearchChange,
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    ApiClient.getHealth()
      .then((h) => setBackendHealthy(h.status === 'ok'))
      .catch(() => setBackendHealthy(false));

    const timer = setInterval(() => {
      ApiClient.getHealth()
        .then((h) => setBackendHealthy(h.status === 'ok'))
        .catch(() => setBackendHealthy(false));
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const topTabs = ['Lab', 'Experiments', 'Models', 'Analysis', 'Documentation'];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(8, 11, 17, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-medium)',
      padding: '0 1.25rem',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* 1. Left Brand / Title (Reference style) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '4px',
          background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.85rem',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.25)',
        }}>
          DF
        </div>
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            DataForge 2026
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
            The Thinking Budget
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs (Lab, Experiments, Models, Analysis, Documentation) */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {topTabs.map((tab) => {
          const isActive = activeTopTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTopTabChange && onTopTabChange(tab)}
              style={{
                background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--text-accent)' : '2px solid transparent',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* 3. Center/Right Search Bar */}
      <div style={{
        flex: '1',
        maxWidth: '380px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '10px',
            color: 'var(--text-tertiary)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search experiments, models, or concepts..."
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: '4px',
            padding: '5px 50px 5px 30px',
            fontSize: '0.75rem',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--text-accent)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
        />
        <span style={{
          position: 'absolute',
          right: '8px',
          fontSize: '0.65rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-tertiary)',
          background: 'var(--bg-viewport)',
          border: '1px solid var(--border-subtle)',
          padding: '1px 5px',
          borderRadius: '2px',
          pointerEvents: 'none',
        }}>
          Ctrl K
        </span>
      </div>

      {/* 4. Right Utility Icons & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        {/* Backend status badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: backendHealthy ? 'var(--correct-color)' : 'var(--text-tertiary)',
          background: 'var(--bg-surface)',
          padding: '3px 8px',
          borderRadius: '3px',
          border: '1px solid var(--border-subtle)',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: backendHealthy ? 'var(--correct-color)' : 'var(--warning-color)',
          }} />
          {backendHealthy ? 'ONLINE' : 'PRECOMPUTED'}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Toggle Light/Dark Theme"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications Icon */}
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={15} />
        </button>

        {/* Settings Icon */}
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={15} />
        </button>

        {/* User avatar / badge (from reference) */}
        <div style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: 'var(--border-prominent)',
          color: 'var(--text-primary)',
          fontSize: '0.72rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
        }} title="User Profile: HK">
          HK
        </div>
      </div>
    </header>
  );
};
