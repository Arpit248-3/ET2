import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Bell, Shield, Palette, Monitor, Save, ToggleLeft, ToggleRight, Check, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { fetchSettings, updateSettings } from '../../services/api.js';
import { useScenario } from '../../context/ScenarioContext.jsx';

function Toggle({ value, onChange }) {
  return (
    <button 
      onClick={() => onChange(!value)} 
      style={{ 
        background: 'none', 
        border: 'none', 
        cursor: 'pointer', 
        padding: 0, 
        display: 'flex', 
        alignItems: 'center',
        transition: 'transform 0.15s ease'
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {value ? (
        <ToggleRight size={32} color="#4ade80" style={{ filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.35))' }} />
      ) : (
        <ToggleLeft size={32} color="var(--text-dim)" />
      )}
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { backendOnline } = useScenario();
  const { addToast } = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  
  const [settings, setSettings] = useState({
    emailAlerts: true, 
    smsAlerts: false, 
    criticalOnly: false, 
    weeklyDigest: true,
    twoFactor: true, 
    sessionTimeout: '30', 
    auditLogging: true,
    autoRefresh: true, 
    refreshInterval: '30',
    darkMode: true,
    compactView: false,
    apiAccess: false, 
    language: 'English', 
    timezone: 'IST (UTC+5:30)',
  });

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const data = await fetchSettings();
      // Map API payload properties
      setSettings(prev => ({
        ...prev,
        emailAlerts: data.email_alerts !== undefined ? data.email_alerts : prev.emailAlerts,
        smsAlerts: data.sms_alerts !== undefined ? data.sms_alerts : prev.smsAlerts,
        criticalOnly: data.critical_only !== undefined ? data.critical_only : prev.criticalOnly,
        weeklyDigest: data.weekly_digest !== undefined ? data.weekly_digest : prev.weeklyDigest,
        twoFactor: data.two_factor_auth !== undefined ? data.two_factor_auth : prev.twoFactor,
        sessionTimeout: data.session_timeout ? String(data.session_timeout) : prev.sessionTimeout,
        auditLogging: data.audit_logging !== undefined ? data.audit_logging : prev.auditLogging,
        autoRefresh: data.auto_refresh !== undefined ? data.auto_refresh : prev.autoRefresh,
        refreshInterval: data.refresh_interval ? String(data.refresh_interval) : prev.refreshInterval,
      }));
    } catch (err) {
      console.warn('Settings API offline, using cached parameters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const update = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    if (key === 'darkMode') {
      localStorage.setItem('urja_dark_mode', String(val));
      document.body.classList.toggle('light-theme', !val);
      addToast(`Theme switched to ${val ? 'Dark' : 'Light'} Mode`, 'info');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings({
        auto_refresh: settings.autoRefresh,
        active_security_profile: settings.twoFactor ? 'Standard NATO-Level AES256' : 'Basic',
        alert_emails: settings.emailAlerts ? 'alerts@nemc.gov.in' : null,
      });
      setSaved(true); 
      addToast('Settings persisted to database', 'success');
      setTimeout(() => setSaved(false), 2000); 
    } catch (err) {
      addToast('Failed to persist settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      id: 'notifications', 
      label: 'Notifications', 
      desc: 'Preferences for alerts and summaries',
      icon: Bell, 
      color: '#1d8cff',
      items: [
        { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive critical alerts and reports via email', type: 'toggle' },
        { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive urgent SMS alerts for CRITICAL severity events only', type: 'toggle' },
        { key: 'criticalOnly', label: 'Critical Only Mode', desc: 'Suppress warnings and low-level alerts, showing only emergency incidents', type: 'toggle' },
        { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly analytics and intelligence summary report', type: 'toggle' },
      ]
    },
    {
      id: 'security', 
      label: 'Security & Access', 
      desc: 'MFA, session configurations, and API keys',
      icon: Shield, 
      color: '#ef4444',
      items: [
        { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Require OTP confirmation on every administrative login', type: 'toggle' },
        { key: 'sessionTimeout', label: 'Session Timeout (minutes)', desc: 'Automatically logout active sessions after inactivity', type: 'select', options: ['15', '30', '60', '120'] },
        { key: 'auditLogging', label: 'Enhanced Audit Logging', desc: 'Maintain detailed, immutable logs for all administrative actions', type: 'toggle' },
        { key: 'apiAccess', label: 'External API Access', desc: 'Allow secure API key generation for third-party command connections', type: 'toggle' },
      ]
    },
    {
      id: 'display', 
      label: 'Display & Interface', 
      desc: 'Theme, layouts, and regional settings',
      icon: Palette, 
      color: '#8b5cf6',
      items: [
        { key: 'darkMode', label: 'Dark Command-Center Theme', desc: 'High-visibility dark layout suitable for control rooms', type: 'toggle' },
        { key: 'compactView', label: 'Compact Grid View', desc: 'Decrease margins and padding to display maximum data density', type: 'toggle' },
        { key: 'language', label: 'Interface Language', desc: 'Default localization language for all charts and pages', type: 'select', options: ['English', 'Hindi', 'Tamil', 'Telugu'] },
        { key: 'timezone', label: 'System Timezone', desc: 'Timezone for timestamps, events, and reports', type: 'select', options: ['IST (UTC+5:30)', 'UTC', 'EST', 'PST'] },
      ]
    },
    {
      id: 'data', 
      label: 'Data & Performance', 
      desc: 'Refresh rates and processing frequencies',
      icon: Monitor, 
      color: '#22c55e',
      items: [
        { key: 'autoRefresh', label: 'Real-Time Auto Refresh', desc: 'Periodically fetch live telemetry updates and risk feeds', type: 'toggle' },
        { key: 'refreshInterval', label: 'Refresh Interval (seconds)', desc: 'Frequency of data fetches for active screens', type: 'select', options: ['15', '30', '60', '120'] },
      ]
    },
  ];

  const currentSection = sections.find(s => s.id === activeTab) || sections[0];
  const ActiveIcon = currentSection.icon;

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

      <PageHeader 
        title="Settings" 
        subtitle="Platform preferences, security controls, and notification management"
        actions={
          <button 
            className={`btn ${saved ? 'btn-success' : 'btn-primary'}`} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              fontSize: 12,
              padding: '8px 16px',
              transition: 'all 0.2s ease',
              boxShadow: saved ? '0 0 12px rgba(34,197,94,0.3)' : 'none'
            }} 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? 'Settings Saved' : 'Save Changes'}
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <GlassCard style={{ padding: '8px 0', border: '1px solid var(--border-soft)' }}>
          <div style={{ padding: '12px 16px 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            System Settings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sections.map(s => {
              const Icon = s.icon;
              const isActive = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: isActive ? 'rgba(29,140,255,0.08)' : 'transparent',
                    border: 'none',
                    borderLeft: `3px solid ${isActive ? s.color : 'transparent'}`,
                    cursor: 'pointer',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: `${s.color}${isActive ? '1c' : '0d'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: s.color,
                    transition: 'all 0.15s ease'
                  }}>
                    <Icon size={14} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 600 }}>{s.label}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Settings Panel */}
        <GlassCard style={{ padding: '24px 28px', border: '1px solid var(--border-soft)', minHeight: 380 }}>
          {/* Active section header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: 20, 
            paddingBottom: 16, 
            borderBottom: '1px solid var(--border-soft)' 
          }}>
            <div style={{ 
              background: `${currentSection.color}1c`, 
              borderRadius: 8, 
              padding: 10,
              color: currentSection.color,
              boxShadow: `0 0 12px ${currentSection.color}15`
            }}>
              <ActiveIcon size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{currentSection.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{currentSection.desc}</div>
            </div>
          </div>

          {/* Setting Items */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {currentSection.items.map((item, idx) => (
              <div 
                key={item.key} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px 0', 
                  borderBottom: idx === currentSection.items.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ paddingRight: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {item.type === 'toggle' ? (
                    <Toggle value={settings[item.key]} onChange={val => update(item.key, val)} />
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <select 
                        value={settings[item.key]} 
                        onChange={e => update(item.key, e.target.value)}
                        style={{ 
                          background: 'rgba(10,25,50,0.4)', 
                          border: '1px solid var(--border-soft)', 
                          borderRadius: 8, 
                          padding: '8px 32px 8px 12px', 
                          fontSize: 12, 
                          color: 'var(--text-primary)', 
                          outline: 'none', 
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          minWidth: 100,
                          textAlign: 'left'
                        }}
                      >
                        {item.options.map(opt => (
                          <option key={opt} value={opt} style={{ background: '#081225', color: '#f8fafc' }}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <div style={{ 
                        position: 'absolute', 
                        right: 12, 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        pointerEvents: 'none',
                        fontSize: 9,
                        color: 'var(--text-dim)'
                      }}>
                        ▼
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: 24, 
            padding: '14px 18px', 
            background: 'rgba(29,140,255,0.02)', 
            border: '1px solid rgba(29,140,255,0.1)', 
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <CheckCircle2 size={16} color="#00e5ff" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Configurations are stored in SQLite and will be applied instantly to all telemetry visualization pages in the active workspace sessions.
            </span>
          </div>

        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
