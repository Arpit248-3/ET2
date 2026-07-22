/**
 * SecurityTimeline — 7-step animated security clearance verification timeline.
 * Displays step-by-step verification progress (Identity, Email, Phone, Gov ID, Clearance, Role, Admin Approval).
 */
import React from 'react';
import {
  CheckCircle2, Loader2, ShieldCheck, Mail, Phone, Building2,
  Lock, Award, Clock
} from 'lucide-react';

export const DEFAULT_VERIFICATION_STEPS = [
  { id: 1, title: 'Identity Scan', desc: 'Aadhaar / Passport biometrics scan', icon: ShieldCheck, status: 'DONE' },
  { id: 2, title: 'Email Verification', desc: 'Official government domain validated', icon: Mail, status: 'DONE' },
  { id: 3, title: 'Phone Verification', desc: 'Encrypted SMS OTP confirmed', icon: Phone, status: 'DONE' },
  { id: 4, title: 'Government ID Validation', desc: 'NITI Aayog / MoPNG registry check', icon: Building2, status: 'DONE' },
  { id: 5, title: 'Security Clearance', desc: 'LEVEL-4 Top Secret clearance issued', icon: Lock, status: 'IN_PROGRESS' },
  { id: 6, title: 'Role Authorization', desc: 'Command Center permissions assigned', icon: Award, status: 'PENDING' },
  { id: 7, title: 'Administrator Approval', desc: 'Awaiting Cabinet Sec. signature', icon: Clock, status: 'PENDING' },
];

export default function SecurityTimeline({ steps = DEFAULT_VERIFICATION_STEPS }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      margin: '20px 0',
      width: '100%',
    }}>
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isDone = step.status === 'DONE';
        const isInProgress = step.status === 'IN_PROGRESS';
        const isPending = step.status === 'PENDING';

        const color = isDone ? '#22c55e' : isInProgress ? '#00e5ff' : '#64748b';

        return (
          <div
            key={step.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              borderRadius: 10,
              background: isInProgress
                ? 'rgba(0, 229, 255, 0.08)'
                : isDone
                ? 'rgba(34, 197, 94, 0.06)'
                : 'rgba(8, 18, 38, 0.4)',
              border: `1px solid ${isInProgress ? '#00e5ff' : isDone ? 'rgba(34, 197, 94, 0.3)' : 'rgba(90, 130, 255, 0.15)'}`,
              boxShadow: isInProgress ? '0 0 16px rgba(0, 229, 255, 0.15)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Step Icon */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `${color}18`,
              border: `1px solid ${color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {isInProgress ? (
                <Loader2 size={18} color="#00e5ff" className="animate-spin" />
              ) : isDone ? (
                <CheckCircle2 size={18} color="#22c55e" />
              ) : (
                <Icon size={18} color="#64748b" />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: isPending ? 'var(--text-dim, #64748b)' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                {step.title}
              </div>
                <div style={{
                fontSize: 11,
                color: isPending ? '#475569' : 'var(--text-muted, #94a3b8)',
              }}>
                {step.desc}
              </div>
            </div>

            {/* Status Badge */}
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: color,
              padding: '3px 8px',
              borderRadius: 4,
              background: `${color}12`,
              border: `1px solid ${color}30`,
              textTransform: 'uppercase',
            }}>
              {isDone ? 'VERIFIED' : isInProgress ? 'PROCESSING' : 'PENDING'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
