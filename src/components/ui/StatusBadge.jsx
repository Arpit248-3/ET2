import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const map = {
    'LIVE': 'badge-green', 'ACTIVE': 'badge-green', 'OPERATIONAL': 'badge-green', 'COMPLIANT': 'badge-green',
    'COMPATIBLE': 'badge-green', 'CLEAR': 'badge-green', 'PUBLISHED': 'badge-green', 'APPROVED': 'badge-green',
    'ONLINE': 'badge-green', 'SUCCESS': 'badge-green', 'ALIGNED': 'badge-green', 'VALID': 'badge-green',
    'MITIGATED': 'badge-green', 'DONE': 'badge-green', 'PASSED': 'badge-green',
    'WARNING': 'badge-amber', 'ELEVATED': 'badge-amber', 'CAUTION': 'badge-amber', 'PARTIAL': 'badge-amber',
    'MAINTENANCE': 'badge-amber', 'DRAFT': 'badge-amber', 'PENDING': 'badge-amber', 'DELAYED': 'badge-amber',
    'REVIEW': 'badge-amber', 'UNDER REVIEW': 'badge-amber', 'MINOR FLAG': 'badge-amber', 'RESTRICTED': 'badge-amber',
    'IN PROGRESS': 'badge-amber', 'DEGRADED': 'badge-amber', 'CONSIDER': 'badge-amber', 'MONITOR': 'badge-amber',
    'HIGH': 'badge-amber', 'MEDIUM': 'badge-blue', 'LOW': 'badge-green',
    'CRITICAL': 'badge-red', 'HIGH RISK': 'badge-red', 'FLAGGED': 'badge-red', 'INACTIVE': 'badge-red',
    'INCOMPATIBLE': 'badge-red', 'RED': 'badge-red', 'MISALIGNED': 'badge-red', 'NON-COMPLIANT': 'badge-red',
    'OFFLINE': 'badge-red', 'VOTING': 'badge-red', 'ACTIVATE': 'badge-red',
    'INFO': 'badge-blue', 'VIABLE': 'badge-blue', 'RECOMMENDED': 'badge-blue', 'AI': 'badge-blue',
    'SECRET': 'badge-purple', 'TOP SECRET': 'badge-red', 'CONFIDENTIAL': 'badge-blue',
    'GREEN': 'badge-green', 'AMBER': 'badge-amber',
  };

  const dots = {
    'badge-green': '#22c55e', 'badge-amber': '#f59e0b', 'badge-red': '#ef4444',
    'badge-blue': '#1d8cff', 'badge-purple': '#8b5cf6', 'badge-cyan': '#00e5ff',
  };

  const cls = map[status?.toUpperCase()] || 'badge-gray';
  const dot = dots[cls];

  return (
    <span className={`badge ${cls}`} style={{ fontSize: size === 'sm' ? 10 : 11 }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />}
      {status}
    </span>
  );
}
