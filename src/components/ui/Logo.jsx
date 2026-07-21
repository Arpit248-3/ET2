import React from 'react';

export default function Logo({ size = 'md', showText = true }) {
  const sizes = { sm: { icon: 28, title: 13, sub: 9 }, md: { icon: 36, title: 15, sub: 10 }, lg: { icon: 48, title: 20, sub: 12 } };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Logo icon - stylized eye/energy symbol */}
      <div className="logo-pulse" style={{
        width: s.icon, height: s.icon, borderRadius: '50%',
        background: 'linear-gradient(135deg, #0a1628, #0d2040)',
        border: '1.5px solid rgba(0,229,255,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative', overflow: 'hidden'
      }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute', inset: 3, borderRadius: '50%',
          border: '1px solid rgba(29,140,255,0.3)',
        }} />
        {/* Eye / Chakra-like symbol */}
        <svg width={s.icon * 0.55} height={s.icon * 0.55} viewBox="0 0 24 24" fill="none">
          <path d="M12 3 L12 21" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          <path d="M3 12 L21 12" stroke="#1d8cff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          <circle cx="12" cy="12" r="4" stroke="#00e5ff" strokeWidth="1.5" fill="rgba(0,229,255,0.15)"/>
          <circle cx="12" cy="12" r="2" fill="#00e5ff"/>
          <path d="M7 7 L17 17" stroke="rgba(29,140,255,0.3)" strokeWidth="1" />
          <path d="M17 7 L7 17" stroke="rgba(29,140,255,0.3)" strokeWidth="1" />
        </svg>
      </div>

      {showText && (
        <div>
          <div style={{ fontSize: s.title, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Urja<span style={{ color: '#00e5ff' }}>Netra</span> <span style={{ color: '#1d8cff' }}>AI</span>
          </div>
          <div style={{ fontSize: s.sub, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
            Energy Command Platform
          </div>
        </div>
      )}
    </div>
  );
}
