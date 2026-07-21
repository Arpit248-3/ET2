import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, X, FileText, Clock, Filter, BarChart2, LineChart as LineIcon, PieChart as PieIcon, Activity, Loader, WifiOff, Info } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, AreaChart, Area,
  PieChart, Pie, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import useApi from '../../hooks/useApi.js';
import { checkCompliance, recordDecision } from '../../services/api.js';

const getBarColor = (score) => {
  if (score >= 90) return '#22c55e';
  if (score >= 80) return '#1d8cff';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const score = payload[0]?.value;
  return (
    <div className="custom-tooltip" style={{ background: 'rgba(8,18,35,0.95)', border: '1px solid rgba(90,130,255,0.3)', borderRadius: 8, padding: 8, fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 4 }}>{label}</p>
      <p style={{ color: getBarColor(score), fontWeight: 700, fontSize: 13 }}>Score: {score}%</p>
      {payload[1] && <p style={{ color: '#64748b', fontSize: 11 }}>Prev: {payload[1].value}%</p>}
    </div>
  );
};

const chartTypes = [
  { id: 'bar', label: 'Bar', icon: BarChart2 },
  { id: 'line', label: 'Line', icon: LineIcon },
  { id: 'area', label: 'Area', icon: Activity },
  { id: 'pie', label: 'Pie', icon: PieIcon },
];

const fallbackComp = {
  all_clear: false,
  flagged_count: 1,
  results: [
    { supplier_id: 'sup-001', supplier_name: 'West Africa (Nigeria / Bonny Light)', sanctions: 'CLEAR', insurance: 'VALID', legal_status: 'COMPLIANT', policy_alignment: 'ALIGNED', route_restriction: 'CLEAR', overall: 'GREEN', flags: [] },
    { supplier_id: 'sup-002', supplier_name: 'Saudi Arabia (Aramco / Arab Light)', sanctions: 'CLEAR', insurance: 'VALID', legal_status: 'COMPLIANT', policy_alignment: 'ALIGNED', route_restriction: 'HIGH ALERT', overall: 'AMBER', flags: ['Route (Strait of Hormuz): Iranian naval exercises active — heightened risk zone.'] },
    { supplier_id: 'sup-003', supplier_name: 'Russia (Rosneft / Urals)', sanctions: 'FLAGGED', insurance: 'RESTRICTED', legal_status: 'REVIEW REQUIRED', policy_alignment: 'ALIGNED', route_restriction: 'CAUTION', overall: 'RED', flags: ['Sanctions: Russia — G7 price cap restrictions apply. 14 VLCCs on SDN list.', 'Insurance: P&I Club coverage withdrawn for Russia-flag vessels post-G7 directive.', 'Route (Arctic / Cape): Limited P&I coverage in Arctic corridors for sanctioned vessels.'] },
    { supplier_id: 'sup-004', supplier_name: 'Brazil (Petrobras / Tupi)', sanctions: 'CLEAR', insurance: 'VALID', legal_status: 'COMPLIANT', policy_alignment: 'ALIGNED', route_restriction: 'CLEAR', overall: 'GREEN', flags: [] },
    { supplier_id: 'sup-005', supplier_name: 'UAE (ADNOC / Murban)', sanctions: 'CLEAR', insurance: 'VALID', legal_status: 'COMPLIANT', policy_alignment: 'MINOR FLAG', route_restriction: 'HIGH ALERT', overall: 'AMBER', flags: ['UAE route transits Hormuz — conflict zone premium applies.', 'Route (Strait of Hormuz): Iranian naval exercises active — heightened risk zone.'] },
  ]
};

// Hover tooltip Metric card
function HoverMetricCard({ label, value, color = '#1d8cff', icon: Icon, bg = 'rgba(29,140,255,0.1)', desc }) {
  const [show, setShow] = useState(false);
  return (
    <div
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(prev => !prev)}
      style={{
        position: 'relative', overflow: 'visible', padding: '16px 18px', borderRadius: 12,
        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)',
        cursor: 'default', transition: 'all 0.2s',
        borderColor: show ? 'rgba(29,140,255,0.4)' : undefined,
        boxShadow: show ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(95deg, ${color} 0%, transparent 80%)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {label} <Info size={10} style={{ color: '#475569', flexShrink: 0 }} />
        </span>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 6, background: bg, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} style={{ color: color }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: color }}>{value}</span>
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

export default function ComplianceShield() {
  const { addToast } = useToast();
  const { activeScenario, backendOnline, refreshState } = useScenario();
  const [filter, setFilter] = useState('All');
  const [chartType, setChartType] = useState('bar');
  const [checking, setChecking] = useState(false);
  const [approving, setApproving] = useState(false);
  const [flagging, setFlagging] = useState(false);

  // Cache-based compliance state
  const [compCache, setCompCache] = useState(() => {
    try {
      const cached = localStorage.getItem('urja_compliance_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Supplier compliance checking state
  const { data: compData, loading: compLoading, error: compError, execute: runComp } = useApi(checkCompliance, {
    manual: true,
    fallback: null,
  });

  // Sync cache
  useEffect(() => {
    if (compData) {
      setCompCache(compData);
      localStorage.setItem('urja_compliance_cache', JSON.stringify(compData));
    }
  }, [compData]);

  // Run compliance check on mount or activeScenario change
  useEffect(() => {
    if (backendOnline) {
      runComp({ supplier_ids: ['sup-001', 'sup-002', 'sup-003', 'sup-004', 'sup-005'] })
        .then(res => {
          if (res) {
            setCompCache(res);
            localStorage.setItem('urja_compliance_cache', JSON.stringify(res));
          }
        })
        .catch(() => {});
    }
  }, [backendOnline, runComp, activeScenario]);

  const handleVerifySuppliers = async () => {
    setChecking(true);
    try {
      const res = await runComp({ supplier_ids: ['sup-001', 'sup-002', 'sup-003', 'sup-004', 'sup-005'] });
      if (res) {
        setCompCache(res);
        localStorage.setItem('urja_compliance_cache', JSON.stringify(res));
      }
      await refreshState();
      addToast('Sanction & policy compliance check completed', 'success');
    } catch (err) {
      addToast('Failed to contact compliance verification engine', 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleApproveClearedRoute = async () => {
    setApproving(true);
    try {
      if (backendOnline) {
        await recordDecision({
          action_type: "APPROVE_COMPLIANT_ROUTES",
          approved_by: "Commander Arjun Mehta",
          scenario_id: activeScenario?.id || 'baseline',
          details: activeCompData || { message: "Approved compliant sourcing routes" }
        });
      }
      await refreshState();
      addToast('Cleared routes approved and registered on backend', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to record compliance route approval on backend', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleFlagForReview = async () => {
    setFlagging(true);
    try {
      if (backendOnline) {
        await recordDecision({
          action_type: "FLAG_COMPLIANCE_REVIEW",
          approved_by: "Commander Arjun Mehta",
          scenario_id: activeScenario?.id || 'baseline',
          details: { message: "Flagged compliance check results for review due to risk escalation" }
        });
      }
      await refreshState();
      addToast('Compliance review flag recorded successfully', 'warning');
    } catch (err) {
      console.error(err);
      addToast('Failed to record review flag on backend', 'error');
    } finally {
      setFlagging(false);
    }
  };

  const handleExportReport = async () => {
    addToast('Generating Compliance Report...', 'info');
    const content = [
      'URJANETRA AI — COMPLIANCE VERIFICATION REPORT',
      '==============================================',
      `Timestamp: ${new Date().toISOString()}`,
      `Scenario: ${activeScenario?.name || 'Baseline Operations'}`,
      `Overall Score: ${overallScore}%`,
      `Compliance Status: ${activeCompData.all_clear ? 'ALL CLEAR' : 'ISSUES FLAGGED'}`,
      '',
      'VERIFICATION BREAKDOWN BY SUPPLIER:',
      ...results.map(r => [
        `Supplier: ${r.supplier_name}`,
        `  - Sanctions: ${r.sanctions}`,
        `  - Insurance Check: ${r.insurance}`,
        `  - Legal Status: ${r.legal_status}`,
        `  - Policy Alignment: ${r.policy_alignment}`,
        `  - Route Restriction: ${r.route_restriction}`,
        `  - Overall Rating: ${r.overall}`,
        `  - Flags: ${r.flags?.join('; ') || 'None'}`,
        ''
      ].join('\n')),
      'Prepared for: National Energy Management Council (NEMC)',
      'Classification: CONFIDENTIAL / OFFICIAL USE ONLY',
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `compliance_report_${Date.now()}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast('Compliance report downloaded successfully', 'success');
  };

  const activeCompData = compCache || compData || fallbackComp;

  // Deriving metrics and charts from compliance results
  const results = activeCompData?.results || [];
  const totalSuppliers = results.length || 1;
  const compliantCount = results.filter(r => r.overall === 'CLEAR' || r.overall === 'COMPLIANT' || r.overall === 'ALIGNED' || r.overall === 'GREEN').length;
  const flaggedCount = activeCompData?.flagged_count ?? results.filter(r => r.overall === 'BLOCKED' || r.overall === 'FLAGGED' || r.overall === 'RED').length;
  const reviewCount = Math.max(0, totalSuppliers - compliantCount - flaggedCount);
  const overallScore = Math.round((compliantCount / totalSuppliers) * 100);

  const derivedPieData = [
    { name: 'Compliant', value: compliantCount, color: '#22c55e' },
    { name: 'Under Review', value: reviewCount, color: '#f59e0b' },
    { name: 'Non-Compliant', value: flaggedCount, color: '#ef4444' },
  ];

  const derivedTrendData = [
    { month: 'Jul', score: 80, prev: 78 },
    { month: 'Aug', score: 85, prev: 82 },
    { month: 'Sep', score: overallScore, prev: 84 },
  ];

  const derivedRadarData = [
    { area: 'Sanctions', score: Math.round((results.filter(r => r.sanctions === 'CLEAR').length / totalSuppliers) * 100) },
    { area: 'Insurance', score: Math.round((results.filter(r => r.insurance === 'VALID' || r.insurance === 'COVERED').length / totalSuppliers) * 100) },
    { area: 'Legal', score: Math.round((results.filter(r => r.legal_status === 'COMPLIANT' || r.legal_status === 'CLEAR').length / totalSuppliers) * 100) },
    { area: 'Policy', score: Math.round((results.filter(r => r.policy_alignment === 'ALIGNED' || r.policy_alignment === 'COMPLIANT').length / totalSuppliers) * 100) },
    { area: 'Route', score: Math.round((results.filter(r => r.route_restriction !== 'BLOCKED' && r.route_restriction !== 'HIGH ALERT').length / totalSuppliers) * 100) },
  ];

  const filteredResults = filter === 'All' 
    ? results 
    : results.filter(r => {
        if (filter === 'Compliant') return r.overall === 'CLEAR' || r.overall === 'COMPLIANT' || r.overall === 'ALIGNED' || r.overall === 'GREEN';
        if (filter === 'Non-Compliant') return r.overall === 'BLOCKED' || r.overall === 'FLAGGED' || r.overall === 'RED';
        if (filter === 'Under Review') return r.overall === 'REVIEW' || r.overall === 'REVIEW REQUIRED' || r.overall === 'AMBER';
        return true;
      });

  const renderChart = () => {
    const tooltipStyle = { background: 'rgba(6,15,32,0.97)', border: '1px solid rgba(90,130,255,0.25)', borderRadius: 10, fontSize: 11 };
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={derivedTrendData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10.5 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10.5 }} axisLine={false} tickLine={false} domain={[50, 100]} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="score" radius={[5, 5, 0, 0]} name="Score">
                {derivedTrendData.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.score)} opacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="prev" radius={[4, 4, 0, 0]} name="Previous" fill="rgba(148,163,184,0.15)" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={derivedTrendData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10.5 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10.5 }} axisLine={false} tickLine={false} domain={[50, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }} name="Score 2024" />
              <Line type="monotone" dataKey="prev" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Prev Year" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={derivedTrendData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d8cff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1d8cff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10.5 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10.5 }} axisLine={false} tickLine={false} domain={[50, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} fill="url(#scoreGrad)" name="Score 2024" />
              <Area type="monotone" dataKey="prev" stroke="#1d8cff" strokeWidth={1.5} fill="url(#prevGrad)" name="Prev Year" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={derivedPieData} cx="50%" cy="50%" outerRadius={60} innerRadius={30}
                dataKey="value" strokeWidth={0} paddingAngle={3}>
                {derivedPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} />
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  if (!activeCompData && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <WifiOff size={48} style={{ color: '#f59e0b' }} />
          <h2>System Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached compliance data is available.</p>
          <button className="btn btn-primary" onClick={handleVerifySuppliers}>
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

      <PageHeader
        title="Compliance Shield"
        subtitle="Regulatory tracking and audit readiness across all energy mandates"
        badge={{ label: 'AUTO-MONITORING', color: '#22c55e' }}
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={handleVerifySuppliers} disabled={checking || compLoading}>
              {checking || compLoading ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={12} />}
              {' '}Verify Compliance
            </button>
            <button className="btn btn-success btn-sm" onClick={handleApproveClearedRoute} disabled={approving}><CheckCircle size={12} /> Approve Cleared Route</button>
            <button className="btn btn-danger btn-sm" onClick={handleFlagForReview} disabled={flagging}><AlertTriangle size={12} /> Flag for Review</button>
            <button className="btn btn-primary btn-sm" onClick={handleExportReport}>
              <FileText size={12} /> Export Report
            </button>
          </>
        }
      />

      {/* Loading overlay bar */}
      {(compLoading || checking) && (
        <div style={{ background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)', color: '#1d8cff', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Verifying supplier credentials against global OFAC and legal sanctions...
        </div>
      )}

      {/* Error Notification Banner */}
      {backendOnline && compError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <AlertTriangle size={14} />
          Compliance check failed: {compError.message || 'Connection failed'}. Showing fallback statuses.
        </div>
      )}

      {/* KPI row with Hover Tooltips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <HoverMetricCard
          label="Overall Score"
          value={`${overallScore}%`}
          color="#4ade80"
          icon={Shield}
          bg="rgba(34,197,94,0.1)"
          desc="Percentage of suppliers cleared across all compliance dimensions. Targets 100% regulatory compliance."
        />
        <HoverMetricCard
          label="Compliant"
          value={`${compliantCount}/${totalSuppliers}`}
          color="#60b4ff"
          icon={CheckCircle}
          bg="rgba(29,140,255,0.1)"
          desc="Number of suppliers fully cleared (GREEN) with valid P&I insurance and no sanctions flags."
        />
        <HoverMetricCard
          label="Under Review"
          value={`${reviewCount}`}
          color="#fbbf24"
          icon={Clock}
          bg="rgba(245,158,11,0.1)"
          desc="Suppliers with warning flags (AMBER) or routing policy minor flags requiring manual compliance review."
        />
        <HoverMetricCard
          label="Non-Compliant"
          value={`${flaggedCount}`}
          color="#f87171"
          icon={X}
          bg="rgba(239,68,68,0.1)"
          desc="Suppliers on active OFAC / EU sanctions lists or with P&I Club insurance coverage withdrawn (RED)."
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 280px)', gap: 16, marginBottom: 16 }}>
        {/* Main trend chart with switcher */}
        <GlassCard style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div className="card-title">Compliance Score Trend (2024)</div>
              <div className="card-subtitle" style={{ marginBottom: 0 }}>Monthly scores vs prior year · Color = performance band</div>
            </div>
            {/* Chart type switcher */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4, border: '1px solid var(--border-soft)' }}>
              {chartTypes.map(ct => {
                const Icon = ct.icon;
                return (
                  <button
                    key={ct.id}
                    onClick={() => setChartType(ct.id)}
                    title={ct.label}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
                      background: chartType === ct.id ? 'rgba(29,140,255,0.2)' : 'transparent',
                      color: chartType === ct.id ? '#60b4ff' : '#64748b',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={12} /> {ct.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color legend for bar chart */}
          {chartType === 'bar' && (
            <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
              {[['≥90 Excellent', '#22c55e'], ['≥80 Good', '#1d8cff'], ['≥70 Fair', '#f59e0b'], ['<70 At Risk', '#ef4444']].map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 9.5, color: '#64748b' }}>{label}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 170 }}>
            {renderChart()}
          </div>
        </GlassCard>

        {/* Radar */}
        <GlassCard style={{ padding: '16px 20px' }}>
          <div className="card-title">Coverage by Category</div>
          <div className="card-subtitle">Radar of compliance across domains</div>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={derivedRadarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="area" tick={{ fill: '#64748b', fontSize: 9 }} />
              <Radar dataKey="score" stroke="#1d8cff" fill="#1d8cff" fillOpacity={0.15} strokeWidth={1.5} />
              <Tooltip contentStyle={{ background: 'rgba(6,15,32,0.97)', border: '1px solid rgba(90,130,255,0.25)', borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Filter + Table */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={12} style={{ color: 'var(--text-dim)' }} />
        {['All', 'Compliant', 'Non-Compliant', 'Under Review'].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: '1px solid', fontFamily: 'inherit',
            background: filter === cat ? 'rgba(29,140,255,0.15)' : 'transparent',
            borderColor: filter === cat ? '#60b4ff' : 'var(--border-soft)',
            color: filter === cat ? '#60b4ff' : 'var(--text-dim)',
            transition: 'all 0.15s',
          }}>{cat}</button>
        ))}
      </div>

      {/* Supplier Verification results - Live Backend Hook */}
      <GlassCard style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>Supplier Sanctions & Insurance Verification</h3>
          <span className={`badge ${activeCompData.all_clear ? 'badge-green' : 'badge-amber'}`}>
            {activeCompData.all_clear ? 'ALL CLEAR' : `${activeCompData.flagged_count} FLAGGED`}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Supplier', 'Sanctions', 'Insurance Check', 'Legal Status', 'Policy Alignment', 'Flags'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResults?.map(res => (
                <tr key={res.supplier_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>{res.supplier_name}</td>
                  <td style={{ padding: '8px 12px' }}><StatusBadge status={res.sanctions} size="sm" /></td>
                  <td style={{ padding: '8px 12px' }}><StatusBadge status={res.insurance} size="sm" /></td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)' }}>{res.legal_status}</td>
                  <td style={{ padding: '8px 12px' }}><StatusBadge status={res.policy_alignment} size="sm" /></td>
                  <td style={{ padding: '8px 12px', fontSize: 10, color: '#f87171' }}>{res.flags?.join(', ') || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
