import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'dark',
    name: 'Midnight Cyber-Command',
    tagline: 'Deep Obsidian & Neon Sapphire',
    desc: 'High-contrast midnight layout with radiant azure telemetry glow and ultra-clean glassmorphism.',
    icon: '🌌',
    colorBg: '#030712',
    colorPrimary: '#38bdf8',
    colorAccent: '#00f2fe',
    colorGlow: 'rgba(56, 189, 248, 0.4)',
    badge: 'DEFAULT COMMAND',
  },
  {
    id: 'light',
    name: 'Light Platinum Executive',
    tagline: 'Crisp Slate & Royal Sapphire',
    desc: 'Pure platinum briefing mode with deep indigo accents, soft ambient elevation, and ultra-readable typography.',
    icon: '☀️',
    colorBg: '#f8fafc',
    colorPrimary: '#2563eb',
    colorAccent: '#0284c7',
    colorGlow: 'rgba(37, 99, 235, 0.25)',
    badge: 'DAYLIGHT BRIEFING',
  },
  {
    id: 'neon',
    name: 'Cyberpunk Synthwave Matrix',
    tagline: 'Hyper Electric Neon & Laser Magenta',
    desc: 'Ultra high-energy synthwave dark mode featuring glowing electric turquoise, neon lime, laser magenta, and pulsating cyber borders.',
    icon: '⚡',
    colorBg: '#030308',
    colorPrimary: '#00f3ff',
    colorAccent: '#ff00aa',
    colorGlow: 'rgba(0, 243, 255, 0.65)',
    badge: 'SYNTHWAVE NEON',
  },
  {
    id: 'sunset',
    name: 'Sunset Twilight Obsidian',
    tagline: 'Fiery Amber & Radiant Coral',
    desc: 'Warm twilight obsidian aesthetic with glowing burnt orange, golden amber, and rose ambient lighting.',
    icon: '🌅',
    colorBg: '#0d0714',
    colorPrimary: '#ff5e36',
    colorAccent: '#f59e0b',
    colorGlow: 'rgba(255, 94, 54, 0.55)',
    badge: 'WARM OBSIDIAN',
  },
  {
    id: 'emerald',
    name: 'Quantum Emerald Bio-Grid',
    tagline: 'Electric Mint & Forest Jade',
    desc: 'Cutting-edge bio-energy aesthetic featuring electric mint green, quantum jade glass, and luminous green telemetry nodes.',
    icon: '🌿',
    colorBg: '#02140d',
    colorPrimary: '#00ff9d',
    colorAccent: '#10b981',
    colorGlow: 'rgba(0, 255, 157, 0.55)',
    badge: 'BIO-GRID MATRIX',
  },
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('urja_theme');
    if (saved && THEMES.some(t => t.id === saved)) return saved;
    const legacyDark = localStorage.getItem('urja_dark_mode');
    if (legacyDark === 'false') return 'light';
    return 'dark';
  });

  const applyTheme = (themeId) => {
    const validTheme = THEMES.some(t => t.id === themeId) ? themeId : 'dark';
    
    // Remove old theme classes
    document.body.classList.remove(
      'theme-dark', 'theme-light', 'theme-neon', 'theme-sunset', 'theme-emerald',
      'light-theme'
    );

    // Apply new theme class
    document.body.classList.add(`theme-${validTheme}`);
    if (validTheme === 'light') {
      document.body.classList.add('light-theme');
    }

    localStorage.setItem('urja_theme', validTheme);
    localStorage.setItem('urja_dark_mode', String(validTheme !== 'light'));
    setThemeState(validTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const setTheme = (newTheme) => {
    applyTheme(newTheme);
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    applyTheme(THEMES[nextIndex].id);
  };

  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, currentTheme: currentThemeObj, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
