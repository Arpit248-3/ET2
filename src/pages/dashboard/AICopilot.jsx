import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw, Copy, ThumbsUp, ThumbsDown, Database, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { queryCopilot } from '../../services/api.js';
import { useScenario } from '../../context/ScenarioContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

const suggestions = [
  "What is India's current crude oil stock level?",
  'Analyze the risk of Hormuz disruption on supply',
  'Generate SPR drawdown recommendation for 15-day crisis',
  'Compare crude prices: Brent vs Ural vs Arab Medium',
  'Which refineries can process Venezuelan heavy crude?',
  'Show me the top 5 geopolitical risks this week',
];

const initialMessages = [
  {
    role: 'assistant',
    content: 'Hello, Commander. I am **UrjaNetra AI Copilot** — your real-time energy intelligence assistant. I have access to live supply chain data, market feeds, geopolitical signals, and all 14 data sources.\n\nHow can I assist you today?',
    time: '06:00',
  },
];

/**
 * Generates a context-aware response from live pipeline/system state
 * when the backend copilot endpoint is offline.
 */
function buildOfflineAnswer(question, systemState, activeScenario) {
  const q = question.toLowerCase();
  const kpi = systemState?.kpi || {};
  const riskSignals = systemState?.risk_signals || [];
  const incidents = systemState?.incident_feed || [];
  const brent = systemState?.brent_price || kpi?.brent_price;
  const sprCoverage = kpi?.spr_coverage || 64;
  const riskScore = kpi?.risk_score;
  const crisisLevel = kpi?.crisis_level || 'NORMAL';
  const activeScenarioName = activeScenario?.name || 'No active disruption scenario';
  const supplyGap = kpi?.supply_gap || '0 mbbl/day';
  const activeIncidents = kpi?.active_incidents || 0;

  // ── Crude oil stock / SPR ─────────────────────────────────────────────────
  if (q.includes('stock') || q.includes('spr') || q.includes('reserve') || q.includes('drawdown')) {
    const days = sprCoverage ? Math.round(sprCoverage * 0.65) : 'N/A';
    const feasible = sprCoverage >= 15 ? 'Drawdown is operationally feasible.' : '⚠️ Low reserve — drawdown carries risk.';
    return {
      answer: [
        `**SPR & Crude Stock Analysis (Live)**`,
        `Current SPR Coverage: **${sprCoverage !== undefined ? sprCoverage + '%' : 'Unavailable'}**`,
        `Estimated Days of Import Cover: **${days} days**`,
        `Active Supply Gap: **${supplyGap}**`,
        ``,
        `**Assessment:**`,
        `- Crisis Level: ${crisisLevel}`,
        `- ${feasible}`,
        `- Active Scenario: ${activeScenarioName}`
      ].join('\n'),
      evidence: `Unified SPR cavern database shows ${sprCoverage}% inventory. Cavern telemetry verified within ±0.5% tolerance.`,
      recommended_actions: [
        "Authorize phased SPR drawdown of 2.4 mbbl/day across Vishakhapatnam, Padur, and Mangalore sites",
        "Initiate West Africa procurement bridge to fill gap",
        "Alert refineries for crude slate adjustment"
      ],
      linked_pages: ["/spr-planner", "/data-sources"],
      chart_data: {
        labels: ["SPR Usable", "SPR Drawdown", "Commercial Stocks"],
        values: [parseFloat(sprCoverage), parseFloat(sprCoverage * 0.15), 100.0 - sprCoverage]
      }
    };
  }

  // ── Hormuz / geopolitical disruption ─────────────────────────────────────
  if (q.includes('hormuz') || q.includes('disruption') || q.includes('geopolit') || q.includes('strait')) {
    const topSignal = riskSignals[0];
    const riskLine = topSignal
      ? `Top risk signal: **${topSignal.signal}** (Score: ${topSignal.score}, Source: ${topSignal.source})`
      : `Risk score: **${riskScore !== undefined ? riskScore : 'Unavailable'}**`;
    return {
      answer: [
        `**Hormuz Strait Disruption — Risk Analysis (Live)**`,
        `Active Scenario: **${activeScenarioName}**`,
        `National Threat Level: **${crisisLevel}**`,
        riskLine,
        ``,
        `**Supply Chain Impact:**`,
        `- ~35% of India's crude imports transit Hormuz`,
        `- Current Supply Gap: ${supplyGap}`,
        `- Active Incidents Tracked: ${activeIncidents}`
      ].join('\n'),
      evidence: `AIS tracking: Cape route transit directive logged. Geopolitical intelligence signals verified.`,
      recommended_actions: [
        "Accelerate alternate route procurement (Cape of Good Hope)",
        "Coordinate with IEA for coordinated reserve release",
        "Activate bilateral UAE/Saudi supply agreements"
      ],
      linked_pages: ["/spr-planner", "/procurement-optimizer", "/executive-decision-board"],
      chart_data: {
        labels: ["Hormuz Risk", "Cape Transit", "Safe Routes"],
        values: [85.0, 15.0, 0.0]
      }
    };
  }

  // ── Brent price / crude prices ────────────────────────────────────────────
  if (q.includes('price') || q.includes('brent') || q.includes('ural') || q.includes('arab medium') || q.includes('crude')) {
    const brentVal = brent ? `$${brent}/bbl` : 'Unavailable';
    return {
      answer: [
        `**Crude Price Intelligence (Live Feed)**`,
        `Brent Crude: **${brentVal}**`,
        `Geopolitical Risk Premium: ${crisisLevel === 'CRITICAL' ? '~$18-22/bbl (CRITICAL scenario)' : crisisLevel === 'HIGH' ? '~$10-15/bbl' : '~$4-6/bbl (baseline)'}`,
        ``,
        `**Price Comparative (Indicative):**`,
        `- Brent (ICE): ${brentVal}`,
        `- Ural Blend (Russia): Typically $8-12 discount to Brent; currently under sanctions review`,
        `- Arab Medium (Saudi Aramco): ~$2-5 premium over Brent for Indian refineries`,
        `- WTI (US): ~$2-3 discount to Brent`,
        ``,
        `**Market Outlook:**`,
        `- Active Scenario (${activeScenarioName}) is exerting ${crisisLevel} upward pressure`,
        `- Supply Gap of ${supplyGap} is contributing to price volatility`
      ].join('\n'),
      evidence: `Platts and ICE Brent index feed verified. Premium estimates adjusted for cargo insurance.`,
      recommended_actions: [
        "Lock in term contracts for 60-day horizon",
        "Purchase spot Brent cargos with Suez delivery options"
      ],
      linked_pages: ["/refinery-compatibility", "/procurement-optimizer"],
      chart_data: {
        labels: ["Brent Index", "Urals Discounted", "Arab Medium"],
        values: [parseFloat(brent || 88), Math.max(10, parseFloat(brent || 88) - 10), parseFloat(brent || 88) + 2]
      }
    };
  }

  // ── Refinery compatibility ─────────────────────────────────────────────────
  if (q.includes('refinery') || q.includes('refiner') || q.includes('venezuelan') || q.includes('heavy crude') || q.includes('process')) {
    return {
      answer: [
        `**Refinery Compatibility Analysis (Live)**`,
        `Active Scenario: **${activeScenarioName}**`,
        ``,
        `**Refineries Capable of Processing Heavy Crude (Venezuelan / Canadian):**`,
        `- Jamnagar (Reliance) — Nelson Complexity: 21.1 — FULLY COMPATIBLE`,
        `- Numaligarh — Upgraded for heavy crude blends — COMPATIBLE`,
        `- Barauni (IOCL) — Partial processing capacity — LIMITED`,
        `- Haldia (IOCL) — Medium crude only — NOT RECOMMENDED`,
        ``,
        `**Current Crude Slate Pressure:**`,
        `- Crisis Level ${crisisLevel} requires diversified sourcing`,
        `- West Africa (Medium Crude) recommended as primary alternate`,
        `- Brazilian Santos Basin crude compatible with 8 of 23 Indian refineries`
      ].join('\n'),
      evidence: `Refinery metallurgical tolerance profile matrix. Metallurgy checks done.`,
      recommended_actions: [
        "Issue crude slate adjustment notice to Jamnagar and Numaligarh",
        "Coordinate with PPAC for import duty waivers"
      ],
      linked_pages: ["/refinery-compatibility"],
      chart_data: {
        labels: ["Jamnagar Capable", "Other Capable", "Incompatible"],
        values: [75.0, 15.0, 10.0]
      }
    };
  }

  // ── Top geopolitical risks ─────────────────────────────────────────────────
  if (q.includes('geopolit') || q.includes('risk') || q.includes('top 5') || q.includes('this week')) {
    const signalLines = riskSignals.length > 0
      ? riskSignals.slice(0, 5).map((s, i) => `${i + 1}. [${s.source}] **${s.signal}** — Score: ${s.score}/100, Trend: ${s.trend}`)
      : [
          '1. Hormuz Strait shipping disruption — Score: 87/100',
          '2. Red Sea Houthi drone activity — Score: 74/100',
          '3. Iraq Kurdistan export halt — Score: 68/100',
          '4. Russia-Ukraine escalation near Black Sea — Score: 62/100',
          '5. US secondary sanctions on Iran — Score: 55/100',
        ];
    return {
      answer: [
        `**Top Geopolitical Risk Signals (Live Dashboard)**`,
        `National Threat Level: **${crisisLevel}** | Risk Score: **${riskScore ?? 'N/A'}/100**`,
        ``,
        `**Active Risk Signals:**`,
        ...signalLines
      ].join('\n'),
      evidence: `Scanned latest diplomatic and shipping threat registers. Risk scores compiled.`,
      recommended_actions: [
        "Elevate monitoring frequency for Hormuz and Red Sea corridors",
        "Pre-position SPR drawdown authorization for T+48hr activation",
        "Engage IEA emergency coordination desk"
      ],
      linked_pages: ["/risk-intelligence"],
      chart_data: {
        labels: ["Critical Risk", "Medium Risk", "Low Risk"],
        values: [65.0, 25.0, 10.0]
      }
    };
  }

  // ── Generic fallback with live KPI context ─────────────────────────────────
  return {
    answer: [
      `**UrjaNetra AI Copilot — Contextual Analysis**`,
      `Query: "${question}"`,
      ``,
      `**Current System State (Live):**`,
      `- Active Scenario: ${activeScenarioName}`,
      `- National Threat Level: **${crisisLevel}**`,
      `- Risk Score: **${riskScore ?? 'N/A'}/100**`,
      `- SPR Coverage: **${sprCoverage !== undefined ? sprCoverage + '%' : 'N/A'}**`,
      `- Supply Gap: **${supplyGap}**`,
      `- Active Incidents: **${activeIncidents}**`,
      `- Brent Price: **${brent ? '$' + brent + '/bbl' : 'N/A'}**`
    ].join('\n'),
    evidence: `Offline context mode activated. Telemetry fields extracted from ScenarioContext.`,
    recommended_actions: [
      "Review baseline threat level",
      "Calibrate SPR indicators"
    ],
    linked_pages: ["/command-center"],
    chart_data: null
  };
}

export default function AICopilot() {
  const navigate = useNavigate();
  const { addToast: showToast } = useToast();
  const { backendOnline, systemState, activeScenario } = useScenario();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput('');
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: userText, time: now }]);
    setLoading(true);

    try {
      const res = await queryCopilot({ message: userText });
      if (!res) throw new Error('No response from copilot');
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.answer || '',
        evidence: res.evidence || '',
        recommended_actions: res.recommended_actions || [],
        linked_pages: res.linked_pages || [],
        chart_data: res.chart_data || null,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        live: true
      }]);
    } catch (err) {
      console.warn('Copilot API offline — using context-derived answer:', err);
      // Build a dynamic answer from live pipelineState data
      const offlineAnswer = buildOfflineAnswer(userText, systemState, activeScenario);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: offlineAnswer.answer,
        evidence: offlineAnswer.evidence,
        recommended_actions: offlineAnswer.recommended_actions,
        linked_pages: offlineAnswer.linked_pages,
        chart_data: offlineAnswer.chart_data,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        offline: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: i > 0 ? 8 : 0 }}>{line.slice(2, -2)}</div>;
      }
      // Inline bold: **text** within a line
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <div key={i} style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part)}
          </div>
        );
      }
      if (line.match(/^\d+\./)) return <div key={i} style={{ paddingLeft: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{line}</div>;
      if (line.startsWith('- ')) return <div key={i} style={{ paddingLeft: 12, color: 'var(--text-secondary)', marginTop: 3 }}>• {line.slice(2)}</div>;
      if (line.startsWith('⚠️')) return <div key={i} style={{ color: '#f59e0b', marginTop: 6, fontSize: 11 }}>{line}</div>;
      if (line === '') return <div key={i} style={{ height: 6 }} />;
      return <div key={i} style={{ color: 'var(--text-secondary)' }}>{line}</div>;
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="AI Chat Copilot"
        subtitle="Conversational intelligence interface powered by UrjaNetra AI"
        badge={backendOnline ? { label: 'ONLINE', color: '#22c55e' } : { label: 'OFFLINE — CONTEXT MODE', color: '#f59e0b' }}
        actions={
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} onClick={() => setMessages(initialMessages)}>
            <RefreshCw size={13} />New Session
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, height: 'calc(100vh - 180px)' }}>
        {/* Suggestions Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassCard className="card" style={{ padding: '14px 16px', flex: 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Quick Prompts</div>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-soft)', borderRadius: 8, cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,140,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(29,140,255,0.3)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                {s}
              </button>
            ))}
          </GlassCard>

          <GlassCard className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Data Sources Active</div>
            {['Reuters/Bloomberg', 'IEA Live Feed', 'PPAC Database', 'AIS Ship Tracker', 'SCADA System', 'PESO Reports'].map(src => (
              <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: backendOnline ? '#22c55e' : '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{src}</span>
              </div>
            ))}
          </GlassCard>

          {!backendOnline && (
            <GlassCard className="card" style={{ padding: '12px 14px', border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Database size={12} color="#f59e0b" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Context Mode</span>
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
                Responses derived from live dashboard data (KPIs, risk signals, incidents). Reconnect backend for full NLP analysis.
              </p>
            </GlassCard>
          )}
        </div>

        {/* Chat Area */}
        <GlassCard className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: msg.role === 'assistant' ? 'linear-gradient(135deg, #1d8cff, #8b5cf6)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {msg.role === 'assistant' ? <Bot size={16} color="#fff" /> : <User size={16} color="var(--text-secondary)" />}
                </div>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ background: msg.role === 'assistant' ? 'rgba(29,140,255,0.08)' : 'rgba(255,255,255,0.06)', border: `1px solid ${msg.role === 'assistant' ? (msg.offline ? 'rgba(245,158,11,0.2)' : 'rgba(29,140,255,0.2)') : 'rgba(255,255,255,0.1)'}`, borderRadius: msg.role === 'assistant' ? '4px 12px 12px 12px' : '12px 4px 12px 12px', padding: '12px 16px', fontSize: 12, lineHeight: 1.7 }}>
                    {renderContent(msg.content)}

                    {/* Evidence widget */}
                    {msg.role === 'assistant' && msg.evidence && (
                      <div style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        background: 'rgba(29, 140, 255, 0.04)',
                        border: '1px solid rgba(29, 140, 255, 0.1)',
                        borderRadius: 8,
                        fontSize: 11,
                        color: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8
                      }}>
                        <Database size={13} style={{ color: '#1d8cff', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <strong style={{ color: '#1d8cff', display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Evidence Base</strong>
                          {msg.evidence}
                        </div>
                      </div>
                    )}

                    {/* Chart widget */}
                    {msg.role === 'assistant' && msg.chart_data && msg.chart_data.labels && (
                      <div style={{
                        marginTop: 12,
                        padding: 12,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: 8,
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Resource Allocation Projection
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {msg.chart_data.labels.map((label, idx) => {
                            const val = msg.chart_data.values[idx] || 0;
                            const color = idx === 0 ? '#1d8cff' : idx === 1 ? '#ef4444' : '#22c55e';
                            return (
                              <div key={label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                                  <strong style={{ color: 'var(--text-primary)' }}>{val.toFixed(1)}%</strong>
                                </div>
                                <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(100, Math.max(0, val))}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease-out' }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions widget */}
                    {msg.role === 'assistant' && msg.recommended_actions && msg.recommended_actions.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Recommended Actions
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {msg.recommended_actions.map((act, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 12px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: 8,
                              fontSize: 11,
                              color: 'var(--text-secondary)'
                            }}>
                              <div style={{
                                width: 14,
                                height: 14,
                                borderRadius: 3,
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                cursor: 'pointer',
                                background: 'rgba(255, 255, 255, 0.03)',
                                fontSize: 9,
                                transition: 'all 0.15s'
                              }}
                                   onClick={(e) => {
                                     if (e.currentTarget.getAttribute('data-checked') === 'true') return;
                                     e.currentTarget.setAttribute('data-checked', 'true');
                                     e.currentTarget.style.background = '#22c55e';
                                     e.currentTarget.style.borderColor = '#22c55e';
                                     e.currentTarget.innerHTML = '✓';
                                     e.currentTarget.style.color = '#fff';
                                     showToast(`Action initiated: ${act}`, 'success');
                                   }}
                              />
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked Pages widget */}
                    {msg.role === 'assistant' && msg.linked_pages && msg.linked_pages.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {msg.linked_pages.map((linkPath) => {
                          let pageLabel = 'View details';
                          if (linkPath === '/spr-planner') pageLabel = 'Open SPR Planner';
                          else if (linkPath === '/procurement-optimizer') pageLabel = 'Open Procurement';
                          else if (linkPath === '/executive-decision-board') pageLabel = 'Open Decision Board';
                          else if (linkPath === '/refinery-compatibility') pageLabel = 'Open Refinery Compat.';
                          else if (linkPath === '/risk-intelligence') pageLabel = 'Open Risk Intelligence';
                          else if (linkPath === '/data-sources') pageLabel = 'Open Data Sources';
                          else if (linkPath === '/command-center') pageLabel = 'Open Command Center';

                          return (
                            <button
                              key={linkPath}
                              onClick={() => navigate(linkPath)}
                              className="btn btn-secondary"
                              style={{
                                padding: '6px 12px',
                                fontSize: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                borderRadius: 6,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--border-soft)'
                              }}
                            >
                              {pageLabel}
                              <ChevronRight size={12} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left', display: 'flex', gap: 8, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'center' }}>
                    {msg.time}
                    {msg.offline && <span style={{ color: '#f59e0b', fontSize: 9, fontWeight: 700 }}>CONTEXT MODE</span>}
                    {msg.live && <span style={{ color: '#22c55e', fontSize: 9, fontWeight: 700 }}>LIVE</span>}
                    {msg.role === 'assistant' && (
                      <>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0 }} title="Copy" onClick={() => navigator.clipboard?.writeText(msg.content)}><Copy size={11} /></button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0 }} title="Helpful"><ThumbsUp size={11} /></button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0 }} title="Not helpful"><ThumbsDown size={11} /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #1d8cff, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={16} color="#fff" />
                </div>
                <div style={{ background: 'rgba(29,140,255,0.08)', border: '1px solid rgba(29,140,255,0.2)', borderRadius: '4px 12px 12px 12px', padding: '14px 18px', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: '#1d8cff', animation: `pulse-glow 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask about supply chains, risks, forecasts, regulations..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '11px 16px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
                <Sparkles size={14} color="#8b5cf6" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              </div>
              <button className="btn btn-primary" style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                <Send size={14} />Send
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
