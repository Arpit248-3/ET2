import { useState, useEffect } from 'react';

function useTypingEffect(text = '', speedMs = 18) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speedMs);
    return () => clearInterval(interval);
  }, [text, speedMs]);
  return displayed;
}

export default function ExecutiveSummary({ data }) {
  const fullText  = data?.executive_summary ?? '';
  const displayed = useTypingEffect(fullText, 14);
  const done      = displayed.length >= fullText.length;

  return (
    <div style={{
      background:    '#0f172a',
      border:        '1px solid rgba(29,140,255,0.2)',
      borderRadius:  20,
      padding:       30,
      color:         'white',
      position:      'relative',
      overflow:      'hidden',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #1d8cff 0%, #8b5cf6 50%, #00e5ff 100%)',
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 0% 0%, rgba(29,140,255,0.07) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: 'linear-gradient(135deg, rgba(29,140,255,0.25), rgba(139,92,246,0.25))',
            border: '1px solid rgba(29,140,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            🧠
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', color: '#f1f5f9' }}>
              Executive Summary
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              UrjaNetra AI — Situation Analysis
            </div>
          </div>
        </div>

        {/* LIVE badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
            animation: 'pulse-glow 2s infinite',
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 22 }} />

      {/* Typing text */}
      <div style={{
        fontSize:    17,
        lineHeight:  1.85,
        color:       '#d1d5db',
        fontWeight:  400,
        letterSpacing: '0.005em',
        minHeight:   60,
      }}>
        {displayed}
        {/* blinking cursor while typing */}
        {!done && (
          <span style={{
            display: 'inline-block', width: 2, height: '1.1em',
            background: '#1d8cff', marginLeft: 2, verticalAlign: 'text-bottom',
            animation: 'blink 0.9s step-end infinite',
          }} />
        )}
      </div>

      {/* "Analysis complete" footer when done */}
      {done && fullText && (
        <div style={{
          marginTop: 18, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fade-in-up 0.4s ease both',
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Analysis complete
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
        </div>
      )}
    </div>
  );
}