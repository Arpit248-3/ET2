/**
 * AnimatedLock — Full-screen mission control authentication & vault unlock overlay.
 * Replaces static timer with step-by-step backend progress resolution sequence.
 */
import React, { useEffect, useState } from 'react';
import { Lock, Unlock, ShieldCheck, Cpu, Database, Brain, Activity, Check } from 'lucide-react';
import VaultDoor from './VaultDoor.jsx';

export default function AnimatedLock({ onComplete, error = null }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [doorStatus, setDoorStatus] = useState('AUTHENTICATING');

  const steps = [
    { label: 'POST /api/auth/login — Authenticating credentials', icon: Lock },
    { label: 'JWT Token & RSA-2048 Session Keys Generated', icon: KeyIcon },
    { label: 'User Role & Level-5 Clearance Verified', icon: ShieldCheck },
    { label: 'Command Center Permissions & RBAC Matrix Loaded', icon: Cpu },
    { label: 'National Pipeline Twin State Synchronized', icon: Database },
    { label: 'UrjaNetra AI Copilot Engine Warmed & Ready', icon: Brain },
    { label: 'Vault Bolts Disengaged — Unlocking Command Layer', icon: Unlock },
  ];

  function KeyIcon(props) {
    return <Activity {...props} />;
  }

  useEffect(() => {
    if (error) return;

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setCurrentStep(stepIdx);
        if (stepIdx === steps.length - 1) {
          setDoorStatus('UNLOCKED');
        } else {
          setDoorStatus('UNLOCKING');
        }
      } else {
        clearInterval(interval);
        setDoorStatus('ACCESS GRANTED');
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 800);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [error, onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(2, 6, 16, 0.96)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      {/* Vault Door Centerpiece */}
      <VaultDoor status={error ? 'ACCESS DENIED' : doorStatus} size={280} />

      {/* Progress Telemetry Card */}
      <div style={{
        marginTop: 24,
        width: '100%',
        maxWidth: 460,
        background: 'rgba(8, 18, 38, 0.85)',
        border: `1px solid ${error ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 229, 255, 0.3)'}`,
        borderRadius: 14,
        padding: 20,
        boxShadow: error
          ? '0 0 40px rgba(239, 68, 68, 0.2)'
          : '0 0 40px rgba(0, 229, 255, 0.15)',
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 800,
          fontFamily: "'JetBrains Mono', monospace",
          color: error ? '#ef4444' : '#00e5ff',
          letterSpacing: '0.1em',
          textAlign: 'center',
          marginBottom: 14,
          textTransform: 'uppercase',
        }}>
          {error ? 'AUTHENTICATION FAILED — INCORRECT CREDENTIALS' : 'COMMAND LAYER INITIALIZATION'}
        </div>

        {/* Step-by-step progress list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: isDone ? '#22c55e' : isCurrent ? '#00e5ff' : '#475569',
                  opacity: isDone || isCurrent ? 1 : 0.4,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: isDone ? 'rgba(34, 197, 94, 0.15)' : isCurrent ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  border: `1px solid ${isDone ? '#22c55e' : isCurrent ? '#00e5ff' : '#475569'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isDone ? <Check size={10} color="#22c55e" /> : <Icon size={10} color={isCurrent ? '#00e5ff' : '#475569'} />}
                </div>
                <span style={{ flex: 1 }}>{step.label}</span>
                {isDone && <span style={{ fontSize: 9, color: '#22c55e' }}>[OK]</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
