import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, TrendingDown, CheckCircle, ArrowRight, Bot, Loader, AlertTriangle, WifiOff, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import useApi from '../../hooks/useApi.js';
import { planSPR, recordDecision, generateBrief } from '../../services/api.js';

const fallbackPlan = {
  daily_supply_gap_mbbl: 2.4,
  days_until_cargo_arrival: 22,
  total_drawdown_required_mbbl: 8.5,
  reserve_after_action_mbbl: 15.1,
  reserve_after_action_pct: 41.0,
  coverage_days: 21,
  feasible: true,
  warning: null,
  sites: [
    { name: 'Visakhapatnam', capacity_mbbl: 13.3, current_stock_mbbl: 8.9, drawdown_allocated_mbbl: 3.5, status: 'OPERATIONAL' },
    { name: 'Mangaluru', capacity_mbbl: 11.5, current_stock_mbbl: 7.8, drawdown_allocated_mbbl: 3.0, status: 'OPERATIONAL' },
    { name: 'Padur', capacity_mbbl: 12.0, current_stock_mbbl: 6.9, drawdown_allocated_mbbl: 2.0, status: 'MAINTENANCE' },
  ],
  depletion_projection: [
    { day: 'D+0', level: 64 }, { day: 'D+7', level: 58 }, { day: 'D+14', level: 51 },
    { day: 'D+21', level: 43 }, { day: 'D+28', level: 35 }, { day: 'D+34', level: 28 },
    { day: 'D+40', level: 20 }, { day: 'D+45', level: 14 },
  ],
  action_comparison: [
    { day: 'D+0', without: 64, with: 64 }, { day: 'D+7', without: 58, with: 61 },
    { day: 'D+14', without: 51, with: 58 }, { day: 'D+21', without: 43, with: 55 },
    { day: 'D+28', without: 35, with: 51 }, { day: 'D+34', without: 28, with: 46 },
    { day: 'D+40', without: 20, with: 41 }, { day: 'D+45', without: 14, with: 38 },
  ],
  ai_recommendation: "Staged drawdown of 8.5 MMT recommended over 22 days from Visakhapatnam and Mangaluru. Reserve levels will remain above critical threshold."
};

const themes = {
  cyan: { glow: '#00e5ff', primary: '#1d8cff', secondary: '#091e3a' },
  teal: { glow: '#00ffcc', primary: '#10b981', secondary: '#032920' },
  purple: { glow: '#d946ef', primary: '#8b5cf6', secondary: '#240a4a' },
  orange: { glow: '#fbbf24', primary: '#f97316', secondary: '#3a0f05' },
  blue: { glow: '#38bdf8', primary: '#1d8cff', secondary: '#081730' }
};

const Tank3D = ({ name, capacity, current, pct, status, theme }) => {
  const isMaintenance = status === 'MAINTENANCE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 155 }}>
      {/* Top Site Name & Capacity */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
          {name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2, fontWeight: 500 }}>
          {capacity.toFixed(2)} MMT
        </div>
      </div>

      {/* 3D Isometric Cylinder Tank */}
      <div className="tank-3d-wrapper" style={{
        position: 'relative',
        width: 140,
        height: 48,
        margin: '12px 0 24px 0',
        perspective: 600,
        transformStyle: 'preserve-3d',
        cursor: 'pointer'
      }}>
        {/* Metal Bottom Ring */}
        <div style={{
          position: 'absolute',
          bottom: -12,
          left: 0,
          right: 0,
          height: 24,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #101c30 0%, #02050c 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.8), inset 0 -4px 8px rgba(0,0,0,0.8)',
          zIndex: 1,
        }} />

        {/* Liquid Column */}
        {pct > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: Math.max(1, (pct / 100) * 48),
            background: `linear-gradient(90deg, ${theme.secondary}b0 0%, ${theme.primary}50 30%, ${theme.secondary}b0 100%)`,
            zIndex: 2,
          }}>
            {/* Liquid Surface */}
            <div className="liquid-surface-glow" style={{
              position: 'absolute',
              top: -12,
              left: 0,
              right: 0,
              height: 24,
              borderRadius: '50%',
              background: `radial-gradient(ellipse at center, ${theme.glow}80 0%, ${theme.primary}20 80%)`,
              border: `1.5px solid ${theme.glow}d0`,
              boxShadow: `0 0 10px ${theme.glow}40`,
              zIndex: 3,
            }} />
            
            {/* Liquid Bottom */}
            <div style={{
              position: 'absolute',
              bottom: -12,
              left: 0,
              right: 0,
              height: 24,
              borderRadius: '50%',
              background: `linear-gradient(90deg, ${theme.secondary}d0 0%, ${theme.primary}80 30%, ${theme.secondary}d0 100%)`,
              zIndex: 2,
            }} />
          </div>
        )}

        {/* Glass Outer Cylinder Wall */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.05) 15%, rgba(0,0,0,0.35) 50%, rgba(255,255,255,0.03) 85%, rgba(255,255,255,0.01) 100%)',
          borderLeft: '1.5px solid rgba(255,255,255,0.12)',
          borderRight: '1.5px solid rgba(255,255,255,0.12)',
          zIndex: 4,
        }}>
          <div style={{ position: 'absolute', left: '25%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.04)', boxShadow: '-1px 0 0 rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.04)', boxShadow: '-1px 0 0 rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.04)', boxShadow: '-1px 0 0 rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', top: '33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.04)', boxShadow: '0 -1px 0 rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', top: '66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.04)', boxShadow: '0 -1px 0 rgba(0,0,0,0.4)' }} />
        </div>

        {/* Glowing Top Ring */}
        <div style={{
          position: 'absolute',
          top: -12,
          left: 0,
          right: 0,
          height: 24,
          borderRadius: '50%',
          border: `2px solid ${isMaintenance ? '#64748b' : theme.glow}`,
          boxShadow: `0 0 12px ${isMaintenance ? '#64748b' : theme.glow}40, inset 0 0 8px ${isMaintenance ? '#64748b' : theme.glow}40`,
          background: 'rgba(4, 10, 20, 0.45)',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontSize: '19px',
            fontWeight: '800',
            color: '#ffffff',
            textShadow: `0 0 10px ${isMaintenance ? '#64748b' : theme.glow}, 0 2px 4px rgba(0,0,0,0.9)`,
            transform: 'translateY(11px)',
            zIndex: 10,
          }}>
            {Math.round(pct)}%
          </div>
        </div>
      </div>

      {/* Bottom Usable Metrics */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
          {current.toFixed(2)} MMT
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Usable
        </div>
      </div>
    </div>
  );
};

// Hover tooltip Metric card
function HoverMetricCard({ label, value, unit = '', color = 'blue', icon: Icon, desc }) {
  const [show, setShow] = useState(false);
  const colorMap = {
    blue:   { text: '#60b4ff', bg: 'rgba(29,140,255,0.1)', border: 'rgba(29,140,255,0.2)', top: 'rgba(29,140,255,0.6)' },
    cyan:   { text: '#22d3ee', bg: 'rgba(0,229,255,0.09)', border: 'rgba(0,229,255,0.2)',   top: 'rgba(0,229,255,0.6)' },
    green:  { text: '#4ade80', bg: 'rgba(34,197,94,0.09)', border: 'rgba(34,197,94,0.2)',   top: 'rgba(34,197,94,0.6)' },
    amber:  { text: '#fbbf24', bg: 'rgba(245,158,11,0.09)',border: 'rgba(245,158,11,0.2)',  top: 'rgba(245,158,11,0.6)' },
    red:    { text: '#f87171', bg: 'rgba(239,68,68,0.09)', border: 'rgba(239,68,68,0.2)',   top: 'rgba(239,68,68,0.6)' },
    purple: { text: '#a78bfa', bg: 'rgba(139,92,246,0.09)',border: 'rgba(139,92,246,0.2)',  top: 'rgba(139,92,246,0.6)' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{
        position: 'relative', overflow: 'visible', padding: '16px 18px', borderRadius: 12,
        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)',
        cursor: 'default', transition: 'all 0.2s',
        borderColor: show ? 'rgba(29,140,255,0.4)' : undefined,
        boxShadow: show ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(95deg, ${c.top} 0%, transparent 80%)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {label} <Info size={10} style={{ color: '#475569', flexShrink: 0 }} />
        </span>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 6, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} style={{ color: c.text }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: c.text }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{unit}</span>}
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

export default function SPRPlanner() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { activeScenario, backendOnline, refreshState } = useScenario();
  const [optimizing, setOptimizing] = useState(false);
  const [approving, setApproving] = useState(false);

  // Cache-based SPR state
  const [sprCache, setSprCache] = useState(() => {
    try {
      const cached = localStorage.getItem('urja_spr_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Live SPR plan from backend
  const { data: sprPlan, loading: sprLoading, error: sprError, execute: runPlan } = useApi(planSPR, {
    manual: false,
    fallback: null,
    deps: [activeScenario],
    args: [{
      daily_gap_mbbl: activeScenario?.india_import_gap_mbbl_day ?? 2.4,
      days_until_cargo: activeScenario?.id === 'hormuz' ? 22 : activeScenario ? 15 : 22,
      target_coverage_days: 30
    }],
  });

  // Sync cache
  useEffect(() => {
    if (sprPlan) {
      setSprCache(sprPlan);
      localStorage.setItem('urja_spr_cache', JSON.stringify(sprPlan));
    }
  }, [sprPlan]);

  // Display toast on error
  useEffect(() => {
    if (sprError) {
      addToast('Error fetching SPR plan: showing cached results', 'error');
    }
  }, [sprError, addToast]);

  const activePlan = sprCache || sprPlan;

  const handleOptimizeDrawdown = async () => {
    setOptimizing(true);
    try {
      const res = await runPlan({
        daily_gap_mbbl: activeScenario?.india_import_gap_mbbl_day ?? 2.4,
        days_until_cargo: activeScenario?.id === 'hormuz' ? 22 : activeScenario ? 15 : 22,
        target_coverage_days: 30,
      });
      if (res) {
        setSprCache(res);
        localStorage.setItem('urja_spr_cache', JSON.stringify(res));
      }
      await refreshState();
      addToast('SPR drawdown plan optimized successfully', 'success');
    } catch (err) {
      addToast('Failed to optimize SPR drawdown: showing cached plan', 'warning');
    } finally {
      setOptimizing(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      if (backendOnline) {
        await recordDecision({
          action_type: "APPROVE_SPR_DRAWDOWN_PLAN",
          approved_by: "Commander Arjun Mehta",
          scenario_id: activeScenario?.id || 'baseline',
          details: activePlan || { message: "Approved SPR drawdown plan" }
        });
      }
      await refreshState();
      addToast('SPR drawdown plan approved and execution initiated', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to record approval on the backend', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleSendToBrief = async () => {
    addToast('Generating intelligence brief from SPR plan...', 'info');
    try {
      await generateBrief({
        scenario_id: activeScenario?.id || 'hormuz_closure',
        classification: 'SECRET',
        prepared_for: 'National Energy Council',
      });
      addToast('SPR plan sent to Action Brief.', 'success');
      navigate('/action-brief');
    } catch (err) {
      console.error(err);
      addToast('Failed to compile Action Brief. Navigating to page.', 'warning');
      navigate('/action-brief');
    }
  };

  // Generate 5-tank dataset
  const getTanksData = () => {
    if (!activeScenario) {
      return [
        { name: 'Visakhapatnam', capacity: 1.33, current: 1.04, pct: 78, status: 'OPERATIONAL', theme: themes.cyan },
        { name: 'Mangaluru', capacity: 1.50, current: 1.23, pct: 82, status: 'OPERATIONAL', theme: themes.teal },
        { name: 'Padur', capacity: 2.50, current: 1.60, pct: 64, status: 'MAINTENANCE', theme: themes.purple },
        { name: 'Chandikhole', capacity: 4.00, current: 2.84, pct: 71, status: 'OPERATIONAL', theme: themes.orange },
        { name: 'Total India SPR', capacity: 9.33, current: 6.71, pct: 72, status: 'OPERATIONAL', theme: themes.blue }
      ];
    }

    const activeSites = activePlan?.sites || fallbackPlan.sites;
    const v = activeSites.find(s => s.name.toLowerCase().includes('visa')) || { capacity_mbbl: 13.3, current_stock_mbbl: 8.9, status: 'OPERATIONAL' };
    const m = activeSites.find(s => s.name.toLowerCase().includes('manga')) || { capacity_mbbl: 11.5, current_stock_mbbl: 7.8, status: 'OPERATIONAL' };
    const p = activeSites.find(s => s.name.toLowerCase().includes('padur')) || { capacity_mbbl: 12.0, current_stock_mbbl: 6.9, status: 'MAINTENANCE' };

    const vCap = 1.33;
    const vPct = v.capacity_mbbl > 0 ? (v.current_stock_mbbl / v.capacity_mbbl) * 100 : 78;
    const vCurrent = vCap * (vPct / 100);

    const mCap = 1.50;
    const mPct = m.capacity_mbbl > 0 ? (m.current_stock_mbbl / m.capacity_mbbl) * 100 : 82;
    const mCurrent = mCap * (mPct / 100);

    const pCap = 2.50;
    const pPct = p.capacity_mbbl > 0 ? (p.current_stock_mbbl / p.capacity_mbbl) * 100 : 64;
    const pCurrent = pCap * (pPct / 100);

    const cCap = 4.00;
    const cPct = Math.round((vPct + mPct + pPct) / 3);
    const cCurrent = cCap * (cPct / 100);

    const tCap = vCap + mCap + pCap + cCap;
    const tCurrent = vCurrent + mCurrent + pCurrent + cCurrent;
    const tPct = tCap > 0 ? (tCurrent / tCap) * 100 : 72;

    return [
      { name: 'Visakhapatnam', capacity: vCap, current: vCurrent, pct: vPct, status: v.status || 'OPERATIONAL', theme: themes.cyan },
      { name: 'Mangaluru', capacity: mCap, current: mCurrent, pct: mPct, status: m.status || 'OPERATIONAL', theme: themes.teal },
      { name: 'Padur', capacity: pCap, current: pCurrent, pct: pPct, status: p.status || 'MAINTENANCE', theme: themes.purple },
      { name: 'Chandikhole', capacity: cCap, current: cCurrent, pct: cPct, status: 'OPERATIONAL', theme: themes.orange },
      { name: 'Total India SPR', capacity: tCap, current: tCurrent, pct: tPct, status: 'OPERATIONAL', theme: themes.blue }
    ];
  };

  const tanks = getTanksData();

  const coverageDays = activePlan?.coverage_days ?? fallbackPlan.coverage_days;
  const currentStock = tanks.find(t => t.name === 'Total India SPR')?.current.toFixed(1) ?? fallbackPlan.reserve_after_action_mbbl.toFixed(1);
  const recommendedDrawdown = activePlan?.total_drawdown_required_mbbl ?? fallbackPlan.total_drawdown_required_mbbl;
  const reserveAfterAction = activePlan?.reserve_after_action_mbbl ?? fallbackPlan.reserve_after_action_mbbl;
  const cargoBuffer = activePlan?.days_until_cargo_arrival
    ? `${activePlan.days_until_cargo_arrival} days`
    : `${fallbackPlan.days_until_cargo_arrival} days`;

  const predictedDepletion = activePlan?.daily_supply_gap_mbbl
    ? `${Math.round((parseFloat(currentStock) * 7.33) / activePlan.daily_supply_gap_mbbl)} days`
    : '34 days';

  // Use rich AI recommendation from backend if available, fallback otherwise
  const aiRec = activePlan?.ai_recommendation || (activePlan?.warning
    ? `SPR Warning: ${activePlan.warning}. Recommend staged drawdown: Vizag (${(recommendedDrawdown * 0.55).toFixed(1)} MMT), Mangaluru (${(recommendedDrawdown * 0.45).toFixed(1)} MMT).`
    : `Recommend staged drawdown of ${recommendedDrawdown} MMT over ${cargoBuffer}: Phase 1 (Vizag, ${(recommendedDrawdown * 0.55).toFixed(1)} MMT), Phase 2 (Mangaluru, ${(recommendedDrawdown * 0.45).toFixed(1)} MMT).`);

  const depletionData = activePlan?.depletion_projection ?? fallbackPlan.depletion_projection;
  const withSPRData = activePlan?.action_comparison ?? fallbackPlan.action_comparison;

  if (!activePlan && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <WifiOff size={48} style={{ color: '#f59e0b' }} />
          <h2>System Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached SPR data is available.</p>
          <button className="btn btn-primary" onClick={handleOptimizeDrawdown}>
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

      <PageHeader title="SPR Planner" subtitle="Strategic Petroleum Reserve management · Drawdown optimization · Crisis buffer planning"
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={handleSendToBrief}><ArrowRight size={13} /> Send to Brief</button>
          <button className="btn btn-primary btn-sm" onClick={handleOptimizeDrawdown} disabled={optimizing || sprLoading}>
            {optimizing || sprLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {' '}Optimize Drawdown
          </button>
        </>}
      />

      {/* Loading overlay bar */}
      {(sprLoading || optimizing) && (
        <div style={{ background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)', color: '#1d8cff', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Calculating optimal Strategic Petroleum Reserve drawdown allocations...
        </div>
      )}

      {/* Error Notification Banner */}
      {backendOnline && sprError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <AlertTriangle size={14} />
          Planning failed: {sprError.message || 'Connection failed'}. Showing cached reserves.
        </div>
      )}

      {/* KPI Cards with Hover Tooltips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <HoverMetricCard
          label="Current SPR Coverage"
          value={String(coverageDays)}
          unit="days"
          color="blue"
          icon={Database}
          desc="Number of days the Strategic Petroleum Reserve can bridge the supply gap at the current daily deficit rate without alternate sourcing."
        />
        <HoverMetricCard
          label="Current Stock"
          value={String(currentStock)}
          unit="MMT"
          color="cyan"
          icon={Database}
          desc="Total volume of crude oil currently stored in all operational caverns across Visakhapatnam, Mangaluru, and Padur."
        />
        <HoverMetricCard
          label="Predicted Depletion"
          value={predictedDepletion}
          color="amber"
          icon={TrendingDown}
          desc="Projected days remaining before total SPR stock reaches zero if the current supply gap continues without any drawdown optimization."
        />
        <HoverMetricCard
          label="Recommended Drawdown"
          value={String(recommendedDrawdown)}
          unit="MMT"
          color="green"
          icon={CheckCircle}
          desc="Total volume of crude release recommended by AI core logic to safely bridge the gap without triggering inventory alerts."
        />
        <HoverMetricCard
          label="Reserve After Action"
          value={String(reserveAfterAction)}
          unit="MMT"
          color="blue"
          desc="Remaining volume of crude in caverns after executing the recommended drawdown plan."
        />
        <HoverMetricCard
          label="Cargo Buffer"
          value={cargoBuffer}
          color="purple"
          desc="Total timeframe in days until the next scheduled spot or term VLCC tanker arrives at Indian ports to replenish stock."
        />
      </div>

      {/* Tank visual panel */}
      <GlassCard style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Current SPR Reserve Level</h3>
        
        <div style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '30px 14px 20px 14px',
          background: 'linear-gradient(180deg, transparent 52%, rgba(29,140,255,0.06) 53%, rgba(0,229,255,0.12) 55%, rgba(29,140,255,0.06) 57%, transparent 58%)',
          position: 'relative',
          borderRadius: 8
        }}>
          {tanks.map(site => (
            <Tank3D
              key={site.name}
              name={site.name}
              capacity={site.capacity}
              current={site.current}
              pct={site.pct}
              status={site.status}
              theme={site.theme}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24, fontSize: 11, color: 'var(--text-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1d8cff' }} />Usable</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />Committed</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff' }} />In Transit</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />Unavailable</div>
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Depletion chart */}
        <GlassCard>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>SPR Depletion Forecast</h3>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14 }}>Without drawdown action (% remaining)</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={depletionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,130,255,0.08)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 80]} />
              <Tooltip contentStyle={{ background: 'rgba(8,18,35,0.95)', border: '1px solid rgba(90,130,255,0.3)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="level" stroke="#ef4444" fill="rgba(239,68,68,0.15)" name="SPR Level %" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* With/Without comparison */}
        <GlassCard>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>SPR Action vs No-Action</h3>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14 }}>Drawdown impact on reserves</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={withSPRData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,130,255,0.08)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'rgba(8,18,35,0.95)', border: '1px solid rgba(90,130,255,0.3)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="without" stroke="#ef4444" fill="rgba(239,68,68,0.15)" name="No SPR Action" />
              <Area type="monotone" dataKey="with" stroke="#22c55e" fill="rgba(34,197,94,0.15)" name="With SPR Drawdown" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* AI Recommendation */}
      <GlassCard style={{ background: 'rgba(29,140,255,0.05)', borderColor: 'rgba(29,140,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Bot size={16} style={{ color: '#00e5ff' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#00e5ff' }}>AI Drawdown Recommendation</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.7, marginBottom: 14 }}>
          {aiRec}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-success btn-sm" onClick={handleApprove} disabled={approving}>
            {approving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {' '}Approve Drawdown
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleOptimizeDrawdown} disabled={optimizing || sprLoading}>
            {optimizing || sprLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {' '}Compare Alternatives
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleSendToBrief}><ArrowRight size={13} /> Send to Action Brief</button>
        </div>
      </GlassCard>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .tank-3d-wrapper {
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        .tank-3d-wrapper:hover {
          transform: translateY(-5px) rotateX(12deg) rotateY(4deg);
        }

        .liquid-surface-glow {
          animation: surface-shimmer 2.5s infinite alternate ease-in-out;
        }

        @keyframes surface-shimmer {
          0% { filter: brightness(1) drop-shadow(0 0 2px rgba(255, 255, 255, 0.2)); }
          100% { filter: brightness(1.2) drop-shadow(0 0 6px rgba(255, 255, 255, 0.5)); }
        }
      `}</style>
    </DashboardLayout>
  );
}
