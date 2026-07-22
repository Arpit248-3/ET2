export default function Evidence({ data }) {
  const evidence = data?.evidence ?? [];

  const sourceIcons = { default: '🔍', satellite: '🛰️', ais: '🚢', ppac: '📋', reuters: '📰', iea: '⚡', scada: '🖥️' };

  const items = evidence.map((e, i) => {
    const text = typeof e === 'string' ? e : e?.text ?? e?.source ?? JSON.stringify(e);
    const key  = Object.keys(sourceIcons).find(k => text.toLowerCase().includes(k)) ?? 'default';
    return { id: i, text, icon: sourceIcons[key] };
  });

  if (items.length === 0) {
    return (
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 30 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 18 }}>
          🔍 Evidence Base
        </div>
        <div style={{ color: '#475569', fontSize: 14, fontStyle: 'italic' }}>No evidence data available.</div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid rgba(139,92,246,0.2)',
      borderRadius: 20,
      padding: 30,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 100% 100%, rgba(139,92,246,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 24 }}>
        🔍 Evidence Base — {items.length} source{items.length !== 1 ? 's' : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(({ id, text, icon }, i) => (
          <div key={id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '14px 18px',
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 12,
            animation: 'fade-in-up 0.4s ease both',
            animationDelay: `${i * 80}ms`,
          }}>
            {/* Index + icon */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {icon}
              </div>
              <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                #{String(id + 1).padStart(2, '0')}
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.7 }}>{text}</div>
            </div>

            {/* Verified badge */}
            <div style={{
              flexShrink: 0, padding: '4px 10px', borderRadius: 99,
              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)',
            }}>
              VERIFIED
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
