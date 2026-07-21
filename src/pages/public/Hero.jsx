import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Shield, Zap, Globe, BarChart2, Target, Users, CheckCircle, Star } from 'lucide-react';

const SECTIONS = ['hero', 'features', 'how-it-works', 'use-cases', 'about'];

function GlowMap() {
  const nodes = [
    {x:148,y:148,c:'#00bfff',p:2},{x:295,y:175,c:'#00e5ff',p:2.4},
    {x:290,y:205,c:'#8b5cf6',p:1.8},{x:190,y:190,c:'#22c55e',p:2.2},
    {x:240,y:265,c:'#1d8cff',p:2.6},{x:185,y:260,c:'#8b5cf6',p:2.1},
    {x:258,y:118,c:'#f59e0b',p:1.6},{x:220,y:308,c:'#00e5ff',p:2.8},
  ];
  return (
    <svg viewBox="0 0 400 340" style={{width:'100%',height:'100%'}}>
      <defs>
        <radialGradient id="hbg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#0a1628"/><stop offset="100%" stopColor="#020810"/></radialGradient>
        <radialGradient id="hig" cx="50%" cy="70%" r="60%"><stop offset="0%" stopColor="rgba(0,191,255,0.22)"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        <filter id="hg"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="hsg"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="340" fill="url(#hbg)"/>
      {[...Array(10)].map((_,i)=>[...Array(9)].map((_,j)=><circle key={`${i}${j}`} cx={i*44+2} cy={j*40+2} r="0.8" fill="rgba(29,140,255,0.1)"/>))}
      <ellipse cx="210" cy="200" rx="115" ry="150" fill="url(#hig)"/>
      <polygon points="130,30 180,25 220,32 255,38 280,55 300,75 318,100 325,130 320,160 310,185 325,210 330,235 318,265 300,290 275,305 250,310 225,308 200,295 178,275 160,255 150,230 142,205 138,180 135,155 138,128 148,105 155,80 148,55" fill="rgba(0,191,255,0.06)" stroke="rgba(0,191,255,0.75)" strokeWidth="1.8" filter="url(#hg)"/>
      {nodes.map((n,i)=>(
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="18" fill="none" stroke={n.c} strokeWidth="0.8" opacity="0.3">
            <animate attributeName="r" values="8;22;8" dur={`${n.p}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0;0.3" dur={`${n.p}s`} repeatCount="indefinite"/>
          </circle>
          <circle cx={n.x} cy={n.y} r="5" fill={n.c} filter="url(#hsg)" opacity="0.9"/>
          <circle cx={n.x} cy={n.y} r="2.5" fill="white" opacity="0.9"/>
        </g>
      ))}
      <ellipse cx="210" cy="330" rx="140" ry="20" fill="rgba(0,191,255,0.18)" filter="url(#hg)"/>
    </svg>
  );
}

const navItems = ['Features','How It Works','Use Cases','About'];

export default function Hero() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [active, setActive] = useState(0);
  const sectionRefs = useRef([]);

  // Scroll-snap observer
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = sectionRefs.current.indexOf(e.target);
          if (idx !== -1) setActive(idx);
        }
      });
    }, { root: containerRef.current, threshold: 0.5 });
    sectionRefs.current.forEach(s => s && obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (i) => sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={{ background: '#020810', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#f1f5f9' }}>
      {/* Fixed nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(2,8,16,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(90,130,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0066cc,#00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,229,255,0.35)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="#fff" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="3" fill="#00e5ff"/></svg>
          </div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800 }}>UrjaNetra <span style={{ background: 'linear-gradient(90deg,#1d8cff,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {navItems.map((n, i) => (
            <button key={n} onClick={() => scrollTo(i + 1)} style={{ background: 'none', border: 'none', color: active === i + 1 ? '#60b4ff' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s' }}>{n}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/login')} style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(29,140,255,0.3)', background: 'transparent', color: '#60b4ff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sign In</button>
          <button onClick={() => navigate('/login')} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1d8cff,#8b5cf6)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(29,140,255,0.3)' }}>
            Launch War Room →
          </button>
        </div>
      </nav>

      {/* Scroll container */}
      <div ref={containerRef} style={{ height: '100vh', overflowY: 'scroll', scrollSnapType: 'y mandatory', paddingTop: 64 }}>

        {/* ── SECTION 1: HERO ── */}
        <section ref={el => sectionRefs.current[0] = el} style={{ minHeight: 'calc(100vh - 64px)', scrollSnapAlign: 'start', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '0 80px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 65% 50%, rgba(0,191,255,0.08) 0%, transparent 70%)' }} />
          <div style={{ flex: 1, position: 'relative', zIndex: 2, maxWidth: 580 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse-glow 2s infinite' }} />
              <span style={{ fontSize: 11.5, color: '#60b4ff', fontWeight: 600, letterSpacing: '0.06em' }}>LIVE — NATIONAL ENERGY COMMAND</span>
            </div>
            <h1 style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: 22 }}>
              <span>AI-Powered </span>
              <span style={{ background: 'linear-gradient(90deg,#1d8cff,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence.</span>
              <br />
              <span>National Energy </span>
              <span style={{ background: 'linear-gradient(90deg,#8b5cf6,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Resilience.</span>
            </h1>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.75, marginBottom: 36, maxWidth: 460 }}>
              Secure India's energy future with real-time risk intelligence, AI scenario simulation, and strategic decision support for national energy security.
            </p>
            <div style={{ display: 'flex', gap: 14 }}>
              <button onClick={() => navigate('/login')} style={{ padding: '14px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d8cff,#8b5cf6)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(29,140,255,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                Launch War Room <ArrowRight size={16} />
              </button>
              <button onClick={() => scrollTo(1)} style={{ padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                Explore Features <ChevronDown size={15} />
              </button>
            </div>
            {/* Stats strip */}
            <div style={{ display: 'flex', gap: 32, marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[['14+', 'Live Data Sources'], ['99.9%', 'System Uptime'], ['25+', 'Dashboard Modules'], ['<2s', 'AI Response Time']].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#60b4ff', letterSpacing: '-0.02em' }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative', zIndex: 2, height: 480, maxWidth: 480 }}>
            <GlowMap />
          </div>
          {/* Scroll hint */}
          <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.5 }}>
            <span style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.1em' }}>SCROLL TO EXPLORE</span>
            <ChevronDown size={16} style={{ color: '#64748b', animation: 'float 1.5s ease-in-out infinite' }} />
          </div>
        </section>

        {/* ── SECTION 2: FEATURES ── */}
        <section ref={el => sectionRefs.current[1] = el} style={{ minHeight: 'calc(100vh - 64px)', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', background: 'linear-gradient(180deg, #020810 0%, #030f22 100%)' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#60b4ff', textTransform: 'uppercase', marginBottom: 12 }}>Platform Features</div>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 14 }}>Everything Your Command Needs</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 520, margin: '0 auto' }}>Built for national energy decision-makers — real-time, AI-powered, and battle-tested.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, width: '100%', maxWidth: 1100 }}>
            {[
              { icon: Shield, color: '#1d8cff', title: 'Real-Time Risk Intelligence', desc: 'Multi-source threat monitoring with AI-synthesized signals from 14+ live data feeds including Reuters, Bloomberg, AIS Ship Tracker.' },
              { icon: Globe, color: '#00e5ff', title: 'Supply Chain Digital Twin', desc: 'Full-fidelity digital twin of India\'s energy supply chain — from wellhead to pump, with live node status and disruption simulation.' },
              { icon: Zap, color: '#f59e0b', title: 'Crisis Mode Command', desc: 'Activate emergency protocols instantly. Live crisis timer, alert broadcast, emergency contacts, and response action tracking.' },
              { icon: BarChart2, color: '#22c55e', title: 'Economic Impact Engine', desc: 'Quantify the economic ripple of every energy decision. GDP impact, forex pressure, inflation modeling, sector-by-sector analysis.' },
              { icon: Target, color: '#8b5cf6', title: 'AI Scenario Simulator', desc: 'Run what-if scenarios — Hormuz closure, OPEC cuts, monsoon disruption — with probability-weighted outcome forecasting.' },
              { icon: Users, color: '#ef4444', title: 'Executive Decision Board', desc: 'Structured decision workflow with motion voting, AI recommendations, quorum tracking, and full audit trail.' },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{ background: 'rgba(8,18,38,0.7)', border: '1px solid rgba(90,130,255,0.14)', borderRadius: 14, padding: '24px', transition: 'all 0.22s', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}40`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(90,130,255,0.14)'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${f.color}15`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon size={20} style={{ color: f.color }} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SECTION 3: HOW IT WORKS ── */}
        <section ref={el => sectionRefs.current[2] = el} style={{ minHeight: 'calc(100vh - 64px)', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', background: '#020810' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: 12 }}>How It Works</div>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 14 }}>From Signal to Decision in Seconds</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>UrjaNetra AI ingests live signals, runs AI models, and surfaces actionable intelligence — automatically.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, width: '100%', maxWidth: 1000, position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 32, left: '10%', right: '10%', height: 2, background: 'linear-gradient(90deg, #1d8cff, #8b5cf6, #00e5ff)', opacity: 0.3, zIndex: 0 }} />
            {[
              { step: '01', title: 'Ingest Signals', desc: 'Live feeds from 14+ sources: oil markets, satellite AIS, geopolitical wire, SCADA, PPAC database.', color: '#1d8cff' },
              { step: '02', title: 'AI Analysis', desc: 'NLP models, anomaly detection, and causal AI synthesize raw signals into risk scores and forecasts.', color: '#8b5cf6' },
              { step: '03', title: 'Scenario Modeling', desc: 'Monte Carlo simulations generate probability-weighted outcomes for every detected threat vector.', color: '#00e5ff' },
              { step: '04', title: 'Action Brief', desc: 'AI generates ranked action recommendations with cost-benefit analysis, ready for commander approval.', color: '#22c55e' },
            ].map((s, i) => (
              <div key={s.step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 16px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${s.color}12`, border: `2px solid ${s.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: `0 0 20px ${s.color}25` }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.step}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: USE CASES ── */}
        <section ref={el => sectionRefs.current[3] = el} style={{ minHeight: 'calc(100vh - 64px)', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', background: 'linear-gradient(180deg, #030f22 0%, #020810 100%)' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#4ade80', textTransform: 'uppercase', marginBottom: 12 }}>Use Cases</div>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 14 }}>Built for Every Energy Crisis</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, width: '100%', maxWidth: 900 }}>
            {[
              { scenario: 'Hormuz Strait Disruption', outcome: 'Reroute 8 VLCCs, activate SPR drawdown, alert coastal refineries — AI generates full response brief in 4 seconds.', tag: 'Maritime Crisis', color: '#ef4444' },
              { scenario: 'OPEC Production Cut', outcome: 'Model price impact on Indian basket, trigger procurement diversification from West Africa & Americas.', tag: 'Market Shock', color: '#f59e0b' },
              { scenario: 'Refinery Unplanned Shutdown', outcome: 'Identify compatible alternate crude grades, reroute supply, calculate throughput loss and SPR drawdown requirements.', tag: 'Operational Crisis', color: '#1d8cff' },
              { scenario: 'Sanction Regime Change', outcome: 'Auto-flag affected supplier contracts, compliance gaps flagged instantly, alternative supplier shortlist generated.', tag: 'Geopolitical', color: '#8b5cf6' },
            ].map(u => (
              <div key={u.scenario} style={{ background: 'rgba(8,18,38,0.8)', border: `1px solid ${u.color}20`, borderRadius: 14, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${u.color}, transparent)` }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: u.color, background: `${u.color}15`, border: `1px solid ${u.color}30`, borderRadius: 6, padding: '2px 9px', letterSpacing: '0.06em' }}>{u.tag}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{u.scenario}</h3>
                <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.7 }}>{u.outcome}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
                  <CheckCircle size={12} style={{ color: '#4ade80' }} />
                  <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>AI-Ready Response Protocol</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 5: ABOUT + CTA ── */}
        <section ref={el => sectionRefs.current[4] = el} style={{ minHeight: 'calc(100vh - 64px)', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', background: '#020810', textAlign: 'center' }}>
          <div style={{ maxWidth: 720 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#fbbf24', textTransform: 'uppercase', marginBottom: 16 }}>About UrjaNetra AI</div>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20 }}>
              India's Premier<br />
              <span style={{ background: 'linear-gradient(90deg,#1d8cff,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Energy Command Intelligence</span>
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8, marginBottom: 40 }}>
              UrjaNetra AI is a next-generation national energy command platform purpose-built for India's strategic energy security apparatus. Developed for commanders, secretaries, and decision-makers across the Ministry of Petroleum, NEMC, IOC, and Cabinet — it fuses real-time data, AI reasoning, and geopolitical intelligence into a single command interface.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 48 }}>
              {[['🔒', '256-bit End-to-End Encryption'], ['🏛️', 'Govt-Grade Security Infrastructure'], ['🤖', 'Explainable AI with Full Audit Trail'], ['⚡', '99.9% Uptime SLA']].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 14px' }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Final CTA */}
            <div style={{ background: 'linear-gradient(135deg, rgba(29,140,255,0.08) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(29,140,255,0.2)', borderRadius: 20, padding: '40px 48px' }}>
              <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Ready to Secure India's Energy Future?</h3>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Join commanders and analysts already using UrjaNetra AI to protect national energy security.</p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                <button onClick={() => navigate('/login')} style={{ padding: '13px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d8cff,#8b5cf6)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(29,140,255,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Launch War Room <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate('/register')} style={{ padding: '13px 28px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
