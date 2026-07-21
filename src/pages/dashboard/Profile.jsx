import React, { useState, useEffect } from 'react';
import { User, Shield, Edit, Save, Key, Bell, Clock, Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { fetchProfile, updateProfilePreferences } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';

const recentActivity = [
  { action: 'Approved SPR Drawdown MOT-2024-031', time: '09:12 today', type: 'Decision' },
  { action: 'Generated Intelligence Brief AB-2024-0912', time: '06:00 today', type: 'AI' },
  { action: 'Exported Procurement Report', time: 'Yesterday 14:30', type: 'Data' },
  { action: 'Joined Crisis Command Room', time: 'Yesterday 09:00', type: 'Collaboration' },
  { action: 'Updated Risk Threshold Settings', time: '2 days ago', type: 'Settings' },
];

export default function Profile() {
  const { backendOnline } = useScenario();
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profile, setProfile] = useState({
    name: 'Arjun Mehta', email: 'arjun.mehta@nemc.gov.in', phone: '+91 98100 00001',
    dept: 'National Energy Management Council', location: 'New Delhi, India',
    bio: 'Commander at NEMC with 18 years of experience in energy policy, crisis management, and strategic reserves planning.',
  });
  const [preferences, setPreferences] = useState({ theme: 'dark', notifications_enabled: true });
  const [form, setForm] = useState({ ...profile });

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const data = await fetchProfile();
      setProfile({
        name: data.name,
        email: data.email,
        phone: '+91 98100 00001',
        dept: data.role === 'Commander' ? 'National Energy Management Council' : 'Operations',
        location: 'New Delhi, India',
        bio: 'Commander at NEMC with 18 years of experience in energy policy, crisis management, and strategic reserves planning.'
      });
      setForm({
        name: data.name,
        email: data.email,
        phone: '+91 98100 00001',
        dept: data.role === 'Commander' ? 'National Energy Management Council' : 'Operations',
        location: 'New Delhi, India',
        bio: 'Commander at NEMC with 18 years of experience in energy policy, crisis management, and strategic reserves planning.'
      });
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.warn('Profile API offline, using cached fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePref = async () => {
    const nextVal = !preferences.notifications_enabled;
    try {
      const updated = await updateProfilePreferences({
        ...preferences,
        notifications_enabled: nextVal
      });
      setPreferences(updated);
      addToast(`Notification setting updated to ${nextVal ? 'ON' : 'OFF'}`, 'success');
    } catch (err) {
      addToast('Failed to update preferences', 'error');
    }
  };

  const save = () => {
    setProfile({ ...form });
    setEditing(false);
    addToast('Profile info updated locally', 'success');
  };

  useEffect(() => {
    loadProfileData();
  }, []);

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

      <PageHeader title="My Profile" subtitle="Account information, security settings, and activity history"
        actions={
          editing
            ? <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => { setEditing(false); setForm({ ...profile }); }}>Cancel</button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} onClick={save}><Save size={13} />Save Changes</button>
              </div>
            : <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} onClick={() => setEditing(true)}><Edit size={13} />Edit Profile</button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Avatar Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GlassCard className="card" style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(29,140,255,0.4), rgba(139,92,246,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26, fontWeight: 700, color: '#1d8cff', border: '2px solid rgba(29,140,255,0.3)' }}>AM</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{profile.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>{profile.dept}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}><Shield size={9} style={{ marginRight: 4, verticalAlign: 'middle' }} />TOP SECRET</span>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>Commander</span>
            </div>
          </GlassCard>

          {/* Security */}
          <GlassCard className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={14} color="#ef4444" />Security</div>
            {[
              { label: '2FA Status', value: 'Enabled', color: '#22c55e' },
              { label: 'Last Login', value: '2 min ago', color: 'var(--text-secondary)' },
              { label: 'Active Sessions', value: '1', color: 'var(--text-secondary)' },
              { label: 'Clearance', value: 'TOP SECRET', color: '#ef4444' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-dim)' }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: item.color }}>{item.value}</span>
              </div>
            ))}
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11 }} onClick={() => addToast('Credential modification restricted', 'warning')}><Key size={12} />Change Password</button>
          </GlassCard>

          {/* Stats */}
          <GlassCard className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={14} color="#1d8cff" />Platform Stats</div>
            {[
              { label: 'Decisions Made', value: '147' },
              { label: 'Reports Generated', value: '38' },
              { label: 'Days Active', value: '284' },
              { label: 'AI Queries', value: '2,341' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-dim)' }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: '#1d8cff' }}>{item.value}</span>
              </div>
            ))}
          </GlassCard>
        </div>

        {/* Main profile area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Personal Info */}
          <GlassCard className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><User size={15} color="#1d8cff" />Personal Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {[
                { label: 'Full Name', key: 'name' }, { label: 'Email Address', key: 'email' },
                { label: 'Phone', key: 'phone' }, { label: 'Location', key: 'location' },
                { label: 'Department', key: 'dept' },
              ].map(field => (
                <div key={field.key} style={field.key === 'dept' ? { gridColumn: '1 / -1' } : {}}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 700 }}>{field.label}</div>
                  {editing
                    ? <input value={form[field.key]} onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(29,140,255,0.3)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                    : <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{profile[field.key]}</div>
                  }
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 700 }}>Bio</div>
                {editing
                  ? <textarea value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))} rows={3}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(29,140,255,0.3)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  : <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{profile.bio}</div>
                }
              </div>
            </div>
          </GlassCard>

          {/* Recent Activity */}
          <GlassCard className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={15} color="#8b5cf6" />Recent Activity</div>
            {recentActivity.map((act, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Activity size={12} color="#8b5cf6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 2 }}>{act.action}</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-dim)' }}>
                    <span>{act.time}</span>
                    <span style={{ padding: '0px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>{act.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </GlassCard>

          {/* Notification Preferences Quick Panel */}
          <GlassCard className="card" style={{ padding: '16px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={14} color="#f59e0b" />Notification Preferences</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Email Alerts', active: preferences.notifications_enabled },
                { label: 'SMS Alerts', active: false },
                { label: 'Critical Only', active: false },
                { label: 'Weekly Digest', active: true },
              ].map(pref => (
                <div key={pref.label} onClick={pref.label === 'Email Alerts' ? handleTogglePref : undefined} style={{ background: pref.active ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${pref.active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center', cursor: pref.label === 'Email Alerts' ? 'pointer' : 'default' }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{pref.active ? '✓' : '○'}</div>
                  <div style={{ fontSize: 10, color: pref.active ? '#22c55e' : 'var(--text-dim)', fontWeight: 600 }}>{pref.label}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
