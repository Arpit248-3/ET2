/**
 * AuthLayout — Shared split-screen command layout for all authentication pages.
 * Left (40%): CyberGrid, VaultDoor centerpiece, SecurityHUD, Live Terminal Log Stream.
 * Right (60%): Glassmorphism auth panel, Header, Badge, Children content, Session Info bar, Security badges.
 * Mobile: Fully responsive single-column layout.
 */
import React, { useEffect, useState } from 'react';
import Logo from '../ui/Logo.jsx';
import CyberGrid from './CyberGrid.jsx';
import VaultDoor from './VaultDoor.jsx';
import SecurityHUD from './SecurityHUD.jsx';
import { authService } from '../../services/authService.js';
import { Shield, Activity, Lock, Globe, Server, Cpu, Terminal, Radio, Eye } from 'lucide-react';

export default function AuthLayout({
  children,
  title = 'National Energy Command Platform',
  subtitle = 'Authorized Personnel Only — Classified Access',
  badge = 'CLASSIFIED',
  vaultStatus = 'LOCKED',
}) {
  const [liveStats, setLiveStats] = useState({});
  const [lastLogin, setLastLogin] = useState(null);
  const [logs, setLogs] = useState([
    '[SYSTEM] NEMC-IN-01 Node Handshake Initialized',
    '[SECURITY] HSM FIPS 140-3 Module Active',
    '[NETWORK] mTLS 1.3 Tunnel Established (Delhi DR)',
  ]);

  useEffect(() => {
    authService.getLiveStats().then(setLiveStats).catch(() => {});
    setLastLogin(authService.getLastLogin());

    const interval = setInterval(() => {
      authService.getLiveStats().then(setLiveStats).catch(() => {});

      // Stream live terminal audit logs
      const sampleLogs = [
        `[AUDIT] Zero-Trust Token Re-verified (${Math.floor(Math.random() * 20 + 10)}ms)`,
        `[TELEMETRY] Pipeline Pressure Normal: ${Math.floor(Math.random() * 5 + 95)}% Capacity`,
        `[THREAT AI] 0 Anomalies Detected across 48 Nodes`,
        `[AUTH] RSA-2048 Session Handshake Health 100%`,
        `[REFINERY] 12 Cracking Units Synchronized`,
      ];
      const randomLog = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
      setLogs(prev => [randomLog, prev[0], prev[1]]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--bg-main, #030712)',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ─── CLASSIFIED OPERATIONS STATUS STRIP (TOP) ─── */}
      <div style={{
        height: 28,
        background: 'rgba(4, 10, 24, 0.98)',
        borderBottom: '1px solid rgba(90, 130, 255, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--text-muted, #94a3b8)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 800 }}>
            <Shield size={12} color="#ef4444" />
            <span>CLASSIFICATION: OFFICIAL (UNCLASSIFIED)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="hidden md:flex">
            <Radio size={11} color="#00e5ff" />
            <span>AUTH SERVICE: <strong style={{ color: '#22c55e' }}>OPERATIONAL</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="hidden lg:flex">
            <Cpu size={11} color="#1d8cff" />
            <span>AI ENGINES: <strong style={{ color: '#00e5ff' }}>8 / 8 ONLINE</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server size={11} color="#8b5cf6" />
            <span>DR SITE: <strong style={{ color: '#fff' }}>{liveStats.authServer || 'DELHI MAIN'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="hidden sm:flex">
            <Terminal size={11} color="#22c55e" />
            <span>LATENCY: <strong style={{ color: '#22c55e' }}>{liveStats.latency || 23} ms</strong></span>
          </div>
        </div>
      </div>

      {/* ─── MAIN SPLIT SCREEN CONTAINER ─── */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        minHeight: 'calc(100vh - 28px)',
      }}>
        {/* ─── LEFT PANEL (40% Desktop) ─── */}
        <div style={{
          width: '42%',
          position: 'relative',
          background: 'radial-gradient(circle at 30% 30%, #0c192d 0%, #040812 70%)',
          borderRight: '1px solid rgba(90, 130, 255, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 30px',
          overflow: 'hidden',
        }} className="hidden lg:flex">
          {/* Cyber Canvas Background */}
          <CyberGrid />

          {/* Top Brand Logo */}
          <div style={{ zIndex: 10, alignSelf: 'flex-start' }}>
            <Logo size="lg" />
          </div>

          {/* Centerpiece Vault Door */}
          <div style={{
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            my: 'auto',
          }}>
            <VaultDoor status={vaultStatus} size={320} />

            {/* Live Operational Metrics Ticker */}
            <div style={{
              background: 'rgba(6, 15, 30, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: 10,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            }}>
              <div>
                <span style={{ color: '#64748b' }}>BRENT: </span>
                <strong style={{ color: '#00e5ff' }}>${liveStats.brentPrice || '78.45'}</strong>
              </div>
              <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)' }} />
              <div>
                <span style={{ color: '#64748b' }}>PIPELINES: </span>
                <strong style={{ color: '#22c55e' }}>{liveStats.pipelines || 48} ACTIVE</strong>
              </div>
              <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)' }} />
              <div>
                <span style={{ color: '#64748b' }}>USERS: </span>
                <strong style={{ color: '#1d8cff' }}>{liveStats.usersOnline || 22} ONLINE</strong>
              </div>
            </div>
          </div>

          {/* Bottom Terminal Log Stream + HUD */}
          <div style={{ zIndex: 10, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Live Security Log Terminal Stream */}
            <div style={{
              background: 'rgba(4, 8, 18, 0.9)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={{ fontSize: 9, color: '#00e5ff', fontWeight: 800, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={10} color="#00e5ff" />
                LIVE SECURITY TELEMETRY FEED
              </div>
              {logs.map((log, i) => (
                <div key={i} style={{ color: i === 0 ? '#22c55e' : '#64748b', opacity: 1 - i * 0.25 }}>
                  {log}
                </div>
              ))}
            </div>

            <SecurityHUD stats={liveStats} />
          </div>
        </div>

        {/* ─── RIGHT PANEL (60% Desktop) ─── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px 24px',
          position: 'relative',
          background: 'radial-gradient(circle at 70% 30%, rgba(12, 25, 45, 0.4) 0%, rgba(3, 7, 18, 1) 80%)',
          overflowY: 'auto',
        }}>
          {/* Glassmorphism Auth Container */}
          <div style={{
            width: '100%',
            maxWidth: 540,
            background: 'rgba(8, 18, 38, 0.88)',
            backdropFilter: 'blur(36px) saturate(180%)',
            WebkitBackdropFilter: 'blur(36px) saturate(180%)',
            border: '1px solid rgba(90, 130, 255, 0.28)',
            borderRadius: 20,
            padding: 36,
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.75), 0 0 40px rgba(29, 140, 255, 0.12)',
            position: 'relative',
          }}>
            {/* Header / Classification Badge */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ lg: 'hidden' }}>
                  <Logo size="md" />
                </div>
                <div style={{
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#00e5ff',
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  letterSpacing: '0.1em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Shield size={12} color="#00e5ff" />
                  {badge}
                </div>
              </div>

              <h1 style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                marginBottom: 4,
              }}>
                {title}
              </h1>
              <p style={{
                fontSize: 13,
                color: 'var(--text-muted, #94a3b8)',
              }}>
                {subtitle}
              </p>
            </div>

            {/* Main Form Content */}
            {children}

            {/* Government & Military Grade Compliance Badges */}
            <div style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: '1px solid rgba(90, 130, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-dim, #64748b)',
            }}>
              <span>AES-256</span>
              <span>•</span>
              <span>SOC2 TYPE II</span>
              <span>•</span>
              <span>ISO 27001</span>
              <span>•</span>
              <span>GOVT READY</span>
              <span>•</span>
              <span>ZERO TRUST</span>
            </div>
          </div>

          {/* Session Information Bar (Bottom) */}
          <div style={{
            marginTop: 20,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-dim, #64748b)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {lastLogin && <span>Last Login: <strong style={{ color: '#94a3b8' }}>{lastLogin}</strong></span>}
            <span>API Version: <strong style={{ color: '#00e5ff' }}>v2.4</strong></span>
            <span>Auth Node: <strong style={{ color: '#1d8cff' }}>NEMC-IN-01</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
