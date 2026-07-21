import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Eye, Search, Filter, FileText, BarChart2, AlertTriangle, RefreshCw } from 'lucide-react';
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
  const { backendOnline } = useScenario();
  const { addToast } = useToast();
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const types = ['All', 'Intelligence', 'Economic', 'Supply Chain', 'Compliance', 'Operations', 'Procurement', 'Strategic', 'Red Team'];

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchReports();
      if (data && Array.isArray(data)) {
        // Map API fields (title, format, size, generated_by, status)
        const mapped = data.map(r => ({
          id: r.id,
          title: r.title,
          type: r.title.includes('Compliance') ? 'Compliance' : r.title.includes('Economic') ? 'Economic' : 'Intelligence',
          date: r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now',
          author: r.generated_by,
          pages: 12,
          status: r.status,
          priority: r.title.includes('Crisis') || r.title.includes('Security') ? 'CRITICAL' : 'MEDIUM'
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
                <button className="btn btn-secondary" onClick={() => addToast(`Opening PDF: ${report.title}`, 'info')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 10px' }}>
                  <Eye size={12} />View
                </button>
                <button className="btn btn-secondary" onClick={() => addToast('Download started', 'success')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 10px' }}>
                  <Download size={12} />Download PDF
                </button>
                <div style={{ marginLeft: 'auto' }}><StatusBadge status={report.status} /></div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
