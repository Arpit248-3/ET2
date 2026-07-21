import React, { useState, useEffect } from 'react';
import { Brain, GitBranch, BarChart2, ChevronRight, Info, Eye, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { fetchExplainability } from '../../services/api.js';
import { useScenario } from '../../context/ScenarioContext.jsx';

const decisionsList = [
  { id: 'DEC-001', key: 'west_africa', title: 'Procurement Source Switch to West Africa', confidence: 92, model: 'SupplyOptimizer', timestamp: 'Just now', verdict: 'RECOMMENDED' },
  { id: 'DEC-002', key: 'spr_drawdown', title: 'SPR Drawdown Recommendation', confidence: 87, model: 'RiskNet-v4', timestamp: '2 hours ago', verdict: 'ACTIVATE' },
  { id: 'DEC-003', key: 'refinery_load', title: 'Refinery Load Reduction Alert', confidence: 74, model: 'OperationsAI', timestamp: '1 day ago', verdict: 'CONSIDER' },
  { id: 'DEC-004', key: 'currency_hedge', title: 'Currency Hedge Trigger', confidence: 68, model: 'FinanceAI', timestamp: '2 days ago', verdict: 'MONITOR' },
];

export default function ExplainableAI() {
  const { backendOnline } = useScenario();
  const [selectedMeta, setSelectedMeta] = useState(decisionsList[0]);
  const [explainData, setExplainData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadExplanation = async (decisionKey) => {
    setLoading(true);
    try {
      const data = await fetchExplainability(decisionKey);
      setExplainData(data);
    } catch (err) {
      console.warn('Explainability API offline, using cached client logic:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExplanation(selectedMeta.key);
  }, [selectedMeta]);

  // Derived attributes from database/API
  const featureImportance = (explainData?.factor_contributions || [
    { factor: 'Tanker AIS Data', weight: 94 },
    { factor: 'Geopolitical Index', weight: 87 },
    { factor: 'Crude Price Delta', weight: 82 },
  ]).map((f, idx) => ({
    feature: f.factor,
    weight: f.weight,
    color: ['#1d8cff', '#8b5cf6', '#f59e0b', '#22c55e'][idx % 4]
  }));

  const decisionTree = explainData?.reason_graph?.nodes?.map((node, i) => ({
    level: i,
    label: node.label,
    result: i === explainData.reason_graph.nodes.length - 1 ? explainData.answer.split('.')[0] : null,
    children: i < explainData.reason_graph.nodes.length - 1 ? [`YES → Next Node`, `NO → Re-evaluate`] : []
  })) || [
    { level: 0, label: 'Disruption Probability > 70%?', result: null, children: ['YES → Evaluate alt.', 'NO → Monitor'] },
  ];

  if (!explainData && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <Brain size={48} style={{ color: '#f59e0b' }} />
          <h2>Explainable AI Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached explainability ledger is available.</p>
          <button className="btn btn-primary" onClick={() => loadExplanation(selectedMeta.key)}>
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

      <PageHeader title="Explainable AI" subtitle="Understand AI decision logic, model confidence, and feature attribution"
        badge={{ label: 'XAI ENABLED', color: '#8b5cf6' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Decision List */}
        <GlassCard className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-soft)', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            AI Decisions {loading && <RefreshCw size={12} className="animate-spin" style={{ display: 'inline-block', marginLeft: 6 }} />}
          </div>
          {decisionsList.map(dec => (
            <div key={dec.id} onClick={() => setSelectedMeta(dec)}
              style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: selectedMeta.id === dec.id ? 'rgba(139,92,246,0.1)' : 'transparent', borderLeft: selectedMeta.id === dec.id ? '3px solid #8b5cf6' : '3px solid transparent', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8b5cf6' }}>{dec.id}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: dec.confidence >= 85 ? '#22c55e' : dec.confidence >= 70 ? '#f59e0b' : '#ef4444' }}>{dec.confidence}%</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>{dec.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{dec.model} · {dec.timestamp}</div>
            </div>
          ))}
        </GlassCard>

        {/* Explanation Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {explainData && (
            <>
              {/* Decision Summary */}
              <GlassCard className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Brain size={16} color="#8b5cf6" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>AI DECISION EXPLANATION</span>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedMeta.title}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: selectedMeta.confidence >= 85 ? '#22c55e' : selectedMeta.confidence >= 70 ? '#f59e0b' : '#ef4444' }}>{Math.round(explainData.confidence * 100)}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Model Confidence</div>
                  </div>
                </div>
                
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14, background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #8b5cf6' }}>
                  <strong>Recommendation Summary:</strong> {explainData.answer}
                </p>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedMeta.model}</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verdict</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{selectedMeta.verdict}</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evidence Data</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{explainData.evidence}</div>
                  </div>
                </div>
              </GlassCard>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {/* Feature Importance */}
                <GlassCard className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChart2 size={14} color="#1d8cff" />Feature Importance (SHAP)
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={featureImportance} layout="vertical" margin={{ top: 0, right: 10, left: 90, bottom: 0 }}>
                      <XAxis type="number" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <YAxis dataKey="feature" type="category" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} axisLine={false} tickLine={false} width={88} />
                      <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-soft)', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                        {featureImportance.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </GlassCard>

                {/* Decision Tree */}
                <GlassCard className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GitBranch size={14} color="#8b5cf6" />Decision Logic Tree
                  </div>
                  {decisionTree.map((node, i) => (
                    <div key={i} style={{ marginLeft: node.level * 16, marginBottom: 12 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 12px', marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: node.result ? 4 : 0 }}>
                          <Eye size={11} color="#8b5cf6" style={{ marginRight: 6, verticalAlign: 'middle' }} />
                          {node.label}
                        </div>
                      </div>
                      {node.children.map((child, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16, marginBottom: 2 }}>
                          <ChevronRight size={11} color="var(--text-dim)" />
                          <span style={{ fontSize: 10, color: child.includes('YES') ? '#22c55e' : 'var(--text-dim)' }}>{child}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#22c55e' }}>
                      <Zap size={13} />RECOMMENDED OUTCOME APPLIED
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Alternatives analysis */}
              {explainData.alternatives && explainData.alternatives.length > 0 && (
                <GlassCard className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Info size={14} color="#00e5ff" />Route Alternatives Evaluation Matrix
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-soft)', color: 'var(--text-dim)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 0' }}>Supply Scenario Route</th>
                          <th>Cost Score</th>
                          <th>Safety Index</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {explainData.alternatives.map((alt, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: alt.selected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: alt.selected ? 700 : 400 }}>
                            <td style={{ padding: '10px 0' }}>{alt.option}</td>
                            <td>{alt.cost_cr} pts</td>
                            <td style={{ color: alt.safety === 'HIGH' ? '#22c55e' : alt.safety === 'MEDIUM' ? '#f59e0b' : '#ef4444' }}>{alt.safety}</td>
                            <td>
                              {alt.selected ? (
                                <span style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>ACTIVE RECOMMENDATION</span>
                              ) : (
                                <span style={{ color: 'var(--text-dim)' }}>EVALUATED</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
