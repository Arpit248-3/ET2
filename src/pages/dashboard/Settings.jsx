import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Bell, Shield, Palette, Monitor, Save, ToggleLeft, ToggleRight, Check, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { fetchSettings, updateSettings } from '../../services/api.js';
import { useScenario } from '../../context/ScenarioContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

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
  const { theme, setTheme, themes } = useTheme();
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
        email_alerts: settings.emailAlerts,
        sms_alerts: settings.smsAlerts,
        critical_only: settings.criticalOnly,
        weekly_digest: settings.weeklyDigest,
        two_factor_auth: settings.twoFactor,
        session_timeout: parseInt(settings.sessionTimeout, 10),
        audit_logging: settings.auditLogging,
        api_access: settings.apiAccess,
        auto_refresh: settings.autoRefresh,
        refresh_interval: parseInt(settings.refreshInterval, 10),
        language: settings.language,
        timezone: settings.timezone,
        compact_view: settings.compactView,
        dark_mode: settings.darkMode,
        active_security_profile: settings.twoFactor ? 'Standard NATO-Level AES256' : 'Basic',
        alert_emails: settings.emailAlerts ? 'alerts@nemc.gov.in' : null,
      });
      setSaved(true);
      addToast('All settings persisted to database successfully.', 'success');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      addToast('Failed to persist settings — backend may be offline.', 'error');
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

          {/* Theme Selection Grid for Display Tab */}
          {activeTab === 'display' && (
            <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ letterSpacing: '0.04em' }}>PLATFORM COLORED AESTHETIC PALETTES</span>
                <span style={{ fontSize: 9.5, padding: '3px 9px', borderRadius: 12, background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', fontWeight: 800 }}>
                  5 DYNAMIC THEMES
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 18 }}>
                Select from high-visibility aesthetic command center palettes. Theme choices switch instantly across all command dashboards, analytics screens, header bars, and login gateways.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {themes.map(t => {
                  const isActive = theme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        addToast(`Applied ${t.name}`, 'info');
                      }}
                      style={{
                        padding: '16px',
                        borderRadius: 14,
                        border: isActive ? `2px solid ${t.colorPrimary}` : '1px solid var(--border-soft)',
                        background: isActive ? `${t.colorPrimary}14` : 'rgba(255,255,255,0.02)',
                        boxShadow: isActive ? `0 0 24px ${t.colorGlow || 'rgba(0,0,0,0.2)'}` : '0 4px 12px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = t.colorPrimary;
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = `0 8px 24px ${t.colorPrimary}25`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = 'var(--border-soft)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 24, filter: `drop-shadow(0 0 8px ${t.colorPrimary})` }}>{t.icon}</span>
                          <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: t.colorPrimary, color: t.id === 'light' ? '#fff' : '#000', letterSpacing: '0.04em' }}>
                            {t.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: t.colorPrimary, marginBottom: 8 }}>
                          {t.tagline}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: 14 }}>
                          {t.desc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        {/* Swatches preview */}
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '3px 7px', borderRadius: 12, background: 'rgba(0,0,0,0.25)' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.colorBg, border: '1px solid rgba(255,255,255,0.3)' }} title="Canvas BG" />
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.colorPrimary, boxShadow: `0 0 6px ${t.colorPrimary}` }} title="Primary Accent" />
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.colorAccent }} title="Secondary Accent" />
                        </div>

                        {isActive ? (
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: t.colorPrimary, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={14} /> ACTIVE
                          </div>
                        ) : (
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)' }}>
                            Select →
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
