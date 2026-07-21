import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, CheckCircle, AlertTriangle, Bot, ArrowRight, RefreshCw, Info, Zap, Droplets, Thermometer, Activity } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import RiskGauge from '../../components/ui/RiskGauge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { fetchRefineryCompatibility, recordDecision } from '../../services/api.js';
import { useScenario } from '../../context/ScenarioContext.jsx';

/* ── Compatibility colour helper ─────────────────────────── */
const getStatusColor = s =>
  s === 'COMPATIBLE' ? '#22c55e' : s === 'PARTIAL' ? '#f59e0b' : '#ef4444';

const getStatusRgb = s =>
  s === 'COMPATIBLE' ? '34,197,94' : s === 'PARTIAL' ? '245,158,11' : '239,68,68';

/* ── Inline hover-tooltip ────────────────────────────────── */
function ChemProp({ icon: Icon, label, value, unit, desc, color = '#00e5ff' }) {
  const [show, setShow] = useState(false);
  return (
    <div
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ position: 'relative', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-soft)', cursor: 'default', transition: 'border-color 0.2s', borderColor: show ? `${color}55` : undefined }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {Icon && <Icon size={13} style={{ color }} />}
        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <Info size={9} style={{ color: '#475569' }} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color }}>
        {value}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-dim)', marginLeft: 3 }}>{unit}</span>
      </div>
      {show && desc && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60, minWidth: 220, maxWidth: 270,
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

export default function RefineryCompatibility() {
  const { activeScenario, backendOnline, refreshState } = useScenario();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [crudeOptions, setCrudeOptions]     = useState([]);
  const [selectedCrude, setSelectedCrude]   = useState('');
  const [refineries, setRefineries]         = useState([]);
  const [selectedRefinery, setSelectedRefinery] = useState(null);
  const [blendingAdvice, setBlendingAdvice] = useState('');
  const [chemMatrix, setChemMatrix]         = useState(null);
  const [loading, setLoading]               = useState(false);
  const [advisoryApplied, setAdvisoryApplied] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const load = async (crude) => {
    setLoading(true);
    try {
      const data = await fetchRefineryCompatibility(crude);
      if (data?.crude_options) {
        setCrudeOptions(data.crude_options);
        if (!selectedCrude && data.crude_options.length > 0 && !crude) {
          setSelectedCrude(data.crude_options[0]);
        }
      }
      if (data?.refineries) {
        setRefineries(data.refineries);
        setSelectedRefinery(prev => {
          const match = data.refineries.find(r => prev && r.name === prev.name);
          return match || data.refineries[0];
        });
      }
      if (data?.blending_advice) setBlendingAdvice(data.blending_advice);
      if (data?.compatibility_matrix) setChemMatrix(data.compatibility_matrix);
    } catch (err) {
      console.warn('Refinery API offline:', err);
      addToast('Refinery compatibility data unavailable', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(selectedCrude); }, [selectedCrude]);

  /* Send to Procurement — shares state via localStorage */
  const handleSendToProcurement = () => {
    if (selectedCrude) {
      localStorage.setItem('urja_preferred_crude', selectedCrude);
    }
    addToast(`${selectedCrude || 'Crude'} compatibility data sent to Procurement Optimizer`, 'success');
    refreshState();
    navigate('/procurement-optimizer');
  };

  /* Approve Match */
  const handleApproveMatch = async () => {
    try {
      if (backendOnline) {
        await recordDecision({
          action_type: 'APPROVE_REFINERY_MATCH',
          approved_by: 'Commander Arjun Mehta',
          scenario_id: activeScenario?.id || 'baseline',
          details: {
            crude_type: selectedCrude,
            refinery: selectedRefinery?.name,
            compatibility: selectedRefinery?.compatibility,
            advisory: blendingAdvice
          }
        });
      }
      await refreshState();
      addToast(`Refinery compatibility match approved for ${selectedCrude}`, 'success');
    } catch {
      addToast('Failed to record compatibility match approval', 'error');
    }
  };

  /* Apply Advisory */
  const handleApplyAdvisory = () => {
    setAdvisoryApplied(true);
    addToast('Blend advisory applied — procurement parameters updated', 'success');
    refreshState();
    setTimeout(() => setAdvisoryApplied(false), 4000);
  };

  /* Show Alternatives — switch to next crude type */
  const handleAlternatives = () => {
    setShowAlternatives(true);
    if (crudeOptions.length > 1) {
      const idx = crudeOptions.indexOf(selectedCrude);
      const next = crudeOptions[(idx + 1) % crudeOptions.length];
      setSelectedCrude(next);
      addToast(`Switched to alternative: ${next}`, 'info');
    }
    setTimeout(() => setShowAlternatives(false), 2000);
  };

  /* Chemistry labels */
  const chemProps = chemMatrix ? [
    { icon: Activity,    label: 'API Gravity',     value: chemMatrix.gravity_api,  unit: '°API',   color: '#1d8cff',  desc: 'Higher API = lighter crude. Light (>31°) yields more petrol/diesel. Heavy (<20°) needs coker processing.' },
    { icon: Droplets,    label: 'Sulfur Content',  value: chemMatrix.sulfur_pct,   unit: '%wt',    color: '#f59e0b',  desc: 'Low sulfur (<0.5%) = sweet crude, easier to process. High sulfur = sour crude, requires hydrotreater or coker.' },
    { icon: Thermometer, label: 'TAN (Acidity)',   value: chemMatrix.tan_mg_koh,   unit: 'mg KOH/g', color: '#ef4444',desc: 'Total Acid Number measures corrosive acidity. Values >0.30 can corrode refinery columns without metallurgy upgrades.' },
    { icon: Zap,         label: 'Viscosity',       value: chemMatrix.viscosity_cst, unit: 'cSt',   color: '#22c55e',  desc: 'Higher viscosity crudes are harder to pump and process. Ultra-viscous grades require diluent or heat tracing.' },
  ] : [];

  const avgScore = refineries.length > 0
    ? Math.round(refineries.reduce((s, r) => s + r.compatibility, 0) / refineries.length)
    : 0;

  if (crudeOptions.length === 0 && !backendOnline) return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
        <Factory size={48} style={{ color: '#f59e0b' }} />
        <h2>Refinery Compatibility Offline</h2>
        <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra backend.</p>
        <button className="btn btn-primary" onClick={() => load(selectedCrude)}>
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry Connection
        </button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {!backendOnline && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} /><span>Showing last known intelligence state (Offline)</span>
        </div>
      )}

      <PageHeader
        title="Refinery Compatibility"
        subtitle="Crude chemistry analysis · India refinery fit matrix · AI blend advisory"
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={handleSendToProcurement}>
            <ArrowRight size={13} /> Send to Procurement
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleApproveMatch}>
            <CheckCircle size={13} /> Approve Match
          </button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) 1fr minmax(260px, 320px)', gap: 14, marginBottom: 16, alignItems: 'start' }}>

        {/* ── Column 1: Crude Selector ── */}
        <GlassCard>
          <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }}>
            Select Crude {loading && <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite', color: '#1d8cff' }} />}
          </h3>
          {crudeOptions.map(c => (
            <div key={c} onClick={() => setSelectedCrude(c)} style={{
              padding: '9px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
              border: `1px solid ${selectedCrude === c ? 'rgba(29,140,255,0.4)' : 'var(--border-soft)'}`,
              background: selectedCrude === c ? 'rgba(29,140,255,0.1)' : 'rgba(255,255,255,0.02)',
              fontSize: 12.5, color: selectedCrude === c ? '#1d8cff' : 'var(--text-main)',
              fontWeight: selectedCrude === c ? 600 : 400, transition: 'all 0.18s',
            }}>
              {c}
            </div>
          ))}

          {/* Chemistry matrix below selector */}
          {chemProps.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                {chemMatrix?.classification} · {chemMatrix?.origin}
              </div>
              {chemProps.map(p => (
                <ChemProp key={p.label} icon={p.icon} label={p.label} value={p.value} unit={p.unit} color={p.color} desc={p.desc} />
              ))}
            </div>
          )}
        </GlassCard>

        {/* ── Column 2: Refinery Compatibility Map ── */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>India Refinery Compatibility Map</h3>
              <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Crude: <span style={{ color: '#1d8cff', fontWeight: 600 }}>{selectedCrude}</span>
                {avgScore > 0 && <span style={{ marginLeft: 10, color: avgScore >= 70 ? '#22c55e' : '#f59e0b' }}>Fleet avg: {avgScore}%</span>}
              </p>
            </div>
            {loading && <RefreshCw size={14} style={{ color: '#1d8cff', animation: 'spin 1s linear infinite' }} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {refineries.map(ref => {
              const isSelected = selectedRefinery?.name === ref.name;
              const rgb = getStatusRgb(ref.status);
              return (
                <div
                  key={ref.name}
                  onClick={() => { setSelectedRefinery(ref); addToast(`Selected: ${ref.name}`, 'info'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 10,
                    border: `1px solid rgba(${rgb},0.3)`,
                    background: `rgba(${rgb},0.05)`,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isSelected ? `0 0 0 2px rgba(${rgb},0.6)` : 'none',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `rgba(${rgb},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Factory size={18} style={{ color: getStatusColor(ref.status) }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>{ref.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ref.location} · {ref.capacity}
                      {ref.coker && <span style={{ marginLeft: 8, color: '#60b4ff' }}>⚙ Coker</span>}
                      {ref.hydrotreater && <span style={{ marginLeft: 4, color: '#a78bfa' }}>⚗ HDT</span>}
                    </div>
                  </div>
                  {/* Compatibility bar */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: getStatusColor(ref.status) }}>{ref.compatibility}%</div>
                    <StatusBadge status={ref.status} size="sm" />
                    <div style={{ marginTop: 4, width: 80, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${ref.compatibility}%`, height: '100%', background: getStatusColor(ref.status), borderRadius: 2, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { color: '#22c55e', label: 'Compatible (≥80%)' },
              { color: '#f59e0b', label: 'Partial Fit (50–79%)' },
              { color: '#ef4444', label: 'Incompatible (<50%)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* ── Column 3: Score Gauge + Advisory ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {selectedRefinery && (
            <GlassCard>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                {selectedRefinery.name.split('(')[0].trim()}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <RiskGauge value={selectedRefinery.compatibility} size={130} label="Compatibility" />
              </div>
              <div style={{ marginBottom: 10, textAlign: 'center' }}>
                <StatusBadge status={selectedRefinery.status} />
              </div>
              {selectedRefinery.notes && (
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--border-soft)' }}>
                  <Info size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#475569' }} />
                  {selectedRefinery.notes}
                </p>
              )}
            </GlassCard>
          )}

          {/* AI Blend Advisory */}
          <GlassCard style={{ background: 'rgba(29,140,255,0.05)', borderColor: 'rgba(29,140,255,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Bot size={15} style={{ color: '#00e5ff' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#00e5ff' }}>AI Blend Advisory</span>
              {advisoryApplied && (
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', fontWeight: 600 }}>✓ APPLIED</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.6, marginBottom: 12 }}>
              {blendingAdvice || 'Loading blend advisory…'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleApplyAdvisory}
                disabled={!blendingAdvice || advisoryApplied}
                style={{ opacity: advisoryApplied ? 0.7 : 1 }}
              >
                <CheckCircle size={12} /> {advisoryApplied ? 'Applied' : 'Apply Advisory'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleAlternatives}
                disabled={showAlternatives || crudeOptions.length <= 1}
              >
                {showAlternatives ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={12} />}
                Alternatives
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
