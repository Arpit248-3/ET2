/**
 * ResetPassword — Reset Password Page
 * Enter new clearance password + confirm password with real-time strength meter.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import PasswordStrength from '../../components/auth/PasswordStrength.jsx';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier || 'arjun.mehta@nemc.gov.in';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must meet minimum military security criteria (8+ chars).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/auth-success', { state: { type: 'PASSWORD_RESET', identifier } });
    }, 1200);
  };

  return (
    <AuthLayout
      title="Set New Clearance Password"
      subtitle={`Updating credentials for ${identifier}`}
      badge="RSA-2048 RE-KEY"
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-muted, #94a3b8)',
            marginBottom: 6,
            display: 'block',
          }}>
            NEW CLEARANCE PASSWORD
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <Lock size={16} color="#00e5ff" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                background: 'rgba(8, 18, 38, 0.8)',
                border: '1px solid rgba(90, 130, 255, 0.25)',
                borderRadius: 8,
                padding: '10px 40px 10px 40px',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {showPassword ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
            </button>
          </div>

          <PasswordStrength password={password} />
        </div>

        <div>
          <label style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-muted, #94a3b8)',
            marginBottom: 6,
            display: 'block',
          }}>
            CONFIRM NEW PASSWORD
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <Lock size={16} color="#1d8cff" />
            </div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
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
            marginTop: 6,
          }}
        >
          <ShieldCheck size={18} />
          <span>{loading ? 'RE-KEYING CREDENTIALS...' : 'SAVE & UPDATE PASSWORD'}</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </AuthLayout>
  );
}
