import React from 'react';
import { EvidenceLevel } from '../types';

interface EvidenceBadgeProps {
  level?: EvidenceLevel | string;
  type?: EvidenceLevel | string;
  className?: string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ level, type, className = '' }) => {
  const badgeLevel = (level || type || 'PRECOMPUTED') as string;

  const getBadgeClass = () => {
    switch (badgeLevel) {
      case 'OBSERVED': return 'badge-observed';
      case 'HYPOTHESIS': return 'badge-hypothesis';
      case 'INCONCLUSIVE': return 'badge-inconclusive';
      case 'LIVE': return 'badge-live';
      case 'PRECOMPUTED': return 'badge-precomputed';
      case 'SYNTHETIC': return 'badge-observed';
      case 'PROJECTED': return 'badge-projected';
      case 'ILLUSTRATION':
      case 'ILLUSTRATIVE': return 'badge-illustrative';
      case 'HISTORICAL': return 'badge-historical';
      case 'RECOVERY': return 'badge-recovery';
      default: return 'badge-precomputed';
    }
  };

  return (
    <span className={`badge ${getBadgeClass()} ${className}`} title={`Evidence classification: ${badgeLevel}`}>
      {badgeLevel}
    </span>
  );
};
