import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Command, CheckCircle, X, Clock, Users, FileText, AlertTriangle, 
  ThumbsUp, ThumbsDown, ChevronRight, Loader, Info, ShieldAlert, 
  Play, Check, HelpCircle, GitBranch, ArrowRight
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { recordDecision, fetchDecisions } from '../../services/api.js';
import { usePipeline } from '../../context/PipelineContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

const voteColor = { 
  FOR: '#22c55e', 
  AGAINST: '#ef4444', 
  ABSTAIN: '#f59e0b', 
  PENDING: '#94a3b8', 
  APPROVE: '#22c55e', 
  REJECT: '#ef4444', 
  SIMULATE: '#38bdf8' 
};

const fallbackMotion = {
  id: 'MOT-MONITOR',
  title: 'System Monitoring and Standard Operations Protocol',
  proposedBy: 'System Admin',
  status: 'APPROVED',
  urgency: 'LOW',
  votes: { for: 6, against: 0, abstain: 0 },
  quorum: 6,
  deadline: 'Passed',
  summary: 'No active threat scenarios. Continue monitoring crude price indices, pipeline health, and reserve levels.',
  aiRecommendation: 'MONITOR',
  aiConfidence: 99,
  members: [
    { name: 'Arjun Mehta', role: 'Commander', avatar: 'AM', vote: 'FOR' },
    { name: 'Dr. V. Sinha', role: 'Chief Advisor', avatar: 'VS', vote: 'FOR' },
    { name: 'Lt. Gen. Sandhu', role: 'Security Chief', avatar: 'RS', vote: 'FOR' },
    { name: 'M. K. Sharma', role: 'Finance Rep', avatar: 'MS', vote: 'FOR' },
    { name: 'Sunita Rao', role: 'Petroleum Rep', avatar: 'SR', vote: 'FOR' },
  ],
  redTeamCritique: 'Baseline simulation normal. No risk anomalies detected.',
  weakAssumptions: ['Assumes constant local production levels'],
  ignoredRisks: ['Secondary shipping lane congestions']
};

export default function ExecutiveDecisionBoard() {
  const navigate = useNavigate();
  const { pipelineState, offline, refreshPipeline } = usePipeline();
  const { addToast: showToast } = useToast();

  const [motions, setMotions] = useState([fallbackMotion]);
  const [selected, setSelected] = useState(fallbackMotion);
  const [loading, setLoading] = useState(false);
  const [votingLoader, setVotingLoader] = useState(false);
  const [boardError, setBoardError] = useState(null);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrgency, setNewUrgency] = useState('HIGH');
  const [newSummary, setNewSummary] = useState('');
  const [newRec, setNewRec] = useState('APPROVE');
  const [newConf, setNewConf] = useState(90);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Helper to map DB decision logs to sidebar motions shape
  const mapDecisionToMotion = (decision) => {
    let statusText = 'APPROVED';
    if (decision.action_type.startsWith('REJECT')) statusText = 'REJECTED';
    if (decision.action_type.startsWith('SIMULATE')) statusText = 'SIMULATION_REQUESTED';

    const details = decision.details || {};

    return {
      id: decision.decision_id || `MOT-${Math.floor(Math.random() * 1000)}`,
      title: details.title || decision.action_type,
      proposedBy: decision.approved_by || 'Secretariat',
      status: statusText,
      urgency: details.urgency || 'MEDIUM',
      votes: { 
        for: statusText === 'APPROVED' ? 5 : 1, 
        against: statusText === 'REJECTED' ? 4 : 1, 
        abstain: statusText === 'SIMULATION_REQUESTED' ? 3 : 1 
      },
      quorum: 6,
      deadline: 'Passed',
      summary: details.summary || `Executive action resolved on ${new Date(decision.timestamp || Date.now()).toLocaleString('en-IN')}. Action: ${decision.action_type}`,
      aiRecommendation: details.aiRecommendation || (statusText === 'APPROVED' ? 'APPROVE' : statusText === 'REJECTED' ? 'REJECT' : 'SIMULATE'),
      aiConfidence: details.aiConfidence || 88,
      members: [
        { name: 'Arjun Mehta', role: 'Commander', avatar: 'AM', vote: statusText === 'APPROVED' ? 'FOR' : statusText === 'REJECTED' ? 'AGAINST' : 'ABSTAIN' },
        { name: 'Dr. V. Sinha', role: 'Chief Advisor', avatar: 'VS', vote: 'FOR' },
        { name: 'Lt. Gen. Sandhu', role: 'Security Chief', avatar: 'RS', vote: statusText === 'APPROVED' ? 'FOR' : 'AGAINST' },
        { name: 'M. K. Sharma', role: 'Finance Rep', avatar: 'MS', vote: 'FOR' },
        { name: 'Sunita Rao', role: 'Petroleum Rep', avatar: 'SR', vote: 'FOR' },
      ],
      redTeamCritique: details.redTeamCritique || 'Critique complete. Historical correlation matches simulated mitigation strategies.',
      weakAssumptions: details.weakAssumptions || ['Assumes immediate logistics clearance'],
      ignoredRisks: details.ignoredRisks || ['Freight premium pricing escalations']
    };
  };

  const loadData = async () => {
    setLoading(true);
    setBoardError(null);
    try {
      let current = fallbackMotion;
      let past = [];

      // 1. Process active pipelineState state to current motion
      if (pipelineState) {
        const brief = pipelineState.brief;
        const redteam = pipelineState.redteam;
        const latestDecision = pipelineState.latest_decision;

        const isDecided = latestDecision && latestDecision.action_type;
        let activeStatus = 'PENDING';
        if (isDecided) {
          if (latestDecision.action_type.includes('REJECT')) activeStatus = 'REJECTED';
          else if (latestDecision.action_type.includes('SIMULATE')) activeStatus = 'SIMULATION_REQUESTED';
          else activeStatus = 'APPROVED';
        } else {
          activeStatus = 'VOTING';
        }

        current = {
          id: brief?.brief_id || 'MOT-CURRENT',
          title: brief?.subject || pipelineState.active_scenario?.name || 'Strategic Energy Response Plan',
          proposedBy: brief?.prepared_by || 'AI Copilot / Secretariat',
          status: activeStatus,
          urgency: 'CRITICAL',
          votes: {
            for: activeStatus === 'APPROVED' ? 5 : (activeStatus === 'REJECTED' ? 1 : 4),
            against: activeStatus === 'REJECTED' ? 4 : 1,
            abstain: activeStatus === 'SIMULATION_REQUESTED' ? 3 : 1,
          },
          quorum: 6,
          deadline: 'Immediate',
          summary: brief?.decision_required || 'Approve response mix and coordinate strategic reserve (SPR) bridges.',
          aiRecommendation: 'APPROVE',
          aiConfidence: redteam?.confidence_adjusted ? Math.round(redteam.confidence_adjusted * 100) : 96,
          members: [
            { 
              name: 'Arjun Mehta', 
              role: 'Commander', 
              avatar: 'AM', 
              vote: activeStatus === 'APPROVED' ? 'FOR' : (activeStatus === 'REJECTED' ? 'AGAINST' : (activeStatus === 'SIMULATION_REQUESTED' ? 'ABSTAIN' : 'PENDING')) 
            },
            { name: 'Dr. V. Sinha', role: 'Chief Advisor', avatar: 'VS', vote: 'FOR' },
            { name: 'Lt. Gen. Sandhu', role: 'Security Chief', avatar: 'RS', vote: 'FOR' },
            { name: 'M. K. Sharma', role: 'Finance Rep', avatar: 'MS', vote: 'FOR' },
            { name: 'Sunita Rao', role: 'Petroleum Rep', avatar: 'SR', vote: 'FOR' },
          ],
          redTeamCritique: redteam?.critique || 'Strategic validation complete. Procurement diversification matches high severity protocols.',
          weakAssumptions: redteam?.weak_assumptions || ['Rerouting window of 14 days is optimistic due to ship availability'],
          ignoredRisks: redteam?.ignored_risks || ['Premium spikes in spot insurance rates']
        };
      }

      // 2. Fetch past decisions if online
      if (!offline) {
        try {
          past = await fetchDecisions();
        } catch (e) {
          console.error("Failed to fetch past decisions", e);
        }
      }

      const pastMotions = past.map(mapDecisionToMotion);
      const combined = [current];
      
      pastMotions.forEach(p => {
        if (p.id !== current.id) {
          combined.push(p);
        }
      });

      setMotions(combined);
      
      // Preserve selection
      if (selected && combined.some(m => m.id === selected.id)) {
        setSelected(combined.find(m => m.id === selected.id));
      } else {
        setSelected(combined[0] || fallbackMotion);
      }
    } catch (err) {
      console.error(err);
      setBoardError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pipelineState, offline]);

  const handleVote = async (voteType) => {
    if (!selected || (selected.status !== 'VOTING' && selected.status !== 'PENDING')) {
      showToast('Decision has already been finalized or is not in voting phase.', 'warning');
      return;
    }
    
    setVotingLoader(true);
    setBoardError(null);
    try {
      if (!offline) {
        await recordDecision({
          action_type: `${voteType} — ${selected.title}`,
          approved_by: 'Commander Arjun Mehta',
          scenario_id: pipelineState?.active_scenario?.id || 'hormuz_closure',
          details: {
            motion_id: selected.id,
            decision: voteType,
            motion_title: selected.title,
            urgency: selected.urgency,
            summary: selected.summary,
            aiRecommendation: selected.aiRecommendation,
            aiConfidence: selected.aiConfidence,
            redTeamCritique: selected.redTeamCritique,
            weakAssumptions: selected.weakAssumptions,
            ignoredRisks: selected.ignoredRisks
          }
        });
      }
      showToast(`Decision recorded: ${voteType} action initiated.`, 'success');
      await refreshPipeline();
      if (voteType === 'SIMULATE') {
        showToast('Redirecting to Scenario Simulator workspace...', 'info');
        navigate('/scenario-simulator');
      }
    } catch (err) {
      console.error(err);
      setBoardError(err);
      showToast('Failed to post decision to the backend.', 'error');
    } finally {
      setVotingLoader(false);
    }
  };

  const handleRaiseMotion = () => {
    setNewTitle('');
    setNewSummary('');
    setNewUrgency('HIGH');
    setNewRec('APPROVE');
    setNewConf(90);
    setShowModal(true);
  };

  const handleSubmitMotion = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) {
      showToast('Please fill out all required fields.', 'warning');
      return;
    }

    setModalSubmitting(true);
    try {
      await recordDecision({
        action_type: `APPROVE — ${newTitle.trim()}`,
        approved_by: 'Commander Arjun Mehta',
        scenario_id: pipelineState?.active_scenario?.id || 'hormuz_closure',
        details: {
          title: newTitle.trim(),
          urgency: newUrgency,
          summary: newSummary.trim(),
          aiRecommendation: newRec,
          aiConfidence: parseInt(newConf),
          redTeamCritique: 'User submitted custom proposal. General compatibility filters clear.',
          weakAssumptions: ['Assumes immediate logistics alignment'],
          ignoredRisks: ['Slight local commodity price volatility']
        }
      });
      showToast('New motion successfully submitted and approved by executive board.', 'success');
      setShowModal(false);
      await refreshPipeline();
    } catch (err) {
      console.error(err);
      showToast('Failed to raise new motion on backend.', 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  // KPI calculations
  const scenarioName = pipelineState?.active_scenario?.name || "No Active Scenario";
  const threatLevel = pipelineState?.active_scenario?.severity || "NORMAL";
  const brentPrice = pipelineState?.state?.brent_price ? `$${pipelineState.state.brent_price}/bbl` : "$88.0/bbl";
  const sprCoverage = pipelineState?.state?.kpi?.spr_coverage !== undefined ? `${pipelineState.state.kpi.spr_coverage}%` : "72%";

  // Node Status for Decision Tree
  const getStepStatus = (stepIndex, status) => {
    if (status === 'VOTING' || status === 'PENDING') {
      if (stepIndex === 1) return { label: 'Complete', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
      if (stepIndex === 2) return { label: 'Complete', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
      if (stepIndex === 3) return { label: 'Complete', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
      if (stepIndex === 4) return { label: 'Voting Live', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
      return { label: 'Pending', color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.05)' };
    }
    // Finalized statuses: APPROVED, REJECTED, SIMULATION_REQUESTED
    if (stepIndex <= 4) return { label: 'Complete', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    
    // Final status node label
    if (status === 'APPROVED') return { label: 'Approved', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    if (status === 'REJECTED') return { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    return { label: 'Simulating', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' };
  };

  if (!pipelineState) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <AlertTriangle size={48} style={{ color: '#f59e0b' }} />
          <h2>System Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached data is available.</p>
          <button className="btn btn-primary" onClick={refreshPipeline}>
            <Clock size={14} style={{ marginRight: 6 }} /> Retry Connection
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {offline && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 16,
          fontSize: 12,
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertTriangle size={14} />
          <span>Showing last known intelligence state (Offline)</span>
        </div>
      )}

      <PageHeader title="Executive Decision Board" subtitle="High-stakes motions, AI-assisted voting, and quorum management"
        badge={{ label: !offline ? 'BOARD LIVE' : 'OFFLINE MODE', color: '#ef4444' }}
        actions={
          <button onClick={handleRaiseMotion} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <FileText size={13} />Raise New Motion
          </button>
        }
      />

      {/* Dynamic KPI Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <GlassCard className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Scenario</div>
          <div style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.2 }}>{scenarioName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: pipelineState?.active_scenario ? '#ef4444' : '#22c55e' }} />
            {pipelineState?.active_scenario ? 'Response Protocol Active' : 'System Normal'}
          </div>
        </GlassCard>
        <GlassCard className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>National Threat Level</div>
          <div style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700, color: threatLevel === 'CRITICAL' || threatLevel === 'HIGH' ? '#ef4444' : '#22c55e', wordBreak: 'break-word', lineHeight: 1.2 }}>{threatLevel}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>Risk assessment score updated live</div>
        </GlassCard>
        <GlassCard className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>SPR Reserve Status</div>
          <div style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700, color: '#1d8cff', wordBreak: 'break-word', lineHeight: 1.2 }}>{sprCoverage}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>Covering approx. {Math.round(parseInt(sprCoverage) * 0.7) || 44} days of imports</div>
        </GlassCard>
        <GlassCard className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Brent Crude Index</div>
          <div style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700, color: '#f59e0b', wordBreak: 'break-word', lineHeight: 1.2 }}>{brentPrice}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>Reflects global geopolitical premium</div>
        </GlassCard>
      </div>

      <div className="board-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Sidebar Motion List */}
        <GlassCard className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Active & Past Motions</div>
          <div style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
            {motions.map(motion => (
              <div key={motion.id} onClick={() => setSelected(motion)}
                style={{ 
                  padding: '14px 16px', 
                  borderBottom: '1px solid rgba(255,255,255,0.03)', 
                  cursor: 'pointer', 
                  background: selected?.id === motion.id ? 'rgba(29,140,255,0.08)' : 'transparent', 
                  borderLeft: selected?.id === motion.id ? '3px solid #1d8cff' : '3px solid transparent', 
                  transition: 'all 0.15s' 
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#1d8cff', fontWeight: 600 }}>{motion.id}</span>
                  <span style={{ 
                    fontSize: 9, 
                    padding: '2px 6px', 
                    borderRadius: 4, 
                    fontWeight: 700, 
                    background: motion.status === 'VOTING' || motion.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : motion.status === 'REJECTED' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', 
                    color: motion.status === 'VOTING' || motion.status === 'PENDING' ? '#f59e0b' : motion.status === 'REJECTED' ? '#ef4444' : '#22c55e' 
                  }}>{motion.status}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.4 }}>{motion.title}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-dim)' }}>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>✓ {motion.votes?.for || 0}</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ {motion.votes?.against || 0}</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>— {motion.votes?.abstain || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Detailed Motion Panel with Decision Logic Tree */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header Description & Voting Actions */}
            <GlassCard className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Command size={15} color="#1d8cff" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1d8cff', letterSpacing: '0.05em' }}>EXECUTIVE MOTION DETAILS</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-dim)' }}>{selected.id}</span>
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{selected.title}</h2>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                    Proposed by: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{selected.proposedBy}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexShrink: 0, gap: 8 }}>
                  {(selected.status === 'VOTING' || selected.status === 'PENDING') && (
                    <>
                      {votingLoader ? (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /></div>
                      ) : (
                        <>
                          <button onClick={() => handleVote('APPROVE')} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><ThumbsUp size={13} />Approve</button>
                          <button onClick={() => handleVote('REJECT')} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><ThumbsDown size={13} />Reject</button>
                          <button onClick={() => handleVote('SIMULATE')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><FileText size={13} />Request Simulation</button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div style={{ background: 'rgba(29,140,255,0.06)', border: '1px solid rgba(29,140,255,0.15)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {selected.summary}
              </div>
            </GlassCard>

            {/* Premium Decision Tree & Flow Visualization */}
            <GlassCard className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <GitBranch size={16} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Decision Authorization Tree</h3>
              </div>

              {/* Horizontal Node-based Tree Map */}
              <div className="decision-tree-container" style={{ 
                display: 'flex', 
                alignItems: 'stretch', 
                justifyContent: 'space-between', 
                gap: 8, 
                position: 'relative', 
                overflowX: 'auto',
                paddingBottom: 10
              }}>
                {/* Node 1: Origin / Proposal */}
                <div className="decision-tree-node" style={{ flex: 1, minWidth: 130, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '10px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600, uppercase: true }}>1. PROPOSAL ORIGIN</span>
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700, background: getStepStatus(1, selected.status).bg, color: getStepStatus(1, selected.status).color }}>{getStepStatus(1, selected.status).label}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{selected.proposedBy}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Secretariat drafting and parameters configuration.</div>
                  </div>
                  <div style={{ fontSize: 9, color: '#1d8cff', fontWeight: 600, marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Proposal Logged <CheckCircle size={10} />
                  </div>
                </div>

                {/* Arrow connector */}
                <div className="decision-tree-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                  <ArrowRight size={16} />
                </div>

                {/* Node 2: AI Risk analysis evaluation */}
                <div className="decision-tree-node" style={{ flex: 1, minWidth: 130, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '10px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>2. AI RECOMMENDATION</span>
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700, background: getStepStatus(2, selected.status).bg, color: getStepStatus(2, selected.status).color }}>{getStepStatus(2, selected.status).label}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#1d8cff' }}>{selected.aiRecommendation} ({selected.aiConfidence}%)</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Optimization model run and price risk calculation.</div>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Confidence Level: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selected.aiConfidence}%</span>
                  </div>
                </div>

                {/* Arrow connector */}
                <div className="decision-tree-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                  <ArrowRight size={16} />
                </div>

                {/* Node 3: Red Team validation critique */}
                <div className="decision-tree-node" style={{ flex: 1, minWidth: 130, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '10px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>3. RED TEAM CRITIQUE</span>
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700, background: getStepStatus(3, selected.status).bg, color: getStepStatus(3, selected.status).color }}>{getStepStatus(3, selected.status).label}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#ef4444' }}>Critique Logged</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Adjusted confidence score and highlighted assumptions.</div>
                  </div>
                  <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 600, marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldAlert size={10} /> {selected.weakAssumptions ? selected.weakAssumptions.length : 0} Weak Spots
                  </div>
                </div>

                {/* Arrow connector */}
                <div className="decision-tree-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                  <ArrowRight size={16} />
                </div>

                {/* Node 4: Quorum vote */}
                <div className="decision-tree-node" style={{ flex: 1, minWidth: 130, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '10px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>4. QUORUM VOTE</span>
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700, background: getStepStatus(4, selected.status).bg, color: getStepStatus(4, selected.status).color }}>{getStepStatus(4, selected.status).label}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selected.votes?.for || 0} For / {selected.votes?.against || 0} Against
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Requires a minimum quorum threshold of {selected.quorum} members.</div>
                  </div>
                  <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 600, marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={10} /> Active Quorum: {selected.members ? selected.members.length : 0}
                  </div>
                </div>

                {/* Arrow connector */}
                <div className="decision-tree-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                  <ArrowRight size={16} />
                </div>

                {/* Node 5: Verdict */}
                <div className="decision-tree-node" style={{ 
                  flex: 1, 
                  minWidth: 130, 
                  background: selected.status === 'APPROVED' ? 'rgba(34,197,94,0.05)' : selected.status === 'REJECTED' ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)', 
                  border: `1px solid ${selected.status === 'APPROVED' ? '#22c55e40' : selected.status === 'REJECTED' ? '#ef444440' : 'var(--border-soft)'}`, 
                  borderRadius: 8, 
                  padding: '10px 8px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between' 
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>5. FINAL RESOLUTION</span>
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700, background: getStepStatus(5, selected.status).bg, color: getStepStatus(5, selected.status).color }}>{getStepStatus(5, selected.status).label}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: selected.status === 'APPROVED' ? '#22c55e' : selected.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>
                      {selected.status}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                      {selected.status === 'APPROVED' ? 'Implementation authorized immediately.' : selected.status === 'REJECTED' ? 'Motion dismissed.' : 'Awaiting quorum.'}
                    </div>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Status: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selected.status}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Vote Tally */}
              <GlassCard className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Vote Tally</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'For', value: selected.votes?.for || 0, color: '#22c55e' },
                    { label: 'Against', value: selected.votes?.against || 0, color: '#ef4444' },
                    { label: 'Abstain', value: selected.votes?.abstain || 0, color: '#f59e0b' },
                  ].map(v => (
                    <div key={v.label} style={{ textAlign: 'center', background: `${v.color}10`, borderRadius: 8, padding: '10px 0', border: `1px solid ${v.color}25` }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: v.color }}>{v.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{v.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div style={{ flex: selected.votes?.for || 1, height: 6, background: '#22c55e', borderRadius: '4px 0 0 4px' }} />
                  <div style={{ flex: selected.votes?.against || 0, height: 6, background: '#ef4444' }} />
                  <div style={{ flex: selected.votes?.abstain || 0, height: 6, background: '#f59e0b', borderRadius: '0 4px 4px 0' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                  <span>Quorum required: {selected.quorum} members</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />Deadline: {selected.deadline}</span>
                </div>
              </GlassCard>

              {/* AI Critique & Red Team Critique logs */}
              <GlassCard className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={14} color="#ef4444" />
                  Red Team Critique & Validation
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selected.redTeamCritique}
                  </div>
                  
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Weak Assumptions Tracked:</div>
                    {selected.weakAssumptions && selected.weakAssumptions.map((wa, idx) => (
                      <div key={idx} style={{ fontSize: 11, color: '#ef4444', display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 3 }}>
                        <span style={{ flexShrink: 0 }}>•</span>
                        <span>{wa}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Ignored Risks Filtered:</div>
                    {selected.ignoredRisks && selected.ignoredRisks.map((ir, idx) => (
                      <div key={idx} style={{ fontSize: 11, color: '#f59e0b', display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 3 }}>
                        <span style={{ flexShrink: 0 }}>•</span>
                        <span>{ir}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Board Member Votes */}
            {selected.members && selected.members.length > 0 && (
              <GlassCard className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={14} color="#1d8cff" />Board Member Votes
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  {selected.members.map(member => (
                    <div key={member.name} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10, 
                      background: 'rgba(255,255,255,0.03)', 
                      borderRadius: 8, 
                      padding: '10px 12px', 
                      border: `1px solid ${voteColor[member.vote] || '#94a3b8'}20` 
                    }}>
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        background: `${voteColor[member.vote] || '#94a3b8'}20`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: 11, 
                        fontWeight: 700, 
                        color: voteColor[member.vote] || '#94a3b8', 
                        flexShrink: 0 
                      }}>{member.avatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{member.role}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: voteColor[member.vote] || '#94a3b8' }}>{member.vote}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </div>

      {/* Raise Motion Dialog Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <GlassCard style={{
            width: '100%',
            maxWidth: 500,
            padding: 24,
            border: '1px solid var(--border-soft)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: 'var(--bg-panel)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Command size={18} color="#1d8cff" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Raise New Executive Motion</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitMotion} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>Motion Title</label>
                <input
                  required
                  placeholder="e.g., Authorize Bilateral UAE Oil Purchase Agreements"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>Urgency</label>
                  <select
                    value={newUrgency}
                    onChange={e => setNewUrgency(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="CRITICAL" style={{ background: '#1a1d24' }}>CRITICAL</option>
                    <option value="HIGH" style={{ background: '#1a1d24' }}>HIGH</option>
                    <option value="MEDIUM" style={{ background: '#1a1d24' }}>MEDIUM</option>
                    <option value="LOW" style={{ background: '#1a1d24' }}>LOW</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>AI Recommendation</label>
                  <select
                    value={newRec}
                    onChange={e => setNewRec(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="APPROVE" style={{ background: '#1a1d24' }}>APPROVE</option>
                    <option value="REJECT" style={{ background: '#1a1d24' }}>REJECT</option>
                    <option value="MONITOR" style={{ background: '#1a1d24' }}>MONITOR</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>AI Confidence Level</label>
                  <span style={{ fontSize: 11, color: '#1d8cff', fontWeight: 700 }}>{newConf}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={newConf}
                  onChange={e => setNewConf(e.target.value)}
                  style={{ width: '100%', accentColor: '#1d8cff', cursor: 'pointer', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>Motion Summary & Recommendation</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide brief outline of decision impact, resources required, and direct action items..."
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" disabled={modalSubmitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  {modalSubmitting ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={13} />}
                  Submit Motion
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .page-content {
          overflow-x: auto !important;
        }
        @media (min-width: 1201px) {
          .board-grid {
            min-width: 1060px !important;
          }
        }
        @media (max-width: 1200px) {
          .board-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .decision-tree-container {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .decision-tree-arrow {
            transform: rotate(90deg) !important;
            padding: 8px 0 !important;
            margin: 4px 0 !important;
          }
          .decision-tree-node {
            width: 100% !important;
            min-width: 0 !important;
            flex: none !important;
          }
        }
        @media (max-width: 480px) {
          .kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
