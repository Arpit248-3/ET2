/**
 * ScenarioSwitcher — Compact dropdown to change the active scenario.
 * Lives in the top bar so every page can switch scenarios.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext.jsx';
import { useToast } from './Toast.jsx';

const SCENARIO_COLORS = {
  hormuz_closure:    '#ef4444',
  opec_cut:          '#f59e0b',
  russia_sanctions:  '#8b5cf6',
  port_disruption:   '#f97316',
};

const SEVERITY_ICONS = {
  CRITICAL: AlertTriangle,
  HIGH:     Zap,
  MEDIUM:   AlertTriangle,
  LOW:      CheckCircle,
};

export default function ScenarioSwitcher() {
  const { scenarios, activeScenario, activateScenario, backendOnline } = useScenario();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (scenario) => {
    if (switching) return;
    setOpen(false);
    setSwitching(true);
    try {
      await activateScenario(scenario.id);
      addToast(`Scenario activated: ${scenario.name}`, 'success');
    } catch {
      addToast('Failed to activate scenario. Is the backend running?', 'error');
    } finally {
      setSwitching(false);
    }
  };

  const label = activeScenario?.name || 'Baseline Operations';
  const activeColor = activeScenario ? (SCENARIO_COLORS[activeScenario.id] || '#1d8cff') : '#22c55e';
  const severity = activeScenario?.severity;
  const SevIcon = severity ? (SEVERITY_ICONS[severity] || Zap) : CheckCircle;

  if (!backendOnline) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 8,
        background: 'rgba(100,116,139,0.1)',
        border: '1px solid rgba(100,116,139,0.2)',
        fontSize: 11, color: '#64748b',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }} />
        Offline
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 12px', borderRadius: 8,
          background: `${activeColor}12`,
          border: `1px solid ${activeColor}35`,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
          minWidth: 180,
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${activeColor}20`}
        onMouseLeave={e => e.currentTarget.style.background = `${activeColor}12`}
      >
        {switching ? (
          <Loader size={12} style={{ color: activeColor, animation: 'spin 1s linear infinite' }} />
        ) : (
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: activeColor, flexShrink: 0,
            boxShadow: `0 0 6px ${activeColor}` }} />
        )}
        <span style={{ fontSize: 11.5, fontWeight: 700, color: activeColor, flex: 1, textAlign: 'left',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
          {label}
        </span>
        <ChevronDown size={12} style={{ color: activeColor, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          minWidth: 280, zIndex: 9999,
          background: 'rgba(8,18,35,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          animation: 'dropIn 0.15s ease',
        }}>
          {/* Header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Switch Scenario
            </div>
          </div>

          {/* Baseline */}
          <ScenarioItem
            label="Baseline Operations"
            subtitle="Normal operating conditions · No active crisis"
            color="#22c55e"
            active={!activeScenario}
            onClick={() => {
              setOpen(false);
              addToast('Baseline mode — no active scenario', 'info');
            }}
          />

          {/* Divider */}
          <div style={{ padding: '6px 14px 2px', fontSize: 9.5, fontWeight: 700,
            color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Crisis Scenarios
          </div>

          {/* Scenario list */}
          {scenarios.map(sc => (
            <ScenarioItem
              key={sc.id}
              label={sc.name}
              subtitle={sc.description?.slice(0, 80) + '…'}
              color={SCENARIO_COLORS[sc.id] || '#1d8cff'}
              severity={sc.severity}
              active={activeScenario?.id === sc.id}
              onClick={() => handleSelect(sc)}
            />
          ))}

          {/* Footer */}
          <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.07)',
            fontSize: 10, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
            Backend connected · 4 scenarios loaded
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ScenarioItem({ label, subtitle, color, severity, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  const SevIcon = severity ? (SEVERITY_ICONS[severity] || Zap) : null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        width: '100%', padding: '10px 14px',
        background: active ? `${color}12` : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        transition: 'background 0.12s',
        borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color,
        marginTop: 4, flexShrink: 0, boxShadow: active ? `0 0 6px ${color}` : 'none' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: active ? 700 : 600,
            color: active ? color : 'var(--text-main, #e2e8f0)' }}>{label}</span>
          {severity && SevIcon && (
            <SevIcon size={10} style={{ color, flexShrink: 0 }} />
          )}
          {active && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#fff',
              background: color, padding: '1px 5px', borderRadius: 4 }}>ACTIVE</span>
          )}
        </div>
        {subtitle && (
          <div style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </div>
        )}
      </div>
    </button>
  );
}
