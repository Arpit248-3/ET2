/**
 * VerifyOTP — 6-Digit Dynamic Security OTP Verification Page.
 * Features delivery status badges (SMS/Email/Voice/Token), countdown timer, auto-submit.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import OTPInput from '../../components/auth/OTPInput.jsx';
import { ShieldCheck, MessageSquare, Mail, PhoneCall, Key, RotateCcw, ArrowRight } from 'lucide-react';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier || 'arjun.mehta@nemc.gov.in';

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(120);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = (codeToVerify) => {
    const finalOtp = codeToVerify || otp;
    if (finalOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/reset-password', { state: { identifier, otp: finalOtp } });
    }, 1000);
  };

  const minutes = Math.floor(timer / 60);
  const seconds = (timer % 60).toString().padStart(2, '0');

  return (
    <AuthLayout
      title="Dynamic OTP Verification"
      subtitle={`Enter the 6-digit code dispatched to ${identifier}`}
      badge="2FA HANDSHAKE"
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

      {/* Multi-channel Delivery Status Badges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
        marginBottom: 16,
      }}>
        {[
          { label: 'SMS Gateway Delivered', color: '#22c55e', icon: MessageSquare },
          { label: 'Gov Mail Delivered', color: '#22c55e', icon: Mail },
          { label: 'Voice Call Ready', color: '#00e5ff', icon: PhoneCall },
          { label: 'Hardware Token Sync', color: '#1d8cff', icon: Key },
        ].map((channel, i) => {
          const Icon = channel.icon;
          return (
            <div
              key={i}
              style={{
                background: 'rgba(8, 18, 38, 0.6)',
                border: `1px solid ${channel.color}30`,
                borderRadius: 6,
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#ffffff',
              }}
            >
              <Icon size={12} color={channel.color} />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {channel.label}
              </span>
              <span style={{ color: channel.color, fontWeight: 800 }}>✓</span>
            </div>
          );
        })}
      </div>

      {/* OTP 6-Digit Box */}
      <OTPInput
        length={6}
        onComplete={(code) => {
          setOtp(code);
          handleVerify(code);
        }}
        error={!!error}
      />

      {/* Timer & Resend Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '16px 0',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <div style={{ color: 'var(--text-muted, #94a3b8)' }}>
          OTP Expires in: <strong style={{ color: timer < 30 ? '#ef4444' : '#00e5ff' }}>{minutes}:{seconds}</strong>
        </div>

        <button
          type="button"
          disabled={timer > 0}
          onClick={() => setTimer(120)}
          style={{
            background: 'none',
            border: 'none',
            color: timer > 0 ? '#64748b' : '#00e5ff',
            cursor: timer > 0 ? 'not-allowed' : 'pointer',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <RotateCcw size={12} /> Resend Code
        </button>
      </div>

      {/* Action Submit Button */}
      <button
        type="button"
        onClick={() => handleVerify()}
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
        <ShieldCheck size={18} />
        <span>{loading ? 'VERIFYING SECURITY HANDSHAKE...' : 'VERIFY & PROCEED'}</span>
        <ArrowRight size={16} />
      </button>

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
        Wrong email or number?{' '}
        <Link to="/forgot-password" style={{ color: '#00e5ff', fontWeight: 700, textDecoration: 'none' }}>
          Change Contact Info
        </Link>
      </div>
    </AuthLayout>
  );
}
