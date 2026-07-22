import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, Activity, TrendingUp, Shield, CheckCircle, ArrowRight, Radio, Bot, Droplets, Loader, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import MetricCard from '../../components/ui/MetricCard.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import RiskGauge from '../../components/ui/RiskGauge.jsx';
import IndiaMapSVG from '../../components/ui/MapPanel.jsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast.jsx';
import { usePipeline } from '../../context/PipelineContext.jsx';
import useApi from '../../hooks/useApi.js';
import { recordDecision, generateBrief, fetchSupplyChainTwin } from '../../services/api.js';
import CrisisUploadModal from '../../components/ui/CrisisUploadModal.jsx';


const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ color: 'var(--text-muted)', marginBottom: 5, fontSize: 10.5 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontSize: 12, fontWeight: 600 }}>
          {p.name}: <b>${p.value}</b>
        </p>
      ))}
    </div>
  );
};

const incidentColorMap = {
  red: { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.18)' },
  amber: { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)' },
  blue: { bg: 'rgba(29,140,255,0.07)', border: 'rgba(29,140,255,0.18)' },
  green: { bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.18)' },
};

const defaultKPI = {
  riskScore: 32,
  crisisLevel: 'NORMAL',
  activeIncidents: 0,
  supplyGap: '0M bbl/day',
  sprCoverage: 64,
  activeSanctions: 0,
};

const defaultIncidents = [
  { id: 1, time: "09:00", type: "INFO", title: "All supply chains nominal", detail: "No disruptions reported across monitored corridors", region: "Global", color: "green" },
  { id: 2, time: "08:30", type: "INFO", title: "SPR levels above target", detail: "Strategic reserve at 64% — above 60% minimum threshold", region: "India", color: "green" }
];

const defaultTimeSeries = [
  {"month": "Jan", "brent": 78, "indianBasket": 75, "wti": 73, "import": 4.2},
  {"month": "Feb", "brent": 82, "indianBasket": 79, "wti": 77, "import": 4.0},
  {"month": "Mar", "brent": 79, "indianBasket": 76, "wti": 74, "import": 4.3},
  {"month": "Apr", "brent": 85, "indianBasket": 82, "wti": 80, "import": 4.1},
  {"month": "May", "brent": 88, "indianBasket": 85, "wti": 83, "import": 3.9},
  {"month": "Jun", "brent": 91, "indianBasket": 88, "wti": 86, "import": 4.4},
  {"month": "Jul", "brent": 94, "indianBasket": 91, "wti": 89, "import": 4.6},
];

export default function CommandCenter() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { pipelineState, offline, refreshPipeline, uploadScenario, runPipeline } = usePipeline();
  const [mapFilter, setMapFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);

  const [nodes, setNodes] = useState([]);
  const [ships, setShips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [twinLoading, setTwinLoading] = useState(false);

  useEffect(() => {
    const loadTwinData = async () => {
      setTwinLoading(true);
      try {
        const data = await fetchSupplyChainTwin();
        if (data.nodes) setNodes(data.nodes);
        if (data.ships) setShips(data.ships);
        if (data.routes) setRoutes(data.routes);
      } catch (err) {
        console.warn('Failed to load twin data in command center:', err);
      } finally {
        setTwinLoading(false);
      }
    };
    loadTwinData();
  }, []);

  // Trigger decision logging via API
  const { execute: doDecision } = useApi(recordDecision, { manual: true });

  const handleRunPipeline = async () => {
    setRunningPipeline(true);
    addToast('Executing Master Intelligence Pipeline sequence...', 'info');
    try {
      await runPipeline();
      addToast('Pipeline recalculation sequence completed successfully.', 'success');
    } catch (err) {
      addToast('Pipeline run failed: ' + (err.message || 'connection error'), 'error');
    } finally {
      setRunningPipeline(false);
    }
  };

  const handleActivateCrisisMode = async () => {
    addToast('Issuing cabinet decision to activate crisis mode...', 'info');
    try {
      await recordDecision({
        action_type: 'ACTIVATE_CRISIS_MODE',
        approved_by: 'Commander Arjun Mehta',
        details: { source: 'CommandCenter', reason: 'Emergency button activation' },
      });
      addToast('National Energy Emergency protocols activated.', 'success');
      navigate('/crisis-mode');
    } catch (err) {
      addToast('Failed to record crisis decision. Navigating to console.', 'warning');
      navigate('/crisis-mode');
    }
  };

  const handleAction = async (action) => {
    if (action === 'Generate AI Brief' || action === 'Generate Brief') {
      addToast('Compiling executive action brief...', 'info');
      try {
        await generateBrief({
          scenario_id: pipelineState?.active_scenario?.id || 'hormuz_closure',
          classification: 'TOP SECRET',
          prepared_for: 'National Energy Management Council',
        });
        addToast('Action Brief compiled successfully.', 'success');
        navigate('/action-brief');
      } catch (err) {
        addToast('Failed to compile Action Brief. Navigating to cached board.', 'warning');
        navigate('/action-brief');
      }
      return;
    }

    if (action === 'Run Crisis Simulation' || action === 'Run Simulation') {
      navigate('/scenario-simulator');
      return;
    }

    if (action === 'Initiate SPR Drawdown' || action === 'Optimize Drawdown') {
      navigate('/spr-planner');
      return;
    }

    if (action === 'Approve Procurement Plan') {
      navigate('/procurement-optimizer');
      return;
    }

    if (action === 'View Full Report') {
      navigate('/reports');
      return;
    }

    addToast(`${action} initiated — AI processing...`, 'success');
    try {
      await doDecision({
        action_type: action,
        approved_by: 'Commander Arjun Mehta',
        details: { source: 'CommandCenter', scenario: pipelineState?.active_scenario?.id },
      });
      await refreshPipeline();
    } catch {
      // Non-blocking
    }
  };

  // If no cache and offline, show clean offline state
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

  // Derive parameters from pipeline state
  const systemState = pipelineState.state;
  const activeScenario = pipelineState.active_scenario;
  const riskData = pipelineState.risk;
  const econData = pipelineState.economic;
  const redTeamData = pipelineState.redteam;

  const liveKPIs = systemState?.kpi || null;
  const liveIncidents = systemState?.incident_feed || null;
  
  const displayRisk = riskData?.overall_score ?? liveKPIs?.risk_score ?? defaultKPI.riskScore;
  const displayCrisisLevel = riskData?.crisis_level ?? liveKPIs?.crisis_level ?? defaultKPI.crisisLevel;
  const displaySPR = liveKPIs?.spr_coverage ?? defaultKPI.sprCoverage;
  const displayActiveIncidents = liveKPIs?.active_incidents ?? defaultKPI.activeIncidents;
  const displaySupplyGap = liveKPIs?.supply_gap ?? defaultKPI.supplyGap;
  const displaySanctions = liveKPIs?.active_sanctions ?? defaultKPI.activeSanctions;

  const displayIncidents = liveIncidents || defaultIncidents;

  // Normalize backend time_series (uses day/crude_price_usd keys) into chart-compatible shape
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rawTimeSeries = econData?.time_series;
  const displayTimeSeries = (() => {
    if (!rawTimeSeries || rawTimeSeries.length === 0) return defaultTimeSeries;
    // If backend data has 'month' key already, use as-is
    if (rawTimeSeries[0]?.month !== undefined) return rawTimeSeries;
    // Backend returns 30-day projection — sample ~7 points and normalize keys
    const step = Math.max(1, Math.floor(rawTimeSeries.length / 7));
    return rawTimeSeries
      .filter((_, i) => i % step === 0)
      .slice(0, 7)
      .map((pt, i) => ({
        month: MONTH_LABELS[i] || `D${pt.day ?? i}`,
        brent: pt.crude_price_usd ?? defaultTimeSeries[i]?.brent ?? 80,
        indianBasket: pt.crude_price_usd ? +(pt.crude_price_usd * 0.95).toFixed(1) : defaultTimeSeries[i]?.indianBasket ?? 77,
        wti: pt.crude_price_usd ? +(pt.crude_price_usd * 0.92).toFixed(1) : defaultTimeSeries[i]?.wti ?? 74,
        import: pt.import_bill_increase_usd_bn ?? defaultTimeSeries[i]?.import ?? 4.2,
      }));
  })();

  const crisisColor = displayRisk >= 80 ? '#ef4444' : displayRisk >= 60 ? '#f59e0b' : '#22c55e';
  
  // AI recommendation derived from pipeline brief or red team
  const aiRec = pipelineState.brief?.decision_required
    || redTeamData?.final_recommendation
    || systemState?.ai_recommendation
    || 'Reroute 2 cargo via Cape of Good Hope. Initiate West Africa negotiations. Draw SPR 5M bbl.';

  // Live prices
  const baseBrent = systemState?.brent_price ?? 88.0;
  const brentChange = activeScenario ? '+6.8%' : '+0.0%';
  const indianBasketPrice = baseBrent * 0.95;
  const indianBasketChange = activeScenario ? '+5.4%' : '+0.0%';
  const wtiPrice = baseBrent * 0.92;
  const wtiChange = activeScenario ? '+4.9%' : '+0.0%';

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
        title="Command Center"
        subtitle="National Energy Resilience — Real-time Situational Awareness"
        badge={{ label: displayCrisisLevel, color: crisisColor }}
        actions={
          <>
            <button className="btn btn-primary btn-sm" onClick={handleRunPipeline} disabled={runningPipeline}>
              {runningPipeline ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />} Run Full Pipeline
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowUploadModal(true)}>
              Upload Crisis Feed
            </button>
            <button className="btn btn-secondary btn-sm" onClick={refreshPipeline}>
              <Radio size={12} /> Live Feed
            </button>
            {!offline && (
              <span style={{ fontSize: 10, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                Live
              </span>
            )}
            <button className="btn btn-danger btn-sm" onClick={handleActivateCrisisMode}>
              <AlertTriangle size={12} /> Activate Crisis Mode
            </button>
          </>
        }
      />

      <CrisisUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        onUploadSuccess={uploadScenario} 
      />

      {/* KPI Row — 6 cards */}
      <div className="kpi-row-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 18 }}>
        <MetricCard label="National Risk Score" value={String(displayRisk)} unit="/100" color={displayRisk >= 80 ? 'red' : displayRisk >= 60 ? 'amber' : 'blue'} icon={AlertTriangle} delta={8} deltaLabel="vs yesterday" />
        <MetricCard label="Crisis Level" value={displayCrisisLevel} color={displayRisk >= 80 ? 'red' : 'amber'} icon={Activity} subtitle={activeScenario?.name?.slice(0, 20) || 'Hormuz + OPEC'} valueSm />
        <MetricCard label="Active Incidents" value={String(displayActiveIncidents)} color="red" icon={Zap} delta={2} deltaLabel="new today" />
        <MetricCard label="Supply Gap" value={displaySupplyGap} unit="bbl/day" color="red" icon={TrendingUp} delta={-12} deltaLabel="vs capacity" />
        <MetricCard label="SPR Coverage" value={String(displaySPR)} unit="days" color="blue" icon={Shield} delta={-4} />
        <MetricCard label="Active Sanctions" value={String(displaySanctions)} color="purple" icon={Droplets} subtitle="On 4 suppliers" />
      </div>

      {/* Map + Right panel */}
      <div className="responsive-map-grid">
        {/* India Map */}
        <GlassCard style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border-soft)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <h3 className="card-title">India Energy Risk Map</h3>
              <p className="card-subtitle" style={{ marginBottom: 0 }}>Live node status · Supply chain visualization</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Refinery', 'Port', 'SPR', 'Pipeline'].map(f => (
                <button key={f} onClick={() => setMapFilter(f)} style={{
                  padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em',
                  background: mapFilter === f ? 'rgba(29,140,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color: mapFilter === f ? '#60b4ff' : '#64748b',
                  border: `1px solid ${mapFilter === f ? 'rgba(29,140,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.15s',
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 380, position: 'relative' }}>
            <IndiaMapSVG 
              filterType={mapFilter} 
              nodes={nodes}
              ships={ships}
              activeLayers={{ refineries: true, ports: true, spr: true, pipelines: true, ships: true }}
            />
          </div>
        </GlassCard>

        {/* Risk gauge + AI rec */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GlassCard glow={displayRisk >= 80 ? 'red' : 'amber'} style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <RiskGauge value={displayRisk} size={140} label="Risk Score" />
            </div>
            <StatusBadge status={displayCrisisLevel} />
            <p style={{ fontSize: 12, color: 'var(--text-main)', marginTop: 10, fontWeight: 500, lineHeight: 1.5 }}>
              {activeScenario?.name || 'Baseline Resilience Operation'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4, minHeight: 38 }}>
              {activeScenario?.description || 'System operating at optimal capacity. Threat telemetry monitored in real-time across key sea corridors.'}
            </p>

            <div style={{ marginTop: 14, borderTop: '1px solid var(--border-soft)', paddingTop: 12, textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Threat Vector Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Geopolitical Conflict</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${activeScenario?.geopolitical_risk || 32}%`, height: '100%', background: displayRisk >= 80 ? '#ef4444' : '#fbbf24', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-main)', minWidth: 24, textAlign: 'right' }}>
                      {activeScenario?.geopolitical_risk || 32}%
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Maritime Transit Delay</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${activeScenario?.maritime_delay_pct || 0}%`, height: '100%', background: '#1d8cff', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-main)', minWidth: 24, textAlign: 'right' }}>
                      {activeScenario?.maritime_delay_pct || 0}%
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active Sanctions Threat</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-main)' }}>
                    {activeScenario?.kpi?.active_sanctions || 0} alerts
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard style={{
            background: 'rgba(29,140,255,0.05)',
            borderColor: 'rgba(29,140,255,0.22)',
            flex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={14} style={{ color: '#00e5ff' }} />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#00e5ff' }}>AI Recommendation</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-main)', lineHeight: 1.65, marginBottom: 12 }}>
              {aiRec}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleAction('AI Recommendation')}>Approve</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleAction('Alternative analysis')}>Alternatives</button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Chart + Incident feed */}
      <div className="responsive-chart-grid">
        {/* Price chart */}
        <GlassCard style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <h3 className="card-title">Oil Price Trend</h3>
              <p className="card-subtitle" style={{ marginBottom: 0 }}>
                {!offline ? 'Live scenario data' : 'Historical baseline'} · 7-month trend · $USD/bbl
              </p>
            </div>
            {/* Live price tickers */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Brent', price: `$${baseBrent.toFixed(1)}`, change: brentChange, color: '#1d8cff', up: activeScenario ? true : false },
                { label: 'Indian Basket', price: `$${indianBasketPrice.toFixed(1)}`, change: indianBasketChange, color: '#00e5ff', up: activeScenario ? true : false },
                { label: 'WTI', price: `$${wtiPrice.toFixed(1)}`, change: wtiChange, color: '#8b5cf6', up: activeScenario ? true : false },
              ].map(t => (
                <div key={t.label} style={{
                  background: `${t.color}10`, border: `1px solid ${t.color}25`,
                  borderRadius: 8, padding: '6px 10px', textAlign: 'right', minWidth: 82,
                }}>
                  <div style={{ fontSize: 9.5, color: 'var(--text-dim)', marginBottom: 2 }}>{t.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.price}</div>
                  <div style={{ fontSize: 10, color: t.up ? '#4ade80' : '#f87171', fontWeight: 600, marginTop: 2 }}>{t.change}</div>
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={displayTimeSeries} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="brentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d8cff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1d8cff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="indianGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="wtiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,130,255,0.07)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10.5 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10.5 }} domain={['dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="brent" stroke="#1d8cff" strokeWidth={2.5} fill="url(#brentGrad)" dot={false} name="Brent" activeDot={{ r: 5, fill: '#1d8cff', strokeWidth: 2, stroke: '#fff' }} />
              <Area type="monotone" dataKey="indianBasket" stroke="#00e5ff" strokeWidth={2} fill="url(#indianGrad)" dot={false} name="Indian Basket" activeDot={{ r: 5, fill: '#00e5ff', strokeWidth: 2, stroke: '#fff' }} />
              <Area type="monotone" dataKey="wti" stroke="#8b5cf6" strokeWidth={1.8} fill="url(#wtiGrad)" dot={false} name="WTI" activeDot={{ r: 4, fill: '#8b5cf6' }} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Real-time Trend Analysis */}
          <div style={{ 
            marginTop: 10, 
            background: 'rgba(29, 140, 255, 0.03)', 
            border: '1px dashed rgba(29, 140, 255, 0.15)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 11,
            lineHeight: 1.45,
            color: 'var(--text-muted)'
          }}>
            <strong style={{ color: '#00e5ff' }}>Trend Analysis:</strong>{' '}
            {activeScenario ? (
              <span>
                Escalation in <strong style={{ color: '#ef4444' }}>{activeScenario.name}</strong> has injected an immediate geopolitical premium. Crude spot prices are elevated, with Brent Crude hovering around <strong>${baseBrent.toFixed(1)}/bbl</strong>. Refiners are advised to hedge against route deviations and rising war-risk insurance premiums.
              </span>
            ) : (
              <span>
                Domestic oil basket price is holding steady at <strong>${indianBasketPrice.toFixed(1)}/bbl</strong>. Minimal price volatility is expected in the next 14 days, supported by stable strategic petroleum reserves and normal tanker transit flow rates across critical choke points.
              </span>
            )}
          </div>

          {/* Bottom info strip */}
          <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
            {[
              { event: '🔴 OPEC Cut', date: 'Mar 2024', impact: '-0.8M bbl/day', color: '#ef4444' },
              { event: '⚠️ Hormuz Tension', date: 'May 2024', impact: '+$6.2/bbl spike', color: '#f59e0b' },
              { event: '📈 India Demand Peak', date: 'Jun 2024', impact: '+4.2M bbl/day', color: '#22c55e' },
              { event: '🛢️ SPR Release', date: 'Jul 2024', impact: '-$2.1/bbl relief', color: '#1d8cff' },
            ].map(e => (
              <div key={e.event} style={{ flex: 1, borderLeft: `2px solid ${e.color}40`, paddingLeft: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: e.color, marginBottom: 1 }}>{e.event}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-dim)', marginBottom: 1 }}>{e.date}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600 }}>{e.impact}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Live incident feed */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 className="card-title">Live Incident Feed</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className={`status-dot ${!offline ? 'live' : ''}`} style={{ background: !offline ? '#4ade80' : '#64748b' }} />
              <span style={{ fontSize: 10, color: !offline ? '#4ade80' : '#64748b', fontWeight: 700 }}>
                {!offline ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayIncidents.map((incident, idx) => {
              const cols = incidentColorMap[incident.color] || incidentColorMap.blue;
              return (
                <div key={incident.id ?? idx} style={{
                  display: 'flex', gap: 10, padding: '10px 12px',
                  borderRadius: 9, background: cols.bg, border: `1px solid ${cols.border}`,
                }}>
                  <div style={{ flexShrink: 0, paddingTop: 1 }}>
                    <StatusBadge status={incident.type || incident.severity} size="sm" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>{incident.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{incident.detail || incident.description}</p>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>{incident.time}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Immediate actions */}
      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, margin: 0, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Immediate Actions
          </h3>
          {pipelineState.latest_decision?.action_type && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Latest Decision: <span style={{ color: '#22c55e', fontWeight: 600 }}>{pipelineState.latest_decision.action_type}</span> ({pipelineState.latest_decision.status})
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { label: 'Approve Procurement Plan', variant: 'primary', icon: CheckCircle },
            { label: 'Initiate SPR Drawdown', variant: 'secondary', icon: Shield },
            { label: 'Run Crisis Simulation', variant: 'secondary', icon: Activity },
            { label: 'Generate AI Brief', variant: 'secondary', icon: Bot },
            { label: 'Alert Cabinet', variant: 'danger', icon: AlertTriangle },
            { label: 'View Full Report', variant: 'ghost', icon: ArrowRight },
          ].map(a => (
            <button key={a.label} className={`btn btn-${a.variant} btn-sm`} onClick={() => handleAction(a.label)}>
              <a.icon size={12} />{a.label}
            </button>
          ))}
        </div>
      </GlassCard>
    </DashboardLayout>
  );
}
