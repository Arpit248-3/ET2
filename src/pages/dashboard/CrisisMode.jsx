import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, Phone, Radio, Shield, Activity, X, CheckCircle, Clock, ChevronRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import { recordDecision } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';

const mockCrisisAlerts = [
  { id: 'CA-001', title: 'Hormuz Strait – Naval Exercise Active', type: 'GEOPOLITICAL', severity: 'CRITICAL', impact: 'Supply disruption imminent', time: '09:12' },
  { id: 'CA-002', title: 'Jamnagar Refinery – Unit 3 Shutdown', type: 'OPERATIONAL', severity: 'HIGH', impact: '80 kBPD capacity loss', time: '08:45' },
  { id: 'CA-003', title: 'INR/USD at 84.5 – Import Cost Alert', type: 'FINANCIAL', severity: 'HIGH', impact: '+₹2,600 Cr/month', time: '07:30' },
];

const mockResponseActions = [
  { id: 'ACT-001', title: 'Activate SPR Emergency Release (3.2 MT)', status: 'PENDING', priority: 'P1', owner: 'Cabinet' },
  { id: 'ACT-002', title: 'Reroute 4 VLCCs – Persian Gulf to Nigeria', status: 'IN PROGRESS', priority: 'P1', owner: 'IOC' },
  { id: 'ACT-003', title: 'Alert Coastal Refineries – Reduced Throughput', status: 'DONE', priority: 'P2', owner: 'HPCL/BPCL' },
  { id: 'ACT-004', title: 'Emergency NEMC Plenary Session', status: 'DONE', priority: 'P2', owner: 'NEMC' },
  { id: 'ACT-005', title: 'Negotiate Saudi Aramco Backup Clause', status: 'PENDING', priority: 'P1', owner: 'MoP' },
];

const contacts = [
  { name: 'MoP Secretary', avatar: 'PS', online: true },
  { name: 'IOC Chairman', avatar: 'RK', online: true },
  { name: 'PMO Office', avatar: 'PM', online: false },
  { name: 'HPCL Director', avatar: 'SN', online: true },
];

const statusColor = { PENDING: '#f59e0b', 'IN PROGRESS': '#1d8cff', DONE: '#22c55e' };

export default function CrisisMode() {
  const { systemState, backendOnline, activeScenario } = useScenario();
  const [tick, setTick] = useState(0);
  const [timer, setTimer] = useState({ h: 0, m: 47, s: 22 });
  const [actionsList, setActionsList] = useState([]);
  const [submittingAction, setSubmittingAction] = useState(null);
  const navigate = useNavigate();
  const { addToast: showToast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        let { h, m, s } = prev;
        s++; if (s >= 60) { s = 0; m++; } if (m >= 60) { m = 0; h++; }
        return { h, m, s };
      });
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync actionsList when systemState risk signals change
  useEffect(() => {
    if (systemState?.risk_signals && systemState.risk_signals.length > 0) {
      const liveActions = systemState.risk_signals.map((sig, idx) => {
        let title = '';
        if (sig.category === 'Shipping') {
          title = `Optimize Maritime Corridor: Reroute or secure transit for ${sig.signal.split('—')[0] || sig.signal}`;
        } else if (sig.category === 'OPEC') {
          title = `Initiate OPEC Contingency Protocol: Negotiate backup volume`;
        } else if (sig.category === 'Sanctions') {
          title = `Audit Compliance: Sanction exposure check for ${sig.signal.split('—')[0] || sig.signal}`;
        } else if (sig.category === 'Weather') {
          title = `Activate Weather Mitigation Plans for vulnerable supply lines`;
        } else {
          title = `Mitigate Risk: ${sig.signal}`;
        }

        return {
          id: `ACT-${String(idx + 1).padStart(3, '0')}`,
          title: title,
          status: idx % 3 === 0 ? 'IN PROGRESS' : idx % 3 === 1 ? 'PENDING' : 'DONE',
          priority: sig.score > 75 ? 'P1' : sig.score > 55 ? 'P2' : 'P3',
          owner: sig.source
        };
      });
      setActionsList(liveActions);
    } else {
      setActionsList(mockResponseActions);
    }
  }, [systemState]);

  const pad = n => String(n).padStart(2, '0');

  // Derive dynamic state parameters based on active scenario and current backend state
  const riskIndex = systemState?.kpi?.risk_score ?? 82;
  const supplyCover = systemState?.kpi?.spr_coverage ?? 26;
  const crudePrice = systemState?.brent_price ?? 101;
  const activeAlertsCount = systemState?.kpi?.active_incidents ?? 3;

  // Adapt alerts from backend incident feed, fall back to mock
  const displayAlerts = systemState?.incident_feed && systemState.incident_feed.length > 0
    ? systemState.incident_feed.map(i => ({
        id: `CA-${String(i.id).padStart(3, '0')}`,
        title: i.title,
        type: i.type,
        severity: i.color === 'red' || i.type === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        impact: i.detail,
        time: i.time,
      }))
    : mockCrisisAlerts;

  const handleActionClick = async (action) => {
    if (action.status === 'DONE') return;
    setSubmittingAction(action.id);
    
    // Toggle state: PENDING -> IN PROGRESS -> DONE
    const nextStatus = action.status === 'PENDING' ? 'IN PROGRESS' : 'DONE';
    
    try {
      if (backendOnline) {
        await recordDecision({
          action_type: action.title,
          approved_by: 'Commander Arjun Mehta',
          scenario_id: activeScenario?.id || 'baseline',
          details: {
            action_id: action.id,
            previous_status: action.status,
            new_status: nextStatus,
          }
        });
      }
      
      setActionsList(prev => prev.map(a => a.id === action.id ? { ...a, status: nextStatus } : a));
      showToast(`Action updated: ${action.title} is now ${nextStatus}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to record action updates on the backend.', 'error');
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleQuickAction = async (label, color) => {
    try {
      if (backendOnline) {
        await recordDecision({
          action_type: label,
          approved_by: 'Commander Arjun Mehta',
          scenario_id: activeScenario?.id || 'baseline',
          details: { category: 'Quick Crisis Action' }
        });
      }
      showToast(`Crisis command issued: ${label}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to issue crisis command to the backend.', 'error');
    }
  };

  const pendingCount = actionsList.filter(a => a.status !== 'DONE').length;

  return (
    <DashboardLayout crisisMode>
      {/* Crisis Banner */}
      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 20px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse-glow 1s infinite', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', letterSpacing: '0.06em' }}>⚠ CRISIS MODE ACTIVE — NATIONAL ENERGY EMERGENCY</div>
            <div style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', marginTop: 2 }}>
              All systems in emergency response protocol · Authorized: Commander Arjun Mehta {backendOnline ? '· (BACKEND ONLINE)' : '· (OFFLINE FALLBACK)'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{pad(timer.h)}:{pad(timer.m)}:{pad(timer.s)}</div>
            <div style={{ fontSize: 9, color: 'rgba(239,68,68,0.6)', letterSpacing: '0.08em' }}>CRISIS DURATION</div>
          </div>
          <button onClick={() => navigate('/command-center')} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#ef4444', fontSize: 12, fontWeight: 700, transition: 'all 0.2s' }}>
            Deactivate Crisis Mode
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14 }}>
        {/* KPIs */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'Risk Index', value: String(riskIndex), unit: '/100', color: '#ef4444', blink: riskIndex > 70 },
            { label: 'Supply Cover', value: String(supplyCover), unit: ' days', color: supplyCover < 30 ? '#ef4444' : '#f59e0b' },
            { label: 'Crude Price', value: `$${crudePrice}`, unit: '/bbl', color: '#ef4444' },
            { label: 'Active Alerts', value: String(activeAlertsCount), unit: ' critical', color: '#ef4444', blink: activeAlertsCount > 0 },
            { label: 'Actions Pending', value: String(pendingCount), unit: ` of ${actionsList.length}`, color: pendingCount > 0 ? '#f59e0b' : '#22c55e' },
          ].map(kpi => (
            <GlassCard key={kpi.label} className="card" style={{ padding: '14px 18px', borderColor: `${kpi.color}30`, background: `${kpi.color}06` }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 700 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color, animation: kpi.blink && tick % 2 === 0 ? 'none' : undefined }}>
                {kpi.value}<span style={{ fontSize: 12, fontWeight: 400 }}>{kpi.unit}</span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Active Alerts */}
        <GlassCard className="card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} color="#ef4444" />Active Crisis Alerts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '350px', overflowY: 'auto' }}>
            {displayAlerts.map(alert => (
              <div key={alert.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#ef4444' }}>{alert.id}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}><Clock size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />{alert.time}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{alert.title}</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                  <span style={{ color: '#ef4444', padding: '1px 6px', background: 'rgba(239,68,68,0.1)', borderRadius: 4 }}>{alert.severity}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{alert.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Response Actions */}
        <GlassCard className="card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color="#f59e0b" />Emergency Response Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actionsList.map(action => (
              <div key={action.id} 
                onClick={() => handleActionClick(action)}
                style={{ 
                  display: 'flex', 
                  gap: 10, 
                  padding: '10px 12px', 
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: action.status === 'DONE' ? 'default' : 'pointer',
                  alignItems: 'flex-start',
                  transition: 'all 0.15s ease',
                  opacity: action.status === 'DONE' ? 0.7 : 1,
                  userSelect: 'none'
                }}
                className={action.status !== 'DONE' ? 'hover-glow' : ''}
              >
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#ef4444', flexShrink: 0, marginTop: 1 }}>
                  {action.priority}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: action.status === 'DONE' ? 'var(--text-dim)' : 'var(--text-primary)', marginBottom: 3, lineHeight: 1.4, textDecoration: action.status === 'DONE' ? 'line-through' : 'none' }}>
                    {action.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-dim)' }}>
                    <span>{action.owner}</span>
                    <span style={{ fontWeight: 700, color: statusColor[action.status] }}>
                      {submittingAction === action.id ? (
                        <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : action.status}
                    </span>
                  </div>
                </div>
                {action.status !== 'DONE' && (
                  <ChevronRight size={14} style={{ color: 'var(--text-dim)', alignSelf: 'center' }} />
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Emergency Contacts */}
        <GlassCard className="card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={14} color="#1d8cff" />Emergency Contacts
          </div>
          {contacts.map(c => (
            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{c.avatar}</div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderRadius: '50%', background: c.online ? '#22c55e' : '#666', border: '1.5px solid var(--bg-panel)' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
              </div>
              <button 
                onClick={() => showToast(`Dialing ${c.name} via encrypted secure line...`, 'info')}
                style={{ background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#1d8cff', fontSize: 10 }}
              >
                Call
              </button>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quick Actions</div>
            {[
              { label: 'Broadcast Alert to All Users', icon: Radio, color: '#ef4444' },
              { label: 'Open War Room Channel', icon: Shield, color: '#8b5cf6' },
              { label: 'Escalate to PMO', icon: Zap, color: '#f59e0b' },
            ].map(action => {
              const Icon = action.icon;
              return (
                <button 
                  key={action.label} 
                  onClick={() => handleQuickAction(action.label, action.color)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: `${action.color}10`, border: `1px solid ${action.color}30`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: action.color, fontSize: 11, fontWeight: 600, marginBottom: 6, textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <Icon size={12} />{action.label}
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
