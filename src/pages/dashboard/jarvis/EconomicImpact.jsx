export default function EconomicImpact({ data }) {
  const impact = data?.economic_impact ?? {};

  const defaultMetrics = [
    { key: 'oil_price',     label: 'Oil Price Impact',      icon: '🛢️', unit: '/bbl', color: '#f59e0b' },
    { key: 'inflation',     label: 'Inflation Pressure',    icon: '📈', unit: '',      color: '#ef4444' },
    { key: 'gdp',           label: 'GDP Effect',            icon: '🏛️', unit: '',      color: '#1d8cff' },
    { key: 'forex',         label: 'Forex Pressure',        icon: '💱', unit: '',      color: '#8b5cf6' },
    { key: 'trade_balance', label: 'Trade Balance',         icon: '⚖️', unit: '',      color: '#00e5ff' },
    { key: 'fuel_cost',     label: 'Fuel Cost Increase',    icon: '⛽', unit: '',      color: '#22c55e' },
  ];

  // build the display list: prioritise keys present in `impact`, fallback to defaults
  const entries = Object.entries(impact).length > 0
    ? Object.entries(impact).map(([key, value]) => {
        const found = defaultMetrics.find(m => m.key === key);
        return {
          key,
          label: found?.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          icon:  found?.icon  ?? '📊',
          color: found?.color ?? '#1d8cff',
          unit:  found?.unit  ?? '',
          value: String(value),
        };
      })
    : defaultMetrics.map(m => ({ ...m, value: '—' }));

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: 20,
      padding: 30,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 100% 0%, rgba(245,158,11,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 24 }}>
        📊 Economic Impact Analysis
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
        {entries.map(({ key, label, icon, color, unit, value }) => (
          <div key={key} style={{
            background: `${color}0d`,
            border: `1px solid ${color}28`,
            borderRadius: 14,
            padding: '18px 20px',
            animation: 'fade-in-up 0.5s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>
              {value}{unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
