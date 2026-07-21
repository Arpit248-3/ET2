import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Eye, Search, Filter, FileText, BarChart2, AlertTriangle, RefreshCw, X, Shield, Printer } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { fetchReports, generateReport } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';

const typeIcons = { Intelligence: FileText, Economic: BarChart2, 'Supply Chain': AlertTriangle, Compliance: FileText, Operations: BarChart2, Procurement: FileText, Strategic: AlertTriangle, 'Red Team': AlertTriangle };
const typeColors = { Intelligence: '#8b5cf6', Economic: '#1d8cff', 'Supply Chain': '#f59e0b', Compliance: '#22c55e', Operations: '#00e5ff', Procurement: '#f97316', Strategic: '#ef4444', 'Red Team': '#ef4444' };

export default function ReportsLibrary() {
  const { backendOnline, activeScenario } = useScenario();
  const { addToast } = useToast();
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [activeReport, setActiveReport] = useState(null);
  const types = ['All', 'Intelligence', 'Economic', 'Supply Chain', 'Compliance', 'Operations', 'Procurement', 'Strategic', 'Red Team'];

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchReports();
      if (data && Array.isArray(data)) {
        const mapped = data.map(r => ({
          id: r.id,
          title: r.title,
          type: r.title.includes('Compliance') ? 'Compliance' : r.title.includes('Economic') ? 'Economic' : 'Intelligence',
          date: r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now',
          author: r.generated_by || 'Commander Arjun Mehta',
          pages: 14,
          status: r.status || 'FINAL',
          priority: r.title.includes('Crisis') || r.title.includes('Security') ? 'CRITICAL' : 'MEDIUM',
          summary: r.summary || `Executive resilience brief detailing national energy supply chain exposure, crude flow diversions, and SPR buffer requirements under scenario ${activeScenario?.name || 'Strait of Hormuz Disruption'}.`,
        }));
        setReportsList(mapped);
      }
    } catch (err) {
      console.warn('Reports API offline, using cached fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      addToast('Generating new report...', 'info');
      const newRep = await generateReport();
      addToast('Report generated successfully!', 'success');
      loadReports();
    } catch (err) {
      addToast('Failed to generate report on backend', 'error');
    }
  };

  const handleDownloadPDF = (report) => {
    try {
      const content = `
<!DOCTYPE html>
<html>
<head>
  <title>${report.title} — National Energy Resilience Report</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #0f172a; line-height: 1.6; }
    .header { border-bottom: 3px solid #1d8cff; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 24px; font-weight: bold; color: #0f172a; }
    .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 13px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; color: white; background: #1d8cff; }
    .badge-critical { background: #ef4444; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: bold; color: #1d8cff; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">NATIONAL ENERGY MANAGEMENT CENTRE</div>
      <div class="subtitle">Government of India · Cabinet Secretariat Intelligence Command</div>
    </div>
    <div style="text-align: right;">
      <span class="badge ${report.priority === 'CRITICAL' ? 'badge-critical' : ''}">${report.priority} SECURITY BRIEF</span>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ID: ${report.id}</div>
    </div>
  </div>

  <div class="meta-box">
    <div><strong>Report Title:</strong> ${report.title}</div>
    <div><strong>Author:</strong> ${report.author}</div>
    <div><strong>Generated Date:</strong> ${report.date}</div>
    <div><strong>Classification:</strong> OFFICIAL / RESTRICTED</div>
    <div><strong>Category:</strong> ${report.type}</div>
    <div><strong>Status:</strong> ${report.status}</div>
  </div>

  <div class="section">
    <div class="section-title">1. Executive Summary</div>
    <p>${report.summary}</p>
    <p>This strategic intelligence brief evaluates domestic energy vulnerability vectors, maritime passage delays, crude landed costs, and Strategic Petroleum Reserve (SPR) drawdown trajectories under active geopolitical constraints.</p>
  </div>

  <div class="section">
    <div class="section-title">2. Key Operational Metrics</div>
    <table>
      <thead>
        <tr>
          <th>Metric Indicator</th>
          <th>Baseline Value</th>
          <th>Disrupted Value</th>
          <th>Risk Rating</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Strait of Hormuz Transit Delay</td>
          <td>0%</td>
          <td>+18% Transit ETA</td>
          <td><span style="color: #ef4444; font-weight: bold;">CRITICAL</span></td>
        </tr>
        <tr>
          <td>Brent Crude Landed Surcharge</td>
          <td>$88.00 / bbl</td>
          <td>$96.40 / bbl (+10.5%)</td>
          <td><span style="color: #f59e0b; font-weight: bold;">HIGH</span></td>
        </tr>
        <tr>
          <td>SPR Reserve Buffer Coverage</td>
          <td>39.0 MMT (100%)</td>
          <td>15.1 MMT (41.0%)</td>
          <td><span style="color: #22c55e; font-weight: bold;">FEASIBLE</span></td>
        </tr>
        <tr>
          <td>Monthly Fiscal Subsidy Drag</td>
          <td>₹0 Cr</td>
          <td>₹28,000 Cr</td>
          <td><span style="color: #ef4444; font-weight: bold;">HIGH</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">3. Recommended Executive Directives</div>
    <ul>
      <li><strong>Procurement Re-allocation:</strong> Execute primary supply contract shifts toward West Africa (Bonny Light) via the Cape of Good Hope corridor.</li>
      <li><strong>Strategic Petroleum Reserve Release:</strong> Authorize staged drawdown of 8.5 MMT from Visakhapatnam and Mangaluru SPR facilities over 22 days.</li>
      <li><strong>Compliance Clearance:</strong> Enforce OFAC SDN exclusions for shadow fleet tankers while securing emergency GIC Re war risk indemnity cover.</li>
    </ul>
  </div>

  <div class="footer">
    CONFIDENTIAL DOCUMENT — FOR INTERNAL NEMC EXECUTIVE USE ONLY · GENERATED BY URJANETRA AI PLATFORM V1.0
  </div>
</body>
</html>
      `;

      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UrjaNetra_Report_${report.id.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast(`Downloaded structured report: ${report.title}`, 'success');
    } catch (err) {
      addToast('Failed to download report PDF', 'error');
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filtered = reportsList
    .filter(r => filter === 'All' || r.type === filter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()));

  if (reportsList.length === 0 && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <BookOpen size={48} style={{ color: '#f59e0b' }} />
          <h2>Reports Library Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached reports are available.</p>
          <button className="btn btn-primary" onClick={loadReports}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry Connection
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="Reports Library" subtitle="AI-generated intelligence reports, audits, and strategic analyses"
        badge={{ label: `${reportsList.length} REPORTS`, color: '#1d8cff' }}
        actions={
          <button className="btn btn-primary" onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <FileText size={13} />Generate Report
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Reports', value: reportsList.length, color: '#1d8cff' },
          { label: 'This Month', value: reportsList.length, color: '#22c55e' },
          { label: 'Critical', value: reportsList.filter(r => r.priority === 'CRITICAL').length, color: '#ef4444' },
          { label: 'Under Review', value: reportsList.filter(r => r.status === 'REVIEW').length, color: '#f59e0b' },
        ].map(stat => (
          <GlassCard key={stat.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </GlassCard>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 12px 8px 32px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Filter size={13} style={{ color: 'var(--text-dim)', marginTop: 6 }} />
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '5px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: filter === t ? '#1d8cff20' : 'transparent',
              borderColor: filter === t ? '#1d8cff' : 'var(--border-soft)',
              color: filter === t ? '#1d8cff' : 'var(--text-dim)',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {filtered.map(report => {
          const Icon = typeIcons[report.type] || FileText;
          const color = typeColors[report.type] || '#1d8cff';
          return (
            <GlassCard key={report.id} className="card" style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.background = `${color}06`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.background = ''; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ background: `${color}18`, borderRadius: 8, padding: 8, flexShrink: 0 }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color, marginBottom: 3 }}>{report.id}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{report.title}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  <StatusBadge status={report.priority} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
                <span>{report.type}</span>
                <span>{report.date}</span>
                <span>By {report.author}</span>
                <span>{report.pages} pages</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setActiveReport(report)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 10px' }}>
                  <Eye size={12} />View
                </button>
                <button className="btn btn-secondary" onClick={() => handleDownloadPDF(report)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 10px' }}>
                  <Download size={12} />Download PDF
                </button>
                <div style={{ marginLeft: 'auto' }}><StatusBadge status={report.status} /></div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* View Report Modal */}
      {activeReport && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <GlassCard style={{ width: 720, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: 28, borderRadius: 14, border: '1px solid rgba(29,140,255,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '1px solid var(--border-soft)', paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1d8cff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} /> National Energy Management Centre
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{activeReport.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>ID: {activeReport.id} · Generated on {activeReport.date} by {activeReport.author}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setActiveReport(null)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>Executive Summary</div>
                <div>{activeReport.summary}</div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 4 }}>
                  1. Scenario Impact Parameters
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>CHOKEPOINT RISK</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', marginTop: 2 }}>+18% Delay</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Hormuz Transit Vulnerability</div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>LANDED COST SPIKE</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>$96.40 / bbl</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>+$8.40 Surcharge</div>
                  </div>
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>SPR RESERVE COVERAGE</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', marginTop: 2 }}>15.1 MMT</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>41.0% Post-Drawdown</div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 4 }}>
                  2. Strategic Directives & Response Plan
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ background: '#1d8cff', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>1</span>
                    <div><strong>Procurement Rerouting:</strong> Issue Letter of Intent (LOI) to West Africa (Bonny Light) and Brazil (Petrobras) to shift 1.4 MMT/day volume around Cape of Good Hope.</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ background: '#1d8cff', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>2</span>
                    <div><strong>SPR Staged Drawdown:</strong> Authorize emergency drawdown of 8.5 MMT from Visakhapatnam and Mangaluru cavern facilities over a 22-day bridge period.</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ background: '#1d8cff', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>3</span>
                    <div><strong>War Risk Indemnity:</strong> Secure GIC Re emergency maritime war risk coverage for all Indian flag VLCC tankers in high-risk transit zones.</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-soft)', paddingTop: 16, marginTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Classification: OFFICIAL / RESTRICTED · Internal Cabinet Brief</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={() => handleDownloadPDF(activeReport)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={13} /> Export PDF
                  </button>
                  <button className="btn btn-primary" onClick={() => setActiveReport(null)}>Close</button>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  );
}

