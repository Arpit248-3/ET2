import React, { useState } from 'react';
import { ClipboardList, Search, Filter, Download, User, Shield, Loader, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import useApi from '../../hooks/useApi.js';
import { fetchAuditLogs } from '../../services/api.js';
import { useScenario } from '../../context/ScenarioContext.jsx';

const severityColor = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#1d8cff', INFO: '#22c55e' };
const actionColor = { APPROVED: '#22c55e', GENERATED: '#8b5cf6', VOTED: '#1d8cff', EXPORTED: '#f59e0b', TRIGGERED: '#ef4444', ACCESSED: '#00e5ff', LOGIN: '#22c55e', LOGGED: '#94a3b8' };

const parseTime = (timeStr) => {
  if (!timeStr) return '--:--:--';
  if (timeStr.includes('-') || timeStr.includes('T')) {
    try {
      return new Date(timeStr).toLocaleTimeString();
    } catch {
      return timeStr;
    }
  }
  // If it's already a time-only format (e.g. HH:MM:SS), return as-is to avoid new Date() crashes
  return timeStr;
};

const parseDate = (timeStr) => {
  if (!timeStr) return 'Today';
  if (timeStr.includes('-') || timeStr.includes('T')) {
    try {
      return new Date(timeStr).toLocaleDateString();
    } catch {
      return 'Today';
    }
  }
  return 'Today';
};

export default function AuditLogs() {
  const { backendOnline } = useScenario();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Decision', 'AI', 'Data Access', 'System', 'Auth'];

  // Live audit logs from backend
  const { data: liveLogsData, loading: logsLoading, error: logsError, execute: refetchLogs } = useApi(fetchAuditLogs, { fallback: null, args: [0, 50] });

  // Normalize live logs to match the display format
  const displayLogs = liveLogsData?.logs
    ? liveLogsData.logs.map(l => {
        let sev = 'INFO';
        if (l.type === 'CRITICAL' || l.type === 'HIGH') sev = 'HIGH';
        else if (l.type === 'WARNING' || l.type === 'MEDIUM') sev = 'MEDIUM';
        else if (l.type === 'LOW') sev = 'LOW';

        return {
          id: l.id || `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
          user: l.user || 'System',
          role: l.module === 'AI' || l.user?.toLowerCase().includes('ai') ? 'AI Engine' : 'Operator',
          action: l.action || 'LOGGED',
          resource: l.details?.resource || l.module || 'Platform',
          ip: 'internal',
          time: parseTime(l.time),
          date: parseDate(l.time),
          severity: sev,
          category: l.module || 'System',
        };
      })
    : [];

  const filtered = displayLogs
    .filter(l => filter === 'All' || l.category === filter)
    .filter(l => !search || l.user.toLowerCase().includes(search.toLowerCase()) || l.resource.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()));

  // Safe empty offline view if no cache is available and offline
  if (displayLogs.length === 0 && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <WifiOff size={48} style={{ color: '#f59e0b' }} />
          <h2>System Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached audit log ledger is available.</p>
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
          <WifiOff size={14} />
          <span>Showing last known intelligence state (Offline)</span>
        </div>
      )}

      <PageHeader title="Audit Logs" subtitle="Immutable record of all platform actions, AI decisions, and user access events"
        badge={{ label: 'TAMPER-PROOF', color: '#22c55e' }}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => { refetchLogs(); }} disabled={logsLoading}>
              {logsLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
              {' '}Refresh Logs
            </button>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <Download size={13} />Export Logs
            </button>
          </div>
        }
      />

      {/* Loading/Error Notification Banners */}
      {logsLoading && (
        <div style={{ background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)', color: '#1d8cff', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Loading audit trails from DB ledger...
        </div>
      )}
      {backendOnline && logsError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <AlertTriangle size={14} />
          Failed to fetch audit log trail: {logsError.message || 'Connection failed'}. Showing cached log entries.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Log Entries", value: displayLogs.length, color: '#1d8cff' },
          { label: 'High Severity', value: displayLogs.filter(l => l.severity === 'HIGH').length, color: '#ef4444' },
          { label: 'User Actions', value: displayLogs.filter(l => l.role !== 'Auto' && l.role !== 'AI Engine').length, color: '#8b5cf6' },
          { label: 'AI Events', value: displayLogs.filter(l => l.role === 'AI Engine' || l.role === 'Auto').length, color: '#22c55e' },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user, action, or resource..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 12px 8px 32px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Filter size={13} style={{ color: 'var(--text-dim)', marginTop: 6 }} />
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: '5px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: filter === cat ? '#1d8cff20' : 'transparent',
              borderColor: filter === cat ? '#1d8cff' : 'var(--border-soft)',
              color: filter === cat ? '#1d8cff' : 'var(--text-dim)',
            }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <GlassCard className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                {['Log ID', 'User', 'Action', 'Resource', 'Category', 'IP Address', 'Time', 'Severity'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No audit logs match criteria.</td>
                </tr>
              ) : (
                filtered.map((log, i) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px', fontSize: 10, fontFamily: 'monospace', color: '#1d8cff' }}>{log.id}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {log.role === 'AI Engine' || log.role === 'Auto' ? <Shield size={11} color="#8b5cf6" /> : <User size={11} color="#8b5cf6" />}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>{log.user}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{log.role}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: actionColor[log.action] || 'var(--text-secondary)' }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{log.resource}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="badge badge-ghost" style={{ fontSize: 10 }}>{log.category}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{log.ip}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-main)' }}>{log.time}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{log.date}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ color: severityColor[log.severity], fontWeight: 700, fontSize: 11 }}>{log.severity}</span>
                    </td>
                  </tr>
                ))
              )}
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
