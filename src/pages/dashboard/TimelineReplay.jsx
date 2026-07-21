import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, SkipBack, SkipForward, Calendar, AlertTriangle, Loader, WifiOff } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { usePipeline } from '../../context/PipelineContext.jsx';
import { triggerDemoStep } from '../../services/api.js';

const defaultCrisisEvents = [
  { id: 'EVT-001', time: '04:30', title: 'Hormuz Tanker Seizure', severity: 'CRITICAL', impact: 'Supply disruption initiated' },
  { id: 'EVT-002', time: '06:00', title: 'NEMC Emergency Session', severity: 'HIGH', impact: 'Crisis protocol activated' },
  { id: 'EVT-003', time: '08:15', title: 'SPR Drawdown Authorized', severity: 'HIGH', impact: '2.1 MT released from Vizag' },
  { id: 'EVT-004', time: '12:00', title: 'Alt. Supply Routes Secured', severity: 'MEDIUM', impact: 'West Africa contracts activated' },
  { id: 'EVT-005', time: '09:00', title: 'Price Stabilization', severity: 'LOW', impact: 'Crude prices returned to baseline' },
];

const defaultTimelineData = [
  { t: '00:00', price: 88, supply: 100, risk: 20 },
  { t: '04:00', price: 88, supply: 100, risk: 22 },
  { t: '04:30', price: 96, supply: 92, risk: 68 },
  { t: '06:00', price: 101, supply: 88, risk: 82 },
  { t: '08:00', price: 98, supply: 91, risk: 74 },
  { t: '12:00', price: 94, supply: 95, risk: 55 },
  { t: '18:00', price: 90, supply: 98, risk: 38 },
  { t: '24:00', price: 89, supply: 99, risk: 25 },
];

const severityColor = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#1d8cff', LOW: '#22c55e' };

export default function TimelineReplay() {
  const { pipelineState, offline, refreshPipeline } = usePipeline();
  const [playing, setPlaying] = useState(false);

  // If no cache and offline, show clean offline state
  if (!pipelineState) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <AlertTriangle size={48} style={{ color: '#f59e0b' }} />
          <h2>System Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached data is available.</p>
          <button className="btn btn-primary" onClick={refreshPipeline}>
            <Loader size={14} style={{ marginRight: 6 }} /> Retry Connection
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const liveEvents = pipelineState.timeline?.events || [];
  const currentStep = pipelineState.timeline?.current_step || 0;

  // Process live events into chart format
  const chartData = liveEvents.length > 0
    ? liveEvents.map(e => ({
        t: e.time,
        risk: e.risk,
        price: 88 + (e.risk > 40 ? (e.risk - 40) * 0.4 : 0),
        supply: 100 - (e.risk > 40 ? (e.risk - 40) * 0.3 : 0),
        step: e.step,
      }))
    : defaultTimelineData;

  const displayEvents = liveEvents.length > 0
    ? liveEvents.map(e => ({
        id: `EVT-${e.step}`,
        time: e.time,
        title: e.event,
        severity: e.type || 'INFO',
        impact: `Risk level: ${e.risk}%`,
        step: e.step,
      }))
    : defaultCrisisEvents;

  // Sync state step when position changes in playback
  const handleStepSelect = async (stepIndex) => {
    try {
      await triggerDemoStep(stepIndex);
      await refreshPipeline();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    const nextStep = Math.min(currentStep + 1, chartData.length - 1);
    handleStepSelect(nextStep);
  };

  const handlePrev = () => {
    const prevStep = Math.max(currentStep - 1, 0);
    handleStepSelect(prevStep);
  };

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

      <PageHeader title="Timeline Replay" subtitle="Replay historical energy crisis events with AI-annotated decision playback"
        badge={{ label: !offline ? 'LIVE SYNC' : 'DEMO MODE', color: !offline ? '#22c55e' : '#8b5cf6' }}
      />

      {/* Main Timeline Chart */}
      <GlassCard className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {pipelineState.active_scenario?.name || 'Baseline Operations'} – Timeline
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 3, background: '#ef4444', display: 'inline-block', borderRadius: 2 }} />Risk Index</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 3, background: '#1d8cff', display: 'inline-block', borderRadius: 2 }} />Crude Price</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 3, background: '#22c55e', display: 'inline-block', borderRadius: 2 }} />Supply Level</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
              <linearGradient id="gPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1d8cff" stopOpacity={0.2} /><stop offset="95%" stopColor="#1d8cff" stopOpacity={0} /></linearGradient>
              <linearGradient id="gSupply" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="t" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-soft)', borderRadius: 8, fontSize: 11 }} />
            {chartData[currentStep] && (
              <ReferenceLine x={chartData[currentStep].t} stroke="#8b5cf6" strokeWidth={2} label={{ value: 'Current Step', position: 'top', fill: '#8b5cf6', fontSize: 9 }} />
            )}
            <Area type="monotone" dataKey="risk" stroke="#ef4444" fill="url(#gRisk)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="price" stroke="#1d8cff" fill="url(#gPrice)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="supply" stroke="#22c55e" fill="url(#gSupply)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: '10px 0', borderTop: '1px solid var(--border-soft)' }}>
          <button onClick={() => handleStepSelect(0)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)' }}><SkipBack size={14} /></button>
          <button onClick={handlePrev} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)' }}>Prev</button>
          <button onClick={() => setPlaying(!playing)} disabled style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '8px 16px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
            {playing ? <><Pause size={14} />Pause</> : <><Play size={14} />Play</>}
          </button>
          <button onClick={handleNext} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)' }}>Next</button>
          <button onClick={() => handleStepSelect(chartData.length - 1)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)' }}><SkipForward size={14} /></button>
          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <div style={{ width: `${(currentStep / Math.max(chartData.length - 1, 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #1d8cff)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace', flexShrink: 0 }}>
            Step {currentStep + 1} / {chartData.length}
          </span>
        </div>
      </GlassCard>

      {/* Event Timeline */}
      <GlassCard className="card" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={14} color="#8b5cf6" />Crisis Event Log
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #8b5cf6, rgba(139,92,246,0.1))' }} />
          {displayEvents.map((event, i) => {
            const isCurrent = event.step === currentStep;
            return (
              <div key={event.id || i}
                onClick={() => handleStepSelect(event.step)}
                style={{
                  display: 'flex', gap: 14, marginBottom: 16, position: 'relative', cursor: 'pointer',
                  opacity: isCurrent ? 1 : 0.6,
                  transform: isCurrent ? 'scale(1.01)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${severityColor[event.severity] || '#94a3b8'}18`, border: `2px solid ${isCurrent ? '#8b5cf6' : `${severityColor[event.severity] || '#94a3b8'}40`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                  <AlertTriangle size={14} color={severityColor[event.severity] || '#94a3b8'} />
                </div>
                <div style={{ flex: 1, background: isCurrent ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', border: `1px solid ${isCurrent ? '#8b5cf650' : 'rgba(255,255,255,0.06)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{event.title}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${severityColor[event.severity] || '#94a3b8'}18`, color: severityColor[event.severity] || '#94a3b8', fontWeight: 700 }}>{event.severity}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-dim)' }}>
                    <span><Clock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />{event.time}</span>
                    <span>{event.impact}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
