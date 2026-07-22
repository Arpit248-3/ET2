import { useState } from 'react';
import { approveProcurementRoute } from '../../../services/api.js';

export default function Recommendations({ data }) {
  const recs = data?.recommendations ?? [];
  const alts = data?.alternatives    ?? [];
  const [checked, setChecked] = useState({});
  const [approvingId, setApprovingId] = useState(null);

  const handleRouteApproveInJarvis = async (item) => {
    setApprovingId(item.id);
    const payload = {
      route_id: 'cape_of_good_hope',
      route_name: 'Cape of Good Hope (West Africa / Atlantic Corridor)',
      supplier: 'West Africa (Nigeria / Bonny Light)',
      destination_port: 'Jamnagar / Vadinar Terminal',
      eta_days: 22,
      landed_cost: '$84.2/bbl',
      risk_score: 18,
      approved_by: 'Commander Arjun Mehta (JARVIS Copilot)'
    };
    try {
      await approveProcurementRoute(payload);
      setChecked(prev => ({ ...prev, [item.id]: true }));
    } catch (e) {
      console.warn('JARVIS route approval:', e);
      localStorage.setItem('urja_approved_route', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('urja-route-approved', { detail: payload }));
      setChecked(prev => ({ ...prev, [item.id]: true }));
    } finally {
      setApprovingId(null);
    }
  };

  const allItems = [
    ...recs.map((r, i) => ({ id: `rec-${i}`, text: typeof r === 'string' ? r : r?.action ?? JSON.stringify(r), priority: 'high',     type: 'Recommended Action' })),
    ...alts.map((a, i) => ({ id: `alt-${i}`, text: typeof a === 'string' ? a : a?.action ?? JSON.stringify(a), priority: 'moderate', type: 'Alternative'         })),
  ];

  const priorityColor = { high: '#ef4444', moderate: '#f59e0b', low: '#1d8cff' };
  const priorityBg    = { high: 'rgba(239,68,68,0.08)', moderate: 'rgba(245,158,11,0.08)', low: 'rgba(29,140,255,0.08)' };

  const toggleCheck = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  if (allItems.length === 0) {
    return (
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 30 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 18 }}>
          ✅ Recommendations
        </div>
        <div style={{ color: '#475569', fontSize: 14, fontStyle: 'italic' }}>No recommendations generated yet.</div>
      </div>
    );
  }

  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: 20,
      padding: 30,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 0% 100%, rgba(34,197,94,0.06) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>
          ✅ Recommended Actions
        </div>
        <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>
          {doneCount}/{allItems.length} initiated
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, marginBottom: 22, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, background: '#22c55e',
          width: `${allItems.length > 0 ? (doneCount / allItems.length) * 100 : 0}%`,
          transition: 'width 0.5s ease',
          boxShadow: '0 0 8px rgba(34,197,94,0.5)',
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {allItems.map(({ id, text, priority, type }, i) => {
          const color  = priorityColor[priority] ?? '#1d8cff';
          const bg     = priorityBg[priority]    ?? 'rgba(29,140,255,0.08)';
          const done   = !!checked[id];
          return (
            <div key={id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 18px',
              background: done ? 'rgba(34,197,94,0.06)' : bg,
              border: `1px solid ${done ? '#22c55e44' : color + '28'}`,
              borderRadius: 12,
              transition: 'all 0.25s ease',
              animation: 'fade-in-up 0.35s ease both',
              animationDelay: `${i * 70}ms`,
              opacity: done ? 0.7 : 1,
            }}>
              {/* Checkbox */}
              <button
                onClick={() => toggleCheck(id)}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  background: done ? '#22c55e' : 'transparent',
                  border: `1.5px solid ${done ? '#22c55e' : color}`,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: 'white',
                  transition: 'all 0.2s ease',
                }}
              >
                {done ? '✓' : ''}
              </button>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '2px 8px', borderRadius: 99,
                    background: `${color}20`, color, border: `1px solid ${color}40`,
                  }}>
                    {type}
                  </span>
                </div>
                <div style={{
                  fontSize: 13, color: done ? '#64748b' : '#e2e8f0', lineHeight: 1.6,
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {text}
                </div>

                {(text.toLowerCase().includes('route') || text.toLowerCase().includes('cape') || text.toLowerCase().includes('africa') || text.toLowerCase().includes('bypass') || text.toLowerCase().includes('supplier')) && (
                  <button
                    onClick={() => handleRouteApproveInJarvis({ id, text })}
                    disabled={approvingId === id || done}
                    style={{
                      marginTop: 8, padding: '4px 12px', borderRadius: 6,
                      background: done ? 'rgba(34,197,94,0.15)' : '#22c55e',
                      color: done ? '#22c55e' : '#000',
                      border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    {done ? '✓ Approved & Rerouted' : (approvingId === id ? 'Approving...' : '⚡ Approve Alternative Route via Cape of Good Hope')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
