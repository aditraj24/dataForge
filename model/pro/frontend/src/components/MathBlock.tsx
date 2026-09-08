import React from 'react';

interface MathBlockProps {
  formula: string;
  explanation?: string;
}

export const MathBlock: React.FC<MathBlockProps> = ({ formula, explanation }) => {
  return (
    <div style={{
      margin: '1.25rem 0',
      padding: '1rem 1.25rem',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px',
      fontFamily: 'var(--font-mono)'
    }}>
      <div style={{
        fontSize: '1.05rem',
        color: 'var(--text-accent)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textAlign: 'center',
        padding: '0.5rem 0'
      }}>
        {formula}
      </div>
      {explanation && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.5rem',
          textAlign: 'center'
        }}>
          {explanation}
        </div>
      )}
    </div>
  );
};
