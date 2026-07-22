export default function ImmediateEffects({ data }) {
  const effects = data?.immediate_effects ?? [];

  const icons = ['⚡', '🛢️', '⛽', '🚢', '🏭', '🌐', '📊', '⚠️'];
  const colors = ['#ef4444', '#f59e0b', '#1d8cff', '#8b5cf6', '#22c55e', '#00e5ff', '#f59e0b', '#ef4444'];

  if (!effects || effects.length === 0) {
    return (
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 30,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 18 }}>
          ⚡ Immediate Effects
        </div>
        <div style={{ color: '#475569', fontSize: 14, fontStyle: 'italic' }}>
          No immediate effects data available.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 20,
      padding: 30,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 0% 0%, rgba(239,68,68,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 22 }}>
        ⚡ Immediate Effects
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {effects.map((effect, i) => {
          const color = colors[i % colors.length];
          const icon  = icons[i % icons.length];
          const text  = typeof effect === 'string' ? effect : effect?.description ?? JSON.stringify(effect);
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '14px 18px',
              background: `${color}0d`,
              border: `1px solid ${color}28`,
              borderRadius: 12,
              transition: 'all 0.2s ease',
              animation: 'fade-in-up 0.4s ease both',
              animationDelay: `${i * 80}ms`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${color}20`,
                border: `1px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>{text}</div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, animation: 'pulse-glow 2s infinite' }} />
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Active</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
