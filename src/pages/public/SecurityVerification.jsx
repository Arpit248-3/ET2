/**
 * SecurityVerification — Security Clearance Verification Status Page
 * Displayed after submitting registration. Shows 7-step clearance verification timeline.
 */
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import SecurityTimeline from '../../components/auth/SecurityTimeline.jsx';
import { ShieldCheck, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SecurityVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.user || { fullName: 'Dr. Arjun Mehta', role: 'Cabinet Secretariat' };

  return (
    <AuthLayout
      title="Security Clearance Status"
      subtitle={`Application Reference: NEMC-REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`}
      badge="CLEARANCE PENDING"
    >
      <div style={{
        background: 'rgba(0, 229, 255, 0.08)',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Clock size={24} color="#00e5ff" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: '#f8fafc' }}>
          <strong>Clearance Application Submitted for {userData.fullName}</strong>
          <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
            Your request for <strong style={{ color: '#00e5ff' }}>{userData.role}</strong> clearance is currently under automated background check and Cabinet Secretariat review.
          </div>
        </div>
      </div>

      {/* 7-Step Animated Clearance Timeline */}
      <SecurityTimeline />

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        <button
          type="button"
          onClick={() => navigate('/auth-success', { state: { type: 'REGISTER_APPROVED' } })}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1d8cff 0%, #00e5ff 100%)',
            border: 'none',
            color: '#030712',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
          }}
        >
          <ShieldCheck size={18} />
          <span>SIMULATE PROVISIONAL APPROVAL</span>
          <ArrowRight size={16} />
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
          Questions regarding clearance status?{' '}
          <Link to="/login" style={{ color: '#00e5ff', fontWeight: 700, textDecoration: 'none' }}>
            Return to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
