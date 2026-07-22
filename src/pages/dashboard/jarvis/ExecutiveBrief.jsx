export default function ExecutiveBrief({ data }) {
  const brief = data?.executive_brief ?? '';

  if (!brief) return null;

  // Simple markdown-like renderer: bold **text**, bullets - text, empty lines
  const renderLine = (line, i) => {
    if (line === '') return <div key={i} style={{ height: 8 }} />;

    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <div key={i} style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 16, marginTop: i > 0 ? 14 : 0 }}>
          {line.slice(2, -2)}
        </div>
      );
    }

    if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <div key={i} style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: 14 }}>
          {parts.map((p, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ color: '#e2e8f0' }}>{p}</strong>
              : p
          )}
        </div>
      );
    }

    if (line.startsWith('- ')) {
      return (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#94a3b8', lineHeight: 1.7, fontSize: 14 }}>
          <span style={{ color: '#1d8cff', fontWeight: 700, marginTop: 2, flexShrink: 0 }}>›</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    }

    if (line.match(/^\d+\./)) {
      return (
        <div key={i} style={{ display: 'flex', gap: 10, color: '#94a3b8', lineHeight: 1.7, fontSize: 14 }}>
          <span style={{ color: '#1d8cff', fontWeight: 700, flexShrink: 0 }}>{line.split('.')[0]}.</span>
          <span>{line.slice(line.indexOf('.') + 1).trim()}</span>
        </div>
      );
    }

    return (
      <div key={i} style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: 14 }}>
        {line}
      </div>
    );
  };

  const lines = brief.split('\n');

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #0f172a 100%)',
      border: '1px solid rgba(29,140,255,0.25)',
      borderRadius: 20,
      padding: 36,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Gradient accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #1d8cff, #8b5cf6, #00e5ff)',
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Background orbs */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(29,140,255,0.06) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(29,140,255,0.25), rgba(139,92,246,0.25))',
          border: '1px solid rgba(29,140,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          📋
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            Executive Brief
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
            Classified — JARVIS AI • {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '5px 14px', borderRadius: 99,
            background: 'rgba(29,140,255,0.15)', color: '#60b4ff', border: '1px solid rgba(29,140,255,0.3)',
          }}>
            GENERATED
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lines.map((line, i) => renderLine(line, i))}
      </div>
    </div>
  );
}
