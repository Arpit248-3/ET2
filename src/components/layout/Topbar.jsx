import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, HelpCircle, ChevronDown, AlertOctagon, X, Zap, LogOut } from 'lucide-react';
import ScenarioSwitcher from '../ui/ScenarioSwitcher.jsx';
import { useAuth } from '../../context/AuthContext.jsx';


export default function Topbar({ crisisMode = false }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Derive display values from AuthContext
  const sessionUser = {
    name: currentUser?.name || 'Operator',
    role: currentUser?.designation || currentUser?.role || 'NEMC Operator',
    avatar: currentUser?.avatar || (currentUser?.name?.slice(0, 2).toUpperCase()) || 'OP',
  };


  const [showAlert, setShowAlert] = useState(false);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div
        className="topbar"
        style={crisisMode
          ? { borderBottomColor: 'rgba(239,68,68,0.3)', background: 'rgba(16,4,4,0.98)' }
          : {}
        }
      >
        {/* Search */}
        <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
          <Search size={14} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-dim)',
          }} />
          <input
            className="input-field"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Ask UrjaNetra AI…"
            style={{ paddingLeft: 34, fontSize: 12.5, height: 36, borderRadius: 8 }}
            onKeyDown={e => {
              if (e.key === 'Enter' && searchVal.trim()) {
                navigate('/ai-copilot', { state: { initialQuery: searchVal.trim() } });
                setSearchVal('');
              }
            }}
          />
        </div>

        {/* Crisis mode banner */}
        {crisisMode && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: 8, padding: '5px 13px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', animation: 'pulse-glow 0.8s infinite' }} />
            <span style={{ fontSize: 11.5, color: '#f87171', fontWeight: 700, letterSpacing: '0.07em' }}>CRISIS MODE ACTIVE</span>
          </div>
        )}

        {/* Scenario Switcher */}
        <ScenarioSwitcher />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          {/* Critical Alert */}
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowAlert(true)}
            style={{ gap: 6, padding: '5px 13px' }}
          >
            <AlertOctagon size={12} />
            Critical Alert
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border-soft)', margin: '0 4px' }} />

          {/* Notifications */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => navigate('/notifications')}
            style={{ position: 'relative', padding: '7px' }}
          >
            <Bell size={16} />
            <span style={{
              position: 'absolute', top: 3, right: 3,
              width: 7, height: 7, borderRadius: '50%',
              background: '#f87171', border: '2px solid var(--bg-main)',
            }} />
          </button>

          {/* Help */}
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/help')} style={{ padding: '7px' }}>
            <HelpCircle size={16} />
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border-soft)', margin: '0 4px' }} />

          {/* User + dropdown */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost"
              onClick={() => setShowUserMenu(v => !v)}
              style={{ gap: 9, padding: '5px 9px', borderRadius: 8 }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d8cff, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
                boxShadow: '0 0 10px rgba(29,140,255,0.3)',
              }}>
                {sessionUser.avatar}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{sessionUser.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.2 }}>{sessionUser.role}</div>
              </div>
              <ChevronDown size={12} style={{ color: 'var(--text-dim)' }} />
            </button>

            {showUserMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 1000,
                background: 'rgba(6,15,32,0.98)', border: '1px solid rgba(90,130,255,0.22)',
                borderRadius: 10, padding: '6px', minWidth: 180,
                backdropFilter: 'blur(24px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                animation: 'fade-in-up 0.18s ease-out',
              }}>
                {[
                  { label: 'My Profile', icon: HelpCircle, action: () => { navigate('/profile'); setShowUserMenu(false); } },
                  { label: 'Settings', icon: HelpCircle, action: () => { navigate('/settings'); setShowUserMenu(false); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action} style={{
                    display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                    padding: '8px 10px', borderRadius: 7, border: 'none', background: 'none',
                    color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <item.icon size={13} style={{ color: 'var(--text-dim)' }} />
                    {item.label}
                  </button>
                ))}
                <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 0' }} />
                <button onClick={() => { logout(); }} style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                  padding: '8px 10px', borderRadius: 7, border: 'none', background: 'none',
                  color: '#f87171', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <LogOut size={13} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Critical Alert Modal */}
      {showAlert && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowAlert(false)}
        >
          <div
            className="card glow-red"
            style={{ maxWidth: 440, width: '90%', padding: '28px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertOctagon size={18} style={{ color: '#f87171' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#f87171' }}>Critical Alert</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>3 active threats detected</div>
                </div>
              </div>
              <button onClick={() => setShowAlert(false)} className="btn btn-ghost btn-icon">
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[
                { title: 'Hormuz Closure Risk — 87/100', time: '2 min ago', color: '#f87171', level: 'CRITICAL' },
                { title: 'OPEC Cut Announcement Imminent', time: '14 min ago', color: '#fbbf24', level: 'HIGH' },
                { title: 'Supply Gap: 2.4M bbl/day', time: '32 min ago', color: '#fbbf24', level: 'HIGH' },
              ].map((a, i) => (
                <div key={i} style={{
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.16)',
                  borderRadius: 9, padding: '11px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, color: a.color, fontWeight: 700 }}>{a.title}</span>
                    <span className="badge badge-red" style={{ fontSize: 9.5 }}>{a.level}</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>{a.time}</span>
                </div>
              ))}
            </div>

            <button
              className="btn btn-danger"
              style={{ width: '100%', gap: 8 }}
              onClick={() => { setShowAlert(false); navigate('/crisis-mode'); }}
            >
              <Zap size={14} />
              Activate Crisis Mode
            </button>
          </div>
        </div>
      )}
    </>
  );
}
