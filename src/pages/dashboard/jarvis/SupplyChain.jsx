export default function SupplyChain({ data }) {
  const chain = data?.supply_chain ?? {};

  // Build node list from supply_chain object or show defaults
  const hasData = Object.keys(chain).length > 0;

  const defaultNodes = [
    { label: 'Source Countries',   icon: '🌍', status: 'active',  detail: 'Saudi Arabia, UAE, Russia' },
    { label: 'Tanker Fleet',       icon: '🚢', status: 'active',  detail: 'AIS tracking nominal' },
    { label: 'Strait of Hormuz',   icon: '⚓', status: 'warning', detail: 'Elevated tension – monitored' },
    { label: 'Indian Ocean Route', icon: '🌊', status: 'active',  detail: 'Cape route operational' },
    { label: 'Ports & Terminals',  icon: '⚓', status: 'active',  detail: 'Mundra, Paradip, Haldia online' },
    { label: 'SPR Reserves',       icon: '🏛️', status: 'active',  detail: 'Visakhapatnam, Padur, Mangalore' },
    { label: 'Refineries',         icon: '🏭', status: 'active',  detail: '23 operational refineries' },
    { label: 'Distribution Grid',  icon: '🗺️', status: 'active',  detail: 'Pipeline network nominal' },
  ];

  const nodes = hasData
    ? Object.entries(chain).map(([key, val]) => ({
        label:  key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        icon:   '🔗',
        status: String(val).toLowerCase().includes('risk') || String(val).toLowerCase().includes('warn') ? 'warning'
               : String(val).toLowerCase().includes('critical') || String(val).toLowerCase().includes('offline') ? 'critical'
               : 'active',
        detail: String(val),
      }))
    : defaultNodes;

  const statusColor  = { active: '#22c55e', warning: '#f59e0b', critical: '#ef4444' };
  const statusLabel  = { active: 'NOMINAL', warning: 'ELEVATED', critical: 'DISRUPTED' };

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid rgba(0,229,255,0.18)',
      borderRadius: 20,
      padding: 30,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 24 }}>
        🚢 Supply Chain Status
      </div>

      {/* Pipeline flow */}
      <div style={{ position: 'relative' }}>
        {nodes.map((node, i) => {
          const color = statusColor[node.status] ?? '#1d8cff';
          const isLast = i === nodes.length - 1;
          return (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: isLast ? 0 : 8 }}>
              {/* Connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 36 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${color}20`,
                  border: `1.5px solid ${color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {node.icon}
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 16, marginTop: 4,
                    background: `linear-gradient(180deg, ${color}60, transparent)`,
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{
                flex: 1, padding: '8px 14px',
                background: `${color}0a`,
                border: `1px solid ${color}22`,
                borderRadius: 10,
                marginBottom: isLast ? 0 : 8,
                animation: 'fade-in-up 0.35s ease both',
                animationDelay: `${i * 60}ms`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{node.label}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                    padding: '2px 8px', borderRadius: 99,
                    background: `${color}20`, color, border: `1px solid ${color}40`,
                  }}>
                    {statusLabel[node.status] ?? 'UNKNOWN'}
                  </span>
                </div>
                {node.detail && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{node.detail}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
