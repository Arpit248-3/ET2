import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, CheckCircle, Download, FileText, ArrowRight, Loader, AlertTriangle, WifiOff, Info } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartTooltip } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import useApi from '../../hooks/useApi.js';
import { optimizeProcurement, recordDecision, generateBrief, approveProcurementRoute } from '../../services/api.js';

// Hover tooltip descriptions for selected supplier detail boxes
const DETAIL_DESCRIPTIONS = {
  'Route':         "The shipping lane this supplier's cargo traverses to reach India. Longer / riskier routes increase ETA and insurance premiums.",
  'ETA':           'Estimated Time of Arrival in days from port of origin. Directly affects supply-gap bridging capability during a crisis.',
  'Landed Cost':   'Total delivered cost per barrel including freight, insurance, port fees, and customs duties — the key economic metric for procurement decisions.',
  'Risk Score':    'Composite route + sanctions + insurance risk (0 = safest, 100 = maximum risk). Scores below 35 are marked RECOMMENDED.',
  'Compatibility': "Percentage of India's refinery capacity that can process this crude without blending or process modifications.",
  'Sanctions':     'OFAC / EU sanctions clearance status. Any FLAGGED supplier is automatically excluded from the recommended allocation mix.',
  'Availability':  'Current market availability: HIGH = spot & term volumes available; MEDIUM = term only; LOW = constrained spot market.',
  'Verdict':       'AI-derived overall procurement verdict combining all risk, cost, compliance, and compatibility dimensions.',
};

const cols = [
  { 
    key: 'supplier',      
    label: 'Supplier',
    render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{v}</span>
        {row?.isPreferred && (
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(29,140,255,0.15)', color: '#60b4ff', fontWeight: 700, border: '1px solid rgba(29,140,255,0.3)' }}>
            Refinery Preferred
          </span>
        )}
      </div>
    )
  },
  { key: 'route',         label: 'Route' },
  { key: 'eta',           label: 'ETA' },
  { key: 'landedCost',    label: 'Landed Cost' },
  { key: 'riskScore',     label: 'Risk',    render: v => <span style={{ color: v < 35 ? '#22c55e' : v < 65 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{v}/100</span> },
  { key: 'compatibility', label: 'Compat.', render: v => <span style={{ color: '#22c55e', fontWeight: 700 }}>{v}%</span> },
  { key: 'sanctions',     label: 'Sanctions', badge: true },
  { key: 'verdict',       label: 'Verdict', render: v => <StatusBadge status={v} size="sm" /> },
];

const fallbackSuppliers = [
  { supplier: 'West Africa (Nigeria)', route: 'Cape of Good Hope', eta: '22 days', landedCost: '$84.2/bbl', riskScore: 18, compatibility: 94, sanctions: 'CLEAR', availability: 'HIGH', verdict: 'RECOMMENDED' },
  { supplier: 'Saudi Arabia (Aramco)', route: 'Strait of Hormuz',  eta: '18 days', landedCost: '$79.8/bbl', riskScore: 48, compatibility: 88, sanctions: 'CLEAR', availability: 'MEDIUM', verdict: 'VIABLE' },
  { supplier: 'Brazil (Petrobras)',    route: 'Atlantic',          eta: '26 days', landedCost: '$86.5/bbl', riskScore: 15, compatibility: 89, sanctions: 'CLEAR', availability: 'HIGH', verdict: 'RECOMMENDED' },
  { supplier: 'UAE (ADNOC)',           route: 'Strait of Hormuz',  eta: '16 days', landedCost: '$81.3/bbl', riskScore: 55, compatibility: 92, sanctions: 'CLEAR', availability: 'MEDIUM', verdict: 'VIABLE' },
  { supplier: 'Russia (Rosneft)',      route: 'Arctic / Cape',     eta: '28 days', landedCost: '$72.1/bbl', riskScore: 82, compatibility: 71, sanctions: 'FLAGGED', availability: 'LOW', verdict: 'HIGH RISK' },
  { supplier: 'USA (WTI)',             route: 'Pacific / Cape',    eta: '32 days', landedCost: '$88.9/bbl', riskScore: 10, compatibility: 82, sanctions: 'CLEAR', availability: 'MEDIUM', verdict: 'RECOMMENDED' },
];

function buildRadarData(suppliers) {
  if (!suppliers || suppliers.length < 2) return [];
  const [s1, s2] = suppliers.slice(0, 2);
  const k1 = s1.supplier.split(' ')[0];
  const k2 = s2.supplier.split(' ')[0];
  const costOf = s => Math.max(0, Math.round((1 - (parseFloat(s.landedCost?.replace('$','')) || 84) / 110) * 100));
  return [
    { subject: 'Cost',    [k1]: costOf(s1),          [k2]: costOf(s2) },
    { subject: 'Safety',  [k1]: 100 - s1.riskScore,  [k2]: 100 - s2.riskScore },
    { subject: 'Compliance', [k1]: s1.sanctions === 'CLEAR' ? 98 : 20, [k2]: s2.sanctions === 'CLEAR' ? 96 : 20 },
    { subject: 'Compat.', [k1]: s1.compatibility,    [k2]: s2.compatibility },
    { subject: 'Speed',   [k1]: Math.max(0, 100 - (parseInt(s1.eta) || 22) * 2), [k2]: Math.max(0, 100 - (parseInt(s2.eta) || 22) * 2) },
  ];
}

// Hover-tooltip wrapper
function TooltipCard({ label, val, desc }) {
  const [show, setShow] = useState(false);
  return (
    <div
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border-soft)', position: 'relative', cursor: 'default', transition: 'border-color 0.2s', borderColor: show ? 'rgba(29,140,255,0.4)' : undefined }}
    >
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
        {label} <Info size={10} style={{ color: '#475569', flexShrink: 0 }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{val}</div>
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 50, minWidth: 220, maxWidth: 280,
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

export default function ProcurementOptimizer() {
  const { addToast } = useToast();
  const { activeScenario, backendOnline, refreshState } = useScenario();
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [comparing, setComparing] = useState(false);

  const [procCache, setProcCache] = useState(() => {
    try { const c = localStorage.getItem('urja_procurement_cache'); return c ? JSON.parse(c) : null; } catch { return null; }
  });

  const { data: procData, loading: procLoading, error: procError, execute: runOptimize } = useApi(optimizeProcurement, {
    manual: false,
    fallback: null,
    args: [{ target_volume_mbbl: 2.4, duration_days: 30, exclude_routes: [], max_risk_score: 60 }],
  });

  useEffect(() => {
    if (procData) {
      setProcCache(procData);
      localStorage.setItem('urja_procurement_cache', JSON.stringify(procData));
    }
  }, [procData]);

  useEffect(() => {
    if (procError) addToast('Optimizer error — showing cached results', 'error');
  }, [procError, addToast]);

  const activeData = procCache || procData;

  const preferredCrude = localStorage.getItem('urja_preferred_crude');
  const matchesPreferred = (supName, crudeType) => {
    if (!preferredCrude) return false;
    const pref = preferredCrude.toLowerCase();
    const name = (supName || '').toLowerCase();
    const crude = (crudeType || '').toLowerCase();
    return pref.includes(name) || name.includes(pref) || pref.includes(crude) || crude.includes(pref);
  };

  const displaySuppliers = activeData?.recommended_mix
    ? activeData.recommended_mix.map(s => ({
        supplier: s.name,
        route: s.route,
        eta: s.eta_days ? `${s.eta_days} days` : '22 days',
        landedCost: `$${s.landed_cost_usd_bbl}/bbl`,
        riskScore: s.risk_score ?? 28,
        compatibility: s.refinery_compatibility ?? 94,
        sanctions: s.sanctions_status || 'CLEAR',
        availability: s.availability || 'HIGH',
        verdict: s.verdict || 'CAUTION',
        compositeScore: s.composite_score,
        scoreBreakdown: s.score_breakdown,
        recommendedVol: s.recommended_volume_mbbl,
        isPreferred: matchesPreferred(s.name, s.crude_type),
      }))
    : fallbackSuppliers.map(s => ({
        ...s,
        isPreferred: matchesPreferred(s.supplier, s.supplier),
      }));

  const topSupplier = displaySuppliers.find(s => s.verdict === 'RECOMMENDED') || displaySuppliers[0];

  const handleOptimize = async (silent = false) => {
    setOptimizing(true);
    try {
      const res = await runOptimize({ target_volume_mbbl: 2.4, duration_days: 30, exclude_routes: [], max_risk_score: 60 });
      if (res) { setProcCache(res); localStorage.setItem('urja_procurement_cache', JSON.stringify(res)); }
      await refreshState();
      if (!silent) addToast('Procurement mix optimized using live scenario data', 'success');
    } catch { if (!silent) addToast('Failed to optimize — showing cached data', 'warning'); }
    finally { setOptimizing(false); }
  };

  const handleCompareAlternatives = async () => {
    setComparing(true);
    addToast('Re-running optimizer with alternative risk thresholds...', 'info');
    try {
      const res = await runOptimize({ target_volume_mbbl: 3.0, duration_days: 45, exclude_routes: ['Strait of Hormuz'], max_risk_score: 45 });
      if (res) { setProcCache(res); localStorage.setItem('urja_procurement_cache', JSON.stringify(res)); }
      await refreshState();
      addToast('Alternative procurement mix calculated — Hormuz routes excluded', 'success');
    } catch { addToast('Alternative comparison failed', 'error'); }
    finally { setComparing(false); }
  };

  const handleGenerateNote = async () => {
    addToast('Generating Procurement Note...', 'info');
    try {
      await generateBrief({ scenario_id: activeScenario?.id || 'hormuz_closure', classification: 'CONFIDENTIAL', prepared_for: 'Sourcing & Procurement Dept' });
      const content = [
        'URJANETRA AI — PROCUREMENT INTELLIGENCE NOTE',
        '============================================',
        `Generated: ${new Date().toISOString()}`,
        `Scenario: ${activeScenario?.name || 'Baseline'}`,
        `Optimized For: ${activeData?.optimized_for || 'COST_RISK_BALANCE'}`,
        '',
        'RECOMMENDED SUPPLIER MIX:',
        ...displaySuppliers.map(s => `  • ${s.supplier}: Route=${s.route}, Cost=${s.landedCost}, Risk=${s.riskScore}/100, Verdict=${s.verdict}`),
        '',
        `Total Cost Estimate: ${activeData?.total_cost_estimate_cr ? `₹${activeData.total_cost_estimate_cr.toLocaleString()} Cr` : 'N/A'}`,
        `Coverage: ${activeData?.coverage_days || 30} days`,
        `Risk Summary: ${activeData?.risk_summary || 'See above'}`,
        '',
        'Approved By: Commander Arjun Mehta, NEMC',
      ].join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `procurement_note_${Date.now()}.txt`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      addToast('Procurement note downloaded', 'success');
    } catch (err) { addToast('Failed to generate note: ' + (err.message || 'error'), 'error'); }
  };

  const handleExportRFQ = async () => {
    addToast('Generating RFQ document...', 'info');
    const rfq = [
      'REQUEST FOR QUOTATION — URJANETRA AI PLATFORM',
      '===============================================',
      `RFQ Date: ${new Date().toLocaleDateString('en-IN')}`,
      `Scenario: ${activeScenario?.name || 'Standard Operations'}`,
      `Volume Required: ${activeData?.total_cost_estimate_cr ? '2.4 MMT' : '2.4 MMT'} crude oil`,
      `Required Delivery: Within 30 days`,
      '',
      'APPROVED SUPPLIER LIST (CLEARED FOR RFQ):',
      ...displaySuppliers
        .filter(s => s.sanctions !== 'FLAGGED')
        .map((s, i) => `  ${i+1}. ${s.supplier} — Route: ${s.route} — ETA: ${s.eta} — Last quoted: ${s.landedCost}`),
      '',
      'Submit quotations to: procurement@nemc.gov.in',
      'Classification: RESTRICTED',
    ].join('\n');
    const blob = new Blob([rfq], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `RFQ_${Date.now()}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast('RFQ exported and downloaded', 'success');
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      if (backendOnline) {
        await recordDecision({
          action_type: 'APPROVE_PROCUREMENT_PLAN',
          approved_by: 'Commander Arjun Mehta',
          scenario_id: activeScenario?.id || 'baseline',
          details: activeData || { message: 'Approved procurement recommendation plan' },
        });
      }
      await refreshState();
      addToast('Procurement plan approved and sent to Cabinet', 'success');
    } catch { addToast('Failed to record approval', 'error'); }
    finally { setApproving(false); }
  };

  const handleSelectAndActivateSupplier = (row) => {
    setSelectedSupplier(row);
    const supName = (row?.supplier || '').toLowerCase();
    let routeId = 'west_africa';
    if (supName.includes('saudi') || supName.includes('aramco')) routeId = 'saudi_hormuz';
    else if (supName.includes('brazil') || supName.includes('petrobras')) routeId = 'brazil_atlantic';
    else if (supName.includes('uae') || supName.includes('adnoc')) routeId = 'uae_hormuz';
    else if (supName.includes('russia') || supName.includes('rosneft')) routeId = 'russia_arctic';
    else if (supName.includes('usa') || supName.includes('wti')) routeId = 'usa_wti';
    else routeId = 'west_africa';

    const payload = {
      route_id: routeId,
      route_name: `${row.route} (${row.supplier} Corridor)`,
      supplier: row.supplier,
      destination_port: 'Jamnagar / Vadinar Terminal',
      eta_days: parseInt(row.eta) || 22,
      landed_cost: row.landedCost || '$84.2/bbl',
      risk_score: row.riskScore || 18,
      approved_by: 'Commander Arjun Mehta, NEMC'
    };

    try {
      if (backendOnline) {
        approveProcurementRoute(payload).catch(err => console.warn('Backend route approval error:', err));
      }
      localStorage.setItem('urja_approved_route', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('urja-route-approved', { detail: payload }));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    addToast(`Selected & Activated Route: ${row.supplier} (${row.route})`, 'info');
  };

  const handleApproveSpecificRoute = async (sup) => {
    setApproving(true);
    const targetSup = sup || selectedRow || displaySuppliers[0];
    const supName = (targetSup?.supplier || '').toLowerCase();
    let routeId = 'west_africa';
    if (supName.includes('saudi') || supName.includes('aramco')) routeId = 'saudi_hormuz';
    else if (supName.includes('brazil') || supName.includes('petrobras')) routeId = 'brazil_atlantic';
    else if (supName.includes('uae') || supName.includes('adnoc')) routeId = 'uae_hormuz';
    else if (supName.includes('russia') || supName.includes('rosneft')) routeId = 'russia_arctic';
    else if (supName.includes('usa') || supName.includes('wti')) routeId = 'usa_wti';
    else routeId = 'west_africa';

    const payload = {
      route_id: routeId,
      route_name: `${targetSup?.route} (${targetSup?.supplier} Corridor)`,
      supplier: targetSup?.supplier,
      destination_port: 'Jamnagar / Vadinar Terminal',
      eta_days: parseInt(targetSup?.eta) || 22,
      landed_cost: targetSup?.landedCost || '$84.2/bbl',
      risk_score: targetSup?.riskScore || 18,
      approved_by: 'Commander Arjun Mehta, NEMC'
    };

    try {
      if (backendOnline) {
        await approveProcurementRoute(payload);
      } else {
        localStorage.setItem('urja_approved_route', JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent('urja-route-approved', { detail: payload }));
      }
      await refreshState();
      addToast(`Alternative Route Approved & Activated: ${payload.route_name}`, 'success');
    } catch (err) {
      addToast('Route approval failed: ' + (err.message || 'error'), 'error');
    } finally {
      setApproving(false);
    }
  };

  const selectedRow = selectedSupplier || displaySuppliers[0];
  const radar = buildRadarData(displaySuppliers);
  const radarKeys = radar.length > 0 ? Object.keys(radar[0]).filter(k => k !== 'subject') : [];

  const displayTotalCost = activeData?.total_cost_estimate_cr ? `₹${Number(activeData.total_cost_estimate_cr).toLocaleString()} Cr` : '—';
  const displayCoverage  = activeData?.coverage_days ? `${activeData.coverage_days} days` : '30 days';
  const displayRisk      = activeData?.risk_summary || '—';
  const displayOptFor    = (activeData?.optimized_for || 'Cost-Risk Balance').replace(/_/g, ' ');

  if (!activeData && !backendOnline) return (
    <DashboardLayout>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80vh', gap:16 }}>
        <WifiOff size={48} style={{ color:'#f59e0b' }} />
        <h2>System Offline</h2>
        <p style={{ color:'var(--text-muted)' }}>No cached procurement data. Retry when backend is available.</p>
        <button className="btn btn-primary" onClick={() => handleOptimize()}><Loader size={14} style={{ marginRight:6 }} /> Retry</button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {!backendOnline && (
        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:12, color:'#f59e0b', display:'flex', alignItems:'center', gap:8 }}>
          <AlertTriangle size={14} /><span>Showing last known intelligence state (Offline)</span>
        </div>
      )}

      <PageHeader title="Procurement Optimizer" subtitle="Multi-supplier comparison · Route analysis · AI-recommended sourcing strategy"
        badge={<StatusBadge status={activeScenario ? "SCENARIO ACTIVE" : "NOMINAL"} />}
        actions={<>
          <button className="btn btn-ghost btn-sm" onClick={handleGenerateNote}><FileText size={13} /> Generate Note</button>
          <button className="btn btn-ghost btn-sm" onClick={handleExportRFQ}><Download size={13} /> Export RFQ</button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleOptimize(false)} disabled={optimizing || procLoading}>
            {optimizing || procLoading ? <Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> : <ShoppingCart size={13} />} Optimize Procurement
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleApprove} disabled={approving}>
            {approving ? <Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> : <CheckCircle size={13} />} Approve Plan
          </button>
        </>}
      />

      {/* Selected Supplier Detail Banner with Route Approval Button */}
      {selectedRow && (
        <GlassCard style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Active Selection: {selectedRow.supplier}</h3>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Corridor: <b style={{ color: '#00e5ff' }}>{selectedRow.route}</b> (ETA: {selectedRow.eta})</span>
            </div>
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleApproveSpecificRoute(selectedRow)}
              disabled={approving}
              style={{ background: '#22c55e', borderColor: '#22c55e', color: '#000', fontWeight: 800 }}
            >
              {approving ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} style={{ marginRight: 6 }} />}
              Approve & Activate Route: {selectedRow.route}
            </button>
          </div>
        </GlassCard>
      )}

      {(procLoading || optimizing) && (
        <div style={{ background:'rgba(29,140,255,0.1)', border:'1px solid rgba(29,140,255,0.2)', color:'#1d8cff', padding:'10px 16px', borderRadius:8, marginBottom:14, display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
          <Loader size={14} style={{ animation:'spin 1s linear infinite' }} /> Running procurement optimization algorithms...
        </div>
      )}

      {/* AI Best Recommendation */}
      <GlassCard glow="green" style={{ marginBottom:16, background:'rgba(34,197,94,0.05)', borderColor:'rgba(34,197,94,0.3)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(34,197,94,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <CheckCircle size={20} style={{ color:'#22c55e' }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#22c55e', marginBottom:4 }}>
              AI Best Recommendation: {topSupplier?.supplier || '—'}
            </div>
            <p style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.55 }}>
              Route: {topSupplier?.route} · Landed Cost: {topSupplier?.landedCost} · Risk: {topSupplier?.riskScore}/100 · Refinery Compatibility: {topSupplier?.compatibility}% · Sanctions: {topSupplier?.sanctions}
              {activeScenario && <span style={{ color:'#60b4ff', marginLeft:8 }}>· Active Scenario: {activeScenario.name}</span>}
            </p>
          </div>
          <div style={{ display:'flex', gap:10, flexShrink:0 }}>
            <button className="btn btn-success btn-sm" onClick={handleApprove} disabled={approving}>
              {approving ? <Loader size={12} style={{ animation:'spin 1s linear infinite' }} /> : null} Approve
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleCompareAlternatives} disabled={comparing}>
              {comparing ? <Loader size={12} style={{ animation:'spin 1s linear infinite' }} /> : null} Compare Alternatives
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Summary KPI row */}
      {activeData && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:16 }}>
          {[
            { label:'Total Cost Estimate', val:displayTotalCost, color:'#1d8cff' },
            { label:'Coverage Days',       val:displayCoverage,  color:'#22c55e' },
            { label:'Optimized For',       val:displayOptFor,    color:'#00e5ff' },
            { label:'Risk Summary',        val:displayRisk,      color:'#f59e0b', small:true },
          ].map(d => (
            <GlassCard key={d.label} style={{ padding:12, textAlign:'center' }}>
              <div style={{ fontSize: d.small ? 11 : 15, fontWeight:800, color:d.color, lineHeight:1.3 }}>{d.val}</div>
              <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:4 }}>{d.label}</div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Supplier Matrix (wider) + Radar (narrower) */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <GlassCard>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ fontSize:14, fontWeight:700 }}>Supplier Comparison Matrix</h3>
            {procLoading && <Loader size={14} style={{ color:'#1d8cff', animation:'spin 1s linear infinite' }} />}
          </div>
          <div style={{ overflowX:'auto' }}>
            <DataTable
              columns={cols}
              data={displaySuppliers}
              onRowClick={row => handleSelectAndActivateSupplier(row)}
            />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Scoring Radar</h3>
          <p style={{ fontSize:11, color:'var(--text-dim)', marginBottom:10 }}>
            {displaySuppliers[0]?.supplier?.split(' ')[0] || '—'} vs {displaySuppliers[1]?.supplier?.split(' ')[0] || '—'}
          </p>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radar}>
              <PolarGrid stroke="rgba(90,130,255,0.15)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'#64748b', fontSize:10 }} />
              <RechartTooltip contentStyle={{ background:'rgba(8,18,35,0.95)', border:'1px solid rgba(90,130,255,0.3)', borderRadius:8, fontSize:11 }} />
              {radarKeys.map((key, i) => (
                <Radar key={key} name={key} dataKey={key}
                  stroke={i === 0 ? '#22c55e' : '#f59e0b'}
                  fill={i === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.1)'} fillOpacity={1} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:14, justifyContent:'center', marginTop:8, flexWrap:'wrap' }}>
            {radarKeys.map((key, i) => (
              <div key={key} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:10, height:3, background:i===0?'#22c55e':'#f59e0b', borderRadius:2 }} />
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{key}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Selected Supplier Detail with hover tooltips */}
      {selectedRow && (
        <GlassCard>
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Selected: {selectedRow.supplier}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12 }}>
            {[
              { label:'Route',         val: selectedRow.route },
              { label:'ETA',           val: selectedRow.eta },
              { label:'Landed Cost',   val: selectedRow.landedCost },
              { label:'Risk Score',    val: `${selectedRow.riskScore}/100` },
              { label:'Compatibility', val: `${selectedRow.compatibility}%` },
              { label:'Sanctions',     val: selectedRow.sanctions },
              { label:'Availability',  val: selectedRow.availability },
              { label:'Verdict',       val: selectedRow.verdict },
            ].map(d => (
              <TooltipCard key={d.label} label={d.label} val={d.val} desc={DETAIL_DESCRIPTIONS[d.label] || ''} />
            ))}
          </div>
          {selectedRow.scoreBreakdown && (
            <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid var(--border-soft)' }}>
              <div style={{ fontSize:11, color:'var(--text-dim)', marginBottom:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Score Breakdown</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {Object.entries(selectedRow.scoreBreakdown).map(([k, v]) => (
                  <div key={k} style={{ fontSize:11, color:'var(--text-muted)' }}>
                    <span style={{ color:'var(--text-dim)' }}>{k.replace(/_/g,' ')}: </span>
                    <span style={{ color:'#60b4ff', fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
