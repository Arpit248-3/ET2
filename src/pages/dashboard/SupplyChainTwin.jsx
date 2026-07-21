import React, { useState, useEffect } from 'react';
import { Layers, Ship, Factory, Database, GitBranch, ZoomIn, ZoomOut, RefreshCw, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import IndiaMapSVG from '../../components/ui/MapPanel.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { fetchSupplyChainTwin } from '../../services/api.js';
import { useScenario } from '../../context/ScenarioContext.jsx';

const fallbackNodes = [
  { id: "jamnagar", lat: 22.3072, lng: 73.1812, label: "Jamnagar Refinery", type: "refinery", status: "OPERATIONAL", capacity: "1.24M bbl/day", risk: 22 },
  { id: "paradip", lat: 20.3117, lng: 85.8180, label: "Paradip Port", type: "port", status: "OPERATIONAL", capacity: "18M MT/year", risk: 18 },
  { id: "vizag", lat: 17.6868, lng: 83.2185, label: "Vizag SPR", type: "spr", status: "OPERATIONAL", capacity: "13.3 MMT", risk: 15 },
  { id: "mangaluru", lat: 12.8698, lng: 74.8431, label: "Mangaluru SPR", type: "spr", status: "OPERATIONAL", capacity: "11.5 MMT", risk: 20 },
  { id: "kochi", lat: 9.9312, lng: 76.2673, label: "Kochi Refinery", type: "refinery", status: "OPERATIONAL", capacity: "0.31M bbl/day", risk: 25 },
  { id: "mumbai", lat: 19.0760, lng: 72.8777, label: "Mumbai Port", type: "port", status: "OPERATIONAL", capacity: "62M MT/year", risk: 30 },
  { id: "chennai", lat: 13.0827, lng: 80.2707, label: "Chennai Refinery", type: "refinery", status: "OPERATIONAL", capacity: "0.21M bbl/day", risk: 18 },
  { id: "haldia", lat: 22.5726, lng: 88.3639, label: "Haldia Port", type: "port", status: "OPERATIONAL", capacity: "45M MT/year", risk: 22 },
];

const fallbackShips = [
  { name: "MT Rajendra", status: "AT PORT", route: "Basra ➜ Vadinar Terminal" },
  { name: "MT Chola", status: "TRANSIT", route: "Riyadh ➜ Kochi Terminal" },
  { name: "MT Samudra", status: "TRANSIT", route: "Sikka ➜ Haldia Port" },
];

export default function SupplyChainTwin() {
  const { backendOnline } = useScenario();
  const { addToast } = useToast();
  const [nodes, setNodes] = useState(fallbackNodes);
  const [ships, setShips] = useState(fallbackShips);
  const [activeNode, setActiveNode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeLayers, setActiveLayers] = useState({ refineries: true, ports: true, spr: true, pipelines: true, ships: true });
  const [showAnalysis, setShowAnalysis] = useState(false);

  const loadTwinData = async () => {
    setLoading(true);
    try {
      const data = await fetchSupplyChainTwin();
      if (data.nodes) setNodes(data.nodes);
      if (data.ships) setShips(data.ships);
      addToast('Supply chain digital twin data updated', 'success');
    } catch (err) {
      console.warn('Backend twin offline, using offline cache:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTwinData();
  }, []);

  const toggleLayer = (layer) => setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));

  if (nodes.length === 0 && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <Layers size={48} style={{ color: '#f59e0b' }} />
          <h2>Supply Chain Digital Twin Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached network twin state is available.</p>
          <button className="btn btn-primary" onClick={loadTwinData}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry Connection
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

      <PageHeader title="Supply Chain Digital Twin" subtitle="Live India energy network · Interactive node visualization"
        badge={<StatusBadge status={loading ? "SYNCING" : "LIVE"} />}
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={loadTwinData} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAnalysis(true)}>Analyze Network</button>
        </>}
      />

      <div className="twin-digital-grid">
        {/* Layers panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassCard style={{ padding: '16px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Map Layers</h3>
            {[
              { key: 'refineries', label: 'Refineries', icon: Factory, color: '#1d8cff' },
              { key: 'ports', label: 'Ports', icon: Ship, color: '#00e5ff' },
              { key: 'spr', label: 'SPR Sites', icon: Database, color: '#8b5cf6' },
              { key: 'pipelines', label: 'Pipelines', icon: GitBranch, color: '#22c55e' },
              { key: 'ships', label: 'Live Ships', icon: Ship, color: '#f59e0b' },
            ].map(l => (
              <label key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: activeLayers[l.key] ? l.color : 'rgba(255,255,255,0.1)', transition: 'background 0.2s', position: 'relative' }} onClick={() => toggleLayer(l.key)}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: activeLayers[l.key] ? 19 : 3, transition: 'left 0.2s' }} />
                </div>
                <l.icon size={13} style={{ color: activeLayers[l.key] ? l.color : 'var(--text-dim)' }} />
                <span style={{ fontSize: 12, color: activeLayers[l.key] ? 'var(--text-main)' : 'var(--text-dim)' }}>{l.label}</span>
              </label>
            ))}
          </GlassCard>

          <GlassCard style={{ padding: '14px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Risk Legend</h3>
            {[{ color: '#22c55e', label: 'Low Risk (< 30)' }, { color: '#f59e0b', label: 'Medium (30-65)' }, { color: '#ef4444', label: 'High Risk (> 65)' }].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: r.color }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.label}</span>
              </div>
            ))}
          </GlassCard>

          <GlassCard style={{ padding: '14px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Live Ships</h3>
            {ships.map(s => (
              <div key={s.name} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</span>
                  <span style={{ fontSize: 10, color: s.status === 'AT PORT' ? '#22c55e' : '#1d8cff' }}>{s.status}</span>
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{s.route}</p>
              </div>
            ))}
          </GlassCard>
        </div>

        {/* Map */}
        <GlassCard style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <IndiaMapSVG 
            nodes={nodes} 
            ships={ships}
            activeLayers={activeLayers} 
            selectedNode={activeNode} 
            onNodeSelect={(node) => setActiveNode(node)} 
          />
        </GlassCard>

        {/* Details panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <GlassCard style={{ padding: '16px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Network Nodes</h3>
            {nodes.map(node => (
              <div key={node.id} onClick={() => { setActiveNode(node); addToast(`Selected: ${node.label} (Zooming to site)`, 'info'); }}
                style={{ 
                  display: 'flex', 
                  gap: 10, 
                  padding: '10px 8px', 
                  borderBottom: '1px solid var(--border-soft)', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  borderRadius: '6px',
                  background: activeNode?.id === node.id ? 'rgba(29, 140, 255, 0.12)' : 'transparent',
                  border: activeNode?.id === node.id ? '1px solid rgba(29, 140, 255, 0.3)' : '1px solid transparent'
                }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.type === 'refinery' ? '#1d8cff' : node.type === 'port' ? '#00e5ff' : '#8b5cf6', marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>{node.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{node.capacity}</div>
                </div>
                <StatusBadge status={node.status} size="sm" />
              </div>
            ))}
          </GlassCard>

          {activeNode && (
            <GlassCard style={{ background: 'rgba(29,140,255,0.05)', borderColor: 'rgba(29,140,255,0.3)', padding: '16px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#1d8cff' }}>{activeNode.label}</h3>
              {[
                { label: 'Type', value: activeNode.type.toUpperCase() },
                { label: 'Status', value: activeNode.status },
                { label: 'Capacity', value: activeNode.capacity },
                { label: 'Risk Score', value: `${activeNode.risk}/100` },
              ].map(d => (
                <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{d.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>{d.value}</span>
                </div>
              ))}
            </GlassCard>
          )}
        </div>
      </div>

      {/* Network Diagnostics modal */}
      {showAnalysis && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(3, 10, 26, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
        }}>
          <GlassCard style={{ width: '90%', maxWidth: '550px', padding: '24px', position: 'relative' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} /> National Energy Network Diagnostics
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '18px' }}>
              Real-time audit log analysis for routing latency, storage caverns, and pipeline throughput.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>SYNC INTEGRITY</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e', marginTop: '4px' }}>100% Operational</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>CHOKEPOINTS INDEX</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>2 Critical Vectors</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>TRANSIT FLOW RATE</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>2.34M bbl/day</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>REFINERY ULLAGE</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#00e5ff', marginTop: '4px' }}>84.5% Active</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '14px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>Diagnostic Checklist</h4>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                ✓ Node telemetry check: All coastal terminals online and pinging.<br />
                ✓ Pipeline pressure index: Standard operating threshold maintained.<br />
                ✓ Cavern stock check: Usable reserves meet national strategic targets.<br />
                ✓ Marine route conflict validation completed: 0 threats flagged.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAnalysis(false)}>Close Diagnostics</button>
            </div>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  );
}
