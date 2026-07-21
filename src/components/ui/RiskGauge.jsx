import React from 'react';

export default function RiskGauge({ value, max = 100, size = 160, label = 'Risk Score' }) {
  const radius = (size / 2) - 16;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct * 0.75);
  const startAngle = 135;
  const color = value >= 75 ? '#ef4444' : value >= 50 ? '#f59e0b' : '#22c55e';
  const glow = value >= 75 ? 'rgba(239,68,68,0.5)' : value >= 50 ? 'rgba(245,158,11,0.5)' : 'rgba(34,197,94,0.5)';

  return (
    <div className="risk-gauge" style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-135deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} strokeDasharray={`${circumference * 0.75} ${circumference}`} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${circumference * 0.75 * pct} ${circumference}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${glow})`, transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}
