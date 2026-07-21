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

const STEP_AI = [
  'Monitoring baseline energy routes across India refinery network.',
  'Geopolitical feeds detect abnormal escalation near Strait of Hormuz.',
  'Risk Intelligence correlates maritime delays and insurance spikes.',
  'Economic Impact Engine estimates fuel-price and fiscal exposure at Rs 2.4L Cr.',
  'Scenario Simulator models Hormuz closure - 2.4M bbl/day supply gap for India.',
  'Procurement Optimizer selects West Africa route due to lower sanctions exposure.',
  'SPR Planner recommends calibrated 5M bbl strategic petroleum reserve drawdown.',
  'Compliance Shield clears legal, sanctions, and policy checks for West Africa.',
  'Red Team Validator challenges assumptions and confirms revised response plan.',
  'AI Action Brief generates official PMO-style response brief with 4 actions.',
  'Executive Decision Board approves procurement reroute and SPR plan.'
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

  // Autoplay loop using nextDemoStep()
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
          // If live tour is enabled, auto navigate page-by-page
          if (tourType === 'live') {
            const nextStepIdx = currentStep + 1;
            if (STEP_ROUTES[nextStepIdx]) {
              navigate(STEP_ROUTES[nextStepIdx]);
            }
          }
        } catch (err) {
          console.error("Autoplay advance failed:", err);
          setLocalPlaying(false);
        }
      }, 3500);
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
      addToast('Demo state reset to 09:00 baseline.', 'info');
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
  
  const isCritical = activeEvent.risk >= 80;
  const rc = getRiskColor(activeEvent.risk);

  const riskChartData = events.map(s => ({ time: s.time, risk: s.risk }));

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
            CRITICAL SYSTEM TRIGGER DETECTED (Risk Score: {activeEvent.risk}/100) — Escalation Plan Active
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
              {tourType === 'live' ? 'Live Autopilot active. Redirecting through pages...' : 'Sandbox Preview active. Timeline is changing locally. Monitor widgets below.'}
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
            Crisis Timeline Sequence ({events.length} steps)
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 95, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.06)' }} />
            {events.map((s, i) => {
              const isActive = i === currentStepIdx;
              const isPast = i < currentStepIdx;
              const src = getRiskColor(s.risk);
              return (
                <div key={i} onClick={() => handleSelectStep(i)} style={{ display: 'flex', gap: 12, marginBottom: 8, cursor: 'pointer', opacity: isPast && !localPlaying ? 0.6 : 1, transition: 'all 0.2s' }}>
                  <div style={{ width: 96, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <span style={{ fontSize: 11, color: isActive ? '#00e5ff' : 'var(--text-dim)', fontWeight: isActive ? 700 : 500 }}>{s.time}</span>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: isActive ? src : isPast ? '#334155' : 'rgba(255,255,255,0.1)', border: `2px solid ${isActive ? src : 'rgba(255,255,255,0.1)'}`, boxShadow: isActive ? `0 0 8px ${src}` : 'none', flexShrink: 0, zIndex: 1, position: 'relative', transition: 'all 0.2s' }} />
                  </div>
                  <div style={{ flex: 1, background: isActive ? 'rgba(29,140,255,0.07)' : 'transparent', border: isActive ? '1px solid rgba(29,140,255,0.2)' : '1px solid transparent', borderRadius: 8, padding: '8px 12px', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isActive ? 4 : 0 }}>
                      <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.event}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: src }}>{s.risk}</span>
                    </div>
                    {isActive && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{STEP_AI[i] || s.event}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Right: Interactive Sandbox Timeline Widget Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassCard glow={isCritical ? 'red' : activeEvent.risk >= 60 ? 'amber' : 'blue'} style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Sandbox Step Telemetry</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: rc, lineHeight: 1 }}>{activeEvent.risk}<span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 500 }}>/100</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>Risk Score</div>
            <StatusBadge status={activeEvent.type || 'ACTIVE'} />
            <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: '#00e5ff', marginBottom: 3 }}>Active Module</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{STEP_MODULES[currentStepIdx] || 'System'}</div>
            </div>
            <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>AI Context</div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{STEP_AI[currentStepIdx] || activeEvent.event}</p>
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

        <GlassCard style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Mini Crisis Map</div>
          <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-soft)', borderRadius: 8, background: 'rgba(255,255,255,0.01)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Grid sector nodes mapping at {activeEvent.time}</span>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
