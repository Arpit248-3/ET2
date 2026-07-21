import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Ship, Zap, Globe, Filter, Loader, WifiOff } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';
import useApi from '../../hooks/useApi.js';
import { fetchRisk } from '../../services/api.js';

const signalCols = [
  { key: 'source', label: 'Source' },
  { key: 'category', label: 'Category', render: v => <span className="badge badge-blue" style={{fontSize:10}}>{v}</span> },
  { key: 'signal', label: 'Signal' },
  { key: 'score', label: 'Risk Score', render: v => <span style={{ color: v > 75 ? '#ef4444' : v > 55 ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>{v}</span> },
  { key: 'confidence', label: 'Confidence', render: v => <span style={{ color: '#94a3b8' }}>{v}%</span> },
  { key: 'trend', label: 'Trend', render: v => <span style={{ color: v === 'up' ? '#ef4444' : '#22c55e', fontWeight: 600 }}>{v === 'up' ? '↑ Rising' : '→ Stable'}</span> },
];

export default function RiskIntelligence() {
  const { addToast } = useToast();
  const { systemState, backendOnline, refreshState } = useScenario();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const filters = ['ALL', 'CRITICAL', 'WARNING', 'INFO'];

  // Cache-based riskData state
  const [riskData, setRiskData] = useState(() => {
    const cached = localStorage.getItem('urja_risk_cache');
    return cached ? JSON.parse(cached) : null;
  });

  // Live risk data from backend
  const { data: liveRiskData, loading: riskLoading, error: riskError, refetch } = useApi(fetchRisk, {
    fallback: null,
  });

  // Sync cache
  useEffect(() => {
    if (liveRiskData) {
      setRiskData(liveRiskData);
      localStorage.setItem('urja_risk_cache', JSON.stringify(liveRiskData));
    }
  }, [liveRiskData]);

  // Display toast on error
  useEffect(() => {
    if (riskError) {
      addToast('Error fetching live risk data', 'error');
    }
  }, [riskError, addToast]);

  const overallScore = riskData?.overall_score ?? systemState?.kpi?.risk_score ?? 32;
  const crisisLevel = riskData?.crisis_level ?? systemState?.kpi?.crisis_level ?? 'NORMAL';

  const getComponentVal = (name, fallbackVal) => {
    if (!riskData || !Array.isArray(riskData.components)) return fallbackVal;
    const comp = riskData.components.find(c => c.name === name);
    return comp ? Math.round(comp.value) : fallbackVal;
  };

  const maritime = getComponentVal('maritime_delay', 5);
  const sanctions = getComponentVal('sanctions_exposure', 5);
  const opec = getComponentVal('supplier_reliability', 15);
  const weather = getComponentVal('spr_coverage', 36);
  const market = getComponentVal('crude_price_spike', 10);
  const geopolitical = getComponentVal('geopolitical_risk', 20);

  const radarData = riskData?.components?.map(c => ({
    subject: c.label,
    A: Math.round(c.value)
  })) || [
    { subject: 'Geopolitical Risk', A: geopolitical },
    { subject: 'Maritime Delay Risk', A: maritime },
    { subject: 'Crude Price Spike', A: market },
    { subject: 'Supplier Reliability Risk', A: opec },
    { subject: 'Sanctions Exposure', A: sanctions },
    { subject: 'SPR Coverage Risk', A: weather },
  ];

  // Derive intelligence news feed from active risk signals
  const displaySignals = riskData?.signals ?? [];
  const newsFeed = displaySignals.map(sig => {
    let riskStatus = 'INFO';
    if (sig.score >= 75) riskStatus = 'CRITICAL';
    else if (sig.score >= 55) riskStatus = 'WARNING';
    
    return {
      source: sig.source,
      headline: sig.signal,
      risk: riskStatus,
      time: 'Recent'
    };
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      await refreshState();
      addToast('Risk assessment updated from backend', 'success');
    } catch (err) {
      addToast('Failed to refresh risk assessment from backend', 'error');
    }
  };

  // Safe empty offline view if no cache is available and offline
  if (!riskData && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <WifiOff size={48} style={{ color: '#f59e0b' }} />
          <h2>System Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached risk data is available.</p>
          <button className="btn btn-primary" onClick={handleRefresh}>
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

      <PageHeader title="Risk Intelligence" subtitle="Multi-source threat monitoring · AI-synthesized signals · Real-time analysis"
        badge={<StatusBadge status={crisisLevel} />}
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={() => addToast('Filters not implemented', 'info')}><Filter size={13} /> Filters</button>
          <button className="btn btn-primary btn-sm" onClick={handleRefresh} disabled={riskLoading}>
            {riskLoading && <Loader size={13} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />}
            Run Assessment
          </button>
        </>}
      />

      {/* AI Recommendation Banner */}
      {riskData?.recommendation && (
        <div style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 10, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrendingUp size={18} style={{ color: '#00e5ff' }} />
          <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
            <strong>AI Recommendation:</strong> {riskData.recommendation}
          </span>
        </div>
      )}

      {/* Loading indicator bar */}
      {riskLoading && (
        <div style={{ background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)', color: '#1d8cff', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Loading risk assessment from backend...
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Overall Threat Score', val: `${overallScore}/100`, color: overallScore >= 80 ? '#ef4444' : overallScore >= 60 ? '#f59e0b' : '#22c55e' },
          { label: 'Maritime Risk', val: `${maritime}/100`, color: maritime >= 80 ? '#ef4444' : '#f59e0b' },
          { label: 'Sanctions Exposure', val: `${sanctions}/100`, color: sanctions >= 80 ? '#ef4444' : '#f59e0b' },
          { label: 'OPEC Risk', val: `${opec}/100`, color: opec >= 80 ? '#ef4444' : '#f59e0b' },
          { label: 'Weather Disruption', val: `${weather}/100`, color: '#1d8cff' },
          { label: 'Active Signals', val: String(displaySignals.length), color: '#8b5cf6' },
        ].map(k => (
          <GlassCard key={k.label} hover style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{k.label}</div>
          </GlassCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* News Feed */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Intelligence Feed</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {filters.map(f => (
                <button key={f} className={`btn ${activeFilter === f ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setActiveFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {newsFeed.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No intelligence signals matching active criteria.
              </div>
            ) : (
              newsFeed.filter(n => activeFilter === 'ALL' || n.risk === activeFilter).map((news, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#1d8cff', fontWeight: 700 }}>{news.source}</span>
                      <StatusBadge status={news.risk} size="sm" />
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>{news.headline}</p>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0, marginTop: 2 }}>{news.time}</span>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Radar Chart */}
        <GlassCard style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} style={{ color: '#00e5ff' }} /> Risk Radar Assessment
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 0 }}>Multi-dimensional threat vector heatmap</p>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(0,229,255,0.1)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.3)' }}>
              LIVE RADAR
            </span>
          </div>

          <div style={{ position: 'relative', margin: '0 auto' }}>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} outerRadius="75%">
                <defs>
                  <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.45} />
                    <stop offset="70%" stopColor="#1d8cff" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                  </radialGradient>
                </defs>
                <PolarGrid stroke="rgba(0, 229, 255, 0.2)" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                <Radar name="Threat Vector" dataKey="A" stroke="#00e5ff" strokeWidth={2.5} fill="url(#radarGlow)" fillOpacity={0.85} dot={{ r: 4, fill: '#00e5ff', stroke: '#091527', strokeWidth: 2 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7, borderTop: '1px solid var(--border-soft)', paddingTop: 10 }}>
            {radarData.map(d => {
              const valColor = d.A >= 80 ? '#ef4444' : d.A >= 60 ? '#f59e0b' : '#22c55e';
              return (
                <div key={d.subject} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, fontWeight: 500 }}>{d.subject}</span>
                  <div style={{ width: 90, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${d.A}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, #1d8cff, ${valColor})`, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: valColor, fontWeight: 800, minWidth: 32, textAlign: 'right', fontFamily: 'monospace' }}>{d.A}/100</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Signal Table */}
      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>Active Risk Signals</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{displaySignals.length} active signals{backendOnline ? ' · Live' : ' · Cached'}</span>
        </div>
        <DataTable columns={signalCols} data={displaySignals} onRowClick={row => addToast(`Viewing signal: ${row.signal}`, 'info')} />
      </GlassCard>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
