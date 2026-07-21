import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, AlertTriangle, Shield, CheckCircle, Play, RotateCcw, Bot, Loader, ChevronRight, WifiOff, ArrowRight, Info } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import useApi from '../../hooks/useApi.js';
import { validateRedTeam, recordDecision, fetchDecisions } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';

const SCENARIO_RECOMMENDATIONS = {
  hormuz_closure: "Execute 8.5 MMT drawdown of SPR and route 4 VLCCs via West Africa",
  opec_cut: "Pivot procurement to USA and Brazil spot markets to mitigate OPEC+ cuts",
  russia_sanctions: "Immediately halt all Russian crude cargo purchases to comply with G7 sanctions",
  port_disruption: "Reroute all incoming Kandla and Mundra VLCCs to east coast ports (Vizag, Paradip, Ennore)",
};

const DEFAULT_RECOMMENDATION = "Execute standard national energy monitoring and maintain 60-day commercial reserve buffers.";

const severityColor = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#1d8cff', LOW: '#22c55e' };

// Hover tooltip Metric card
function HoverMetricCard({ label, value, color = '#1d8cff', icon: Icon, bg = 'rgba(29,140,255,0.1)', sub, desc }) {
  const [show, setShow] = useState(false);
  return (
    <div
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(prev => !prev)}
      style={{
        position: 'relative', overflow: 'visible', padding: '16px 18px', borderRadius: 12,
        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)',
        cursor: 'default', transition: 'all 0.2s',
        borderColor: show ? 'rgba(29,140,255,0.4)' : undefined,
        boxShadow: show ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(95deg, ${color} 0%, transparent 80%)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {label} <Info size={10} style={{ color: '#475569', flexShrink: 0 }} />
        </span>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 6, background: bg, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} style={{ color: color }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: color }}>{value}</span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</span>
      </div>
      {show && desc && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, zIndex: 60, minWidth: 220, maxWidth: 280,
          background: 'rgba(8,18,35,0.97)', border: '1px solid rgba(29,140,255,0.3)', borderRadius: 8,
          padding: '10px 12px', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
        }}>
          {desc}
        </div>
      )}
    </div>
  );
}

export default function RedTeamValidator() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { activeScenario, backendOnline, refreshState } = useScenario();

  // Cache-based RedTeam state
  const [rtCache, setRtCache] = useState(() => {
    const cached = localStorage.getItem('urja_redteam_cache');
    return cached ? JSON.parse(cached) : null;
  });

  const [recommendationText, setRecommendationText] = useState("");
  const [selectedFinding, setSelectedFinding] = useState(null);

  // Hook for live Red Team Validation API
  const { data: rtData, loading: running, error: rtError, execute: runVal } = useApi(validateRedTeam, {
    manual: true,
    fallback: null,
  });

  // Sync cache
  useEffect(() => {
    if (rtData) {
      setRtCache(rtData);
      localStorage.setItem('urja_redteam_cache', JSON.stringify(rtData));
    }
  }, [rtData]);

  // Set default recommendation text when scenario changes or decisions/localStorage change
  useEffect(() => {
    const fetchAndBuildRecommendation = async () => {
      let parts = [];

      // 1. Check database decisions first
      let databaseDecisions = [];
      try {
        if (backendOnline) {
          const decisions = await fetchDecisions();
          if (decisions) {
            databaseDecisions = decisions.filter(
              d => d.scenario_id === (activeScenario?.id || 'baseline')
            );
          }
        }
      } catch (err) {
        console.warn('Failed to load decisions for dynamic recommendation:', err);
      }

      const procDec = databaseDecisions.find(d => d.action_type === 'APPROVE_PROCUREMENT_PLAN');
      const sprDec = databaseDecisions.find(d => d.action_type === 'APPROVE_SPR_DRAWDOWN_PLAN');
      const refDec = databaseDecisions.find(d => d.action_type === 'APPROVE_REFINERY_MATCH');

      // 2. Resolve Procurement Sourcing
      if (procDec && procDec.details?.recommended_mix) {
        const mix = procDec.details.recommended_mix
          .filter(s => s.recommended_volume_mbbl > 0)
          .map(s => `${s.recommended_volume_mbbl} MMT from ${s.name} (${s.route})`)
          .join(', ');
        if (mix) parts.push(`Procure: ${mix}`);
      } else {
        // Fallback to localStorage cache
        try {
          const cachedProc = localStorage.getItem('urja_procurement_cache');
          if (cachedProc) {
            const procData = JSON.parse(cachedProc);
            if (procData?.recommended_mix) {
              const mix = procData.recommended_mix
                .filter(s => s.recommended_volume_mbbl > 0)
                .map(s => `${s.recommended_volume_mbbl} MMT from ${s.name} (${s.route})`)
                .join(', ');
              if (mix) parts.push(`Procure (Optimized): ${mix}`);
            }
          }
        } catch (e) {}
      }

      // 3. Resolve SPR Drawdown
      if (sprDec && sprDec.details?.sites) {
        const drawdown = sprDec.details.sites
          .filter(s => s.drawdown_allocated_mbbl > 0)
          .map(s => `${s.drawdown_allocated_mbbl} MMT from ${s.name}`)
          .join(', ');
        if (drawdown) parts.push(`SPR Drawdown: ${drawdown}`);
      } else {
        // Fallback to localStorage cache
        try {
          const cachedSpr = localStorage.getItem('urja_spr_cache');
          if (cachedSpr) {
            const sprData = JSON.parse(cachedSpr);
            if (sprData?.sites) {
              const drawdown = sprData.sites
                .filter(s => s.drawdown_allocated_mbbl > 0)
                .map(s => `${s.drawdown_allocated_mbbl} MMT from ${s.name}`)
                .join(', ');
              if (drawdown) parts.push(`SPR Drawdown (Optimized): ${drawdown}`);
            }
          }
        } catch (e) {}
      }

      // 4. Resolve Refinery Compatibility
      if (refDec && refDec.details?.refinery) {
        parts.push(`Refining: Process ${refDec.details.crude_type} at ${refDec.details.refinery}`);
      } else {
        const preferredCrude = localStorage.getItem('urja_preferred_crude');
        if (preferredCrude) {
          parts.push(`Refining: Process preferred ${preferredCrude} crude compatibility blend`);
        }
      }

      let recText = "";
      if (parts.length > 0) {
        recText = `Execute current integrated strategy — ${parts.join('. ')}.`;
      } else {
        recText = activeScenario?.id ? SCENARIO_RECOMMENDATIONS[activeScenario.id] : DEFAULT_RECOMMENDATION;
      }
      setRecommendationText(recText || DEFAULT_RECOMMENDATION);
    };

    fetchAndBuildRecommendation();
  }, [activeScenario, backendOnline]);

  const handleValidate = async (customText) => {
    const textToValidate = customText || recommendationText;
    if (!backendOnline) {
      addToast('Backend offline — using cached red-team parameters', 'warning');
      return;
    }
    try {
      const res = await runVal({
        recommendation: textToValidate,
        scenario_id: activeScenario?.id || 'baseline',
        confidence: 0.85,
      });
      if (res) {
        setRtCache(res);
        localStorage.setItem('urja_redteam_cache', JSON.stringify(res));
      }
      await refreshState();
      addToast('Adversarial Red Team validation complete', 'success');
    } catch (err) {
      addToast('Failed to validate recommendation: showing cached profile', 'error');
    }
  };

  // Initial load
  useEffect(() => {
    if (backendOnline && recommendationText && recommendationText !== DEFAULT_RECOMMENDATION) {
      handleValidate(recommendationText);
    }
  }, [backendOnline, recommendationText]);

  const handleAcceptRevisedPlan = async () => {
    try {
      if (backendOnline) {
        await recordDecision({
          action_type: "ACCEPT_REVISED_REDTEAM_PLAN",
          approved_by: "Commander Arjun Mehta",
          scenario_id: activeScenario?.id || 'baseline',
          details: activeRtData || { message: "Accepted Red Team revised plan recommendation" }
        });
      }
      await refreshState();
      addToast('Revised Red Team resilience plan accepted and registered', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to accept revised plan on backend', 'error');
    }
  };

  const activeRtData = rtData || rtCache || {
    original_recommendation: recommendationText,
    critique: "Awaiting adversarial review simulation from backend.",
    weak_assumptions: ["No critique generated yet."],
    ignored_risks: ["No risks evaluated yet."],
    findings: [],
    confidence_original: 0.85,
    confidence_adjusted: 0.85,
    final_recommendation: "Run validation to generate updated resilience strategies."
  };

  // Autoselect first finding once loaded
  useEffect(() => {
    if (activeRtData.findings && activeRtData.findings.length > 0) {
      setSelectedFinding(activeRtData.findings[0]);
    } else {
      setSelectedFinding(null);
    }
  }, [activeRtData]);

  const compositeResilience = Math.round(activeRtData.confidence_adjusted * 100);

  // Derive radar data from findings
  const radarData = activeRtData.findings && activeRtData.findings.length > 0
    ? activeRtData.findings.map((f, i) => ({
        subject: f.finding.split(' ').slice(0, 2).join(' ') || f.category,
        score: f.severity === 'CRITICAL' ? 30 : f.severity === 'HIGH' ? 55 : 80,
      }))
    : [
        { subject: 'Geopolitical', score: 85 },
        { subject: 'Cyber', score: 85 },
        { subject: 'Physical', score: 85 },
        { subject: 'Market', score: 85 },
      ];

  // Safe empty offline view if no cache is available and offline
  if (!activeRtData && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <WifiOff size={48} style={{ color: '#f59e0b' }} />
          <h2>System Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached Red Team data is available.</p>
          <button className="btn btn-primary" onClick={() => handleValidate()}>
            <Loader size={14} style={{ marginRight: 6 }} /> Retry Connection
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {!backendOnline && (
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

      <PageHeader title="Red Team Validator" subtitle="Adversarial stress-testing of India's energy resilience across all threat vectors"
        badge={{ label: backendOnline ? 'AI RED TEAM' : 'OFFLINE MODE', color: '#ef4444' }}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => handleValidate()} disabled={running}>
              {running ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={13} />}
              {' '}Re-Validate Strategy
            </button>
            <button className="btn btn-secondary" onClick={() => { addToast('Sending back to procurement optimizer...', 'info'); navigate('/procurement-optimizer'); }}><ArrowRight size={13} /> Send to Optimizer</button>
            <button className="btn btn-success" onClick={handleAcceptRevisedPlan}><CheckCircle size={13} /> Accept Revised Plan</button>
          </div>
        }
      />

      {/* Loading overlay bar */}
      {running && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Simulating adversarial attacks and checking strategy vulnerabilities...
        </div>
      )}

      {/* Error Notification Banner */}
      {backendOnline && rtError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <AlertTriangle size={14} />
          Stress test simulation failed: {rtError.message || 'Connection failed'}. Showing cached data.
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <HoverMetricCard
          label="Overall Resilience"
          value={`${compositeResilience}%`}
          color={compositeResilience < 50 ? '#ef4444' : compositeResilience < 75 ? '#f59e0b' : '#22c55e'}
          icon={Shield}
          bg={compositeResilience < 50 ? 'rgba(239,68,68,0.1)' : compositeResilience < 75 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)'}
          sub="Adjusted Confidence"
          desc="Percentage of confidence adjusted after adversarial testing of the active strategy."
        />
        <HoverMetricCard
          label="Critical Threat Findings"
          value={String(activeRtData.findings?.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length || 0)}
          color="#ef4444"
          icon={AlertTriangle}
          bg="rgba(239,68,68,0.1)"
          sub="Vulnerabilities flagged"
          desc="Number of critical or high severity vulnerabilities flagged by the Red Team."
        />
        <HoverMetricCard
          label="Original Confidence"
          value={`${Math.round(activeRtData.confidence_original * 100)}%`}
          color="#1d8cff"
          icon={CheckCircle}
          bg="rgba(29,140,255,0.1)"
          sub="Prior to review"
          desc="Confidence level of the strategy prior to adversarial critiquing."
        />
        <HoverMetricCard
          label="Last Validation Run"
          value={rtData ? 'Just now' : 'Cached Draft'}
          color="#8b5cf6"
          icon={Target}
          bg="rgba(139,92,246,0.1)"
          sub="Automated scan"
          desc="Status of the latest stress test simulation execution."
        />
      </div>

      <div className="responsive-redteam-grid">
        <div>
          {/* Active Findings List */}
          <GlassCard className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', fontSize: 13, fontWeight: 600 }}>Active Vulnerability Findings</div>
            {activeRtData.findings && activeRtData.findings.length > 0 ? (
              activeRtData.findings.map((finding, idx) => (
                <div key={idx} onClick={() => setSelectedFinding(finding)}
                  style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: selectedFinding?.finding === finding.finding ? 'rgba(139,92,246,0.08)' : 'transparent', borderLeft: selectedFinding?.finding === finding.finding ? '3px solid #8b5cf6' : '3px solid transparent', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8b5cf6' }}>RT-00{idx + 1}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${severityColor[finding.severity] || '#ef4444'}15`, color: severityColor[finding.severity] || '#ef4444', fontWeight: 700 }}>{finding.severity}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }}>{finding.category}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{finding.finding}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No active findings identified. Select a scenario and validate the strategy.</div>
            )}
          </GlassCard>

          {/* Critique & Risks */}
          <GlassCard style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={16} /> Adversarial Critique & Risk Mitigation Plan
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              {activeRtData.critique}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Weak Assumptions</div>
                {activeRtData.weak_assumptions?.map((wa, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    <ChevronRight size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                    <span>{wa}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Ignored Threat Vectors</div>
                {activeRtData.ignored_risks?.map((ir, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    <ChevronRight size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                    <span>{ir}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase' }}>Final Adjusted Strategy</div>
              <div style={{ fontSize: 12.5, color: '#22c55e', fontWeight: 600, lineHeight: 1.5 }}>
                {activeRtData.final_recommendation}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Detail Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Radar Chart */}
          <GlassCard className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Resilience by Vector</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                <Radar dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.18} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Strategy Recommendation Input */}
          <GlassCard className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Adversarial Strategy Input</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Active Recommendation</label>
              <textarea
                value={recommendationText}
                onChange={(e) => setRecommendationText(e.target.value)}
                style={{
                  width: '100%',
                  height: 90,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 12,
                  color: 'white',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
              />
            </div>

            {selectedFinding && (
              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Vulnerability Detail</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>{selectedFinding.category}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{selectedFinding.finding}</div>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => handleValidate()} disabled={running}>
              {running ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />Running...</> : <><Play size={14} />Run Stress Test</>}
            </button>
          </GlassCard>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
