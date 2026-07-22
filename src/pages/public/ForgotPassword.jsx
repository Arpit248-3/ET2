/**
 * ForgotPassword — Request Password Reset Page
 * Enterprise security flow: Enter work email / mobile -> Identity Match -> OTP Verification
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import { Mail, Phone, ArrowRight, ShieldCheck, KeyRound, AlertTriangle } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('arjun.mehta@nemc.gov.in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!identifier) {
      setError('Please enter registered work email or mobile number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/verify-otp', { state: { identifier } });
    }, 1000);
  };

  return (
    <AuthLayout
      title="Credential Recovery Protocol"
      subtitle="Verify identity to initiate RSA-2048 password reset and session revocation"
      badge="SECURITY PROTOCOL RE-09"
    >
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 16,
          color: '#ef4444',
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-muted, #94a3b8)',
            marginBottom: 6,
            display: 'block',
          }}>
            REGISTERED WORK EMAIL OR PHONE
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <Mail size={16} color="#00e5ff" />
            </div>
            <input
              type="text"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="name@nemc.gov.in or +91 98765 43210"
              style={{
                width: '100%',
                background: 'rgba(8, 18, 38, 0.8)',
                border: '1px solid rgba(90, 130, 255, 0.25)',
                borderRadius: 8,
                padding: '10px 14px 10px 40px',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Security Notice Box */}
        <div style={{
          background: 'rgba(29, 140, 255, 0.08)',
          border: '1px solid rgba(29, 140, 255, 0.25)',
          borderRadius: 10,
          padding: 14,
          fontSize: 11,
          color: 'var(--text-muted, #94a3b8)',
          display: 'flex',
          gap: 10,
        }}>
          <ShieldCheck size={20} color="#00e5ff" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#fff', display: 'block', marginBottom: 2 }}>SECURITY POLICY</strong>
            A 6-digit dynamic OTP will be dispatched via Encrypted SMS & Government Mail Gateway. Resetting password revokes all active sessions on other devices.
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
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
          <KeyRound size={16} />
          <span>{loading ? 'INITIATING RECOVERY...' : 'DISPATCH SECURITY OTP'}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
        Remembered password?{' '}
        <Link to="/login" style={{ color: '#00e5ff', fontWeight: 700, textDecoration: 'none' }}>
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
}
