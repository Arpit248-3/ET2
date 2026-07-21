import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Bot, Clock, AlertTriangle, CheckCircle, Download, RefreshCw, ChevronRight, Loader, WifiOff, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { usePipeline } from '../../context/PipelineContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { generateBrief } from '../../services/api.js';

const priorityColor = { P1: '#ef4444', P2: '#f59e0b', P3: '#1d8cff' };
const statusColor = { 'PENDING': '#f59e0b', 'IN PROGRESS': '#1d8cff', 'DONE': '#22c55e' };

const fallbackBrief = {
  id: 'AB-OFFLINE',
  title: 'UrjaNetra AI — Baseline Operations Brief',
  time: new Date().toLocaleDateString() + ', 09:00 UTC',
  priority: 'LOW',
  classification: 'RESTRICTED',
  prepared_for: 'Hon. Minister of Petroleum',
  prepared_by: 'UrjaNetra AI System / NEMC Secretariat',
  summary: 'No active crisis scenario. System is in monitoring mode. All supply chains operating within normal parameters.',
  actions: [
    { priority: 'P3', action: 'Continue standard monitoring and maintain reserve buffers', owner: 'NEMC', deadline: 'Ongoing', status: 'DONE' }
  ],
  insights: [
    'System Monitoring: Active',
    'SPR level matches target: 64%',
    'Crude import prices stable'
  ],
  sections: [
    { heading: "1. SITUATION", content: "No active crisis scenario. System is in monitoring mode. All supply chains operating within normal parameters." },
    { heading: "2. RECOMMENDATION", content: "Continue standard monitoring. Maintain SPR above 60%. No immediate action required." }
  ],
  decision_required: 'No decision required at this time.',
};

export default function ActionBrief() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { pipelineState, offline, runPipeline, refreshPipeline } = usePipeline();
  const [selectedBrief, setSelectedBrief] = useState(fallbackBrief);
  const [historyBriefs, setHistoryBriefs] = useState([fallbackBrief]);
  const [generating, setGenerating] = useState(false);

  // Derive brief from pipelineState
  useEffect(() => {
    if (pipelineState?.brief) {
      const brief = pipelineState.brief;
      const normalizedBrief = {
        id: brief.brief_id || `AB-GEN-${Date.now().toString().slice(-4)}`,
        title: brief.subject || 'National Energy Resilience Intelligence Brief',
        time: brief.date || new Date().toLocaleTimeString() + ', 09:00 UTC',
        priority: pipelineState.active_scenario?.severity || 'HIGH',
        classification: brief.classification || 'TOP SECRET',
        prepared_for: brief.prepared_for || 'Hon. Minister of Petroleum',
        prepared_by: brief.prepared_by || 'UrjaNetra AI System',
        summary: brief.sections?.find(s => s.heading.toLowerCase().includes('summary') || s.heading.toLowerCase().includes('executive'))?.content 
          || brief.sections?.[0]?.content 
          || 'Executive summary not provided.',
        actions: brief.actions || [
          { priority: 'P1', action: 'Approve Strategic Response Plan', owner: 'Cabinet', deadline: 'Immediate', status: 'PENDING' },
          { priority: 'P2', action: 'Diversify supply lines as detailed in briefing', owner: 'MoP / IOC', deadline: '24 Hours', status: 'IN PROGRESS' }
        ],
        insights: brief.sections ? brief.sections.map(s => `${s.heading}: ${s.content.substring(0, 120)}...`) : [],
        sections: brief.sections || [
          { heading: "1. SITUATION", content: brief.summary || 'Summary of active crisis' },
          { heading: "2. RECOMMENDATION", content: brief.decision_required || 'AI Action Recommendation' }
        ],
        decision_required: brief.decision_required || 'No decision required.'
      };
      setSelectedBrief(normalizedBrief);
      setHistoryBriefs(prev => {
        const filtered = prev.filter(b => b.id !== normalizedBrief.id && b.id !== 'AB-OFFLINE');
        return [normalizedBrief, ...filtered];
      });
    }
  }, [pipelineState]);

  const handleGenerateBrief = async () => {
    if (offline) {
      addToast('Backend offline — displaying cached briefs', 'warning');
      return;
    }
    setGenerating(true);
    try {
      const brief = await generateBrief({
        scenario_id: pipelineState?.active_scenario?.id || 'hormuz_closure',
        classification: 'TOP SECRET',
        prepared_for: 'Hon. Minister of Petroleum',
      });
      
      if (brief) {
        const normalizedBrief = {
          id: brief.brief_id || `AB-GEN-${Date.now().toString().slice(-4)}`,
          title: brief.subject || 'National Energy Resilience Intelligence Brief',
          time: brief.date || new Date().toLocaleTimeString() + ', 09:00 UTC',
          priority: pipelineState?.active_scenario?.severity || 'HIGH',
          classification: brief.classification || 'TOP SECRET',
          prepared_for: brief.prepared_for || 'Hon. Minister of Petroleum',
          prepared_by: brief.prepared_by || 'UrjaNetra AI System',
          summary: brief.sections?.find(s => s.heading.toLowerCase().includes('summary') || s.heading.toLowerCase().includes('executive'))?.content 
            || brief.sections?.[0]?.content 
            || 'Executive summary not provided.',
          actions: brief.actions && brief.actions.length > 0 ? brief.actions : [
            { priority: 'P1', action: 'Approve Strategic Response Plan', owner: 'Cabinet', deadline: 'Immediate', status: 'PENDING' },
            { priority: 'P2', action: 'Diversify supply lines as detailed in briefing', owner: 'MoP / IOC', deadline: '24 Hours', status: 'IN PROGRESS' }
          ],
          insights: brief.sections ? brief.sections.map(s => `${s.heading}: ${s.content.substring(0, 120)}...`) : [],
          sections: brief.sections || [
            { heading: "1. SITUATION", content: brief.summary || 'Summary of active crisis' },
            { heading: "2. RECOMMENDATION", content: brief.decision_required || 'AI Action Recommendation' }
          ],
          decision_required: brief.decision_required || 'No decision required.'
        };
        setSelectedBrief(normalizedBrief);
        setHistoryBriefs(prev => {
          const filtered = prev.filter(b => b.id !== normalizedBrief.id && b.id !== 'AB-OFFLINE');
          return [normalizedBrief, ...filtered];
        });
      }
      await refreshPipeline();
      addToast('Executive Decision Brief successfully generated by AI Copilot', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to generate brief on backend. Running pipeline...', 'warning');
      try {
        await runPipeline();
      } catch (pipeErr) {}
    } finally {
      setGenerating(false);
    }
  };


  const handleExportPDF = () => {
    if (!selectedBrief) return;
    const content = `URJANETRA EXECUTIVE ACTION BRIEF\n================================\nBrief ID: ${selectedBrief.id}\nTitle: ${selectedBrief.title}\nClassification: ${selectedBrief.classification}\nPriority: ${selectedBrief.priority}\nPrepared For: ${selectedBrief.prepared_for}\nPrepared By: ${selectedBrief.prepared_by}\nTime: ${selectedBrief.time}\n\nExecutive Summary:\n------------------\n${selectedBrief.summary}\n\nDetailed Analysis:\n------------------\n${selectedBrief.sections?.map(s => `\n* ${s.heading}\n  ${s.content}`).join('\n') || ''}\n\nMinisterial Decision Required:\n------------------------------\n${selectedBrief.decision_required || ''}\n\nAction Items:\n-------------\n${selectedBrief.actions?.map(a => `[${a.priority}] ${a.action} (Owner: ${a.owner}, Status: ${a.status})`).join('\n') || ''}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urjanetra_action_brief_${selectedBrief.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Brief exported as text file', 'success');
  };

  if (!pipelineState) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <AlertTriangle size={48} style={{ color: '#f59e0b' }} />
          <h2>System Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached data is available.</p>
          <button className="btn btn-primary" onClick={refreshPipeline}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry Connection
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

      <PageHeader title="AI Action Brief" subtitle="Auto-generated executive intelligence briefs with prioritized action items"
        badge={{ label: !offline ? 'AI LIVE' : 'OFFLINE MODE', color: '#8b5cf6' }}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleExportPDF}><Download size={13} /> Export Brief</button>
            <button className="btn btn-secondary" onClick={() => { addToast('Routing to Executive Board...', 'info'); navigate('/executive-decision-board'); }}><ArrowRight size={13} /> Executive Board</button>
            <button className="btn btn-primary" onClick={handleGenerateBrief} disabled={generating}>
              {generating ? <Loader size={13} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} /> : <Bot size={13} style={{ marginRight: 6 }} />}
              {generating ? 'Generating...' : 'Generate New Brief'}
            </button>
          </div>
        }
      />

      {/* Loading overlay bar */}
      {generating && (
        <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8b5cf6', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Synthesizing real-time energy intelligence feed into executive report...
        </div>
      )}

      <div className="responsive-brief-grid">
        {/* Brief List */}
        <GlassCard className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-soft)', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent Briefs</div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {historyBriefs.map(brief => (
              <div key={brief.id} onClick={() => setSelectedBrief(brief)}
                style={{ padding: '14px 16px', border_bottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: selectedBrief?.id === brief.id ? 'rgba(139,92,246,0.1)' : 'transparent', borderLeft: selectedBrief?.id === brief.id ? '3px solid #8b5cf6' : '3px solid transparent', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8b5cf6' }}>{brief.id}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: brief.priority === 'CRITICAL' || brief.priority === 'HIGH' ? '#ef444420' : '#f59e0b20', color: brief.priority === 'CRITICAL' || brief.priority === 'HIGH' ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>{brief.priority}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>{brief.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-dim)' }}>
                  <Clock size={10} />{brief.time}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Brief Detail */}
        {selectedBrief && (
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header */}
            <GlassCard className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Bot size={16} color="#8b5cf6" />
                    <span style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 700 }}>{selectedBrief.classification || 'AI INTELLIGENCE BRIEF'}</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-dim)' }}>{selectedBrief.id}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{selectedBrief.title}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                    <div>Prepared For: <span style={{ color: 'var(--text-secondary)' }}>{selectedBrief.prepared_for}</span></div>
                    <div>Prepared By: <span style={{ color: 'var(--text-secondary)' }}>{selectedBrief.prepared_by}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><Clock size={11} />{selectedBrief.time}</div>
                  </div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: selectedBrief.priority === 'CRITICAL' || selectedBrief.priority === 'HIGH' ? '#ef444420' : '#f59e0b20', color: selectedBrief.priority === 'CRITICAL' || selectedBrief.priority === 'HIGH' ? '#ef4444' : '#f59e0b', border: `1px solid ${selectedBrief.priority === 'CRITICAL' || selectedBrief.priority === 'HIGH' ? '#ef444440' : '#f59e0b40'}` }}>{selectedBrief.priority}</span>
              </div>
              <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {selectedBrief.summary}
              </div>
            </GlassCard>

            {/* Dynamic brief sections if populated by backend */}
            {selectedBrief.sections && (
              <GlassCard className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={14} color="#a78bfa" />Detailed Briefing Analysis
                </div>
                {selectedBrief.sections.map((sect, index) => (
                  <div key={index} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{sect.heading}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{sect.content}</div>
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Cabinet Decision Required Card */}
            {selectedBrief.decision_required && (
              <GlassCard className="card" style={{ padding: '16px 20px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.02)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} />Ministerial Decision Required
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {selectedBrief.decision_required}
                </div>
              </GlassCard>
            )}

            {/* Prioritized Action Items */}
            <GlassCard className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={14} color="#22c55e" />Prioritized Action Items
              </div>
              {selectedBrief.actions.map((action, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < selectedBrief.actions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${priorityColor[action.priority] || '#1d8cff'}18`, color: priorityColor[action.priority] || '#1d8cff', flexShrink: 0 }}>{action.priority}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>{action.action}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-dim)' }}>
                      <span>Owner: <span style={{ color: 'var(--text-secondary)' }}>{action.owner}</span></span>
                      <span>Deadline: <span style={{ color: 'var(--text-secondary)' }}>{action.deadline}</span></span>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[action.status] || '#f59e0b', padding: '2px 8px', borderRadius: 4, background: `${statusColor[action.status] || '#f59e0b'}15`, flexShrink: 0 }}>{action.status}</span>
                </div>
              ))}
            </GlassCard>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
