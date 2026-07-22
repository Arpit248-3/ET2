/**
 * MFAButtons — Government SSO & Enterprise Authentication option cards.
 * Supports Microsoft, Google, Gov ID (Aadhaar/eSign), Enterprise SSO, Smart Card / Hardware Token.
 */
import React from 'react';
import { ShieldCheck, Cpu, KeyRound, Globe, Building2 } from 'lucide-react';

export default function MFAButtons({ onSelectProvider, loading = false }) {
  const ssoOptions = [
    { id: 'GovID', label: 'Government ID (eSign)', icon: ShieldCheck, color: '#00e5ff' },
    { id: 'Microsoft', label: 'NIC / Gov Azure AD', icon: Building2, color: '#1d8cff' },
    { id: 'Google', label: 'Google Workspace', icon: Globe, color: '#8b5cf6' },
    { id: 'SmartCard', label: 'CAC / PIV Smart Card', icon: KeyRound, color: '#f59e0b' },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '16px 0 12px 0',
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(90, 130, 255, 0.15)' }} />
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--text-dim, #64748b)',
          letterSpacing: '0.08em',
        }}>
          ENTERPRISE SSO / MFA
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(90, 130, 255, 0.15)' }} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}>
        {ssoOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={loading}
              onClick={() => onSelectProvider(opt.id)}
              style={{
                background: 'rgba(8, 18, 38, 0.6)',
                border: '1px solid rgba(90, 130, 255, 0.2)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = opt.color;
                e.currentTarget.style.boxShadow = `0 0 12px ${opt.color}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(90, 130, 255, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: `${opt.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={14} color={opt.color} />
              </div>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
