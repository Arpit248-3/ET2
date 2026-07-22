/**
 * PasswordStrength — Animated password strength meter with 5 security criteria checkmarks.
 */
import React from 'react';
import { Check, X } from 'lucide-react';

export default function PasswordStrength({ password = '' }) {
  const requirements = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Numeric digit (0-9)', valid: /[0-9]/.test(password) },
    { label: 'Special character (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const passedCount = requirements.filter(r => r.valid).length;
  
  let scoreText = 'Weak';
  let scoreColor = '#ef4444'; // Red
  let scorePercent = (passedCount / 5) * 100;

  if (passedCount >= 5) {
    scoreText = 'Military Grade (Strong)';
    scoreColor = '#22c55e'; // Green
  } else if (passedCount >= 3) {
    scoreText = 'Moderate';
    scoreColor = '#f59e0b'; // Amber
  } else if (passedCount > 0) {
    scoreText = 'Weak';
    scoreColor = '#ef4444';
  } else {
    scoreText = 'Enter password';
    scoreColor = '#64748b';
  }

  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Strength Bar */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <span style={{ color: 'var(--text-dim, #64748b)' }}>PASSWORD STRENGTH</span>
          <span style={{ color: scoreColor }}>{scoreText}</span>
        </div>

        <div style={{
          width: '100%',
          height: 4,
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${scorePercent}%`,
            height: '100%',
            background: scoreColor,
            boxShadow: `0 0 10px ${scoreColor}`,
            transition: 'all 0.3s ease',
          }} />
        </div>
      </div>

      {/* 5 Requirements Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        gap: 4,
        marginTop: 4,
      }}>
        {requirements.map((req, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: req.valid ? '#22c55e' : 'var(--text-dim, #64748b)',
              transition: 'color 0.2s ease',
            }}
          >
            <div style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: req.valid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${req.valid ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {req.valid ? <Check size={10} color="#22c55e" /> : <X size={8} color="#64748b" />}
            </div>
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
