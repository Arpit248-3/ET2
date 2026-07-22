import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, Zap, Phone, Radio, Shield, Activity, X, CheckCircle, 
  Clock, ChevronRight, Loader, Upload, Power, Video, Send 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import { recordDecision, fetchCrisisStatus, activateCrisisMode, uploadCrisisManifest, addCollabMessage } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { usePipeline } from '../../context/PipelineContext.jsx';
import { useCall } from '../../context/CallContext.jsx';

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
  { name: 'MoP Secretary', role: 'Ministry of Petroleum', avatar: 'PS', online: true },
  { name: 'IOC Chairman', role: 'Indian Oil Corp Lead', avatar: 'RK', online: true },
  { name: 'PMO Office', role: 'Prime Minister Office Desk', avatar: 'PM', online: false },
  { name: 'HPCL Director', role: 'Refinery Operations', avatar: 'SN', online: true },
];

const statusColor = { PENDING: '#f59e0b', 'IN PROGRESS': '#1d8cff', DONE: '#22c55e' };

export default function CrisisMode() {
  const { systemState, backendOnline, activeScenario } = useScenario();
  const { refreshPipeline } = usePipeline();
  const { startCall } = useCall();
  const { addToast: showToast } = useToast();
  const navigate = useNavigate();

  const [tick, setTick] = useState(0);
  const [timer, setTimer] = useState({ h: 0, m: 0, s: 0 });
  const [activatedAt, setActivatedAt] = useState(null);
  const [actionsList, setActionsList] = useState([]);
  const [alertsList, setAlertsList] = useState(mockCrisisAlerts);
  const [submittingAction, setSubmittingAction] = useState(null);
  const [crisisActive, setCrisisActive] = useState(false);
  const [crisisActivating, setCrisisActivating] = useState(false);
  
  // Manifest Modal State
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [manifestFile, setManifestFile] = useState(null);
  const [manifestNotes, setManifestNotes] = useState('');
  const [manifestUploading, setManifestUploading] = useState(false);
  const [manifestResult, setManifestResult] = useState(null);
  const fileInputRef = useRef(null);

  // Quick Action Modal States
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState('WAR_ROOM');
  const [broadcastMsg, setBroadcastMsg] = useState('⚡ RED ALERT: National energy supply threshold breached. All sector leads initiate emergency drawdown protocol.');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const [showPmoModal, setShowPmoModal] = useState(false);
  const [pmoLevel, setPmoLevel] = useState('LEVEL-5');
  const [pmoNotes, setPmoNotes] = useState('Requesting Level 5 Executive Override for 3.2 MT Strategic Petroleum Reserve emergency release and naval escort for Hormuz tankers.');
  const [escalatingPmo, setEscalatingPmo] = useState(false);

  // Fetch crisis status on mount
  useEffect(() => {
    const loadCrisisStatus = async () => {
      try {
        const data = await fetchCrisisStatus();
        const isActive = data?.crisis_active || false;
        setCrisisActive(isActive);
        if (isActive && data?.activated_at) {
          setActivatedAt(new Date(data.activated_at).getTime());
        } else if (isActive) {
          setActivatedAt(Date.now());
        } else {
          setActivatedAt(null);
        }
      } catch (err) {
        console.warn('[Crisis] Status fetch failed:', err);
      }
    };
    loadCrisisStatus();
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      if (crisisActive) {
        const startTime = activatedAt || Date.now();
        const diffMs = Math.max(0, Date.now() - startTime);
        const totalSec = Math.floor(diffMs / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        setTimer({ h, m, s });
      } else {
        setTimer({ h: 0, m: 0, s: 0 });
      }
      setTick(t => t + 1);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [crisisActive, activatedAt]);

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
  const activeAlertsCount = systemState?.kpi?.active_incidents ?? alertsList.length;

  // Adapt alerts from backend incident feed, fall back to alertsList state
  const displayAlerts = systemState?.incident_feed && systemState.incident_feed.length > 0
    ? systemState.incident_feed.map(i => ({
        id: `CA-${String(i.id).padStart(3, '0')}`,
        title: i.title,
        type: i.type,
        severity: i.color === 'red' || i.type === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        impact: i.detail,
        time: i.time,
      }))
    : alertsList;

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

  const handleQuickActionClick = (actionLabel) => {
    if (actionLabel === 'Broadcast Alert to All Users') {
      setShowBroadcastModal(true);
    } else if (actionLabel === 'Open War Room Channel') {
      showToast('Redirecting to National Crisis War Room...', 'info');
      navigate('/collaboration-room');
    } else if (actionLabel === 'Escalate to PMO') {
      setShowPmoModal(true);
    }
  };

  const executeBroadcast = async () => {
    setSendingBroadcast(true);
    try {
      if (backendOnline) {
        await recordDecision({
          action_type: 'Broadcast Crisis Alert',
          approved_by: 'Commander Arjun Mehta',
          scenario_id: activeScenario?.id || 'baseline',
          details: { message: broadcastMsg, target: broadcastTarget }
        });

        await addCollabMessage('war-room', {
          sender: 'Commander Arjun Mehta',
          role: 'NEMC Crisis Commander',
          message: `🚨 BROADCAST ALERT (${broadcastTarget}): ${broadcastMsg}`,
          type: 'ALERT',
          avatar: '🚨'
        });
      }

      // Prepend to local alerts feed
      const newAlert = {
        id: `CA-${String(Date.now()).slice(-4)}`,
        title: broadcastMsg.slice(0, 45) + '...',
        type: 'BROADCAST',
        severity: 'CRITICAL',
        impact: `Broadcast sent to ${broadcastTarget}`,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
      setAlertsList(prev => [newAlert, ...prev]);

      showToast(`⚡ Emergency alert broadcast sent to ${broadcastTarget}!`, 'warning');
      setShowBroadcastModal(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to complete broadcast dispatch.', 'error');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const executePmoEscalation = async () => {
    setEscalatingPmo(true);
    try {
      if (backendOnline) {
        await recordDecision({
          action_type: `PMO Escalation (${pmoLevel})`,
          approved_by: 'Commander Arjun Mehta',
          scenario_id: activeScenario?.id || 'baseline',
          details: { pmo_level: pmoLevel, notes: pmoNotes }
        });

        await addCollabMessage('war-room', {
          sender: 'NEMC Command',
          role: 'Executive Escalation Desk',
          message: `🏛️ PMO ESCALATION DIRECTIVE (${pmoLevel}): ${pmoNotes}`,
          type: 'ALERT',
          avatar: '🏛️'
        });
      }

      showToast(`🏛️ Escalated to PMO Command — ${pmoLevel} directive recorded. Initiating video call...`, 'warning');
      setShowPmoModal(false);

      // Automatically launch PMO Video Call
      startCall({
        type: 'VIDEO',
        contact: { name: 'PMO Office', role: 'Prime Minister Office Desk', avatar: 'PM' },
        title: 'PMO Emergency Escalation Conference',
        roomId: 'war-room'
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to record PMO escalation.', 'error');
    } finally {
      setEscalatingPmo(false);
    }
  };

  const handleToggleCrisis = async () => {
    setCrisisActivating(true);
    try {
      const result = await activateCrisisMode(!crisisActive);
      const isNowActive = result?.crisis_active ?? !crisisActive;
      setCrisisActive(isNowActive);
      if (isNowActive) {
        const timestamp = result?.activated_at ? new Date(result.activated_at).getTime() : Date.now();
        setActivatedAt(timestamp);
      } else {
        setActivatedAt(null);
      }
      showToast(
        isNowActive
          ? '⚡ CRISIS MODE ACTIVATED — Dashboard risk engines recalculated.'
          : 'Crisis mode deactivated. Returning to standard operations.',
        isNowActive ? 'warning' : 'success'
      );
      await refreshPipeline();
    } catch (err) {
      showToast('Failed to toggle crisis mode on backend.', 'error');
    } finally {
      setCrisisActivating(false);
    }
  };

  const handleManifestUpload = async () => {
    if (!manifestFile) { showToast('Please select a CSV or JSON manifest file.', 'warning'); return; }
    setManifestUploading(true);
    try {
      const result = await uploadCrisisManifest(manifestFile, manifestNotes);
      setManifestResult(result);
      showToast(`Manifest processed: ${result.records_processed} entries integrated.`, 'success');
      await refreshPipeline();
    } catch (err) {
      showToast('Failed to process emergency manifest.', 'error');
    } finally {
      setManifestUploading(false);
    }
  };

  const pendingCount = actionsList.filter(a => a.status !== 'DONE').length;

  return (
    <DashboardLayout crisisMode={crisisActive}>
      {/* Crisis Banner */}
      <div style={{ background: crisisActive ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.07)', border: `1px solid ${crisisActive ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.2)'}`, borderRadius: 12, padding: '14px 20px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.4s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {crisisActive && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse-glow 1s infinite', flexShrink: 0 }} />}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: crisisActive ? '#ef4444' : '#f59e0b', letterSpacing: '0.06em' }}>
              {crisisActive ? '⚡ CRISIS MODE ACTIVE — NATIONAL ENERGY EMERGENCY' : '⚠ ELEVATED MONITORING — STANDBY RESPONSE MODE'}
            </div>
            <div style={{ fontSize: 11, color: crisisActive ? 'rgba(239,68,68,0.7)' : 'rgba(245,158,11,0.6)', marginTop: 2 }}>
              {crisisActive ? 'All systems in emergency response protocol · Master risk engine recalculated' : 'Monitoring baseline operations · Crisis mode available'} · {backendOnline ? 'BACKEND ONLINE' : 'OFFLINE FALLBACK'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          {crisisActive && (
            <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{pad(timer.h)}:{pad(timer.m)}:{pad(timer.s)}</div>
              <div style={{ fontSize: 9, color: 'rgba(239,68,68,0.6)', letterSpacing: '0.08em' }}>CRISIS DURATION</div>
            </div>
          )}
          <button onClick={() => setShowManifestModal(true)}
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#a78bfa', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={13} />Upload Manifest
          </button>
          <button onClick={handleToggleCrisis} disabled={crisisActivating}
            style={{ background: crisisActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${crisisActive ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: crisisActive ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
            {crisisActivating ? <Loader size={13} className="animate-spin" /> : <Power size={13} />}
            {crisisActive ? 'Deactivate' : 'Activate Crisis Mode'}
          </button>
        </div>
      </div>

      {/* Manifest Upload Modal */}
      {showManifestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GlassCard className="card" style={{ width: 480, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={16} color="#a78bfa" />Upload Emergency Logistics Manifest
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => { setShowManifestModal(false); setManifestResult(null); setManifestFile(null); }}><X size={16} /></button>
            </div>
            {manifestResult ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={36} color="#22c55e" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>Manifest Integrated Successfully</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>{manifestResult.records_processed} records processed</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>Total volume: {manifestResult.total_volume_mbbl} MBBL</div>
                <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => { setManifestResult(null); setManifestFile(null); }}>Upload Another</button>
              </div>
            ) : (
              <>
                <div style={{ border: '2px dashed rgba(139,92,246,0.3)', borderRadius: 10, padding: '24px', textAlign: 'center', marginBottom: 14, cursor: 'pointer', background: 'rgba(139,92,246,0.04)' }}
                  onClick={() => fileInputRef.current?.click()}>
                  <Upload size={24} color="#a78bfa" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{manifestFile ? manifestFile.name : 'Click to select CSV or JSON manifest'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Supports .csv, .json emergency logistics files</div>
                  <input ref={fileInputRef} type="file" accept=".csv,.json" style={{ display: 'none' }} onChange={e => setManifestFile(e.target.files[0])} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Operational Notes (optional)</label>
                  <textarea value={manifestNotes} onChange={e => setManifestNotes(e.target.value)} rows={2} placeholder="Emergency supply chain override rationale..."
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={handleManifestUpload} disabled={!manifestFile || manifestUploading}>
                  {manifestUploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
                  {manifestUploading ? 'Processing Manifest...' : 'Integrate Emergency Manifest'}
                </button>
              </>
            )}
          </GlassCard>
        </div>
      )}

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GlassCard className="card" style={{ width: 500, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio size={16} color="#ef4444" /> Broadcast Crisis Alert to All Stations
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowBroadcastModal(false)}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Target Channel / Audience</label>
              <select value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}>
                <option value="WAR_ROOM">National Crisis War Room (High Priority)</option>
                <option value="ALL">All Dashboard Users & Executive Terminals</option>
                <option value="REFINERIES">Refinery & Port Operators Tactical Feed</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Emergency Broadcast Message</label>
              <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => setShowBroadcastModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={sendingBroadcast} onClick={executeBroadcast}>
                {sendingBroadcast ? <Loader size={13} className="animate-spin" /> : <Radio size={13} />}
                {sendingBroadcast ? 'Broadcasting...' : 'Send Emergency Broadcast'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* PMO Escalation Modal */}
      {showPmoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GlassCard className="card" style={{ width: 520, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} color="#f59e0b" /> Prime Minister's Office (PMO) Escalation
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowPmoModal(false)}><X size={16} /></button>
            </div>

            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 11, color: '#f59e0b', lineHeight: 1.5 }}>
              <strong>Level 5 National Security Escalation:</strong> Issues executive brief directly to Cabinet Committee on Security & PMO Office. Initiates direct encrypted video conference with PMO Desk.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Escalation Level</label>
              <select value={pmoLevel} onChange={e => setPmoLevel(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}>
                <option value="LEVEL-5">Level 5: Executive Command (Eyes Only PMO & Cabinet)</option>
                <option value="LEVEL-4">Level 4: Ministry Level Joint Action Group</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Executive Rationale & Action Plan</label>
              <textarea value={pmoNotes} onChange={e => setPmoNotes(e.target.value)} rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => setShowPmoModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={escalatingPmo} onClick={executePmoEscalation}>
                {escalatingPmo ? <Loader size={13} className="animate-spin" /> : <Video size={13} />}
                {escalatingPmo ? 'Escalating...' : 'Escalate & Start PMO Video Call'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

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

        {/* Emergency Contacts & Quick Actions */}
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
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => startCall({ type: 'AUDIO', contact: c, roomId: 'war-room' })}
                  style={{ background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.25)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#1d8cff', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
                  title={`Voice Call ${c.name}`}
                >
                  <Phone size={10} /> Call
                </button>
                <button 
                  onClick={() => startCall({ type: 'VIDEO', contact: c, roomId: 'war-room' })}
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#a78bfa', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
                  title={`Video Call ${c.name}`}
                >
                  <Video size={10} /> Video
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 14 }}>
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
                  onClick={() => handleQuickActionClick(action.label)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: `${action.color}10`, border: `1px solid ${action.color}30`, borderRadius: 8, padding: '9px 12px', cursor: 'pointer', color: action.color, fontSize: 11, fontWeight: 600, marginBottom: 6, textAlign: 'left', transition: 'all 0.15s' }}
                  className="hover-glow"
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
