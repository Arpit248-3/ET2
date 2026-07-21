import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bot,
  DollarSign,
  FileText,
  Home,
  Loader,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  WifiOff,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import useApi from '../../hooks/useApi.js';
import { fetchEconomicExplanation, fetchEconomicImpact } from '../../services/api.js';

const ECON_CACHE_KEY = 'urja_economic_cache';
const EXPLAIN_CACHE_KEY = 'urja_economic_explain_cache';

function readJsonCache(key, validator = () => true) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function formatNumber(value, digits = 2) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return 'N/A';
  return Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatInteger(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return 'N/A';
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function EconKPICard({ label, value, unit, color, icon: Icon, description }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${hovered ? color + '50' : 'var(--border-soft)'}`,
        borderRadius: 12,
        padding: '16px 14px',
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.2s',
        cursor: 'help',
        boxShadow: hovered ? `0 0 18px ${color}22` : 'none',
        zIndex: hovered ? 10 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>{unit}</div>
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 12px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 260,
          background: 'rgba(8, 18, 35, 0.92)',
          border: `1px solid ${color}60`,
          borderRadius: 10,
          padding: '12px 14px',
          zIndex: 999,
          boxShadow: `0 8px 32px rgba(0,0,0,0.65), 0 0 15px ${color}25`,
          pointerEvents: 'none',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.5 }}>{description}</div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>{subtitle}</p>}
    </div>
  );
}

export default function EconomicImpact() {
  const { addToast } = useToast();
  const { activeScenario, backendOnline, refreshState } = useScenario();
  const [recalculating, setRecalculating] = useState(false);
  const [lastRecalculated, setLastRecalculated] = useState(null);
  const [explanation, setExplanation] = useState(() => readJsonCache(EXPLAIN_CACHE_KEY));
  const [explainLoading, setExplainLoading] = useState(false);

  const [econData, setEconData] = useState(() => (
    readJsonCache(ECON_CACHE_KEY, cached => !!cached?.headline)
  ));

  const { data: liveEconData, loading: econLoading, error: econError, refetch } = useApi(fetchEconomicImpact, {
    fallback: null,
  });

  useEffect(() => {
    if (liveEconData?.headline) {
      setEconData(liveEconData);
      localStorage.setItem(ECON_CACHE_KEY, JSON.stringify(liveEconData));
    }
  }, [liveEconData]);

  useEffect(() => {
    if (econError) {
      addToast('Error fetching live economic impact data', 'error');
    }
  }, [econError, addToast]);

  const loadExplanation = async () => {
    if (!econData?.headline || !backendOnline) return;
    setExplainLoading(true);
    try {
      const result = await fetchEconomicExplanation({
        economic_result: econData,
        question: 'Explain the economic impact, transmission channels, uncertainty, and policy options using only this backend result.',
      });
      if (result) {
        const explanationWithContext = {
          ...result,
          economic_timestamp: econData.timestamp,
          scenario_id: econData.scenario_id,
        };
        setExplanation(explanationWithContext);
        localStorage.setItem(EXPLAIN_CACHE_KEY, JSON.stringify(explanationWithContext));
      }
    } catch {
      addToast('AI explanation unavailable from Ollama', 'warning');
    } finally {
      setExplainLoading(false);
    }
  };

  useEffect(() => {
    if (!econData?.timestamp || !explanation) return;
    if (explanation.economic_timestamp !== econData.timestamp) {
      setExplanation(null);
    }
  }, [econData?.timestamp, explanation]);

  useEffect(() => {
    if (econData?.headline && backendOnline && !explanation) {
      loadExplanation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [econData?.timestamp, backendOnline, explanation]);

  const headline = econData?.headline || {};
  const chain = econData?.inflation_transmission_chain || [];
  const sectorImpact = econData?.sector_impact || [];
  const stateImpact = econData?.state_impact || [];
  const projection = econData?.projection || [];
  const policyOptions = econData?.policy_options || [];
  const uncertaintyEntries = useMemo(() => Object.entries(econData?.uncertainty_band || {})
    .filter(([key, value]) => key !== 'method' && value && typeof value === 'object'), [econData]);
  const assumptions = econData?.assumptions || {};
  const trace = assumptions.formula_trace || {};
  const inputs = assumptions.inputs || {};
  const reference = assumptions.reference_parameters || {};
  const confidencePct = Math.round((econData?.confidence || 0) * 100);

  const kpis = [
    {
      label: 'Inflation impact',
      value: `+${formatNumber(headline.inflation_impact_pp)} pp`,
      unit: 'CPI pressure',
      color: '#ef4444',
      icon: TrendingUp,
      description: 'Deterministic CPI impact from fuel, transport, food, and manufacturing pass-through.',
    },
    {
      label: 'GDP growth drag',
      value: `${formatNumber(headline.gdp_growth_drag_pp)} pp`,
      unit: 'growth drag',
      color: '#ef4444',
      icon: TrendingDown,
      description: 'Growth drag from oil price shock, supply gap, confidence risk, and inflation drag.',
    },
    {
      label: 'Fuel price impact',
      value: `+${formatNumber(headline.fuel_price_impact_pct)}%`,
      unit: 'retail pass-through',
      color: '#f59e0b',
      icon: DollarSign,
      description: 'Estimated retail fuel pressure after selected pass-through and policy absorption.',
    },
    {
      label: 'Import bill increase',
      value: `$${formatNumber(headline.import_bill_increase_usd_bn)} bn`,
      unit: 'monthly run-rate',
      color: '#1d8cff',
      icon: BarChart2,
      description: 'Monthly crude import bill increase from landed cost shock and import volume baseline.',
    },
    {
      label: 'Fiscal burden',
      value: `Rs ${formatInteger(headline.fiscal_burden_inr_cr)} cr`,
      unit: 'monthly shock window',
      color: '#f59e0b',
      icon: ShieldCheck,
      description: 'Estimated fiscal absorption through excise buffer, subsidy support, and public sector bridge costs.',
    },
    {
      label: 'CAD impact',
      value: `+${formatNumber(headline.cad_impact_pct_gdp)}%`,
      unit: 'of GDP',
      color: '#ef4444',
      icon: Activity,
      description: 'Annualized current-account pressure if the monthly import shock persists.',
    },
  ];

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await refetch({ recalculate: true });
      await refreshState();
      setExplanation(null);
      setLastRecalculated(new Date().toLocaleTimeString());
      addToast('Economic model refreshed from deterministic backend parameters', 'success');
    } catch {
      addToast('Failed to refresh economic model', 'error');
    } finally {
      setRecalculating(false);
    }
  };

  if (!econData && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <WifiOff size={48} style={{ color: '#f59e0b' }} />
          <h2>Economic Engine Offline</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 520 }}>
            Could not connect to the UrjaNetra backend, and no cached economic impact result is available.
          </p>
          <button className="btn btn-primary" onClick={handleRecalculate}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry Connection
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {(!backendOnline || econData?.__offline) && (
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
          gap: 8,
        }}>
          <AlertTriangle size={14} />
          <span>Showing cached backend economic result.</span>
        </div>
      )}

      <PageHeader
        title="Economic Impact Dashboard"
        subtitle="Deterministic macro impact model · Scenario-driven assumptions · Explainable calculations"
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={() => addToast('Economic report queued from backend result', 'info')}>
            <FileText size={13} /> Export Report
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleRecalculate} disabled={recalculating || econLoading}>
            {(recalculating || econLoading) ? (
              <><Loader size={13} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />Refreshing...</>
            ) : (
              <><RefreshCw size={13} style={{ marginRight: 6 }} />Refresh Model</>
            )}
          </button>
        </>}
      />

      {(recalculating || econLoading) && (
        <div style={{ background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)', color: '#1d8cff', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Refreshing deterministic economic model for {activeScenario?.name || econData?.scenario_name || 'current scenario'}...
        </div>
      )}

      {lastRecalculated && !recalculating && (
        <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', padding: '8px 14px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          Model refreshed at {lastRecalculated}. No LLM-generated economic numbers were used.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20, position: 'relative', zIndex: 2 }}>
        {kpis.map(kpi => <EconKPICard key={kpi.label} {...kpi} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <GlassCard>
          <SectionTitle title="Inflation Transmission Chain" subtitle="Backend-calculated contribution by channel" />
          {chain.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No transmission chain available from backend.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chain.map((stage, index) => {
                const width = Math.min(100, Math.max(4, Number(stage.impact_pp || 0) * 120));
                return (
                  <div key={`${stage.stage}-${index}`} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-soft)', background: 'rgba(255,255,255,0.015)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>{stage.stage}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>+{formatNumber(stage.impact_pp, 3)} pp</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }}>
                      <div style={{ width: `${width}%`, height: '100%', borderRadius: 3, background: '#f59e0b' }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.45 }}>{stage.driver}</div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Sector Impact Ranking" subtitle="Impact score and estimated cost pressure" />
          {sectorImpact.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No sector impact data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sectorImpact} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,130,255,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                <YAxis dataKey="sector" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ background: 'rgba(8,18,35,0.95)', border: '1px solid rgba(90,130,255,0.3)', borderRadius: 8, fontSize: 12 }} formatter={(value, name) => [value, name === 'impact_score' ? 'Impact score' : name]} />
                <Bar dataKey="impact_score" radius={[0, 4, 4, 0]}>
                  {sectorImpact.map((entry, i) => <Cell key={`${entry.sector}-${i}`} fill={entry.fill || '#1d8cff'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <GlassCard>
          <SectionTitle title="State Impact" subtitle="State exposure ranking from backend parameters" />
          {stateImpact.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No state impact data available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflow: 'auto', paddingRight: 4 }}>
              {stateImpact.map((state, i) => {
                const color = state.impact_score >= 72 ? '#ef4444' : state.impact_score >= 52 ? '#f59e0b' : state.impact_score >= 28 ? '#1d8cff' : '#22c55e';
                return (
                  <div key={state.state} style={{ padding: '10px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color, fontWeight: 800, width: 22 }}>#{i + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', flex: 1 }}>{state.state}</span>
                      <span style={{ fontSize: 12, color, fontWeight: 800, minWidth: 32, textAlign: 'right' }}>{formatInteger(state.impact_score)}</span>
                      <span className={`badge ${state.gdp_exposure === 'CRITICAL' ? 'badge-red' : state.gdp_exposure === 'HIGH' ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: 9 }}>{state.gdp_exposure || 'LOW'}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }}>
                      <div style={{ width: `${Math.min(100, state.impact_score || 0)}%`, height: '100%', borderRadius: 3, background: color }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      Driver: {state.main_driver || 'Backend driver unavailable'} · Population: {formatInteger(state.population_mn)} mn
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Household Cost Of Living" subtitle="Monthly household impact from backend model" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 14 }}>
            <div style={{ padding: 14, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'rgba(255,255,255,0.015)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1d8cff', marginBottom: 8 }}>
                <Home size={15} />
                <span style={{ fontSize: 11, fontWeight: 700 }}>Urban</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1d8cff' }}>
                Rs {formatInteger(econData?.cost_of_living?.urban_monthly_household_impact_inr)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>per month</div>
            </div>
            <div style={{ padding: 14, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'rgba(255,255,255,0.015)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e', marginBottom: 8 }}>
                <Home size={15} />
                <span style={{ fontSize: 11, fontWeight: 700 }}>Rural</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>
                Rs {formatInteger(econData?.cost_of_living?.rural_monthly_household_impact_inr)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>per month</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(econData?.cost_of_living?.main_drivers || []).map(driver => (
              <div key={driver.driver} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', fontSize: 11, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{driver.driver}</span>
                <span style={{ color: '#1d8cff' }}>Urban Rs {formatInteger(driver.urban_impact_inr)}</span>
                <span style={{ color: '#22c55e' }}>Rural Rs {formatInteger(driver.rural_impact_inr)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <GlassCard>
          <SectionTitle title="Import Bill, CAD, And Fiscal Burden" subtitle="External and public-finance pressure trace" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[
              ['Baseline monthly import bill', `$${formatNumber(trace.import_bill?.baseline_monthly_import_bill_usd_bn)} bn`],
              ['Landed cost change', `+${formatNumber(trace.import_bill?.landed_cost_change_pct)}%`],
              ['Stressed USD/INR', formatNumber(trace.fx_pressure?.stressed_usdinr)],
              ['CAD after shock', `${formatNumber(trace.fx_pressure?.cad_after_shock_pct_gdp)}% GDP`],
              ['Gross import cost', `Rs ${formatInteger(trace.fiscal_components?.gross_import_cost_inr_cr)} cr`],
              ['SPR bridge cost', `Rs ${formatInteger(trace.fiscal_components?.spr_bridge_cost_inr_cr)} cr`],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'rgba(255,255,255,0.015)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>{value}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="30-Day Projection" subtitle="Daily deterministic projection from current scenario state" />
          {projection.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No projection available from backend.</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={projection}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,130,255,0.08)" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `D+${v}`} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'rgba(8,18,35,0.95)', border: '1px solid rgba(90,130,255,0.3)', borderRadius: 8, fontSize: 12 }} labelFormatter={v => `Day ${v}`} />
                <Line type="monotone" dataKey="inflation_impact_pp" stroke="#ef4444" strokeWidth={2.2} dot={false} name="Inflation pp" />
                <Line type="monotone" dataKey="gdp_growth_drag_pp" stroke="#f59e0b" strokeWidth={2.2} dot={false} name="GDP drag pp" />
                <Line type="monotone" dataKey="fuel_price_impact_pct" stroke="#1d8cff" strokeWidth={2.2} dot={false} name="Fuel impact %" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <GlassCard>
          <SectionTitle title="Uncertainty Bands" subtitle={econData?.uncertainty_band?.method ? `Band width: ${econData.uncertainty_band.method.band_width_pct}%` : 'Backend uncertainty range'} />
          {uncertaintyEntries.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No uncertainty bands available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {uncertaintyEntries.map(([key, band]) => (
                <div key={key} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase' }}>{key.replaceAll('_', ' ')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11 }}>
                    <span>Low: <strong style={{ color: '#22c55e' }}>{formatNumber(band.lower)}</strong></span>
                    <span>Base: <strong style={{ color: '#1d8cff' }}>{formatNumber(band.base)}</strong></span>
                    <span>High: <strong style={{ color: '#f59e0b' }}>{formatNumber(band.upper)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Policy Options" subtitle="Generated deterministically from calculated impacts" />
          {policyOptions.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No policy options available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {policyOptions.map(option => (
                <div key={option.option} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>{option.option}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: 8 }}>{option.recommended_when}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', lineHeight: 1.45 }}>{option.tradeoff}</div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <GlassCard style={{ background: 'rgba(29,140,255,0.04)', borderColor: 'rgba(29,140,255,0.22)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={16} style={{ color: '#00e5ff' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#00e5ff' }}>AI Explanation</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadExplanation} disabled={!backendOnline || explainLoading}>
              {explainLoading ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
              Explain
            </button>
          </div>
          {explainLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Asking Ollama to explain backend data only...
            </div>
          ) : explanation?.explanation ? (
            <div>
              {!explanation.available && (
                <div style={{ color: '#f59e0b', fontSize: 11, marginBottom: 8 }}>Ollama did not provide a live explanation.</div>
              )}
              <p style={{ fontSize: 12.5, color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{explanation.explanation}</p>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No AI explanation has been generated for this backend result.</div>
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Assumptions And Confidence" subtitle="Reference parameters, scenario inputs, and model confidence" />
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Confidence</span>
              <strong style={{ color: confidencePct >= 80 ? '#22c55e' : confidencePct >= 65 ? '#f59e0b' : '#ef4444' }}>{confidencePct}%</strong>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }}>
              <div style={{ width: `${confidencePct}%`, height: '100%', borderRadius: 4, background: confidencePct >= 80 ? '#22c55e' : confidencePct >= 65 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 12 }}>
            {Object.entries(inputs).map(([key, value]) => (
              <div key={key} style={{ padding: 8, borderRadius: 7, background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: 9.5, color: 'var(--text-dim)', marginBottom: 3 }}>{key.replaceAll('_', ' ')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-main)', fontWeight: 700 }}>{typeof value === 'number' ? formatNumber(value, 2) : String(value)}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Baseline crude: ${formatNumber(reference.baseline_crude_price_usd)} per bbl · USD/INR: {formatNumber(reference.baseline_usdinr)} · Import dependency: {formatNumber((reference.oil_import_dependency || 0) * 100)}%
          </div>
          <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            Economic numbers are generated by backend formulas and configurable reference parameters. Ollama is used only for natural-language explanation.
          </div>
        </GlassCard>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
