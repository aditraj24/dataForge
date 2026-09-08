import React from 'react';

interface PermutationTableProps {
  mapping: number[]; // length 8: [pi(0), pi(1), ... pi(7)]
  activeSource?: number | null;
  activeTarget?: number | null;
  onSelectNode?: (node: number) => void;
}

export const PermutationTable: React.FC<PermutationTableProps> = ({
  mapping,
  activeSource = null,
  activeTarget = null,
  onSelectNode
}) => {
  return (
    <div style={{
      overflowX: 'auto',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '10px',
      padding: '1rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        fontSize: '0.8rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-tertiary)'
      }}>
        <span>PERMUTATION MAPPING TABLE &pi; : S_8 &rarr; S_8</span>
        <span>DOMAIN: &#123;0, 1, 2, 3, 4, 5, 6, 7&#125;</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '0.5rem',
        minWidth: '480px'
      }}>
        {mapping.map((target, src) => {
          const isSource = activeSource === src;
          const isTarget = activeTarget === target;

          return (
            <div
              key={src}
              onClick={() => onSelectNode && onSelectNode(src)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0.65rem 0.35rem',
                borderRadius: '8px',
                backgroundColor: isSource
                  ? 'rgba(59, 130, 246, 0.2)'
                  : isTarget
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'var(--bg-surface-elevated)',
                border: isSource
                  ? '2px solid var(--cot-primary)'
                  : isTarget
                  ? '2px solid var(--latent-primary)'
                  : '1px solid var(--border-subtle)',
                cursor: onSelectNode ? 'pointer' : 'default',
                transition: 'all var(--transition-fast)'
              }}
            >
              <span style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: isSource ? 'var(--cot-primary)' : 'var(--text-tertiary)'
              }}>
                v = {src}
              </span>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: isTarget ? 'var(--latent-primary)' : 'var(--text-primary)',
                margin: '0.25rem 0'
              }}>
                {target}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-tertiary)'
              }}>
                &pi;({src})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
