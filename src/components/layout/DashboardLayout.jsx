import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pause, SkipForward, SkipBack, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { triggerDemoStep } from '../../services/api.js';
import { useScenario } from '../../context/ScenarioContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

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

export default function DashboardLayout({ children, crisisMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { demoState, timelineData, refreshState } = useScenario();
  const { warnCountdown, logout } = useAuth();
  
  const [demoActive, setDemoActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(16); // 16 seconds per page

  // Sync state from localStorage & context on mount & route change
  useEffect(() => {
    const active = localStorage.getItem('urja_demo_active') === 'true';
    setDemoActive(active);
    if (demoState) {
      setStepIdx(demoState.current_step);
    } else {
      const step = parseInt(localStorage.getItem('urja_demo_step') || '0', 10);
      setStepIdx(step);
    }
    setTimeLeft(16); // Reset timer
  }, [location.pathname, demoState]);

  // Main countdown timer for Auto-Navigation (16 seconds)
  useEffect(() => {
    if (!demoActive) return;

    // Verify if we are on the correct route for the active step.
    const currentStepRoute = STEP_ROUTES[stepIdx];
    if (currentStepRoute && location.pathname !== currentStepRoute && location.pathname !== '/demo-mode') {
      navigate(currentStepRoute);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const total = demoState?.total_steps || timelineData?.events?.length || 11;
          const nextIdx = (stepIdx + 1) % total;
          localStorage.setItem('urja_demo_step', String(nextIdx));
          setStepIdx(nextIdx);
          triggerDemoStep(nextIdx).then(() => {
            refreshState();
          }).catch(() => {});
          const nextRoute = STEP_ROUTES[nextIdx];
          if (nextRoute) navigate(nextRoute);
          return 16;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [demoActive, stepIdx, location.pathname, navigate, demoState, timelineData, refreshState]);

  // AUTO-CLICK & SCROLL SEQUENCES FOR DEMO MODE
  useEffect(() => {
    if (!demoActive) return;

    // 1. Auto-Click useful buttons after 3 seconds
    const clickTimer = setTimeout(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      
      const targetKeywords = [
        'run assessment', 'run simulation', 'optimize drawdown', 'approve plan',
        'approve drawdown', 'approve match', 'analyze network', 'challenge assumptions',
        'generate brief', 'approve brief', 'resolve crisis', 'authorize action plan',
        'verify sanctions', 'validate model', 'run test', 'apply advisory', 'approve'
      ];

      let foundButton = null;
      for (const keyword of targetKeywords) {
        foundButton = buttons.find(btn => 
          btn.textContent?.toLowerCase().includes(keyword) && 
          !btn.disabled &&
          btn.offsetWidth > 0 && btn.offsetHeight > 0
        );
        if (foundButton) break;
      }

      // Fallback to first primary button if no keyword matches
      if (!foundButton) {
        foundButton = buttons.find(btn => 
          btn.className?.includes('btn-primary') && 
          !btn.disabled && 
          !btn.textContent?.toLowerCase().includes('demo') && 
          !btn.textContent?.toLowerCase().includes('pause') &&
          !btn.textContent?.toLowerCase().includes('save')
        );
      }

      if (foundButton) {
        console.log('Walkthrough Auto-Clicker: Clicking', foundButton.textContent);
        
        // Neon green visual flash indicator so users notice the click
        const origOutline = foundButton.style.outline;
        const origBoxShadow = foundButton.style.boxShadow;
        foundButton.style.outline = '3px solid #4ade80';
        foundButton.style.boxShadow = '0 0 20px #4ade80';
        
        setTimeout(() => {
          foundButton.style.outline = origOutline;
          foundButton.style.boxShadow = origBoxShadow;
        }, 1000);

        foundButton.click();
      }
    }, 3000);

    // 2. Smoothly scroll down after 7 seconds targeting the actual .page-content scroll container
    const scrollDownTimer = setTimeout(() => {
      const pageContentEl = document.querySelector('.page-content');
      if (pageContentEl) {
        pageContentEl.scrollTo({ 
          top: pageContentEl.scrollHeight - pageContentEl.clientHeight || 1200, 
          behavior: 'smooth' 
        });
      }
    }, 7000);

    // 3. Smoothly scroll back to top after 13 seconds
    const scrollUpTimer = setTimeout(() => {
      const pageContentEl = document.querySelector('.page-content');
      if (pageContentEl) {
        pageContentEl.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        });
      }
    }, 13000);

    return () => {
      clearTimeout(clickTimer);
      clearTimeout(scrollDownTimer);
      clearTimeout(scrollUpTimer);
    };
  }, [demoActive, location.pathname]);

  const handlePause = () => {
    localStorage.setItem('urja_demo_active', 'false');
    setDemoActive(false);
    navigate('/demo-mode');
  };

  const handlePrev = async () => {
    const total = demoState?.total_steps || timelineData?.events?.length || 11;
    const prevIdx = (stepIdx - 1 + total) % total;
    localStorage.setItem('urja_demo_step', String(prevIdx));
    setStepIdx(prevIdx);
    try {
      await triggerDemoStep(prevIdx);
      await refreshState();
      const prevRoute = STEP_ROUTES[prevIdx];
      if (prevRoute) navigate(prevRoute);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNext = async () => {
    const total = demoState?.total_steps || timelineData?.events?.length || 11;
    const nextIdx = (stepIdx + 1) % total;
    localStorage.setItem('urja_demo_step', String(nextIdx));
    setStepIdx(nextIdx);
    try {
      await triggerDemoStep(nextIdx);
      await refreshState();
      const nextRoute = STEP_ROUTES[nextIdx];
      if (nextRoute) navigate(nextRoute);
    } catch (e) {
      console.error(e);
    }
  };

  const currentEvent = timelineData?.events?.[stepIdx] || { time: '09:00', event: 'Normal Operations', risk: 24 };
  const isCritical = currentEvent.risk >= 80;
  const statusColor = isCritical ? '#ef4444' : currentEvent.risk >= 60 ? '#f59e0b' : '#22c55e';

  return (
    <div className={`dashboard-layout ${crisisMode ? 'crisis-mode' : ''}`}>
      <Sidebar crisisMode={crisisMode} />
      <div className="main-content">
        <Topbar crisisMode={crisisMode} />

        {/* ── Inactivity Warning Banner ─────────────────────────────────── */}
        {warnCountdown !== null && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999999,
            background: warnCountdown <= 10
              ? 'linear-gradient(90deg, rgba(220,38,38,0.95), rgba(239,68,68,0.9))'
              : 'linear-gradient(90deg, rgba(180,83,9,0.95), rgba(245,158,11,0.9))',
            backdropFilter: 'blur(8px)',
            borderBottom: `1px solid ${warnCountdown <= 10 ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.6)'}`,
            padding: '10px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{warnCountdown <= 10 ? '🚨' : '⚠️'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }}>
                  {warnCountdown <= 10 ? 'SECURITY LOCKOUT IMMINENT' : 'SESSION INACTIVITY WARNING'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1 }}>
                  Auto-logout in <strong>{warnCountdown}s</strong> due to inactivity.
                  Move your mouse or press a key to stay logged in.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Circular countdown */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: `3px solid ${warnCountdown <= 10 ? '#fca5a5' : '#fde68a'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14, color: '#fff',
                background: 'rgba(0,0,0,0.25)',
                fontFamily: 'monospace',
                boxShadow: warnCountdown <= 10 ? '0 0 12px rgba(239,68,68,0.6)' : 'none',
              }}>
                {warnCountdown}
              </div>
              <button onClick={() => logout()} style={{
                padding: '5px 14px', background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 7,
                color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>Logout Now</button>
            </div>
          </div>
        )}

        <div className="page-content" style={{ paddingBottom: demoActive ? 110 : 24, paddingTop: warnCountdown !== null ? 52 : undefined }}>
          {children}
        </div>
      </div>

      {/* Floating Demo Control Overlay HUD */}
      {demoActive && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: 'calc(50% + 120px)',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 300px)',
          maxWidth: 960,
          background: 'rgba(6, 15, 35, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 229, 255, 0.35)'}`,
          boxShadow: `0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px ${isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 229, 255, 0.08)'}`,
          borderRadius: 14,
          padding: '12px 20px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          color: '#f8fafc',
          fontFamily: 'inherit',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', gap: 20 }}>
            {/* Left: Step Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: `${statusColor}1c`,
                border: `1px solid ${statusColor}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={16} color={statusColor} style={{
                  animation: 'pulse 1.5s infinite ease-in-out'
                }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 900, color: '#00e5ff', background: 'rgba(0,229,255,0.08)', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>
                    AUTOPILOT TOUR · STEP {stepIdx + 1}/{demoState?.total_steps || timelineData?.events?.length || 11}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>({currentEvent.time})</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{currentEvent.event}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {timeLeft > 13 ? '🔍 Initializing view...' : timeLeft > 9 ? '⚡ Triggering auto-click action...' : timeLeft > 3 ? '📜 Scrolling down to analyze detailed data...' : '⬆️ Preparing next view...'} — {STEP_AI[stepIdx] || currentEvent.event}
                </div>
              </div>
            </div>

            {/* Right: Interactive Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button 
                  onClick={handlePrev}
                  className="btn btn-secondary btn-icon" 
                  style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Previous Step"
                >
                  <SkipBack size={13} />
                </button>
                <button 
                  onClick={handlePause} 
                  className="btn btn-danger" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: '6px 14px',
                    height: 32,
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.25)'
                  }}
                >
                  <Pause size={13} /> Pause Tour
                </button>
                <button 
                  onClick={handleNext}
                  className="btn btn-secondary btn-icon" 
                  style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Next Step"
                >
                  <SkipForward size={13} />
                </button>
              </div>

              {/* Step Timeout Counter */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                color: '#00e5ff',
                minWidth: 90,
                textAlign: 'center'
              }}>
                Auto-Next: {timeLeft}s
              </div>
            </div>
          </div>

          {/* Progress Bar (countdown visual) */}
          <div style={{
            width: '100%',
            height: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(timeLeft / 16) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${statusColor}, #8b5cf6)`,
              transition: 'width 1s linear',
              borderRadius: 2
            }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 40px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
