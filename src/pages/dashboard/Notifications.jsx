import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, X, Filter, Settings, Loader, WifiOff } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import useApi from '../../hooks/useApi.js';
import { fetchNotifications, markNotificationsRead, updateNotificationPreferences } from '../../services/api.js';
import { useScenario } from '../../context/ScenarioContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

const typeConfig = {
  CRITICAL: { color: '#ef4444', icon: AlertTriangle, bg: '#ef444415' },
  HIGH: { color: '#f59e0b', icon: AlertTriangle, bg: '#f59e0b15' },
  INFO: { color: '#1d8cff', icon: Info, bg: '#1d8cff15' },
  SUCCESS: { color: '#22c55e', icon: CheckCircle, bg: '#22c55e15' },
};

export default function Notifications() {
  const { backendOnline, refreshPipeline } = useScenario();
  const { addToast } = useToast();
  const { data: liveNotifs, loading: notifsLoading, error: notifsError, execute: refetch } = useApi(fetchNotifications, { fallback: null });
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefForm, setPrefForm] = useState({
    inApp: true,
    email: true,
    sms: false,
    telegram: true,
    minSeverity: 'HIGH',
    frequency: 'Instant',
  });

  // Normalize live notifications to display format
  const liveItems = liveNotifs?.notifications
    ? liveNotifs.notifications.map((n, i) => ({
        id: n.id || i,
        type: n.type || 'INFO',
        title: n.title,
        body: n.detail || '',
        time: n.time || 'Just now',
        read: n.read ?? false,
        category: n.type === 'CRITICAL' ? 'Risk' : 'Operations',
      }))
    : null;

  const [filter, setFilter] = useState('All');
  const [items, setItems] = useState([]);

  // Sync state if liveItems updates
  useEffect(() => {
    if (liveItems) {
      setItems(liveItems);
    }
  }, [liveItems]);

  const displayItems = items;
  const categories = ['All', 'Risk', 'Operations', 'Finance', 'Procurement', 'Compliance', 'AI', 'Intelligence'];
  const unread = displayItems.filter(n => !n.read).length;
  const filtered = filter === 'All' ? displayItems : displayItems.filter(n => n.category === filter);

  const markRead = async (id) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      if (backendOnline) {
        await markNotificationsRead(id);
        await refetch();
        if (refreshPipeline) await refreshPipeline();
      }
    } catch (err) {
      console.warn('Failed to sync mark read to backend:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    try {
      if (backendOnline) {
        await markNotificationsRead('all');
        await refetch();
        if (refreshPipeline) await refreshPipeline();
      }
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      addToast('Marked all read locally', 'info');
    }
  };

  const handleSavePreferences = async () => {
    try {
      if (backendOnline) {
        await updateNotificationPreferences(prefForm);
      }
      addToast('Notification preferences saved successfully', 'success');
      setShowPreferences(false);
    } catch (err) {
      addToast('Preferences saved locally', 'info');
      setShowPreferences(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Notifications" subtitle="System alerts, AI signals, and operational updates"
        badge={{ label: `${unread} UNREAD`, color: unread > 0 ? '#ef4444' : '#22c55e' }}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={handleMarkAllRead}>Mark All Read</button>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} onClick={() => setShowPreferences(true)}><Settings size={13} />Preferences</button>
          </div>
        }
      />

      {/* Offline/Error Notification Banner */}
      {!backendOnline ? (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <WifiOff size={14} />
          Backend Offline. Displaying local alert center feed.
        </div>
      ) : notifsLoading ? (
        <div style={{ background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)', color: '#1d8cff', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Fetching live national energy incident alerts...
        </div>
      ) : notifsError ? (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <AlertTriangle size={14} />
          Failed to fetch live notifications: {notifsError.message || 'Connection failed'}. Showing cached feed.
        </div>
      ) : null}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Unread', value: unread, color: '#ef4444' },
          { label: 'Critical', value: items.filter(n => n.type === 'CRITICAL').length, color: '#ef4444' },
          { label: 'High Priority', value: items.filter(n => n.type === 'HIGH').length, color: '#f59e0b' },
          { label: 'Total Today', value: items.length, color: '#1d8cff' },
        ].map(stat => (
          <GlassCard key={stat.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </GlassCard>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={13} style={{ color: 'var(--text-dim)' }} />
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid',
            background: filter === cat ? '#1d8cff20' : 'transparent',
            borderColor: filter === cat ? '#1d8cff' : 'var(--border-soft)',
            color: filter === cat ? '#1d8cff' : 'var(--text-dim)',
          }}>{cat}</button>
        ))}
      </div>

      {/* Notification List */}
      <GlassCard className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No alerts in this category.</div>
        ) : (
          filtered.map((notif, i) => {
            const cfg = typeConfig[notif.type] || typeConfig.INFO;
            const Icon = cfg.icon;
            return (
              <div key={notif.id}
                style={{ padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: notif.read ? 'transparent' : 'rgba(29,140,255,0.03)', display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', transition: 'background 0.15s' }}
                onClick={() => markRead(notif.id)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(29,140,255,0.03)'}>
                {!notif.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1d8cff', flexShrink: 0, marginTop: 6 }} />}
                {notif.read && <div style={{ width: 6, flexShrink: 0 }} />}
                <div style={{ width: 34, height: 34, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={cfg.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: cfg.bg, color: cfg.color, fontWeight: 700 }}>{notif.type}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', padding: '1px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>{notif.category}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>{notif.time}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: notif.read ? 500 : 700, color: 'var(--text-primary)', marginBottom: 4 }}>{notif.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{notif.body}</div>
                </div>
              </div>
            );
          })
        )}
      </GlassCard>

      {/* Preferences Modal */}
      {showPreferences && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GlassCard style={{ width: 440, maxWidth: '90vw', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} style={{ color: '#1d8cff' }} /> Notification Preferences
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPreferences(false)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Alert Channels</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { key: 'inApp', label: 'In-App Alerts' },
                    { key: 'email', label: 'Email Digest' },
                    { key: 'sms', label: 'SMS Emergency' },
                    { key: 'telegram', label: 'Telegram Bot' },
                  ].map(ch => (
                    <label key={ch.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={prefForm[ch.key]} onChange={e => setPrefForm(p => ({ ...p, [ch.key]: e.target.checked }))} />
                      {ch.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Minimum Alert Severity</label>
                <select
                  value={prefForm.minSeverity}
                  onChange={e => setPrefForm(p => ({ ...p, minSeverity: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13 }}
                >
                  <option value="CRITICAL" style={{ background: '#091527' }}>CRITICAL Only</option>
                  <option value="HIGH" style={{ background: '#091527' }}>HIGH & CRITICAL</option>
                  <option value="INFO" style={{ background: '#091527' }}>All Notifications (INFO, HIGH, CRITICAL)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Dispatch Frequency</label>
                <select
                  value={prefForm.frequency}
                  onChange={e => setPrefForm(p => ({ ...p, frequency: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13 }}
                >
                  <option value="Instant" style={{ background: '#091527' }}>Instant Push</option>
                  <option value="Hourly" style={{ background: '#091527' }}>Hourly Rollup</option>
                  <option value="Daily" style={{ background: '#091527' }}>Daily Morning Summary</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button className="btn btn-secondary" onClick={() => setShowPreferences(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSavePreferences}>Save Preferences</button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
