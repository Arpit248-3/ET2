import React, { useState, useEffect } from 'react';
import { Bell, Save, RotateCcw, Download, ToggleLeft, ToggleRight, Activity, AlertTriangle, CheckCircle, MessageSquare, Mail, Phone, Globe, Link, Radio, Loader, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import MetricCard from '../../components/ui/MetricCard.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import useApi from '../../hooks/useApi.js';
import { fetchThresholds, updateThresholds } from '../../services/api.js';

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      {value ? <ToggleRight size={28} color="#22c55e" /> : <ToggleLeft size={28} color="var(--text-dim)" />}
    </button>
  );
}

function Slider({ value, onChange, min = 0, max = 100, color = '#1d8cff' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: color, height: 4, cursor: 'pointer' }} />
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

const alertRules = [
  { name: 'Hormuz Closure Risk', trigger: 'Geopolitical score > 80', severity: 'CRITICAL', module: 'Risk Intelligence', channel: 'All', escalation: 'Level 4', status: 'ACTIVE' },
  { name: 'Crude Price Spike', trigger: 'Brent > +15% in 72h', severity: 'CRITICAL', module: 'Economic Impact', channel: 'Email, SMS', escalation: 'Level 3', status: 'ACTIVE' },
  { name: 'Supplier Sanction Match', trigger: 'Sanctions DB hit', severity: 'HIGH', module: 'Compliance Shield', channel: 'Dashboard', escalation: 'Level 2', status: 'ACTIVE' },
  { name: 'Port Congestion Detected', trigger: 'Delay > 72h', severity: 'WARNING', module: 'Supply Chain', channel: 'Email', escalation: 'Level 1', status: 'ACTIVE' },
  { name: 'Refinery Feedstock Mismatch', trigger: 'API gravity mismatch', severity: 'WARNING', module: 'Refinery Compat.', channel: 'Dashboard', escalation: 'Level 1', status: 'ACTIVE' },
  { name: 'SPR Coverage Below Limit', trigger: 'SPR < 7 days', severity: 'CRITICAL', module: 'SPR Planner', channel: 'All', escalation: 'Level 5', status: 'ACTIVE' },
  { name: 'Insurance Premium Surge', trigger: 'Premium > +25%', severity: 'HIGH', module: 'Procurement', channel: 'Email', escalation: 'Level 2', status: 'ACTIVE' },
  { name: 'Maritime Delay > 72h', trigger: 'Vessel ETA deviation', severity: 'WARNING', module: 'Supply Chain', channel: 'SMS', escalation: 'Level 1', status: 'PENDING' },
];

const escalationLevels = [
  { level: 1, name: 'Analyst Alert', trigger: 'Score 40-59', role: 'Data Analyst', delay: 'Immediate', action: 'Monitor & Log' },
  { level: 2, name: 'Ministry Desk', trigger: 'Score 60-69', role: 'Ministry Officer', delay: '15 minutes', action: 'Assess & Report' },
  { level: 3, name: 'Secretary Review', trigger: 'Score 70-79', role: 'Joint Secretary', delay: '30 minutes', action: 'Brief & Recommend' },
  { level: 4, name: 'Cabinet Decision', trigger: 'Score 80-89', role: 'Cabinet Secretary', delay: '1 hour', action: 'Authorize Response' },
  { level: 5, name: 'Crisis Mode Activation', trigger: 'Score 90+', role: 'PMO', delay: 'Immediate', action: 'Declare Crisis' },
];

const hourlyAlerts = [
  { hour: '06:00', critical: 2, warning: 5 }, { hour: '07:00', critical: 1, warning: 8 },
  { hour: '08:00', critical: 4, warning: 12 }, { hour: '09:00', critical: 6, warning: 15 },
  { hour: '10:00', critical: 8, warning: 18 }, { hour: '11:00', critical: 5, warning: 14 },
  { hour: '12:00', critical: 3, warning: 10 }, { hour: '13:00', critical: 7, warning: 16 },
];

const alertHistory = [
  { time: '10:15', alert: 'Hormuz Shipping Delay Detected', severity: 'CRITICAL', source: 'Maritime Feed', assigned: 'Analyst Team A', status: 'ACTIVE' },
  { time: '09:47', alert: 'Brent Crude +8.2% in 24h', severity: 'HIGH', source: 'Market API', assigned: 'Economic Desk', status: 'ACTIVE' },
  { time: '09:12', alert: 'Supplier Sanction Flag: IranOil', severity: 'CRITICAL', source: 'OFAC DB', assigned: 'Compliance Team', status: 'MONITOR' },
  { time: '08:55', alert: 'Port Congestion: JNPT +48h', severity: 'WARNING', source: 'Port Data', assigned: 'Supply Chain', status: 'PENDING' },
  { time: '08:22', alert: 'SPR Coverage at 9.2 Days', severity: 'WARNING', source: 'SPR Monitor', assigned: 'SPR Team', status: 'ACTIVE' },
];

const channels = [
  { key: 'email', label: 'Email', icon: Mail, color: '#1d8cff' },
  { key: 'sms', label: 'SMS', icon: Phone, color: '#22c55e' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: '#25d366' },
  { key: 'dashboard', label: 'Secure Dashboard', icon: Globe, color: '#8b5cf6' },
  { key: 'gateway', label: 'Govt Alert Gateway', icon: Bell, color: '#ef4444' },
  { key: 'slack', label: 'Slack / Teams', icon: Radio, color: '#f59e0b' },
  { key: 'webhook', label: 'API Webhook', icon: Link, color: '#00e5ff' },
];

const defaultThresholds = { geoPolitical: 80, maritime: 78, crudePct: 15, insurance: 25, supplyGap: 9, sprDays: 7 };

export default function ThresholdsAlerts() {
  const { addToast } = useToast();
  const { backendOnline } = useScenario();
  
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [channelStates, setChannelStates] = useState({ email: true, sms: true, whatsapp: false, dashboard: true, gateway: true, slack: false, webhook: false });
  const [sensitivity, setSensitivity] = useState('High');
  const [quietHours, setQuietHours] = useState(false);
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [emergencyOverride, setEmergencyOverride] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch thresholds from live backend
  const { data: rawData, loading: loadingThresholds, error: fetchError, refetch } = useApi(fetchThresholds, {
    fallback: null,
  });

  const mapBackendToLocal = (b) => {
    if (!b?.thresholds) return defaultThresholds;
    const t = b.thresholds;
    return {
      geoPolitical: t.risk?.critical_threshold ?? 80,
      maritime: t.procurement?.max_route_risk_score ?? 78,
      crudePct: Math.round(t.economic?.fuel_price_alert_inr ?? 15),
      insurance: t.procurement?.max_single_supplier_pct ?? 25,
      supplyGap: t.spr?.target_coverage_days ?? 9,
      sprDays: t.spr?.minimum_coverage_days ?? 7,
    };
  };

  useEffect(() => {
    if (rawData) {
      setThresholds(mapBackendToLocal(rawData));
    }
  }, [rawData]);

  const mapLocalToBackend = (l) => {
    return {
      risk: {
        critical_threshold: l.geoPolitical,
      },
      procurement: {
        max_route_risk_score: l.maritime,
        max_single_supplier_pct: l.insurance,
      },
      economic: {
        fuel_price_alert_inr: l.crudePct,
      },
      spr: {
        target_coverage_days: l.supplyGap,
        minimum_coverage_days: l.sprDays,
      }
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (backendOnline) {
        await updateThresholds({
          thresholds: mapLocalToBackend(thresholds),
          updated_by: 'Commander Arjun Mehta',
        });
        addToast('Alert thresholds updated successfully on the backend.', 'success');
        refetch();
      } else {
        addToast('Backend offline — policy saved locally in window state.', 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to update alert policy on the server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setThresholds(defaultThresholds);
    addToast('Thresholds reset to defaults.', 'info');
  };

  const severityColor = s => s === 'CRITICAL' ? '#ef4444' : s === 'HIGH' ? '#f97171' : '#f59e0b';

  return (
    <DashboardLayout>
      <PageHeader
        title="Thresholds & Alerts"
        subtitle="Configure risk triggers, escalation rules, and notification channels for national energy resilience monitoring."
        badge={{ label: backendOnline ? 'POLICY SYNCED' : 'DEMO MODE', color: backendOnline ? '#22c55e' : '#f59e0b' }}
        actions={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => addToast('Policy exported as JSON', 'info')}><Download size={12} /> Export Policy</button>
            <button className="btn btn-secondary btn-sm" onClick={handleReset} disabled={saving}><RotateCcw size={12} /> Reset Defaults</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />} Save Changes
            </button>
          </>
        }
      />

      {/* Offline banner or loading spinner */}
      {!backendOnline ? (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <WifiOff size={14} />
          Backend Offline. Sliders running in isolated fallback mode.
        </div>
      ) : loadingThresholds ? (
        <div style={{ background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)', color: '#1d8cff', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Loading active threshold metrics from secure configuration...
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <MetricCard label="Active Alert Rules" value="28" color="blue" icon={Bell} />
        <MetricCard label="Critical Threshold" value="80+" color="red" icon={AlertTriangle} subtitle="Score triggers" />
        <MetricCard label="Alert Channels" value="6" color="green" icon={Globe} />
        <MetricCard label="Escalation Matrix" value="ACTIVE" color="amber" icon={CheckCircle} valueSm />
        <MetricCard label="Today's Alerts" value="143" color="purple" icon={Activity} delta={12} deltaLabel="vs yesterday" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        <GlassCard style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Risk Thresholds</div>
          {[
            { label: 'Geopolitical Risk Threshold', key: 'geoPolitical', max: 100, unit: '' },
            { label: 'Maritime Risk Threshold', key: 'maritime', max: 100, unit: '' },
            { label: 'Crude Price Spike Threshold (INR/bbl)', key: 'crudePct', max: 100, unit: ' INR' },
            { label: 'Insurance Premium Spike', key: 'insurance', max: 100, unit: '%' },
            { label: 'Supply Gap Threshold (days)', key: 'supplyGap', max: 50, unit: ' days' },
            { label: 'SPR Coverage Threshold (days)', key: 'sprDays', max: 50, unit: ' days' },
          ].map(t => (
            <div key={t.key} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{t.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Critical: <span style={{ color: '#ef4444', fontWeight: 700 }}>{thresholds[t.key]}{t.unit}</span></span>
              </div>
              <Slider value={thresholds[t.key]} onChange={v => setThresholds(prev => ({ ...prev, [t.key]: v }))} max={t.max} color={thresholds[t.key] >= t.max * 0.8 ? '#ef4444' : '#1d8cff'} />
            </div>
          ))}
        </GlassCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GlassCard style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Notification Channels</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {channels.map(ch => {
                const Icon = ch.icon;
                return (
                  <div key={ch.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${ch.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={14} style={{ color: ch.color }} />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{ch.label}</span>
                    </div>
                    <Toggle value={channelStates[ch.key]} onChange={v => setChannelStates(prev => ({ ...prev, [ch.key]: v }))} />
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Sensitivity & Overrides</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>Alert Sensitivity</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Low', 'Medium', 'High', 'Adaptive'].map(s => (
                  <button key={s} onClick={() => setSensitivity(s)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${sensitivity === s ? '#1d8cff' : 'var(--border-soft)'}`, background: sensitivity === s ? 'rgba(29,140,255,0.15)' : 'rgba(255,255,255,0.03)', color: sensitivity === s ? '#60b4ff' : 'var(--text-dim)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: sensitivity === s ? 700 : 500 }}>{s}</button>
                ))}
              </div>
            </div>
            {[{ label: 'Quiet Hours', value: quietHours, set: setQuietHours }, { label: 'Emergency Override', value: emergencyOverride, set: setEmergencyOverride }, { label: 'Auto-escalate Critical', value: autoEscalate, set: setAutoEscalate }].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{item.label}</span>
                <Toggle value={item.value} onChange={item.set} />
              </div>
            ))}
          </GlassCard>
        </div>
      </div>

      <GlassCard style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Alert Rules</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                {['Rule Name', 'Trigger', 'Severity', 'Module', 'Channel', 'Escalation', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alertRules.map((rule, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{rule.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 11 }}>{rule.trigger}</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ color: severityColor(rule.severity), fontWeight: 700, fontSize: 11 }}>{rule.severity}</span></td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-dim)', fontSize: 11 }}>{rule.module}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 11 }}>{rule.channel}</td>
                  <td style={{ padding: '10px 12px', color: '#60b4ff', fontSize: 11 }}>{rule.escalation}</td>
                  <td style={{ padding: '10px 12px' }}><StatusBadge status={rule.status} size="sm" /></td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => addToast(`Editing rule: ${rule.name}`, 'info')} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-soft)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>Edit</button>
                      <button onClick={() => addToast(`Rule duplicated: ${rule.name}`, 'success')} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-soft)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>Dupe</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        <GlassCard style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Alert Activity Today</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={hourlyAlerts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,130,255,0.07)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(8,18,35,0.97)', border: '1px solid rgba(29,140,255,0.3)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="critical" name="Critical" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="warning" name="Warning" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Escalation Matrix</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {escalationLevels.map(lvl => (
              <div key={lvl.level} style={{ display: 'flex', gap: 12, padding: '8px 12px', borderRadius: 8, background: lvl.level >= 4 ? 'rgba(239,68,68,0.05)' : lvl.level === 3 ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${lvl.level >= 4 ? 'rgba(239,68,68,0.15)' : lvl.level === 3 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)'}` }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: lvl.level >= 4 ? '#ef4444' : lvl.level === 3 ? '#f59e0b' : '#1d8cff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'white', flexShrink: 0 }}>{lvl.level}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{lvl.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{lvl.trigger} · {lvl.role} · {lvl.delay}</div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, alignSelf: 'center' }}>{lvl.action}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Alert History</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alertHistory.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#00e5ff', flexShrink: 0, width: 42 }}>{item.time}</span>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{item.alert}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: severityColor(item.severity), flexShrink: 0, width: 70 }}>{item.severity}</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0, width: 100 }}>{item.source}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, width: 120 }}>{item.assigned}</span>
              <StatusBadge status={item.status} size="sm" />
            </div>
          ))}
        </div>
      </GlassCard>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
