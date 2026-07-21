import React from 'react';

export default function GlassCard({ children, className = '', style = {}, glow, onClick }) {
  const glowMap = {
    blue: '0 0 24px rgba(29,140,255,0.18), 0 0 48px rgba(29,140,255,0.07)',
    cyan: '0 0 24px rgba(0,229,255,0.18), 0 0 48px rgba(0,229,255,0.07)',
    amber: '0 0 24px rgba(245,158,11,0.18), 0 0 48px rgba(245,158,11,0.07)',
    red: '0 0 24px rgba(239,68,68,0.22), 0 0 48px rgba(239,68,68,0.1)',
    green: '0 0 24px rgba(34,197,94,0.18), 0 0 48px rgba(34,197,94,0.07)',
    purple: '0 0 24px rgba(139,92,246,0.18), 0 0 48px rgba(139,92,246,0.07)',
  };

  return (
    <div
      className={`card ${className}`}
      onClick={onClick}
      style={{
        boxShadow: glow ? glowMap[glow] || glowMap.blue : 'var(--shadow-card)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
