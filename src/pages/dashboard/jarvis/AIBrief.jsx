import { useState, useEffect } from 'react';
import ExecutiveSummary from './ExecutiveSummary';
import SeverityCard     from './SeverityCard';
import ImmediateEffects from './ImmediateEffects';
import EconomicImpact   from './EconomicImpact';
import SupplyChain      from './SupplyChain';
import Recommendations  from './Recommendations';
import Evidence         from './Evidence';
import DecisionTrace    from './DecisionTrace';
import ExecutiveBrief   from './ExecutiveBrief';

// Staggered reveal — each card appears after the previous
const REVEAL_DELAY_MS = 180;

function RevealCard({ index, children }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div style={{
      opacity:   visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.55s ease ${index * REVEAL_DELAY_MS}ms, transform 0.55s ease ${index * REVEAL_DELAY_MS}ms`,
    }}>
      {children}
    </div>
  );
}

export default function AIBrief({ brief, onBack, refreshing = false }) {
  // "Situation Room loading" sequence: progress line + classification flash
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar 0 → 100 over ~700ms, then show content
    let val = 0;
    const interval = setInterval(() => {
      val += 5;
      setProgress(val);
      if (val >= 100) {
        clearInterval(interval);
        setTimeout(() => setReady(true), 150);
      }
    }, 35);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    <ExecutiveSummary data={brief} />,
    <SeverityCard     data={brief} />,
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <ImmediateEffects data={brief} />
      <EconomicImpact   data={brief} />
    </div>,
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <SupplyChain      data={brief} />
      <Recommendations  data={brief} />
    </div>,
    <Evidence      data={brief} />,
    <DecisionTrace data={brief} />,
    <ExecutiveBrief data={brief} />,
  ];

  return (
    <div style={{
      maxWidth: 1500,
      margin:   '0 auto',
      padding:  '28px 24px 48px',
      display:  'flex',
      flexDirection: 'column',
      gap: 24,
    }}>

      {/* ── Header bar ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '14px 22px',
        background:     'rgba(8,18,35,0.88)',
        border:         '1px solid rgba(29,140,255,0.22)',
        borderRadius:   14,
        backdropFilter: 'blur(20px)',
        animation:      'fade-in-up 0.35s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* LIVE / Updating badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: refreshing ? '#f59e0b' : '#22c55e',
              animation: 'pulse-glow 2s infinite',
              transition: 'background 0.4s ease',
            }} />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              color: refreshing ? '#fbbf24' : '#4ade80',
              transition: 'color 0.4s ease',
            }}>
              {refreshing ? 'UPDATING…' : 'LIVE'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              AI Situation Room
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
              JARVIS Intelligence Brief · Generated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Severity badge */}
          {ready && brief?.severity != null && (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '5px 14px', borderRadius: 99,
              background: brief.severity >= 80 ? 'rgba(239,68,68,0.15)' : brief.severity >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.12)',
              color:      brief.severity >= 80 ? '#f87171'              : brief.severity >= 60 ? '#fbbf24'              : '#4ade80',
              border:     brief.severity >= 80 ? '1px solid rgba(239,68,68,0.3)' : brief.severity >= 60 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(34,197,94,0.25)',
              animation: 'fade-in-up 0.4s ease both',
            }}>
              Severity {brief.severity}/100
            </span>
          )}

          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px',
              borderRadius: 9,
              background: 'rgba(29,140,255,0.1)',
              border: '1px solid rgba(29,140,255,0.28)',
              color: '#60b4ff',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = 'rgba(29,140,255,0.2)';
              e.currentTarget.style.transform   = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'rgba(29,140,255,0.1)';
              e.currentTarget.style.transform   = 'none';
            }}
          >
            ← Back to Chat
          </button>
        </div>
      </div>

      {/* ── Loading sequence ── */}
      {!ready && (
        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(29,140,255,0.18)',
          borderRadius: 20,
          padding: '40px 36px',
          animation: 'fade-in-up 0.35s ease both',
        }}>
          {/* Classification flash */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#1d8cff', marginBottom: 28, textAlign: 'center',
          }}>
            ◆ CLASSIFIED — COMPILING INTELLIGENCE BRIEF ◆
          </div>

          {/* Stage labels */}
          {[
            'Collecting pipeline context…',
            'Running Risk Assessment Engine…',
            'Querying Economic Engine…',
            'Compiling Supply Chain status…',
            'Synthesizing executive brief…',
          ].map((label, i) => {
            const threshold = (i + 1) * 20;
            const done = progress >= threshold;
            const active = progress >= threshold - 20 && !done;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
                opacity: progress >= threshold - 20 ? 1 : 0.3,
                transition: 'opacity 0.3s ease',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  background: done ? '#22c55e' : active ? '#1d8cff' : 'rgba(255,255,255,0.1)',
                  border: `1.5px solid ${done ? '#22c55e' : active ? '#1d8cff' : 'rgba(255,255,255,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: 'white',
                  transition: 'all 0.3s ease',
                  animation: active ? 'pulse-glow 1s infinite' : 'none',
                }}>
                  {done ? '✓' : ''}
                </div>
                <span style={{ fontSize: 13, color: done ? '#4ade80' : active ? '#60b4ff' : '#64748b', transition: 'color 0.3s ease' }}>
                  {label}
                </span>
              </div>
            );
          })}

          {/* Progress bar */}
          <div style={{ marginTop: 24, width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #1d8cff, #8b5cf6, #00e5ff)',
              borderRadius: 99, width: `${progress}%`,
              transition: 'width 0.1s linear',
              boxShadow: '0 0 12px rgba(29,140,255,0.6)',
            }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: '#475569', textAlign: 'right' }}>
            {progress}% complete
          </div>
        </div>
      )}

      {/* ── Progressive card reveal ── */}
      {ready && cards.map((card, i) => (
        <RevealCard key={i} index={i}>
          {card}
        </RevealCard>
      ))}
    </div>
  );
}