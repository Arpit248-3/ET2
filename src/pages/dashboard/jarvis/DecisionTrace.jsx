export default function DecisionTrace({ data }) {
  const trace = data?.decision_trace ?? [];

  const stepIcons  = ['🧩', '📡', '⚙️', '🧠', '📊', '✅', '🔒', '📤'];
  const stepColors = ['#1d8cff', '#00e5ff', '#8b5cf6', '#f59e0b', '#22c55e', '#1d8cff', '#8b5cf6', '#22c55e'];

  const steps = trace.map((step, i) => ({
    label: typeof step === 'string' ? step : step?.stage ?? step?.name ?? JSON.stringify(step),
    icon:  stepIcons[i  % stepIcons.length],
    color: stepColors[i % stepColors.length],
    index: i,
    done:  true,
  }));

  if (steps.length === 0) {
    return (
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 30 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 18 }}>
          🔗 AI Decision Trace
        </div>
        <div style={{ color: '#475569', fontSize: 14, fontStyle: 'italic' }}>No decision trace available.</div>
      </div>
    );
  }

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
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 55%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 26 }}>
        🔗 AI Decision Trace
      </div>

      {/* Horizontal stepper */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 0,
          minWidth: steps.length * 140,
        }}>
          {steps.map(({ label, icon, color, index }, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                {/* Step */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  minWidth: 120,
                  animation: 'fade-in-up 0.4s ease both',
                  animationDelay: `${i * 100}ms`,
                }}>
                  {/* Circle */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: `${color}20`,
                    border: `2px solid ${color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                    boxShadow: `0 0 16px ${color}40`,
                  }}>
                    {icon}
                  </div>

                  {/* Step number badge */}
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                    padding: '2px 8px', borderRadius: 99,
                    background: `${color}20`, color, border: `1px solid ${color}40`,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    STEP {i + 1}
                  </span>

                  {/* Label */}
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#cbd5e1',
                    textAlign: 'center', lineHeight: 1.4, maxWidth: 110, paddingBottom: 4,
                  }}>
                    {label}
                  </div>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div style={{
                    flex: 1, height: 2, marginTop: 23,
                    background: `linear-gradient(90deg, ${color}80, ${stepColors[(i + 1) % stepColors.length]}80)`,
                    position: 'relative',
                    minWidth: 20,
                  }}>
                    {/* Arrow */}
                    <div style={{
                      position: 'absolute', right: -1, top: '50%', transform: 'translateY(-50%)',
                      width: 0, height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderLeft: `8px solid ${stepColors[(i + 1) % stepColors.length]}80`,
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion bar */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse-glow 2s infinite' }} />
        <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>
          All {steps.length} reasoning steps completed successfully
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
