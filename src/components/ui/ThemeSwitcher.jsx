import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function ThemeSwitcher({ compact = false, showLabel = true, style = {} }) {
  const { theme, setTheme, currentTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen(prev => !prev)}
        title={`Active Palette: ${currentTheme.name}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: compact ? '6px 10px' : '6px 14px',
          borderRadius: 10,
          border: `1.5px solid ${currentTheme.colorPrimary}50`,
          background: 'var(--bg-panel)',
          color: 'var(--text-main)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 4px 14px ${currentTheme.colorGlow || 'rgba(0,0,0,0.2)'}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = currentTheme.colorPrimary;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${currentTheme.colorPrimary}50`;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span style={{ fontSize: compact ? 14 : 16 }}>{currentTheme.icon}</span>
        {showLabel && !compact && (
          <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-main)' }}>
              {currentTheme.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, color: currentTheme.colorPrimary, opacity: 0.9 }}>
              {currentTheme.badge}
            </div>
          </div>
        )}

        {/* Dual Accent Swatch Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 4px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: currentTheme.colorPrimary,
              boxShadow: `0 0 6px ${currentTheme.colorPrimary}`,
            }}
          />
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: currentTheme.colorAccent,
            }}
          />
        </div>

        <ChevronDown size={12} style={{ opacity: 0.7, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 9999,
            minWidth: 295,
            background: 'var(--bg-panel)',
            border: `1.5px solid var(--border-medium)`,
            borderRadius: 14,
            padding: '10px',
            backdropFilter: 'blur(28px) saturate(180%)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 24px rgba(0, 0, 0, 0.3)',
            animation: 'fade-in-up 0.2s ease-out',
          }}
        >
          <div style={{ padding: '4px 8px 10px', fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-soft)', marginBottom: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} style={{ color: currentTheme.colorPrimary }} /> Select Platform Aesthetic Theme
            </span>
            <Palette size={12} style={{ opacity: 0.6 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {themes.map(t => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 11px',
                    borderRadius: 10,
                    border: isActive ? `1.5px solid ${t.colorPrimary}` : '1px solid transparent',
                    background: isActive ? `${t.colorPrimary}18` : 'rgba(255,255,255,0.02)',
                    boxShadow: isActive ? `0 0 16px ${t.colorPrimary}25` : 'none',
                    color: 'var(--text-main)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{t.name}</span>
                        {isActive && (
                          <span style={{ fontSize: 8.5, padding: '1px 6px', borderRadius: 4, background: t.colorPrimary, color: t.id === 'light' ? '#fff' : '#000', fontWeight: 800 }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-dim)', marginTop: 2 }}>
                        {t.tagline}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: 3, padding: '3px 5px', borderRadius: 10, background: 'rgba(0,0,0,0.3)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.colorBg, border: '1px solid rgba(255,255,255,0.2)' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.colorPrimary, boxShadow: `0 0 6px ${t.colorPrimary}` }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.colorAccent }} />
                    </div>
                    {isActive && <Check size={14} style={{ color: t.colorPrimary, marginLeft: 2 }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
