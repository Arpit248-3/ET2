import React, { useState, useEffect, useCallback } from 'react';
import { Play, BarChart2, CheckCircle, Bot, Loader, AlertTriangle, Zap, RefreshCw, Sliders, Calendar } from 'lucide-react';
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
  const { activeScenario, scenarios, backendOnline, activateScenario, refreshState } = useScenario();

  const [selected, setSelected] = useState(() => activeScenario?.id || 'hormuz_closure');
  const [severityMultiplier, setSeverityMultiplier] = useState(1.0);
  const [durationDays, setDurationDays] = useState(30);

  const [running, setRunning] = useState(false);
  const [activating, setActivating] = useState(false);
  const [simulationCache, setSimulationCache] = useState(null);
  const [simulationError, setSimulationError] = useState(null);

  // Derive list of scenarios
  const displayScenarios = scenarios.map(s => ({
    id: s.id,
    name: s.name,
    impact: s.severity || 'HIGH',
    probability: s.probability || 50,
    import_gap: s.india_import_gap_mbbl_day || s.parameters?.supply_shortfall_mbbl || 1.8,
    price_spike: s.crude_price_spike_usd || (s.brent_shock_usd ? s.brent_shock_usd - (s.brent_baseline_usd || 88) : 10),
    risk_score: s.kpi?.risk_score || s.geopolitical_risk || 50,
    region: s.region || 'Middle East',
    is_active: activeScenario?.id === s.id,
  }));

  // Run / Recalculate simulation for selected scenario
  const executeSimulation = useCallback(async (scenarioId, isManualRun = false, mult = severityMultiplier, days = durationDays) => {
    const targetId = scenarioId || selected;
    setRunning(true);
    setSimulationError(null);

    try {
      // 1. Fetch simulation response from backend with multiplier and duration
      const res = await runSimulation({
        scenario_id: targetId,
        duration_days: days,
        severity_multiplier: mult,
      });
      
      // 2. Fetch economic impact for this scenario with recalculate flag
      let econData = null;
      try {
        econData = await fetchEconomicImpact({ scenario_id: targetId, recalculate: true });
      } catch (econErr) {
        console.warn("Economic impact fetch warning:", econErr);
      }

      const cacheResult = {
        scenario_id: targetId,
        severity_multiplier: mult,
        duration_days: days,
        summary: res.summary,
        daily_projection: res.daily_projection,
        recommended_action: res.recommended_action,
        econ: econData,
        timestamp: new Date().toLocaleTimeString(),
      };

      setSimulationCache(cacheResult);
      localStorage.setItem(`urja_sim_${targetId}`, JSON.stringify(cacheResult));

      if (isManualRun) {
        const sName = scenarios.find(s => s.id === targetId)?.name || targetId;
        addToast(`✓ Recalculated ${sName} (${mult}x severity factor, ${days} days)`, 'success');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setSimulationError(err.message || 'Simulation execution failed');
      if (isManualRun) addToast('Recalculation failed to run', 'error');
    } finally {
      setRunning(false);
    }
  }, [selected, scenarios, severityMultiplier, durationDays, addToast]);

  // Trigger simulation whenever selected scenario changes
  useEffect(() => {
    if (selected) {
      executeSimulation(selected, false);
    }
  }, [selected, executeSimulation]);

  // Activate scenario globally across app
  const handleActivateScenario = async (scenarioId) => {
    const targetId = scenarioId || selected;
    setActivating(true);
    try {
      await activateScenario(targetId);
      await refreshState();
      const sObj = scenarios.find(s => s.id === targetId);
      addToast(`⚡ Scenario "${sObj?.name || targetId}" activated system-wide!`, 'success');
    } catch (err) {
      console.error('Failed to activate scenario:', err);
      addToast('Failed to activate scenario', 'error');
    } finally {
      setActivating(false);
    }
  };

  const handleCompareScenarios = () => {
    if (scenarios && scenarios.length > 0) {
      const summary = scenarios.map(s => `${s.name} (${s.severity || 'HIGH'})`).join(' vs ');
      addToast(`Comparing ${scenarios.length} scenarios: ${summary}`, 'info');
    } else {
      addToast('No active scenarios loaded for comparison.', 'warning');
    }
  };

  // Selected scenario metadata
  const selectedObj = scenarios.find(s => s.id === selected) || activeScenario;

  // Dynamic KPI Metric Card Extraction from Backend Simulation
  const result = simulationCache?.summary
    ? {
        supplyLoss: `${(simulationCache.summary.total_supply_gap_mbbl || 0).toFixed(1)}M bbl`,
        priceSurge: `+$${Math.round((simulationCache.summary.peak_brent || 88) - (selectedObj?.brent_baseline_usd || 88))}/bbl`,
        gdpImpact: (() => {
          const raw = simulationCache.econ?.headline?.gdp_growth_drag_pp ??
                      simulationCache.econ?.metrics?.gdp?.value ??
                      selectedObj?.economic?.gdp_impact_pct;
          if (raw === undefined || raw === null) return '-0.30%';
          const val = Math.abs(parseFloat(raw)) * (simulationCache.severity_multiplier || 1.0);
          return `-${val.toFixed(2)}%`;
        })(),
        inflationImpact: (() => {
          const raw = simulationCache.econ?.headline?.inflation_impact_pp ??
                      simulationCache.econ?.metrics?.inflation?.value ??
                      selectedObj?.economic?.inflation_pct;
          if (raw === undefined || raw === null) return '+1.20%';
          const val = Math.abs(parseFloat(raw)) * (simulationCache.severity_multiplier || 1.0);
          return `+${val.toFixed(2)}%`;
        })(),
        duration: `${simulationCache.duration_days || durationDays} days`,
        severity: simulationCache.summary.severity || selectedObj?.severity || 'HIGH',
      }
    : null;

  // Dynamic Chart Data mapping for timeline graph
  const displayChart = simulationCache?.daily_projection
    ? simulationCache.daily_projection.map((d, i) => ({ 
        t: `Day ${d.day || i + 1}`, 
        price: d.brent_price || 88, 
        supply: d.spr_level_pct || 100,
        risk: d.risk_score || 50,
        gap: d.supply_gap_mbbl || 0,
      }))
    : [];

  const displayRecommendation = simulationCache?.recommended_action || selectedObj?.description || '';

  return (
    <DashboardLayout>
      {!backendOnline && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12,
          color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <AlertTriangle size={14} />
          <span>Showing last known intelligence state (Offline mode)</span>
        </div>
      )}

      <PageHeader title="AI Scenario Simulator" subtitle="Geopolitical risk modeling · Economic impact projection · Real-time reserve simulation"
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={handleCompareScenarios}>
            <BarChart2 size={13} /> Compare Scenarios
          </button>
          <button className="btn btn-warning btn-sm" onClick={() => handleActivateScenario(selected)} disabled={activating}>
            {activating ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={13} />} Activate Selected
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => executeSimulation(selected, true)} disabled={running}>
            {running
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Recalculating...</span>
              : <><RefreshCw size={13} /> Recalculate</>}
          </button>
        </>}
      />

      {/* Simulation alert banner */}
      {simulationError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <AlertTriangle size={14} />
          <span>Simulation notice: {simulationError}. Projections rendered from scenario telemetry.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 16 }}>
        
        {/* Left Column: Scenarios List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Scenarios Registry ({displayScenarios.length})
              </h3>
              <span style={{ fontSize: 10, color: '#00e5ff', background: 'rgba(0,229,255,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                SELECT TO SIMULATE
              </span>
            </div>

            {displayScenarios.length === 0 ? (
              <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>No scenarios loaded from backend.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '65vh', overflowY: 'auto', paddingRight: 2 }}>
                {displayScenarios.map(s => {
                  const isSelected = selected === s.id;
                  const isActiveBaseline = activeScenario?.id === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => { setSelected(s.id); }}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: isSelected
                          ? '1px solid rgba(0,229,255,0.6)'
                          : isActiveBaseline
                          ? '1px solid rgba(245,158,11,0.4)'
                          : '1px solid var(--border-soft)',
                        background: isSelected
                          ? 'rgba(0,229,255,0.08)'
                          : isActiveBaseline
                          ? 'rgba(245,158,11,0.05)'
                          : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 0 16px rgba(0,229,255,0.12)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#00e5ff' : 'var(--text-main)' }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                            {s.region} · Gap: {s.import_gap}M bbl/d · Spike: +${s.price_spike.toFixed(1)}
                          </div>
                        </div>
                        <StatusBadge status={s.impact} size="sm" />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, marginRight: 10 }}>
                          <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                            <div style={{
                              width: `${s.probability}%`, height: '100%', borderRadius: 2,
                              background: s.impact === 'CRITICAL' ? '#ef4444' : s.impact === 'HIGH' ? '#f59e0b' : '#1d8cff'
                            }} />
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{s.probability}%</span>
                        </div>

                        {isActiveBaseline && (
                          <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.15)', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>
                            ACTIVE BASELINE
                          </span>
                        )}
                        {isSelected && !isActiveBaseline && (
                          <span style={{ fontSize: 9, color: '#00e5ff', fontWeight: 700, background: 'rgba(0,229,255,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                            SELECTED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Quick Info Card for Selected Scenario */}
          {selectedObj && (
            <GlassCard style={{ background: 'rgba(0,229,255,0.03)', borderColor: 'rgba(0,229,255,0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#00e5ff', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
                Scenario Profile: {selectedObj.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 10 }}>
                {selectedObj.description || 'Geopolitical disruption scenario modeling impact on India crude imports.'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Baseline Brent:</span>
                  <strong style={{ color: '#fff', marginLeft: 4 }}>${selectedObj.brent_baseline_usd || 88}/bbl</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Price Spike:</span>
                  <strong style={{ color: '#f59e0b', marginLeft: 4 }}>+${((selectedObj.crude_price_spike_usd || (selectedObj.brent_shock_usd ? selectedObj.brent_shock_usd - (selectedObj.brent_baseline_usd || 88) : 10)) * severityMultiplier).toFixed(1)}/bbl</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Import Gap:</span>
                  <strong style={{ color: '#ef4444', marginLeft: 4 }}>{(selectedObj.india_import_gap_mbbl_day || selectedObj.parameters?.supply_shortfall_mbbl || 1.8)} M bbl/d</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Risk Score:</span>
                  <strong style={{ color: '#00e5ff', marginLeft: 4 }}>{selectedObj.kpi?.risk_score || selectedObj.geopolitical_risk || 50}/100</strong>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Column: Simulation Output & Dynamic Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Simulation Controls & Recalculate Toolbar */}
          <GlassCard style={{ background: 'rgba(8,18,38,0.95)', border: '1px solid rgba(0,229,255,0.25)', padding: '14px 18px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,229,255,0.1)',
                  border: '1px solid rgba(0,229,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5ff'
                }}>
                  <Sliders size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                    Recalculation Controls — {selectedObj?.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>
                    Adjust shock severity or timeline horizon & click Recalculate
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                
                {/* Severity Multiplier Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Severity Factor:</span>
                  <select
                    value={severityMultiplier}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSeverityMultiplier(val);
                      executeSimulation(selected, true, val, durationDays);
                    }}
                    style={{
                      background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.25)',
                      borderRadius: 6, color: '#00e5ff', fontSize: 12, fontWeight: 700, padding: '5px 10px',
                      cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value={1.0} style={{ background: '#0a1628' }}>1.0x (Standard)</option>
                    <option value={1.3} style={{ background: '#0a1628' }}>1.3x (Elevated)</option>
                    <option value={1.8} style={{ background: '#0a1628' }}>1.8x (Catastrophic)</option>
                  </select>
                </div>

                {/* Duration Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Horizon:</span>
                  <select
                    value={durationDays}
                    onChange={(e) => {
                      const days = parseInt(e.target.value, 10);
                      setDurationDays(days);
                      executeSimulation(selected, true, severityMultiplier, days);
                    }}
                    style={{
                      background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.25)',
                      borderRadius: 6, color: '#00e5ff', fontSize: 12, fontWeight: 700, padding: '5px 10px',
                      cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value={30} style={{ background: '#0a1628' }}>30 Days</option>
                    <option value={60} style={{ background: '#0a1628' }}>60 Days</option>
                    <option value={90} style={{ background: '#0a1628' }}>90 Days</option>
                  </select>
                </div>

                {/* Recalculate Button */}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => executeSimulation(selected, true, severityMultiplier, durationDays)}
                  disabled={running}
                  style={{ gap: 6 }}
                >
                  <RefreshCw size={13} style={{ animation: running ? 'spin 0.8s linear infinite' : 'none' }} />
                  {running ? 'Recalculating...' : 'Recalculate Projections'}
                </button>
              </div>

            </div>
          </GlassCard>

          {/* Metric KPI Cards */}
          {result && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {[
                { 
                  label: 'Supply Loss', 
                  val: result.supplyLoss, 
                  color: '#ef4444',
                  desc: `Daily import gap: ${selectedObj?.india_import_gap_mbbl_day || selectedObj?.parameters?.supply_shortfall_mbbl || 1.8}M bbl/day. Total projected shortage: ${result.supplyLoss}.`
                },
                { 
                  label: 'Peak Price Surge', 
                  val: result.priceSurge, 
                  color: '#f59e0b',
                  desc: `Baseline Brent: $${selectedObj?.brent_baseline_usd || '88'}/bbl. Price shock peak: +$${Math.round((simulationCache?.summary?.peak_brent || 88) - (selectedObj?.brent_baseline_usd || 88))}/bbl.`
                },
                { 
                  label: 'GDP Impact', 
                  val: result.gdpImpact, 
                  color: '#ef4444',
                  desc: `Calculated GDP impact: ${result.gdpImpact}. Contraction based on energy cost pass-through.`
                },
                { 
                  label: 'Inflation Impact', 
                  val: result.inflationImpact, 
                  color: '#f59e0b',
                  desc: `Calculated inflation pressure: ${result.inflationImpact}. Driven by fuel transport & logistics spillovers.`
                },
                { 
                  label: 'Duration', 
                  val: result.duration, 
                  color: '#1d8cff',
                  desc: `Simulation phase: ${result.duration}. Supply gap closes after day 22 as alternate maritime cargoes arrive.`
                },
                { 
                  label: 'Severity Level', 
                  val: result.severity, 
                  color: result.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                  desc: `Scenario severity rating: ${result.severity}. Geopolitical risk rating: ${selectedObj?.kpi?.risk_score || selectedObj?.geopolitical_risk || 50}/100.`
                },
              ].map(k => (
                <GlassCard key={k.label} style={{ textAlign: 'center', padding: '14px', position: 'relative', overflow: 'visible' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{k.label}</div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Timeline Chart */}
          {displayChart.length > 0 && (
            <GlassCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                    {durationDays}-Day Crude Price ($) & Strategic Reserve (%) Trajectory
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    Dynamic response curve for <strong>{selectedObj?.name}</strong> ({severityMultiplier}x shock multiplier)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>🔴 Oil Price ($/bbl)</span>
                  <span style={{ color: '#00e5ff', fontWeight: 600 }}>🔵 SPR Reserve Level (%)</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={displayChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,130,255,0.08)" />
                  <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} interval={Math.max(1, Math.floor(displayChart.length / 8))} />
                  <YAxis yAxisId="left" orientation="left" tick={{ fill: '#ef4444', fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#00e5ff', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'rgba(8,18,35,0.96)', border: '1px solid rgba(90,130,255,0.3)', borderRadius: 8, fontSize: 12 }} />
                  <Area yAxisId="left" type="monotone" dataKey="price" stroke="#ef4444" strokeWidth={2} fill="url(#priceGrad)" name="Brent Crude ($/bbl)" />
                  <Area yAxisId="right" type="monotone" dataKey="supply" stroke="#00e5ff" strokeWidth={2} fill="url(#supplyGrad)" name="SPR Capacity (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* AI Recommendation */}
          {displayRecommendation && (
            <GlassCard style={{ background: 'rgba(0,229,255,0.04)', borderColor: 'rgba(0,229,255,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Bot size={16} style={{ color: '#00e5ff' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#00e5ff' }}>UrjaNetra AI Strategic Recommendation</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.7, marginBottom: 14 }}>
                {displayRecommendation}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-success btn-sm" onClick={() => addToast('Action plan approved', 'success')}>
                  <CheckCircle size={13} /> Approve Action Plan
                </button>
                <button className="btn btn-warning btn-sm" onClick={() => handleActivateScenario(selected)} disabled={activating}>
                  <Zap size={13} /> Activate System Baseline
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
