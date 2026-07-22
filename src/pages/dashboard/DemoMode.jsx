import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, ArrowLeft, AlertTriangle, Sparkles, Navigation, Monitor, Radio, CheckCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { usePipeline } from '../../context/PipelineContext.jsx';
import { triggerDemoStep } from '../../services/api.js';
import CrisisUploadModal from '../../components/ui/CrisisUploadModal.jsx';


const STEP_ROUTES = [
  '/command-center',
  '/risk-intelligence',
  '/risk-intelligence',
  '/economic-impact',
  '/scenario-simulator',
  '/procurement-optimizer',
  '/spr-planner',
  '/compliance-shield',
  '/red-team-validator',
  '/action-brief',
  '/executive-decision-board'
];

const STEP_MODULES = [
  'Command Center',
  'Risk Intelligence',
  'Risk Intelligence',
  'Economic Impact',
  'Scenario Simulator',
  'Procurement Optimizer',
  'SPR Planner',
  'Compliance Shield',
  'Red Team Validator',
  'AI Action Brief',
  'Executive Board'
];

const STEP_NEXT = [
  'Continue monitoring Hormuz shipping lanes',
  'Correlate maritime and insurance data',
  'Estimate economic exposure',
  'Run disruption scenario',
  'Select alternate procurement route',
  'Generate SPR bridge plan',
  'Clear compliance and legal checks',
  'Red Team challenge',
  'Generate minister brief',
  'Executive approval',
  'Monitor implementation'
];

const STEP_CONFIDENCE = [96, 81, 78, 74, 71, 83, 87, 92, 87, 91, 95];

function getRiskColor(risk) {
  if (risk >= 80) return '#ef4444';
  if (risk >= 60) return '#f97316';
  if (risk >= 40) return '#f59e0b';
  return '#22c55e';
}

// ── Fix 3: Live clock step time calculator ──────────────────────────────────
function getLiveStepTime(stepIdx) {
  const now = new Date();
  // Add stepIdx * 25 minutes to current local time to create dynamic live progression
  const stepDate = new Date(now.getTime() + stepIdx * 25 * 60 * 1000);
  return stepDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ── Fix 5: Dynamic AI Context connected to live backend pipelineState ──────
function getDynamicAIContext(stepIdx, pipelineState, fallbackEvent) {
  if (!pipelineState) return fallbackEvent;
  const scenarioName = pipelineState.active_scenario?.name || 'Hormuz Crisis';
  const kpi = pipelineState.state?.kpi || {};
  const riskScore = kpi.risk_score || 32;
  const crisisLevel = kpi.crisis_level || 'NORMAL';
  const supplyGap = kpi.supply_gap || '0M bbl/day';
  const sprCov = kpi.spr_coverage || 64;

  switch (stepIdx) {
    case 0:
      return `Monitoring baseline energy routes. Current Threat Level: ${crisisLevel} (Global Risk Score: ${riskScore}/100).`;
    case 1:
      return `Geopolitical feeds detect abnormal escalation under ${scenarioName}. Supply gap estimated at ${supplyGap}.`;
    case 2:
      return pipelineState.risk?.recommendation || `Risk Intelligence correlates maritime delays and insurance spikes near Hormuz. Overall Threat: ${riskScore}/100.`;
    case 3:
      return `Economic Impact Engine estimates daily fiscal impact under ${scenarioName}. Brent price benchmark at $${pipelineState.state?.brent_price || 88}/bbl.`;
    case 4:
      return `Scenario Simulator models ${scenarioName} — projected deficit of ${supplyGap} for Indian refineries.`;
    case 5:
      return pipelineState.procurement?.recommended_action || `Procurement Optimizer selects alternative supply routes bypassing high-risk zones.`;
    case 6:
      return pipelineState.spr?.drawdown_recommendation || `SPR Planner recommends calibrated release from Visakhapatnam & Mangaluru caverns (Current SPR: ${sprCov}%).`;
    case 7:
      return `Compliance Shield confirms OFAC, maritime insurance, and legal clearance for alternative crude contracts.`;
    case 8:
      return `Red Team Validator stress-tests resilience strategy against secondary disruptions and vessel availability.`;
    case 9:
      return `AI Action Brief compiles executive escalation report for PMO & Cabinet Committee on Security.`;
    case 10:
      return `Executive Decision Board ratifies strategic procurement rerouting and ${supplyGap} SPR drawdown.`;
    default:
      return fallbackEvent;
  }
}

// ── Fix 6: SVG Mini Crisis Map with animated vector nodes ───────────────────
function MiniCrisisMap({ riskScore }) {
  const rc = getRiskColor(riskScore);
  const isHigh = riskScore >= 70;

  const hotspots = [
    { name: 'Hormuz Strait', x: 45, y: 75, risk: riskScore },
    { name: 'Jamnagar (RIL)', x: 125, y: 82, risk: Math.min(100, riskScore + 4) },
    { name: 'Mumbai Port', x: 140, y: 110, risk: Math.max(20, riskScore - 8) },
    { name: 'Mangaluru / Kochi', x: 165, y: 155, risk: Math.max(15, riskScore - 12) },
    { name: 'Paradip / Vizag', x: 235, y: 105, risk: Math.max(10, riskScore - 15) },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: 160, background: 'rgba(8,18,35,0.6)', borderRadius: 10, border: '1px solid var(--border-soft)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="100%" height="100%" viewBox="0 0 320 180" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(13,29,56,0.8), rgba(6,12,24,0.95))' }}>
        {/* Subtle grid lines */}
        <line x1="0" y1="45" x2="320" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1="90" x2="320" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1="135" x2="320" y2="135" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="80" y1="0" x2="80" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="160" y1="0" x2="160" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="240" y1="0" x2="240" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

        {/* Stylized maritime route paths */}
        <path d="M 45 75 Q 85 95 125 82 T 140 110 T 165 155" fill="none" stroke={rc} strokeWidth="1.8" strokeDasharray="4 3" opacity="0.85">
          {isHigh && <animate attributeName="stroke-dashoffset" from="14" to="0" dur="1.2s" repeatCount="indefinite" />}
        </path>
        <path d="M 125 82 Q 180 60 235 105" fill="none" stroke="#1d8cff" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

        {/* India Subcontinent Simplified Outline */}
        <path d="M 120 40 L 170 35 L 210 50 L 250 85 L 260 115 L 235 140 L 195 175 L 165 170 L 150 145 L 135 110 L 115 80 Z" fill="rgba(29,140,255,0.04)" stroke="rgba(29,140,255,0.25)" strokeWidth="1.2" />

        {/* Hotspot Nodes */}
        {hotspots.map((h, idx) => {
          const color = getRiskColor(h.risk);
          return (
            <g key={idx}>
              {/* Outer pulsing ring */}
              <circle cx={h.x} cy={h.y} r="10" fill={color} opacity="0.2">
                <animate attributeName="r" values="6;14;6" dur={`${1.5 + idx * 0.3}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.05;0.4" dur={`${1.5 + idx * 0.3}s`} repeatCount="indefinite" />
              </circle>
              {/* Center dot */}
              <circle cx={h.x} cy={h.y} r="4" fill={color} stroke="#081223" strokeWidth="1.5" />
              {/* Label */}
              <text x={h.x + 7} y={h.y + 3} fill="#94a3b8" fontSize="8" fontWeight="600" fontFamily="sans-serif">{h.name}</text>
            </g>
          );
        })}
      </svg>
      {/* Overlay info tag */}
      <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(8,18,35,0.85)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-soft)', fontSize: 9, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: rc }} />
        <span>Sector Telemetry: {riskScore}/100</span>
      </div>
    </div>
  );
}

export default function DemoMode() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { 
    pipelineState, 
    loading, 
    offline, 
    refreshPipeline, 
    runPipeline, 
    uploadScenario,
    nextDemoStep, 
    resetDemo, 
    activateScenario 
  } = usePipeline();
  
  // States
  const [tourType, setTourType] = useState('sandbox'); // 'live' or 'sandbox'
  const [localPlaying, setLocalPlaying] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const localIntervalRef = useRef(null);

  // Sync initial state from localStorage if active
  useEffect(() => {
    const isLiveActive = localStorage.getItem('urja_demo_active') === 'true';
    if (isLiveActive) {
      setTourType('live');
    }
  }, []);

  // Initialize: if no active scenario exists on boot, activate hormuz_closure
  useEffect(() => {
    const initScenario = async () => {
      if (pipelineState && (!pipelineState.active_scenario?.id || pipelineState.active_scenario?.name === 'No Active Scenario')) {
        try {
          await activateScenario('hormuz_closure');
        } catch (err) {
          console.error("Failed to activate default scenario:", err);
        }
      }
    };
    initScenario();
  }, [pipelineState, activateScenario]);

  // ── Fix 7: Autoplay loop + Automated button click & scrolling for Live Tour ──
  useEffect(() => {
    if (localPlaying) {
      localIntervalRef.current = setInterval(async () => {
        const currentStep = pipelineState?.demo?.current_step ?? 0;
        const totalSteps = pipelineState?.demo?.total_steps ?? 11;
        if (currentStep >= totalSteps - 1) {
          setLocalPlaying(false);
          addToast('Simulation walkthrough complete.', 'success');
          return;
        }
        try {
          await nextDemoStep();
          const nextStepIdx = currentStep + 1;

          if (tourType === 'live') {
            const nextRoute = STEP_ROUTES[nextStepIdx];
            if (nextRoute) {
              navigate(nextRoute);
              // Automated sequence: scroll down -> click button -> scroll up
              setTimeout(() => {
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }, 600);
              setTimeout(() => {
                // Find primary or secondary button on target page to simulate interactive click
                const btn = document.querySelector('.btn-primary') || document.querySelector('.btn-secondary');
                if (btn && typeof btn.click === 'function') {
                  btn.click();
                }
              }, 1400);
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 2200);
            }
          }
        } catch (err) {
          console.error("Autoplay advance failed:", err);
          setLocalPlaying(false);
        }
      }, 4000);
    } else {
      clearInterval(localIntervalRef.current);
    }
    return () => clearInterval(localIntervalRef.current);
  }, [localPlaying, tourType, pipelineState, nextDemoStep, navigate, addToast]);

  const handleStartWalkthrough = async () => {
    addToast('Initializing demo state and executing intelligence pipeline...', 'info');
    try {
      await resetDemo();
      await runPipeline();
      setLocalPlaying(true);
      if (tourType === 'live') {
        localStorage.setItem('urja_demo_active', 'true');
        addToast('Starting Live Autopilot Tour.', 'success');
      } else {
        addToast('Starting Sandbox Timeline Preview.', 'info');
      }
    } catch (err) {
      addToast('Failed to initialize demo: ' + (err.message || 'connection error'), 'error');
    }
  };

  const handlePauseWalkthrough = () => {
    setLocalPlaying(false);
    localStorage.setItem('urja_demo_active', 'false');
    addToast('Walkthrough paused.', 'info');
  };

  const handleResetWalkthrough = async () => {
    localStorage.setItem('urja_demo_active', 'false');
    setLocalPlaying(false);
    try {
      await resetDemo();
      addToast('Demo state reset to baseline.', 'info');
    } catch (err) {
      addToast('Failed to reset demo state.', 'error');
    }
  };

  const handleSelectStep = async (index) => {
    try {
      await triggerDemoStep(index);
      await refreshPipeline();
      // In live mode, selection triggers direct navigation
      if (tourType === 'live') {
        navigate(STEP_ROUTES[index]);
      }
    } catch (err) {
      addToast('Failed to change step.', 'error');
    }
  };

  if (!pipelineState) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <AlertTriangle size={48} style={{ color: '#f59e0b' }} />
          <h2>System Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached data is available.</p>
          <button className="btn btn-primary" onClick={refreshPipeline}>
            <RotateCcw size={14} style={{ marginRight: 6 }} /> Retry Connection
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const currentStepIdx = pipelineState.demo?.current_step ?? 0;
  const events = pipelineState.timeline?.events || [];
  const activeEvent = events[currentStepIdx] || { time: '09:00', event: 'No active event', risk: 24, type: 'INFO' };
  
  // ── Fix 4: Synchronize risk score with global backend KPI risk score ───────
  const globalKpiRisk = pipelineState.state?.kpi?.risk_score;
  const displayRiskScore = globalKpiRisk !== undefined ? globalKpiRisk : activeEvent.risk;
  const isCritical = displayRiskScore >= 80;
  const rc = getRiskColor(displayRiskScore);

  // Dynamic live timeline events with live times & dynamic AI context
  const liveEvents = events.map((s, idx) => ({
    ...s,
    time: getLiveStepTime(idx),
    // Ensure every step's risk score is taken directly from backend calculation
    risk: s.risk !== undefined ? s.risk : (idx === currentStepIdx ? displayRiskScore : 10),
    aiContext: getDynamicAIContext(idx, pipelineState, s.event)
  }));

  // For the chart, replace the active step's value with the authoritative backend KPI score
  const riskChartData = liveEvents.map((s, idx) => ({
    time: s.time,
    risk: idx === currentStepIdx ? displayRiskScore : s.risk,
  }));


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

      <PageHeader
        title="Crisis Story Mode"
        subtitle={`Experience a fully automated, cinematic tour of the UrjaNetra AI platform during a national energy emergency (${pipelineState.active_scenario?.name || 'Hormuz closure'}).`}
        badge={{ label: 'PILOT MODULE', color: '#8b5cf6' }}
        actions={
          <>
            <button className="btn btn-primary btn-sm" onClick={() => setShowUploadModal(true)}>
              Upload Crisis Feed
            </button>
            <button className="btn btn-secondary btn-sm" onClick={runPipeline}>
              <Radio size={12} /> Run Pipeline
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleResetWalkthrough}>
              <RotateCcw size={12} /> Reset
            </button>
            <button 
              className={localPlaying ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'} 
              onClick={localPlaying ? handlePauseWalkthrough : handleStartWalkthrough}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {localPlaying ? (
                <><Pause size={12} /> Pause Demo</>
              ) : (
                <><Play size={12} /> Start Demo</>
              )}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/command-center')}>
              <ArrowLeft size={12} /> Command Center
            </button>
          </>
        }
      />

      <CrisisUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        onUploadSuccess={uploadScenario} 
      />

      {/* Mode Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        <GlassCard 
          onClick={() => {
            if (localPlaying) setLocalPlaying(false);
            setTourType('sandbox');
          }}
          style={{ 
            padding: '16px 20px', 
            cursor: 'pointer',
            border: `1px solid ${tourType === 'sandbox' ? 'rgba(0, 229, 255, 0.45)' : 'var(--border-soft)'}`,
            background: tourType === 'sandbox' ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(0, 229, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00e5ff'
            }}><Monitor size={16} /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Sandbox Timeline Previewer</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Animate steps locally on this page. No routing changes or page loading.</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard 
          onClick={() => {
            setTourType('live');
          }}
          style={{ 
            padding: '16px 20px', 
            cursor: 'pointer',
            border: `1px solid ${tourType === 'live' ? 'rgba(139, 92, 246, 0.45)' : 'var(--border-soft)'}`,
            background: tourType === 'live' ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(139, 92, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a78bfa'
            }}><Navigation size={16} /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Live Autopilot Tour (Recommended)</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Auto-navigates page-by-page with automated scrolling &amp; smart button clicks.</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {isCritical && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} style={{ color: '#ef4444' }} />
          <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: 13 }}>
            CRITICAL SYSTEM TRIGGER DETECTED (Risk Score: {displayRiskScore}/100) — Escalation Plan Active
          </span>
        </div>
      )}

      {localPlaying && (
        <div style={{ 
          background: 'rgba(0, 229, 255, 0.05)', 
          border: '1px solid rgba(0, 229, 255, 0.2)', 
          borderRadius: 10, 
          padding: '12px 20px', 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={16} color="#00e5ff" />
            <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>
              {tourType === 'live' ? 'Live Autopilot active. Redirecting through pages with interactive clicks...' : 'Sandbox Preview active. Timeline is changing locally. Monitor widgets below.'}
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handlePauseWalkthrough} style={{ padding: '4px 12px', fontSize: 11 }}>
            Pause Walkthrough
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Left: Step Info/Details */}
        <GlassCard style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            Crisis Timeline Sequence ({liveEvents.length} steps)
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 95, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.06)' }} />
            {liveEvents.map((s, i) => {
              const isActive = i === currentStepIdx;
              const isPast = i < currentStepIdx;
              const stepRiskScore = isActive ? (displayRiskScore !== undefined ? displayRiskScore : s.risk) : s.risk;
              const src = getRiskColor(stepRiskScore);
              return (
                <div key={i} onClick={() => handleSelectStep(i)} style={{ display: 'flex', gap: 12, marginBottom: 8, cursor: 'pointer', opacity: isPast && !localPlaying ? 0.6 : 1, transition: 'all 0.2s' }}>
                  <div style={{ width: 96, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <span style={{ fontSize: 11, color: isActive ? '#00e5ff' : 'var(--text-dim)', fontWeight: isActive ? 700 : 500 }}>{s.time}</span>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: isActive ? src : isPast ? '#334155' : 'rgba(255,255,255,0.1)', border: `2px solid ${isActive ? src : 'rgba(255,255,255,0.1)'}`, boxShadow: isActive ? `0 0 8px ${src}` : 'none', flexShrink: 0, zIndex: 1, position: 'relative', transition: 'all 0.2s' }} />
                  </div>
                  <div style={{ flex: 1, background: isActive ? 'rgba(29,140,255,0.07)' : 'transparent', border: isActive ? '1px solid rgba(29,140,255,0.2)' : '1px solid transparent', borderRadius: 8, padding: '8px 12px', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isActive ? 4 : 0 }}>
                      <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.event}</span>
                    </div>
                    {isActive && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{s.aiContext}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Right: Interactive Sandbox Timeline Widget Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassCard glow={isCritical ? 'red' : displayRiskScore >= 60 ? 'amber' : 'blue'} style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Sandbox Step Telemetry</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: rc, lineHeight: 1 }}>{displayRiskScore}<span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 500 }}>/100</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>Backend Synced KPI Risk Score</div>
            <StatusBadge status={activeEvent.type || 'ACTIVE'} />
            <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: '#00e5ff', marginBottom: 3 }}>Active Module</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{STEP_MODULES[currentStepIdx] || 'System'}</div>
            </div>
            <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>AI Context</div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {getDynamicAIContext(currentStepIdx, pipelineState, activeEvent.event)}
              </p>
            </div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--text-dim)' }}>Confidence Level</span>
              <span style={{ fontWeight: 700, color: '#4ade80' }}>{STEP_CONFIDENCE[currentStepIdx] || 90}%</span>
            </div>
            <div style={{ marginTop: 8, padding: '7px 10px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: '#a78bfa', marginBottom: 2 }}>Next Escalation</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{STEP_NEXT[currentStepIdx] || 'Escalate response'}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ flex: 1 }} 
                onClick={nextDemoStep}
              >
                Next Step
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ flex: 1 }} 
                onClick={() => {
                  const targetRoute = STEP_ROUTES[currentStepIdx];
                  if (targetRoute) {
                    addToast(`Navigating to ${STEP_MODULES[currentStepIdx]} module...`, 'info');
                    navigate(targetRoute);
                  }
                }}
              >
                Jump to Page
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 0.5 }} onClick={handleResetWalkthrough}>Reset</button>
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '12px 14px', background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' }}>
            <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700, marginBottom: 5 }}>LOCAL SIMULATION PREVIEW</div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              Select "Sandbox Timeline Previewer" above and click Play to preview the response feed, risk score evolution, and map vectors locally inside this tab.
            </p>
          </GlassCard>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <GlassCard style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Risk Score Evolution</div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={riskChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,130,255,0.07)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(8,18,35,0.97)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2.5} fill="url(#riskGrad)" dot={{ fill: '#ef4444', r: 3 }} name="Risk Score" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* ── Mini Crisis Map SVG Card ────────────────────────────────────── */}
        <GlassCard style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Mini Crisis Map</div>
          <MiniCrisisMap riskScore={displayRiskScore} activeEvent={activeEvent} />
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}

