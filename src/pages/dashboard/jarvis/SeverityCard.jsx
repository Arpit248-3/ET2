export default function SeverityCard({ data }) {
  const severity   = data?.severity   ?? 0;
  const confidence = data?.confidence ?? 0;

  const severityColor =
    severity >= 80 ? '#ef4444' :
    severity >= 60 ? '#f59e0b' :
    severity >= 40 ? '#1d8cff' : '#22c55e';

  const severityLabel =
    severity >= 80 ? 'CRITICAL' :
    severity >= 60 ? 'HIGH' :
    severity >= 40 ? 'MODERATE' : 'LOW';

  function Gauge({ value, color, label }) {
    const arc    = 251.3;
    const filled = (value / 100) * arc;
    return (
      <div style={{
        background: '#0f172a',
        border: `1px solid ${color}44`,
        borderRadius: 20,
        padding: 30,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* ambient glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 110%, ${color}30 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 16 }}>
          {label}
        </div>

        <svg width="180" height="105" viewBox="0 0 180 105">
          {/* track */}
          <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
          {/* fill */}
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${arc}`}
            style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 1.2s ease' }}
          />
          <text x="90" y="84" textAnchor="middle" fill="white" fontSize="32" fontWeight="800" fontFamily="Inter">{value}</text>
          <text x="90" y="100" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="Inter">/ 100</text>
        </svg>

        <span style={{
          marginTop: 8,
          padding: '4px 16px',
          borderRadius: 99,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          background: `${color}20`,
          color,
          border: `1px solid ${color}44`,
        }}>
          {label === 'Threat Severity' ? severityLabel : (
            value >= 90 ? 'VERY HIGH' : value >= 75 ? 'HIGH' : value >= 50 ? 'MODERATE' : 'LOW'
          )}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <Gauge value={severity}   color={severityColor} label="Threat Severity" />
      <Gauge value={confidence} color="#1d8cff"       label="AI Confidence"  />
    </div>
  );
}
