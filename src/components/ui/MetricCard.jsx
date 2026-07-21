import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({ label, value, unit = '', delta, deltaLabel, color = 'blue', icon: Icon, subtitle, className = '', valueSm = false }) {
  const colorMap = {
    blue:   { text: '#60b4ff', glow: '#1d8cff', bg: 'rgba(29,140,255,0.1)', border: 'rgba(29,140,255,0.2)', top: 'rgba(29,140,255,0.6)' },
    cyan:   { text: '#22d3ee', glow: '#00e5ff', bg: 'rgba(0,229,255,0.09)', border: 'rgba(0,229,255,0.2)',   top: 'rgba(0,229,255,0.6)' },
    green:  { text: '#4ade80', glow: '#22c55e', bg: 'rgba(34,197,94,0.09)', border: 'rgba(34,197,94,0.2)',   top: 'rgba(34,197,94,0.6)' },
    amber:  { text: '#fbbf24', glow: '#f59e0b', bg: 'rgba(245,158,11,0.09)',border: 'rgba(245,158,11,0.2)',  top: 'rgba(245,158,11,0.6)' },
    red:    { text: '#f87171', glow: '#ef4444', bg: 'rgba(239,68,68,0.09)', border: 'rgba(239,68,68,0.2)',   top: 'rgba(239,68,68,0.6)' },
    purple: { text: '#a78bfa', glow: '#8b5cf6', bg: 'rgba(139,92,246,0.09)',border: 'rgba(139,92,246,0.2)',  top: 'rgba(139,92,246,0.6)' },
  };
  const c = colorMap[color] || colorMap.blue;
  const isUp = delta > 0;
  const isDown = delta < 0;

  return (
    <div
      className={`card card-hover ${className}`}
      style={{ position: 'relative', overflow: 'hidden', padding: '18px 20px' }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${c.top} 0%, transparent 80%)`,
      }} />
      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 80, height: 80,
        background: `radial-gradient(circle at 0 0, ${c.bg} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--text-dim)',
        }}>{label}</span>
        {Icon && (
          <div className="icon-box" style={{
            width: 32, height: 32, background: c.bg,
            border: `1px solid ${c.border}`,
          }}>
            <Icon size={15} style={{ color: c.text }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: subtitle || delta !== undefined ? 8 : 0 }}>
        <span className="stat-number" style={{ color: c.text, fontSize: valueSm ? '1.15rem' : undefined }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{unit}</span>}
      </div>

      {subtitle && (
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: delta !== undefined ? 6 : 0 }}>{subtitle}</p>
      )}

      {delta !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isUp
            ? <TrendingUp size={11} style={{ color: '#4ade80' }} />
            : isDown
            ? <TrendingDown size={11} style={{ color: '#f87171' }} />
            : <Minus size={11} style={{ color: '#94a3b8' }} />}
          <span style={{
            fontSize: 10.5, fontWeight: 600,
            color: isUp ? '#4ade80' : isDown ? '#f87171' : '#94a3b8',
          }}>
            {isUp ? '+' : ''}{delta}% {deltaLabel || ''}
          </span>
        </div>
      )}
    </div>
  );
}
