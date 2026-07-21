import React, { useState } from 'react';
import { Play, BarChart2, Map, CheckCircle, X, Bot, Loader, AlertTriangle, WifiOff } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import { runSimulation, fetchEconomicImpact } from '../../services/api.js';

export default function ScenarioSimulator() {
  const { addToast } = useToast();
  const { activeScenario, scenarios, backendOnline, refreshState } = useScenario();
  const [selected, setSelected] = useState(activeScenario?.id || 'hormuz_closure');
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [simulationError, setSimulationError] = useState(null);

  // Cache-based simulation state
  const [simulationCache, setSimulationCache] = useState(() => {
    const cached = localStorage.getItem('urja_simulation_cache');
    return cached ? JSON.parse(cached) : null;
  });

  // Display scenarios from ScenarioContext
  const displayScenarios = scenarios.map(s => ({
    id: s.id,
    name: s.name,
    impact: s.severity || 'HIGH',
    probability: s.probability || 50
  }));

  const handleCompareScenarios = () => {
    if (scenarios && scenarios.length > 0) {
      const summary = scenarios.map(s => `${s.name} (${s.severity || 'HIGH'})`).join(' vs ');
      addToast(`Comparing scenarios: ${summary}`, 'info');
    } else {
      addToast('No active scenarios loaded for comparison.', 'warning');
    }
  };

  const handleRunScenario = async () => {
    setRunning(true);
    setRan(false);
    setSimulationError(null);

    try {
      const res = await runSimulation({ scenario_id: selected, duration_days: 30 });
      
      // Fetch economic impact to enrich missing GDP/Inflation values
      let econData = null;
      try {
        econData = await fetchEconomicImpact();
      } catch (econErr) {
        console.error("Failed to fetch economic impact post-simulation:", econErr);
      }

      const cacheResult = {
        summary: res.summary,
        daily_projection: res.daily_projection,
        recommended_action: res.recommended_action,
        econ: econData
      };

      setSimulationCache(cacheResult);
      localStorage.setItem('urja_simulation_cache', JSON.stringify(cacheResult));
      
      // Refresh pipeline context after simulation run
      await refreshState();
      
      addToast('Scenario simulation complete — live data loaded', 'success');
      setRan(true);
    } catch (err) {
      console.error(err);
      setSimulationError(err.message || 'Simulation failed');
      addToast('Failed to run simulation', 'error');
    } finally {
      setRunning(false);
    }
  };

  // Derived display data
  const result = simulationCache?.summary
    ? {
        supplyLoss: `${simulationCache.summary.total_supply_gap_mbbl || 0}M bbl`,
        priceSurge: `+$${Math.round((simulationCache.summary.peak_brent || 88) - 88)}/bbl`,
        gdpImpact: (() => {
          const v = simulationCache.econ?.metrics?.gdp?.value;
          if (v === undefined || v === null) return '-0.0%';
          const num = parseFloat(v);
          // value is already signed (negative for contraction)
          return `${num > 0 ? '+' : ''}${num}%`;
        })(),
        inflationImpact: (() => {
          const v = simulationCache.econ?.metrics?.inflation?.value;
          if (v === undefined || v === null) return '+0.0%';
          const num = parseFloat(v);
          return `${num >= 0 ? '+' : ''}${num}%`;
        })(),
        duration: '30 days',
        severity: simulationCache.summary.severity || 'HIGH',
      }
    : null;

  const displayChart = simulationCache?.daily_projection
    ? simulationCache.daily_projection.map((d, i) => ({ 
        t: `D+${d.day || i}`, 
        price: d.brent_price || 88, 
        supply: d.spr_level_pct || 100 
      }))
    : [];

  const displayRecommendation = simulationCache?.recommended_action || '';

  // Safe empty offline view if no cache is available and offline
  if (!simulationCache && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <WifiOff size={48} style={{ color: '#f59e0b' }} />
          <h2>System Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached simulation result is available.</p>
          <button className="btn btn-primary" onClick={handleRunScenario}>
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

      <PageHeader title="AI Scenario Simulator" subtitle="Geopolitical risk modeling · Economic impact projection · Strategic planning"
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={handleCompareScenarios}>Compare Scenarios</button>
          <button className="btn btn-secondary btn-sm" onClick={() => addToast('Custom scenario builder opened', 'info')}>Custom Scenario</button>
          <button className="btn btn-primary btn-sm" onClick={handleRunScenario} disabled={running}>
            {running ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />Running...</span> : <><Play size={13} /> Run Simulation</>}
          </button>
        </>}
      />

      {/* Error Notification Banner */}
      {backendOnline && simulationError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <AlertTriangle size={14} />
          Simulation failed: {simulationError}. Showing cached projections.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Scenario selector */}
        <GlassCard>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Select Scenario</h3>
          {displayScenarios.length === 0 ? (
            <div style={{ padding: 10, color: 'var(--text-muted)', fontSize: 12 }}>No scenarios loaded from backend.</div>
          ) : (
            displayScenarios.map(s => (
              <div key={s.id} onClick={() => { setSelected(s.id); setRan(false); setSimulationError(null); }}
                style={{ padding: '12px 14px', borderRadius: 8, marginBottom: 8, cursor: 'pointer', border: `1px solid ${selected === s.id ? 'rgba(29,140,255,0.4)' : 'var(--border-soft)'}`, background: selected === s.id ? 'rgba(29,140,255,0.1)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: selected === s.id ? '#1d8cff' : 'var(--text-main)' }}>{s.name}</span>
                  <StatusBadge status={s.impact} size="sm" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ width: `${s.probability}%`, height: '100%', borderRadius: 2, background: s.impact === 'CRITICAL' ? '#ef4444' : s.impact === 'HIGH' ? '#f59e0b' : '#1d8cff' }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{s.probability}%</span>
                </div>
              </div>
            ))
          )}
        </GlassCard>

        {/* Simulation area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ran || simulationCache ? (
            <>
              {result && (() => {
                const selectedScenarioObj = scenarios.find(s => s.id === selected) || activeScenario;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                    {[
                      { 
                        label: 'Supply Loss', 
                        val: result.supplyLoss, 
                        color: '#ef4444',
                        desc: `Daily import gap: ${selectedScenarioObj?.india_import_gap_mbbl_day || '0'}M bbl/day. Total projected shortage: ${result.supplyLoss}. Impacted routes: ${selectedScenarioObj?.affected_routes?.join(', ') || 'None'}.`
                      },
                      { 
                        label: 'Price Surge', 
                        val: result.priceSurge, 
                        color: '#f59e0b',
                        desc: `Baseline Brent: $${selectedScenarioObj?.brent_baseline_usd || '88'}/bbl. Price shock: +$${selectedScenarioObj?.crude_price_spike_usd || '0'}/bbl. Insurance premium surge: +${selectedScenarioObj?.insurance_premium_spike_pct || '0'}%.`
                      },
                      { 
                        label: 'GDP Impact', 
                        val: result.gdpImpact, 
                        color: '#ef4444',
                        desc: `Calculated GDP impact: ${result.gdpImpact}. Contraction based on macroeconomic risk weights for ${selectedScenarioObj?.region || 'resilience region'}.`
                      },
                      { 
                        label: 'Inflation Impact', 
                        val: result.inflationImpact, 
                        color: '#f59e0b',
                        desc: `Calculated inflation pressure: ${result.inflationImpact}. Affected suppliers: ${selectedScenarioObj?.affected_suppliers?.join(', ') || 'None'}.`
                      },
                      { 
                        label: 'Duration', 
                        val: result.duration, 
                        color: '#1d8cff',
                        desc: `Simulation phase: ${selectedScenarioObj?.duration_days || '30'} days. Shipping delays through transit lanes increased by ${selectedScenarioObj?.maritime_delay_pct || '0'}%.`
                      },
                      { 
                        label: 'Severity', 
                        val: result.severity, 
                        color: result.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                        desc: `Urgency level: ${result.severity}. Geopolitical risk rating: ${selectedScenarioObj?.geopolitical_risk || '50'}/100. SPR coverage: ${selectedScenarioObj?.kpi?.spr_coverage || 'N/A'} days.`
                      },
                    ].map(k => (
                      <GlassCard key={k.label} style={{ textAlign: 'center', padding: '14px', position: 'relative', overflow: 'visible', cursor: 'help' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.val}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{k.label}</div>
                        <div className="urja-kpi-tooltip">
                          <strong style={{ color: k.color, display: 'block', marginBottom: '4px' }}>{k.label}</strong>
                          {k.desc}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                );
              })()}

              {displayChart.length > 0 && (
                <GlassCard>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Price & Supply Timeline</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={displayChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,130,255,0.08)" />
                      <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'rgba(8,18,35,0.95)', border: '1px solid rgba(90,130,255,0.3)', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="price" stroke="#ef4444" fill="rgba(239,68,68,0.15)" name="Oil Price ($)" />
                      <Area type="monotone" dataKey="supply" stroke="#1d8cff" fill="rgba(29,140,255,0.15)" name="Supply (%)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>
              )}

              {displayRecommendation && (
                <GlassCard style={{ background: 'rgba(29,140,255,0.05)', borderColor: 'rgba(29,140,255,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Bot size={16} style={{ color: '#00e5ff' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#00e5ff' }}>AI Strategic Recommendation</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.7, marginBottom: 14 }}>
                    {displayRecommendation}
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-success btn-sm" onClick={() => addToast('Action plan approved', 'success')}><CheckCircle size={13} /> Approve Plan</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => addToast('Running alternative scenarios...', 'info')}>Modify Parameters</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => addToast('Alternative scenario running...', 'info')}>Run Alternative</button>
                  </div>
                </GlassCard>
              )}
            </>
          ) : (
            <GlassCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {running
                  ? <span style={{ width: 28, height: 28, border: '3px solid rgba(29,140,255,0.3)', borderTopColor: '#1d8cff', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite', display: 'block' }} />
                  : <Play size={26} style={{ color: '#1d8cff' }} />}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>{running ? 'Simulating Scenario...' : 'Ready to Simulate'}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320 }}>{running ? 'AI is running economic models, supply chain analysis, and risk projections...' : 'Select a scenario and click Run Simulation to generate projections.'}</p>
            </GlassCard>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
