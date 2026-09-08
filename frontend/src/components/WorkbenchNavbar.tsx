import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, Moon, Sun, Menu, User } from 'lucide-react';
import { ApiClient } from '../api/client';

interface WorkbenchNavbarProps {
  activeTopTab?: string;
  onTopTabChange?: (tab: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onToggleSidebar?: () => void;
}

export const WorkbenchNavbar: React.FC<WorkbenchNavbarProps> = ({
  activeTopTab = 'Lab',
  onTopTabChange,
  searchQuery = '',
  onSearchChange,
  onToggleSidebar,
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 1.25rem',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* 1. Left Braor / Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.25rem',
            }}
          >
            <Menu size={20} />
          </button>
        )}
        <img
          src="/dataforgelogobgr.png"
          alt="DataForge"
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'contain'
          }}
        />
        {!isMobile && (
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              DataForge 2026
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', lineHeight: 1.1 }}>
              The Thinking Budget
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Navigation Tabs */}
      {!isMobile && (
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
          {topTabs.map((tab) => {
            const isActive = activeTopTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onTopTabChange && onTopTabChange(tab)}
                style={{
                  background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--border-subtle)' : 'transparent',
                  borderRadius: '3px',
                  padding: '6px 14px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
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
      )}

      {/* 3. Center/Right Search Bar & Utilities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, marginLeft: isMobile ? 'auto' : 0 }}>
        {!isMobile && (
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '240px',
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
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '3px',
                padding: '6px 30px',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--text-accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* yuserr avatar */}
          <button style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }} title="User Account">
            <User size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
