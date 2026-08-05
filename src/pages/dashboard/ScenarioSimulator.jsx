import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play, BarChart2, CheckCircle, Bot, Loader, AlertTriangle, Zap,
  RefreshCw, Sliders, Calendar, X, Download, ShieldAlert, TrendingUp,
  Layers, Activity, Search, Filter, ArrowUpRight, ArrowDownRight, Layers3, Eye,
  ChevronRight, Compass
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import { runSimulation, fetchEconomicImpact, compareScenarios } from '../../services/api.js';

const SCENARIO_COLORS = [
  '#00e5ff', '#ef4444', '#f59e0b', '#a855f7', '#10b981',
  '#ec4899', '#3b82f6', '#14b8a6', '#f97316', '#8b5cf6',
  '#06b6d4', '#eab308', '#d946ef', '#6366f1', '#84cc16'
];

// Helper to truncate text safely
const truncateText = (str, maxLen = 22) => {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen - 1) + '…' : str;
};

// ─── Custom Glowing Glass Tooltip for Main Graph ─────────────────────────────
const CustomMainGraphTooltip = ({ active, payload, label, durationDays }) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  const price = dataPoint.price || 88;
  const supply = dataPoint.supply || 100;
  const gap = dataPoint.gap || 0;
  const risk = dataPoint.risk || 50;
  const priceDelta = price - 88;

  return (
    <div style={{
      background: 'rgba(6, 15, 30, 0.96)',
      border: '1px solid rgba(0, 229, 255, 0.45)',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 24px rgba(0, 229, 255, 0.2)',
      borderRadius: 12,
      padding: '12px 16px',
      fontSize: 12,
      color: '#e2e8f0',
      minWidth: 220,
      backdropFilter: 'blur(16px)',
      pointerEvents: 'none',
      zIndex: 9999,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <span style={{ fontWeight: 800, color: '#00e5ff', fontSize: 13, letterSpacing: '0.04em' }}>
          {label} of {durationDays}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: risk > 70 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
          color: risk > 70 ? '#ef4444' : '#f59e0b',
          border: `1px solid ${risk > 70 ? '#ef4444' : '#f59e0b'}40`
        }}>
          Risk {risk}/100
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
            Brent Crude Price:
          </span>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 13 }}>
            ${price.toFixed(1)}/bbl
            <span style={{ fontSize: 10, color: priceDelta >= 0 ? '#ef4444' : '#10b981', marginLeft: 4 }}>
              ({priceDelta >= 0 ? `+$${priceDelta.toFixed(1)}` : `-$${Math.abs(priceDelta).toFixed(1)}`})
            </span>
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#00e5ff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff' }} />
            SPR Reserve Capacity:
          </span>
          <span style={{ fontWeight: 800, color: supply < 30 ? '#ef4444' : '#00e5ff', fontSize: 13 }}>
            {supply.toFixed(1)}%
          </span>
        </div>

        {gap > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
              Daily Import Shortfall:
            </span>
            <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: 13 }}>
              {gap.toFixed(2)} M bbl/d
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Custom Compact Tooltip for Multi-Scenario Compare ────────────────────────
const CustomCompareOverlayTooltip = ({ active, payload, label, metricKey }) => {
  if (!active || !payload || !payload.length) return null;

  // Sort by metric value descending
  const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));
  const topItems = sortedPayload.slice(0, 5);
  const remainingCount = sortedPayload.length - topItems.length;

  const avgVal = (sortedPayload.reduce((acc, curr) => acc + (curr.value || 0), 0) / sortedPayload.length).toFixed(1);

  return (
    <div style={{
      background: 'rgba(5, 12, 26, 0.97)',
      border: '1px solid rgba(0, 229, 255, 0.45)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 229, 255, 0.2)',
      borderRadius: 12,
      padding: '12px 16px',
      fontSize: 12,
      color: '#e2e8f0',
      minWidth: 260,
      maxWidth: 320,
      backdropFilter: 'blur(20px)',
      pointerEvents: 'none',
      zIndex: 9999,
    }}>
      <div style={{
        fontWeight: 800, color: '#00e5ff', fontSize: 13, marginBottom: 8,
        paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span>{label} Projection</span>
        <span style={{ fontSize: 10, color: 'var(--text-dim)', background: 'rgba(0,229,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>
          Avg: {metricKey === 'brent_price' ? `$${avgVal}/bbl` : metricKey === 'spr_level_pct' ? `${avgVal}%` : `${avgVal}M bbl/d`}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {topItems.map((entry) => {
          const val = entry.value;
          const sName = truncateText(entry.name, 24);
          const strokeColor = entry.color;
          return (
            <div key={entry.dataKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: strokeColor, boxShadow: `0 0 6px ${strokeColor}`, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: '#fff', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sName}:
                </span>
              </div>
              <span style={{ fontWeight: 800, color: strokeColor, fontSize: 12, fontFamily: 'monospace', flexShrink: 0 }}>
                {metricKey === 'brent_price' ? `$${val?.toFixed(1)}/bbl` :
                 metricKey === 'spr_level_pct' ? `${val?.toFixed(1)}%` : `${val?.toFixed(2)} M bbl/d`}
              </span>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div style={{
            fontSize: 10, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4,
            paddingTop: 4, borderTop: '1px stroke rgba(255,255,255,0.06)', textAlign: 'right'
          }}>
            + {remainingCount} other scenario curves (hover legend to highlight)
          </div>
        )}
      </div>
    </div>
  );
};

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

  // ─── Filtering & Search State for Scenarios ──────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // ─── Main Graph Mode Switcher ──────────────────────────────────────────────
  const [mainGraphView, setMainGraphView] = useState('price_spr'); // 'price_spr' | 'gap_trajectory' | 'risk_trend'

  // ─── Scenario Comparison State ─────────────────────────────────────────────
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareSelectedIds, setCompareSelectedIds] = useState([]);
  const [compareMetric, setCompareMetric] = useState('brent_price'); // 'brent_price' | 'spr_level_pct' | 'supply_gap_mbbl'
  const [compareViewMode, setCompareViewMode] = useState('chart'); // 'chart' | 'matrix' | 'tradeoff'
  const [comparePreset, setComparePreset] = useState('top5'); // 'top5' | 'all'
  const [hoveredScenarioId, setHoveredScenarioId] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [compareError, setCompareError] = useState(null);

  // Derive list of scenarios
  const displayScenarios = useMemo(() => {
    return scenarios.map(s => ({
      id: s.id,
      name: s.name,
      impact: s.severity || 'HIGH',
      probability: s.probability || 50,
      import_gap: s.india_import_gap_mbbl_day || s.parameters?.supply_shortfall_mbbl || 1.8,
      price_spike: s.crude_price_spike_usd || (s.brent_shock_usd ? s.brent_shock_usd - (s.brent_baseline_usd || 88) : 10),
      risk_score: s.kpi?.risk_score || s.geopolitical_risk || 50,
      region: s.region || 'Middle East',
      is_active: activeScenario?.id === s.id,
      description: s.description || '',
    }));
  }, [scenarios, activeScenario]);

  // Filtered registry list based on search and severity
  const filteredScenarios = useMemo(() => {
    return displayScenarios.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.region.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'ALL' || s.impact === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [displayScenarios, searchTerm, severityFilter]);

  // Run / Recalculate simulation for selected scenario
  const executeSimulation = useCallback(async (scenarioId, isManualRun = false, mult = severityMultiplier, days = durationDays) => {
    const targetId = scenarioId || selected;
    setRunning(true);
    setSimulationError(null);

    try {
      const res = await runSimulation({
        scenario_id: targetId,
        duration_days: days,
        severity_multiplier: mult,
      });

      let econData = null;
      try {
        econData = await fetchEconomicImpact({ scenario_id: targetId, severity_multiplier: mult, recalculate: true });
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

  // ─── Fetch / Compute Multi-Scenario Comparison Data ─────────────────────────
  const loadComparison = useCallback(async (idsToCompare = compareSelectedIds, mult = severityMultiplier, days = durationDays) => {
    if (!idsToCompare || idsToCompare.length === 0) return;
    setCompareLoading(true);
    setCompareError(null);

    // 1. Primary path: try backend POST /api/scenarios/compare
    try {
      const res = await compareScenarios({
        scenario_ids: idsToCompare,
        severity_multiplier: mult,
        duration_days: days,
      });
      if (res && res.scenarios && res.scenarios.length > 0) {
        setCompareData(res);
        setCompareLoading(false);
        return;
      }
    } catch (backendErr) {
      console.warn("Backend comparison endpoint warning, using client fallback:", backendErr);
    }

    // 2. Fallback path: client-side parallel simulations
    try {
      const targetScenarios = scenarios.filter(s => idsToCompare.includes(s.id));
      const scenarioItems = [];
      const projectionsMap = {};

      for (const s of targetScenarios) {
        let simRes = null;
        try {
          simRes = await runSimulation({ scenario_id: s.id, duration_days: days, severity_multiplier: mult });
        } catch (e) {}

        let econData = null;
        try {
          econData = await fetchEconomicImpact({ scenario_id: s.id, severity_multiplier: mult });
        } catch (e) {}

        const brentBaseline = s.brent_baseline_usd || 88.0;
        const crudeSpike = (s.crude_price_spike_usd || (s.brent_shock_usd ? s.brent_shock_usd - brentBaseline : 10.0)) * mult;
        const brentShock = brentBaseline + crudeSpike;
        const gap = (s.india_import_gap_mbbl_day || s.parameters?.supply_shortfall_mbbl || 1.8) * mult;

        const gdpVal = econData?.headline?.gdp_growth_drag_pp ?? s.economic?.gdp_impact_pct ?? 0.30;
        const infVal = econData?.headline?.inflation_impact_pp ?? s.economic?.inflation_pct ?? 1.20;

        scenarioItems.push({
          id: s.id,
          name: s.name,
          severity: s.severity || 'HIGH',
          probability: s.probability || 50,
          region: s.region || 'Middle East',
          geopolitical_risk: s.kpi?.risk_score || s.geopolitical_risk || 50,
          import_gap_mbbl_day: Number(gap.toFixed(2)),
          total_supply_loss_mbbl: Number((gap * days * 0.7).toFixed(1)),
          brent_baseline_usd: brentBaseline,
          brent_shock_usd: Number(brentShock.toFixed(2)),
          crude_price_spike_usd: Number(crudeSpike.toFixed(2)),
          gdp_impact_pct: -Math.abs(Number(gdpVal * mult)),
          inflation_pct: Math.abs(Number(infVal * mult)),
          affected_routes: s.affected_routes || ['Strait of Hormuz'],
          safe_suppliers: s.safe_suppliers || ['West Africa', 'Brazil'],
          is_active: activeScenario?.id === s.id,
          recommended_action: simRes?.recommended_action || s.description || 'Deploy SPR bridge and adjust cargo schedules.'
        });

        if (simRes?.daily_projection) {
          projectionsMap[s.id] = simRes.daily_projection;
        }
      }

      // Sort by risk / price shock descending for rank assignment
      scenarioItems.sort((a, b) => b.crude_price_spike_usd - a.crude_price_spike_usd);

      // Build unified daily chart dataset
      const chartData = [];
      for (let d = 1; d <= days; d++) {
        const point = { day: d, t: `Day ${d}` };
        scenarioItems.forEach(sc => {
          const dp = projectionsMap[sc.id]?.[d - 1];
          point[`${sc.id}_price`] = dp?.brent_price ?? Number((sc.brent_baseline_usd + sc.crude_price_spike_usd * Math.sin((d/days)*Math.PI)).toFixed(1));
          point[`${sc.id}_spr`] = dp?.spr_level_pct ?? Number(Math.max(10, 100 - (sc.import_gap_mbbl_day/3.5) * d).toFixed(1));
          point[`${sc.id}_gap`] = dp?.supply_gap_mbbl ?? sc.import_gap_mbbl_day;
        });
        chartData.push(point);
      }

      const worst = scenarioItems[0];

      setCompareData({
        scenarios: scenarioItems,
        overlay_chart: chartData,
        comparative_summary: `Comparative evaluation of ${scenarioItems.length} active disruption vectors (${mult}x severity, ${days}-day horizon). Highest price vulnerability detected in '${worst?.name || 'Scenario'}' with peak crude shock of +$${worst?.crude_price_spike_usd}/bbl and import shortfall of ${worst?.import_gap_mbbl_day}M bbl/d. Strategic recommendation: pre-authorize SPR drawdown and diversify supplier quotas.`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error("Comparison load error:", err);
      setCompareError("Unable to compute scenario comparisons.");
    } finally {
      setCompareLoading(false);
    }
  }, [scenarios, activeScenario, severityMultiplier, durationDays]);

  // Open Compare Modal
  const handleCompareScenarios = () => {
    const allIds = scenarios.map(s => s.id);
    setCompareSelectedIds(allIds);
    setIsCompareOpen(true);
    loadComparison(allIds, severityMultiplier, durationDays);
  };

  // Toggle individual scenario in comparison modal
  const handleToggleScenarioCompare = (id) => {
    let nextIds;
    if (compareSelectedIds.includes(id)) {
      if (compareSelectedIds.length <= 1) {
        addToast('At least 1 scenario must be selected for comparison', 'warning');
        return;
      }
      nextIds = compareSelectedIds.filter(x => x !== id);
    } else {
      nextIds = [...compareSelectedIds, id];
    }
    setCompareSelectedIds(nextIds);
    loadComparison(nextIds, severityMultiplier, durationDays);
  };

  // Select all or Clear all scenarios
  const handleSelectAllCompare = () => {
    const allIds = scenarios.map(s => s.id);
    setCompareSelectedIds(allIds);
    loadComparison(allIds, severityMultiplier, durationDays);
  };

  const handleClearAllCompare = () => {
    if (scenarios.length > 0) {
      const singleId = [scenarios[0].id];
      setCompareSelectedIds(singleId);
      loadComparison(singleId, severityMultiplier, durationDays);
    }
  };

  // Export scenario comparison report as text
  const handleExportReport = () => {
    if (!compareData || !compareData.scenarios) return;
    const lines = [
      '========================================================================',
      'URJANETRA AI — SCENARIO COMPARATIVE RISK & IMPACT BRIEF',
      '========================================================================',
      `Generated: ${new Date().toLocaleString()}`,
      `Severity Factor: ${severityMultiplier}x  |  Horizon: ${durationDays} Days`,
      `Scenarios Compared: ${compareData.scenarios.length}`,
      '------------------------------------------------------------------------',
      '',
      'EXECUTIVE COMPARATIVE SUMMARY:',
      compareData.comparative_summary || 'N/A',
      '',
      '------------------------------------------------------------------------',
      'DETAILED SCENARIO RANKINGS & METRIC MATRIX:',
      '------------------------------------------------------------------------',
      ...compareData.scenarios.map((s, idx) => [
        `RANK #${idx + 1}: ${s.name} [ID: ${s.id}]`,
        `  • Status / Active: ${s.is_active ? 'ACTIVE SYSTEM BASELINE' : 'Inactive'}`,
        `  • Severity Level: ${s.severity}  |  Risk Score: ${s.geopolitical_risk}/100`,
        `  • Import Gap: ${s.import_gap_mbbl_day} M bbl/day  |  Total 30D Deficit: ${s.total_supply_loss_mbbl} M bbl`,
        `  • Brent Baseline: $${s.brent_baseline_usd}/bbl  |  Peak Shock Brent: $${s.brent_shock_usd}/bbl (+$${s.crude_price_spike_usd})`,
        `  • Macro Economic Drag: GDP ${s.gdp_impact_pct}%  |  Inflation +${s.inflation_pct}%`,
        `  • Affected Routes: ${s.affected_routes.join(', ')}`,
        `  • Safe Sourcing Routes: ${s.safe_suppliers.join(', ')}`,
        `  • Recommended Mitigation: ${s.recommended_action}`,
        '',
      ].join('\n')),
      '========================================================================',
      'CONFIDENTIAL — NATIONAL ENERGY CRISIS MANAGEMENT COUNCIL',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario_comparison_report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Scenario Comparison Report downloaded successfully', 'success');
  };

  // Selected scenario metadata for main view
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
          const val = Math.abs(parseFloat(raw));
          return `-${val.toFixed(2)}%`;
        })(),
        inflationImpact: (() => {
          const raw = simulationCache.econ?.headline?.inflation_impact_pp ??
                      simulationCache.econ?.metrics?.inflation?.value ??
                      selectedObj?.economic?.inflation_pct;
          if (raw === undefined || raw === null) return '+1.20%';
          const val = Math.abs(parseFloat(raw));
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

  // Calculate dynamic stats for main graph telemetry header
  const peakPriceVal = displayChart.length > 0 ? Math.max(...displayChart.map(d => d.price)) : 88;
  const minSprVal = displayChart.length > 0 ? Math.min(...displayChart.map(d => d.supply)) : 100;

  return (
    <DashboardLayout>
      {/* SVG Filters for Glowing Graphs */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

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
          <button className="btn btn-secondary btn-sm" onClick={handleCompareScenarios} style={{ borderColor: '#00e5ff', color: '#00e5ff', boxShadow: '0 0 12px rgba(0,229,255,0.15)' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 18 }}>
        
        {/* Left Column: Scenarios Registry Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GlassCard style={{ background: 'rgba(8, 18, 35, 0.85)', padding: '16px' }}>
            
            {/* Header & Count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers3 size={15} style={{ color: '#00e5ff' }} />
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                  Scenarios Registry ({filteredScenarios.length})
                </h3>
              </div>
              <span style={{ fontSize: 9, color: '#00e5ff', background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                SELECT TO SIMULATE
              </span>
            </div>

            {/* Search Input Bar */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search scenario or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '6px 10px 6px 30px', color: '#fff', fontSize: 11, outline: 'none'
                }}
              />
              {searchTerm && (
                <X size={12} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', cursor: 'pointer' }} />
              )}
            </div>

            {/* Severity Filter Pills */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  style={{
                    background: severityFilter === sev ? (sev === 'CRITICAL' ? '#ef4444' : sev === 'HIGH' ? '#f59e0b' : '#00e5ff') : 'rgba(255,255,255,0.03)',
                    color: severityFilter === sev ? '#050b18' : 'var(--text-dim)',
                    border: 'none', borderRadius: 12, padding: '3px 8px', fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Scenarios List */}
            {filteredScenarios.length === 0 ? (
              <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>No matching scenarios found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '58vh', overflowY: 'auto', paddingRight: 2 }}>
                {filteredScenarios.map(s => {
                  const isSelected = selected === s.id;
                  const isActiveBaseline = activeScenario?.id === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => { setSelected(s.id); }}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: isSelected
                          ? '1px solid rgba(0,229,255,0.7)'
                          : isActiveBaseline
                          ? '1px solid rgba(245,158,11,0.5)'
                          : '1px solid var(--border-soft)',
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(0,229,255,0.12) 0%, rgba(8,18,35,0.9) 100%)'
                          : isActiveBaseline
                          ? 'rgba(245,158,11,0.06)'
                          : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 0 20px rgba(0,229,255,0.15)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#00e5ff' : 'var(--text-main)' }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                            {s.region} · Shortfall: <strong style={{ color: '#ef4444' }}>{s.import_gap}M bbl/d</strong> · Surge: <strong style={{ color: '#f59e0b' }}>+${s.price_spike.toFixed(1)}</strong>
                          </div>
                        </div>
                        <StatusBadge status={s.impact} size="sm" />
                      </div>

                      {/* Probability Progress Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, marginRight: 10 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                            <div style={{
                              width: `${s.probability}%`, height: '100%', borderRadius: 2,
                              background: s.impact === 'CRITICAL' ? '#ef4444' : s.impact === 'HIGH' ? '#f59e0b' : '#1d8cff',
                              boxShadow: `0 0 6px ${s.impact === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`
                            }} />
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{s.probability}% prob.</span>
                        </div>

                        {isActiveBaseline && (
                          <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.15)', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>
                            ⚡ ACTIVE BASELINE
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
            <GlassCard style={{ background: 'rgba(0,229,255,0.03)', borderColor: 'rgba(0,229,255,0.25)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#00e5ff', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
                Scenario Profile: {selectedObj.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 10 }}>
                {selectedObj.description || 'Geopolitical disruption scenario modeling impact on India crude imports.'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Baseline Brent:</span>
                  <strong style={{ color: '#fff', marginLeft: 4 }}>${selectedObj.brent_baseline_usd || 88}/bbl</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Price Surge:</span>
                  <strong style={{ color: '#f59e0b', marginLeft: 4 }}>+${((selectedObj.crude_price_spike_usd || (selectedObj.brent_shock_usd ? selectedObj.brent_shock_usd - (selectedObj.brent_baseline_usd || 88) : 10)) * severityMultiplier).toFixed(1)}/bbl</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Import Gap:</span>
                  <strong style={{ color: '#ef4444', marginLeft: 4 }}>{(selectedObj.india_import_gap_mbbl_day || selectedObj.parameters?.supply_shortfall_mbbl || 1.8)} M bbl/d</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Risk Score:</span>
                  <strong style={{ color: '#00e5ff', marginLeft: 4 }}>{selectedObj.kpi?.risk_score || selectedObj.geopolitical_risk || 50}/100</strong>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Column: Simulation Output & Dynamic Graphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Simulation Controls & Toolbar */}
          <GlassCard style={{ background: 'rgba(8,18,38,0.95)', border: '1px solid rgba(0,229,255,0.3)', padding: '14px 18px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,229,255,0.12)',
                  border: '1px solid rgba(0,229,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5ff',
                  boxShadow: '0 0 16px rgba(0,229,255,0.2)'
                }}>
                  <Sliders size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                    Recalculation Controls — {selectedObj?.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', marginTop: 2 }}>
                    Adjust shock severity factor or duration horizon to dynamically re-simulate trajectories
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                
                {/* Severity Factor Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Severity Factor:</span>
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                    {[
                      { val: 1.0, label: '1.0x (Standard)' },
                      { val: 1.3, label: '1.3x (High)' },
                      { val: 1.8, label: '1.8x (Extreme)' }
                    ].map(mult => (
                      <button
                        key={mult.val}
                        onClick={() => {
                          setSeverityMultiplier(mult.val);
                          executeSimulation(selected, true, mult.val, durationDays);
                          if (isCompareOpen) loadComparison(compareSelectedIds, mult.val, durationDays);
                        }}
                        style={{
                          background: severityMultiplier === mult.val ? '#00e5ff' : 'transparent',
                          color: severityMultiplier === mult.val ? '#050b18' : 'var(--text-dim)',
                          border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          padding: '4px 8px', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        {mult.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Horizon Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Horizon:</span>
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                    {[30, 60, 90].map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setDurationDays(d);
                          executeSimulation(selected, true, severityMultiplier, d);
                          if (isCompareOpen) loadComparison(compareSelectedIds, severityMultiplier, d);
                        }}
                        style={{
                          background: durationDays === d ? '#00e5ff' : 'transparent',
                          color: durationDays === d ? '#050b18' : 'var(--text-dim)',
                          border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        {d}D
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recalculate Button */}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => executeSimulation(selected, true, severityMultiplier, durationDays)}
                  disabled={running}
                  style={{ gap: 6, boxShadow: '0 0 16px rgba(0,229,255,0.2)' }}
                >
                  <RefreshCw size={13} style={{ animation: running ? 'spin 0.8s linear infinite' : 'none' }} />
                  {running ? 'Recalculating...' : 'Recalculate'}
                </button>
              </div>

            </div>
          </GlassCard>

          {/* Metric KPI Cards */}
          {result && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 12 }}>
              {[
                { 
                  label: 'Supply Loss', 
                  val: result.supplyLoss, 
                  color: '#ef4444',
                  sub: `${selectedObj?.india_import_gap_mbbl_day || 1.8}M bbl/d gap`
                },
                { 
                  label: 'Peak Price Surge', 
                  val: result.priceSurge, 
                  color: '#f59e0b',
                  sub: `Base: $${selectedObj?.brent_baseline_usd || 88}/bbl`
                },
                { 
                  label: 'GDP Impact', 
                  val: result.gdpImpact, 
                  color: '#ef4444',
                  sub: `Pass-through drag`
                },
                { 
                  label: 'Inflation Impact', 
                  val: result.inflationImpact, 
                  color: '#f59e0b',
                  sub: `Transport spillover`
                },
                { 
                  label: 'Duration', 
                  val: result.duration, 
                  color: '#1d8cff',
                  sub: `Phase window`
                },
                { 
                  label: 'Severity Level', 
                  val: result.severity, 
                  color: result.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                  sub: `Risk ${selectedObj?.geopolitical_risk || 50}/100`
                },
              ].map(k => (
                <GlassCard key={k.label} style={{ textAlign: 'center', padding: '14px 10px', position: 'relative', overflow: 'hidden', background: 'rgba(8,18,35,0.8)' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: k.color, textShadow: `0 0 12px ${k.color}40` }}>{k.val}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>{k.sub}</div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Main Telemetry Chart Card */}
          {displayChart.length > 0 && (
            <GlassCard style={{ padding: '20px 24px', background: 'rgba(6,14,30,0.92)', border: '1px solid rgba(0,229,255,0.25)' }}>
              
              {/* Telemetry Header & Dynamic Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={18} style={{ color: '#00e5ff' }} />
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>
                      {durationDays}-Day Telemetry Trajectory Curve
                    </h3>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    Dynamic response curve for <strong>{selectedObj?.name}</strong> ({severityMultiplier}x shock factor)
                  </div>
                </div>

                {/* Main Graph View Mode Switcher */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
                  {[
                    { id: 'price_spr', label: 'Price & SPR Level' },
                    { id: 'gap_trajectory', label: 'Import Shortfall' },
                    { id: 'risk_trend', label: 'Risk Rating' }
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => setMainGraphView(v.id)}
                      style={{
                        background: mainGraphView === v.id ? '#00e5ff' : 'transparent',
                        color: mainGraphView === v.id ? '#050b18' : 'var(--text-dim)',
                        border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        padding: '5px 12px', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Telemetry Stats Pill Bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 11
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
                  <span style={{ color: 'var(--text-dim)' }}>Peak Price Shock:</span>
                  <strong style={{ color: '#ef4444' }}>${peakPriceVal.toFixed(1)}/bbl</strong>
                  <span style={{ fontSize: 10, color: '#ef4444' }}>(+${(peakPriceVal - 88).toFixed(1)})</span>
                </div>

                <div style={{ height: 12, width: 1, background: 'rgba(255,255,255,0.1)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff' }} />
                  <span style={{ color: 'var(--text-dim)' }}>Min SPR Capacity:</span>
                  <strong style={{ color: minSprVal < 30 ? '#ef4444' : '#00e5ff' }}>{minSprVal.toFixed(1)}%</strong>
                </div>

                <div style={{ height: 12, width: 1, background: 'rgba(255,255,255,0.1)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
                  <span style={{ color: 'var(--text-dim)' }}>Daily Shortfall:</span>
                  <strong style={{ color: '#f59e0b' }}>{(selectedObj?.india_import_gap_mbbl_day || 1.8) * severityMultiplier} M bbl/d</strong>
                </div>
              </div>

              {/* Responsive Graph Container */}
              <ResponsiveContainer width="100%" height={280}>
                {mainGraphView === 'price_spr' ? (
                  <AreaChart data={displayChart} margin={{ top: 15, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="t" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} interval={Math.max(1, Math.floor(displayChart.length / 8))} />
                    
                    {/* Explicit Left & Right Y-Axes */}
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      tick={{ fill: '#ef4444', fontSize: 10, fontWeight: 700 }}
                      domain={['dataMin - 4', 'dataMax + 4']}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: '#00e5ff', fontSize: 10, fontWeight: 700 }}
                      domain={[0, 100]}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip content={<CustomMainGraphTooltip durationDays={durationDays} />} />
                    
                    <ReferenceLine yAxisId="left" y={88} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
                    <ReferenceLine yAxisId="right" y={25} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />

                    <Area yAxisId="left" type="monotone" dataKey="price" stroke="#ef4444" strokeWidth={3} fill="url(#priceGrad)" name="Brent Crude ($/bbl)" filter="url(#glowRed)" />
                    <Area yAxisId="right" type="monotone" dataKey="supply" stroke="#00e5ff" strokeWidth={3} fill="url(#supplyGrad)" name="SPR Capacity (%)" filter="url(#glowCyan)" />
                  </AreaChart>
                ) : mainGraphView === 'gap_trajectory' ? (
                  <AreaChart data={displayChart} margin={{ top: 15, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="t" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                    <YAxis tick={{ fill: '#f59e0b', fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => `${v}M`} />
                    <Tooltip content={<CustomMainGraphTooltip durationDays={durationDays} />} />
                    <Area type="monotone" dataKey="gap" stroke="#f59e0b" strokeWidth={3} fill="url(#gapGrad)" name="Import Shortfall (M bbl/d)" filter="url(#glowAmber)" />
                  </AreaChart>
                ) : (
                  <LineChart data={displayChart} margin={{ top: 15, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="t" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                    <YAxis tick={{ fill: '#a855f7', fontSize: 10, fontWeight: 700 }} domain={[0, 100]} />
                    <Tooltip content={<CustomMainGraphTooltip durationDays={durationDays} />} />
                    <Line type="monotone" dataKey="risk" stroke="#a855f7" strokeWidth={3} dot={false} name="Geopolitical Risk Rating" />
                  </LineChart>
                )}
              </ResponsiveContainer>

            </GlassCard>
          )}

          {/* AI Strategic Recommendation */}
          {displayRecommendation && (
            <GlassCard style={{ background: 'rgba(0,229,255,0.04)', borderColor: 'rgba(0,229,255,0.25)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Bot size={16} style={{ color: '#00e5ff' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#00e5ff' }}>UrjaNetra AI Strategic Recommendation</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.7, marginBottom: 14 }}>
                {displayRecommendation}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-success btn-sm" onClick={() => addToast('Action plan approved & synced', 'success')}>
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

      {/* ─── FULL-SCREEN COMPARE SCENARIOS OVERLAY / MODAL ────────────────────── */}
      {isCompareOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'radial-gradient(circle at 50% 0%, rgba(0, 229, 255, 0.08), rgba(5, 11, 24, 0.97) 75%)',
          backdropFilter: 'blur(24px)',
          display: 'flex', flexDirection: 'column', padding: '24px 32px', overflowY: 'auto',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          
          {/* Modal Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid rgba(0,229,255,0.2)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BarChart2 size={24} style={{ color: '#00e5ff' }} />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  Multi-Scenario Comparative Risk Intelligence
                </h2>
                <span style={{ fontSize: 11, color: '#00e5ff', background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.3)', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                  LIVE COMPARATIVE TELEMETRY
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 0 34px' }}>
                Simultaneous trajectory overlay, economic drag matrix, and supply gap comparison across disruption scenarios
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleExportReport} disabled={!compareData} style={{ gap: 6 }}>
                <Download size={13} /> Export Report (.txt)
              </button>
              <button
                onClick={() => setIsCompareOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', borderRadius: '50%', width: 34, height: 34, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Toolbar: Scenario Selector Pills & Controls */}
          <GlassCard style={{ marginBottom: 18, background: 'rgba(8,18,35,0.92)', padding: '14px 20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              
              {/* Scenarios Selector Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Included Scenarios ({compareSelectedIds.length}/{scenarios.length}):
                  </span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleSelectAllCompare} style={{ background: 'none', border: 'none', color: '#00e5ff', fontSize: 10, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Select All</button>
                    <button onClick={handleClearAllCompare} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Reset</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 90, overflowY: 'auto', paddingRight: 4 }}>
                  {scenarios.map((s, idx) => {
                    const isChecked = compareSelectedIds.includes(s.id);
                    const color = SCENARIO_COLORS[idx % SCENARIO_COLORS.length];
                    const isHovered = hoveredScenarioId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleToggleScenarioCompare(s.id)}
                        onMouseEnter={() => setHoveredScenarioId(s.id)}
                        onMouseLeave={() => setHoveredScenarioId(null)}
                        style={{
                          background: isChecked ? `${color}20` : 'rgba(255,255,255,0.03)',
                          border: isChecked ? `1px solid ${color}` : '1px solid var(--border-soft)',
                          color: isChecked ? color : 'var(--text-dim)',
                          borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                          boxShadow: isHovered ? `0 0 12px ${color}60` : 'none',
                          transform: isHovered ? 'translateY(-1px)' : 'none'
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isChecked ? color : '#64748b', boxShadow: isChecked ? `0 0 6px ${color}` : 'none' }} />
                        {truncateText(s.name, 22)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* View Mode Switcher & Graph Parameters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                
                {/* View Mode Switcher */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    View Mode:
                  </span>
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                    {[
                      { id: 'chart', label: '📊 Trajectory Graph' },
                      { id: 'matrix', label: '📋 Metric Matrix' },
                      { id: 'tradeoff', label: '🛡️ AI Synthesis' }
                    ].map(v => (
                      <button
                        key={v.id}
                        onClick={() => setCompareViewMode(v.id)}
                        style={{
                          background: compareViewMode === v.id ? '#00e5ff' : 'transparent',
                          color: compareViewMode === v.id ? '#050b18' : 'var(--text-dim)',
                          border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Graph Metric Selector */}
                {compareViewMode === 'chart' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Overlay Curve Metric:
                    </span>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                      {[
                        { id: 'brent_price', label: 'Price ($)' },
                        { id: 'spr_level_pct', label: 'SPR (%)' },
                        { id: 'supply_gap_mbbl', label: 'Gap (M bbl/d)' }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setCompareMetric(m.id)}
                          style={{
                            background: compareMetric === m.id ? '#00e5ff' : 'transparent',
                            color: compareMetric === m.id ? '#050b18' : 'var(--text-dim)',
                            border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700,
                            padding: '4px 8px', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Severity Factor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Severity:
                  </span>
                  <select
                    value={severityMultiplier}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSeverityMultiplier(val);
                      loadComparison(compareSelectedIds, val, durationDays);
                    }}
                    style={{
                      background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.25)',
                      borderRadius: 6, color: '#00e5ff', fontSize: 12, fontWeight: 700, padding: '4px 8px',
                      cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value={1.0} style={{ background: '#0a1628' }}>1.0x</option>
                    <option value={1.3} style={{ background: '#0a1628' }}>1.3x</option>
                    <option value={1.8} style={{ background: '#0a1628' }}>1.8x</option>
                  </select>
                </div>

              </div>
            </div>
          </GlassCard>

          {/* Loading state */}
          {compareLoading && (
            <div style={{ padding: 40, textAlign: 'center', color: '#00e5ff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Calculating Live Multi-Scenario Telemetry & Trajectories...</div>
            </div>
          )}

          {/* Main Comparison Output */}
          {compareData && !compareLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* 1. Trajectory Graph View */}
              {(compareViewMode === 'chart' || compareViewMode === 'tradeoff') && compareData.overlay_chart && (
                <GlassCard style={{ padding: '18px 22px', background: 'rgba(8,18,35,0.94)', border: '1px solid rgba(0,229,255,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>
                        {durationDays}-Day Multi-Scenario Trajectory Overlay — {
                          compareMetric === 'brent_price' ? 'Brent Crude Price ($/bbl)' :
                          compareMetric === 'spr_level_pct' ? 'Strategic Reserve Capacity (%)' : 'Daily Import Shortfall (M bbl/d)'
                        }
                      </h3>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                        Simultaneous trajectory projection across {compareData.scenarios.length} compared scenarios
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Hover legend or curve to highlight</span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={compareData.overlay_chart} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="t" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} interval={Math.max(1, Math.floor(compareData.overlay_chart.length / 8))} />
                      <YAxis
                        tick={{ fill: '#00e5ff', fontSize: 10, fontWeight: 700 }}
                        domain={compareMetric === 'spr_level_pct' ? [0, 100] : ['auto', 'auto']}
                        tickFormatter={(v) => compareMetric === 'brent_price' ? `$${v}` : compareMetric === 'spr_level_pct' ? `${v}%` : `${v}M`}
                      />
                      
                      {/* NO DEFAULT RECHARTS LEGEND TO PREVENT OVERLAPPING TEXT BLOB! */}

                      <Tooltip content={<CustomCompareOverlayTooltip metricKey={compareMetric} />} />
                      
                      {compareMetric === 'brent_price' && (
                        <ReferenceLine y={88} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
                      )}
                      {compareMetric === 'spr_level_pct' && (
                        <ReferenceLine y={25} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
                      )}

                      {compareData.scenarios.map((sc, idx) => {
                        const color = SCENARIO_COLORS[idx % SCENARIO_COLORS.length];
                        const dataKey = compareMetric === 'brent_price' ? `${sc.id}_price` : compareMetric === 'spr_level_pct' ? `${sc.id}_spr` : `${sc.id}_gap`;
                        
                        const isHovered = hoveredScenarioId === sc.id;
                        const isAnyHovered = hoveredScenarioId !== null;
                        const opacity = isAnyHovered ? (isHovered ? 1 : 0.25) : (idx < 5 ? 0.9 : 0.6);
                        const strokeWidth = isHovered ? 3.5 : (idx < 5 ? 2.5 : 1.8);

                        return (
                          <Line
                            key={sc.id}
                            type="monotone"
                            dataKey={dataKey}
                            name={sc.name}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeOpacity={opacity}
                            dot={false}
                            activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Clean Interactive Legend Footer Pills (Replaces Default Overlapping Legend) */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14, paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.06)', maxHeight: 70, overflowY: 'auto'
                  }}>
                    {compareData.scenarios.map((sc, idx) => {
                      const color = SCENARIO_COLORS[idx % SCENARIO_COLORS.length];
                      const isHovered = hoveredScenarioId === sc.id;
                      return (
                        <div
                          key={sc.id}
                          onMouseEnter={() => setHoveredScenarioId(sc.id)}
                          onMouseLeave={() => setHoveredScenarioId(null)}
                          style={{
                            background: isHovered ? `${color}25` : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isHovered ? color : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 12, padding: '3px 8px', fontSize: 10,
                            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                          <span style={{ color: isHovered ? '#fff' : 'var(--text-dim)', fontWeight: isHovered ? 700 : 500 }}>
                            {truncateText(sc.name, 22)}:
                          </span>
                          <strong style={{ color: color }}>
                            {compareMetric === 'brent_price' ? `$${sc.brent_shock_usd}` :
                             compareMetric === 'spr_level_pct' ? `${sc.import_gap_mbbl_day}M` : `${sc.import_gap_mbbl_day}M`}
                          </strong>
                        </div>
                      );
                    })}
                  </div>

                </GlassCard>
              )}

              {/* 2. Side-by-Side Comparative Matrix View */}
              {(compareViewMode === 'matrix' || compareViewMode === 'tradeoff') && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                      Scenario Rank & Metric Comparison Matrix ({compareData.scenarios.length} Scenarios)
                    </h3>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fit, minmax(270px, 1fr))`,
                    gap: 14
                  }}>
                    {compareData.scenarios.map((sc, idx) => {
                      const color = SCENARIO_COLORS[idx % SCENARIO_COLORS.length];
                      const rankBadge = idx === 0 ? '🏆 HIGHEST RISK' : idx === 1 ? '⚠️ SECONDARY SHOCK' : `RANK #${idx + 1}`;
                      const rankColor = idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : '#00e5ff';

                      return (
                        <GlassCard
                          key={sc.id}
                          style={{
                            border: sc.is_active ? '1px solid #f59e0b' : `1px solid ${color}40`,
                            background: sc.is_active ? 'rgba(245,158,11,0.05)' : `rgba(8,18,35,0.85)`,
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            boxShadow: sc.is_active ? '0 0 20px rgba(245,158,11,0.15)' : 'none'
                          }}
                        >
                          <div>
                            {/* Card Header with Rank */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontSize: 9, fontWeight: 800, background: `${rankColor}18`, color: rankColor, border: `1px solid ${rankColor}40`, padding: '2px 8px', borderRadius: 10 }}>
                                {rankBadge}
                              </span>
                              <StatusBadge status={sc.severity} size="sm" />
                            </div>

                            <div style={{ fontSize: 15, fontWeight: 800, color: color, marginBottom: 2 }}>
                              {sc.name}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 12 }}>
                              {sc.region} · Risk Score: <strong style={{ color: '#fff' }}>{sc.geopolitical_risk}/100</strong>
                            </div>

                            {sc.is_active && (
                              <div style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, marginBottom: 10, display: 'inline-block' }}>
                                ⚡ ACTIVE SYSTEM BASELINE
                              </div>
                            )}

                            {/* Metric Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, fontSize: 11 }}>
                              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 6 }}>
                                <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>Peak Brent Shock:</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
                                  ${sc.brent_shock_usd}/bbl
                                </div>
                                <div style={{ fontSize: 9, color: '#ef4444' }}>+${sc.crude_price_spike_usd}/bbl surge</div>
                              </div>

                              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 6 }}>
                                <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>Import Shortfall:</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#ef4444', marginTop: 2 }}>
                                  {sc.import_gap_mbbl_day}M bbl/d
                                </div>
                                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>30D Total: {sc.total_supply_loss_mbbl}M bbl</div>
                              </div>

                              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 6 }}>
                                <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>GDP Drag:</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginTop: 2 }}>
                                  {sc.gdp_impact_pct.toFixed(2)}%
                                </div>
                              </div>

                              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 6 }}>
                                <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>Inflation Spillover:</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginTop: 2 }}>
                                  +{sc.inflation_pct.toFixed(2)}%
                                </div>
                              </div>
                            </div>

                            {/* Routes & Safe Sourcing */}
                            <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                              <div>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>Affected Chokepoints: </span>
                                <span style={{ color: 'var(--text-muted)' }}>{sc.affected_routes.join(', ')}</span>
                              </div>
                              <div>
                                <span style={{ color: '#10b981', fontWeight: 600 }}>Safe Sourcing: </span>
                                <span style={{ color: 'var(--text-muted)' }}>{sc.safe_suppliers.join(', ')}</span>
                              </div>
                            </div>

                            <div style={{ fontSize: 11, color: 'var(--text-dim)', background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)', padding: 8, borderRadius: 6, marginBottom: 12, lineHeight: 1.5 }}>
                              <strong style={{ color: '#00e5ff' }}>Mitigation Plan: </strong>{sc.recommended_action}
                            </div>
                          </div>

                          {/* Card Action Button */}
                          <button
                            className="btn btn-warning btn-xs"
                            onClick={() => handleActivateScenario(sc.id)}
                            disabled={sc.is_active || activating}
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            {sc.is_active ? '✓ Active System Baseline' : 'Activate Baseline'}
                          </button>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. AI Cross-Scenario Strategic Synthesis Box */}
              <GlassCard style={{ background: 'rgba(0,229,255,0.04)', borderColor: 'rgba(0,229,255,0.3)', padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Bot size={20} style={{ color: '#00e5ff' }} />
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#00e5ff', margin: 0 }}>
                    UrjaNetra AI Strategic Tradeoff & Resilience Brief
                  </h4>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.7, margin: 0 }}>
                  {compareData.comparative_summary}
                </p>
              </GlassCard>

            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </DashboardLayout>
  );
}
