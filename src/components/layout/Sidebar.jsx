import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  LayoutDashboard, AlertTriangle, Sliders, TrendingUp, ShoppingCart,
  Factory, Database, Shield, Target, FileText, Bell, BookOpen,
  ClipboardList, Users, Settings, MessageSquare, HelpCircle, Clock,
  Users2, Layers, Brain, User, ChevronDown, ChevronRight, Activity,
  Globe, Command, LogOut, Home, ChevronsLeft, ChevronsRight, Zap, PlayCircle, ShieldCheck
} from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import useApi from '../../hooks/useApi.js';
import { fetchNotifications } from '../../services/api.js';

const navSections = [
  {
    label: 'Main',
    items: [
      { path: '/command-center', label: 'Command Center', icon: LayoutDashboard },
      { path: '/risk-intelligence', label: 'Risk Intelligence', icon: AlertTriangle },
      { path: '/supply-chain-twin', label: 'Supply Chain Twin', icon: Globe },
      { path: '/scenario-simulator', label: 'Scenarios', icon: Sliders },
      { path: '/economic-impact', label: 'Economic Impact', icon: TrendingUp },
    ]
  },
  {
    label: 'Operations',
    items: [
      { path: '/procurement-optimizer', label: 'Procurement', icon: ShoppingCart },
      { path: '/refinery-compatibility', label: 'Refinery Compat.', icon: Factory },
      { path: '/spr-planner', label: 'SPR Planner', icon: Database },
      { path: '/compliance-shield', label: 'Compliance Shield', icon: Shield },
      { path: '/red-team-validator', label: 'Red Team', icon: Target },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/action-brief', label: 'AI Action Brief', icon: FileText },
      { path: '/ai-copilot', label: 'AI Chat Copilot', icon: MessageSquare },
      { path: '/explainable-ai', label: 'Explainable AI', icon: Brain },
      { path: '/executive-decision-board', label: 'Executive Board', icon: Command },
    ]
  },
  {
    label: 'Management',
    items: [
      { path: '/admin', label: 'Admin Portal', icon: ShieldCheck },
      { path: '/notifications', label: 'Notifications', icon: Bell, badge: 3 },
      { path: '/reports', label: 'Reports Library', icon: BookOpen },
      { path: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
      { path: '/user-management', label: 'User Management', icon: Users },
      { path: '/settings/thresholds-alerts', label: 'Thresholds & Alerts', icon: AlertTriangle },
      { path: '/settings', label: 'Settings', icon: Settings },
    ]
  },
  {
    label: 'Tools',
    items: [
      { path: '/timeline-replay', label: 'Timeline Replay', icon: Clock },
      { path: '/collaboration-room', label: 'Collaboration', icon: Users2 },
      { path: '/data-sources', label: 'Data Sources', icon: Layers },
      { path: '/help', label: 'Help Center', icon: HelpCircle },
      { path: '/profile', label: 'My Profile', icon: User },
      { path: '/demo-mode', label: 'Demo Mode', icon: PlayCircle },
    ]
  },
];

export default function Sidebar({ crisisMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { pipelineState } = useScenario();
  const { data: notifData } = useApi(fetchNotifications, { fallback: null });
  const liveUnread = notifData?.unread_count ?? (notifData?.notifications ? notifData.notifications.filter(n => !n.read).length : null);
  const unreadNotifCount = liveUnread ?? (pipelineState?.notifications_unread_count ?? (
    pipelineState?.notifications ? pipelineState.notifications.filter(n => !n.read).length : 0
  ));
  const [collapsed, setCollapsed] = useState({});
  const [minimized, setMinimized] = useState(window.innerWidth <= 1024);
  const navRef = React.useRef(null);

  React.useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem('urja_sidebar_scroll');
    if (navRef.current && savedScroll !== null) {
      navRef.current.scrollTop = Number(savedScroll);
    }
  }, [location.pathname]);

  const handleScroll = (e) => {
    sessionStorage.setItem('urja_sidebar_scroll', e.target.scrollTop);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setMinimized(true);
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSection = (label) => {
    if (!minimized) setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const allItems = navSections.flatMap(s => s.items);

  return (
    <div
      className="sidebar"
      style={{
        width: minimized ? 64 : 'var(--sidebar-width)',
        minWidth: minimized ? 64 : 'var(--sidebar-width)',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        overflow: 'hidden',
        ...(crisisMode ? { borderRightColor: 'rgba(239,68,68,0.28)' } : {}),
      }}
    >
      {/* Logo / Header */}
      <div style={{
        padding: minimized ? '14px 0' : '14px 14px 10px',
        borderBottom: '1px solid var(--border-soft)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: minimized ? 'center' : 'space-between',
        gap: 8,
        overflow: 'hidden',
      }}>
        {!minimized && (
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <Logo size="md" />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="status-dot live" />
              <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 700, letterSpacing: '0.09em', whiteSpace: 'nowrap' }}>
                SYSTEM ONLINE
              </span>
            </div>
          </div>
        )}
        {minimized && (
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #0066cc, #00e5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0,229,255,0.35)',
            flexShrink: 0,
          }}>
            <Zap size={16} style={{ color: 'white' }} />
          </div>
        )}
        {/* Collapse toggle */}
        <button
          onClick={() => setMinimized(v => !v)}
          title={minimized ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-soft)',
            background: 'rgba(255,255,255,0.04)', color: 'var(--text-dim)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,140,255,0.12)'; e.currentTarget.style.color = '#60b4ff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
        >
          {minimized ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
        </button>
      </div>

      {/* Crisis Mode Banner */}
      {crisisMode && !minimized && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8, margin: '8px 8px 0', padding: '8px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="status-dot crit" />
            <span style={{ fontSize: 10.5, color: '#f87171', fontWeight: 700, letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
              CRISIS MODE ACTIVE
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div ref={navRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {minimized ? (
          /* ICON-ONLY MODE */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {allItems.map(item => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  title={item.label}
                  onClick={() => navigate(item.path)}
                  style={{
                    width: 44, height: 40, borderRadius: 9, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'rgba(29,140,255,0.18)' : 'transparent',
                    color: isActive ? '#00e5ff' : 'var(--text-dim)',
                    transition: 'all 0.15s', position: 'relative',
                    boxShadow: isActive ? 'inset 0 0 10px rgba(29,140,255,0.1)' : 'none',
                    marginBottom: 0,
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(29,140,255,0.08)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)'; } }}
                >
                  <Icon size={16} />
                  {item.badge && (
                    <span style={{
                      position: 'absolute', top: 5, right: 5,
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#ef4444', border: '1.5px solid var(--bg-sidebar)',
                    }} />
                  )}
                </button>
              );
            })}
            {/* Crisis icon */}
            <button
              title="Crisis Mode"
              onClick={() => navigate('/crisis-mode')}
              style={{
                width: 44, height: 40, borderRadius: 9, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: location.pathname === '/crisis-mode' ? 'rgba(239,68,68,0.15)' : 'transparent',
                color: '#f87171', transition: 'all 0.15s', marginTop: 4,
              }}
            >
              <Activity size={16} />
            </button>
          </div>
        ) : (
          /* FULL SIDEBAR MODE */
          <>
            {navSections.map(section => (
              <div key={section.label}>
                <button
                  onClick={() => toggleSection(section.label)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '10px 22px 3px',
                  }}
                >
                  <span className="sidebar-section-label" style={{ padding: 0, marginBottom: 0 }}>{section.label}</span>
                  {collapsed[section.label]
                    ? <ChevronRight size={10} style={{ color: 'var(--text-dim)' }} />
                    : <ChevronDown size={10} style={{ color: 'var(--text-dim)' }} />
                  }
                </button>

                {!collapsed[section.label] && section.items.map(item => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.path}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => navigate(item.path)}
                    >
                      <Icon size={14} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                      {(() => {
                        const badgeVal = item.path === '/notifications' ? (unreadNotifCount > 0 ? unreadNotifCount : null) : item.badge;
                        return badgeVal ? (
                          <span style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            borderRadius: 12,
                            padding: '2px 7px',
                            fontSize: 10,
                            fontWeight: 800,
                            lineHeight: 1.2,
                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.75)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 18,
                            height: 18,
                            marginLeft: 'auto'
                          }}>
                            {badgeVal}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Emergency */}
            <div style={{ margin: '6px 0' }}>
              <span className="sidebar-section-label">Emergency</span>
              <div
                className={`sidebar-nav-item ${location.pathname === '/crisis-mode' ? 'active' : ''}`}
                onClick={() => navigate('/crisis-mode')}
                style={{ color: '#f87171', background: location.pathname === '/crisis-mode' ? 'rgba(239,68,68,0.12)' : undefined }}
              >
                <Activity size={14} style={{ color: '#f87171' }} />
                <span style={{ flex: 1 }}>Crisis Mode</span>
                <div className="status-dot crit" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom panel */}
      <div style={{ borderTop: '1px solid var(--border-soft)', padding: minimized ? '8px 0' : '8px 10px 12px', flexShrink: 0 }}>
        {minimized ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button
              title="Home"
              onClick={() => navigate('/command-center')}
              style={{ width: 44, height: 36, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,140,255,0.1)'; e.currentTarget.style.color = '#60b4ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
            >
              <Home size={15} />
            </button>
            <button
              title="Command Center"
              onClick={() => navigate('/command-center')}
              style={{ width: 44, height: 36, borderRadius: 8, border: '1px solid rgba(0,229,255,0.2)', background: 'rgba(0,229,255,0.05)', color: '#00e5ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,229,255,0.05)'}
            >
              
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button
                onClick={() => navigate('/command-center')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', borderRadius: 8, border: '1px solid var(--border-soft)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,140,255,0.08)'; e.currentTarget.style.color = '#60b4ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
              >
                <Home size={13} /> Home
              </button>
              <button
                onClick={() => navigate('/command-center')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', borderRadius: 8, border: '1px solid rgba(0,229,255,0.2)', background: 'rgba(0,229,255,0.05)', color: '#00e5ff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,229,255,0.05)'}
              >
                <Command size={13} /> Command
              </button>
            </div>

            <div className="card" style={{ padding: '9px 12px', background: 'rgba(34,197,94,0.04)', borderColor: 'rgba(34,197,94,0.18)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 7, textTransform: 'uppercase' }}>System Status</div>
              {[
                { label: 'AI Engine', status: 'ONLINE', color: '#4ade80' },
                { label: 'Data Feeds', status: '14 / 14', color: '#4ade80' },
                { label: 'Risk Engine', status: 'ACTIVE', color: '#60b4ff' },
                { label: 'Threat Level', status: 'ELEVATED', color: '#fbbf24' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{item.label}</span>
                  <span style={{ fontSize: 10, color: item.color, fontWeight: 700 }}>{item.status}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
