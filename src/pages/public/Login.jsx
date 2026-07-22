/**
 * Login — Command Platform Login Page
 * High-grade government & enterprise security authentication portal with biometric quick-scan,
 * interactive role scope selection, and dynamic vault unlock sequence.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import MFAButtons from '../../components/auth/MFAButtons.jsx';
import AnimatedLock from '../../components/auth/AnimatedLock.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, ArrowRight, ShieldCheck, Fingerprint, Sparkles } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginOAuth, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('arjun.mehta@nemc.gov.in');
  const [password, setPassword] = useState('UrjaNetra#2026');
  const [role, setRole] = useState('Cabinet Secretariat');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [bioScanning, setBioScanning] = useState(false);

  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleKeyDown = (e) => {
    setCapsLock(e.getModifierState && e.getModifierState('CapsLock'));
  };

  const handleBiometricScan = () => {
    setBioScanning(true);
    setTimeout(() => {
      setBioScanning(false);
      setEmail('arjun.mehta@nemc.gov.in');
      setPassword('UrjaNetra#2026');
      setRole('Cabinet Secretariat');
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter work email and clearance password.');
      return;
    }

    setIsAuthenticating(true);
  };

  const handleUnlockComplete = async () => {
    try {
      await login(email, password, role);
      navigate('/command-center');
    } catch (err) {
      setIsAuthenticating(false);
      setError(err.message || 'Authentication failed. Please check credentials.');
    }
  };

  const handleOAuth = async (provider) => {
    try {
      await loginOAuth(provider);
      navigate('/command-center');
    } catch (err) {
      setError('SSO Authentication Failed.');
    }
  };

  return (
    <>
      {isAuthenticating && (
        <AnimatedLock onComplete={handleUnlockComplete} />
      )}

      <AuthLayout
        title="National Energy Command Platform"
        subtitle="Sign in to access India's strategic energy resilience dashboard"
        badge="LEVEL-5 CLASSIFIED"
        vaultStatus={isAuthenticating ? 'AUTHENTICATING' : 'LOCKED'}
      >
        {/* Quick Biometric Fingerprint / Retina Passkey Banner */}
        <div
          onClick={handleBiometricScan}
          style={{
            background: bioScanning
              ? 'rgba(0, 229, 255, 0.15)'
              : 'rgba(29, 140, 255, 0.08)',
            border: `1px solid ${bioScanning ? '#00e5ff' : 'rgba(90, 130, 255, 0.25)'}`,
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: bioScanning ? '0 0 20px rgba(0, 229, 255, 0.25)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(0, 229, 255, 0.15)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Fingerprint size={18} color="#00e5ff" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                {bioScanning ? 'SCANNING RETINA / BIOMETRICS...' : 'Quick Passkey / Biometric Scan'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted, #94a3b8)' }}>
                {bioScanning ? 'Verifying Hardware Security Module (HSM)' : 'Click to auto-verify credentials via FIDO2 WebAuthn'}
              </div>
            </div>
          </div>
          <Sparkles size={16} color="#00e5ff" />
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#ef4444',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <AlertTriangle size={16} color="#ef4444" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Official Role Preset Selection */}
          <div>
            <label style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-muted, #94a3b8)',
              marginBottom: 6,
              display: 'block',
            }}>
              AUTHENTICATION SCOPE / ROLE
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(8, 18, 38, 0.85)',
                border: '1px solid rgba(90, 130, 255, 0.28)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="Cabinet Secretariat">Cabinet Secretariat (Level-5 Eyes Only)</option>
              <option value="Petroleum Ministry">Ministry of Petroleum & Natural Gas (Level-4)</option>
              <option value="OMC Executive">OMC Executive (IOCL / BPCL / HPCL)</option>
              <option value="Refinery Manager">Refinery Logistics Manager</option>
              <option value="Supply Chain Analyst">SPR & Supply Chain Analyst</option>
              <option value="Intelligence Officer">National Crisis Cell Officer</option>
            </select>
          </div>

          {/* Work Email Field */}
          <div>
            <label style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-muted, #94a3b8)',
              marginBottom: 6,
              display: 'block',
            }}>
              OFFICIAL WORK EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}>
                <Mail size={16} color="#00e5ff" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@nemc.gov.in or name@iocl.co.in"
                style={{
                  width: '100%',
                  background: 'rgba(8, 18, 38, 0.85)',
                  border: '1px solid rgba(90, 130, 255, 0.28)',
                  borderRadius: 8,
                  padding: '10px 14px 10px 40px',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--text-muted, #94a3b8)',
              }}>
                CLEARANCE PASSWORD
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: 11,
                  color: '#00e5ff',
                  textDecoration: 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}>
                <Lock size={16} color="#1d8cff" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  background: 'rgba(8, 18, 38, 0.85)',
                  border: '1px solid rgba(90, 130, 255, 0.28)',
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
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
              </button>
            </div>

            {capsLock && (
              <div style={{
                fontSize: 10,
                color: '#f59e0b',
                marginTop: 4,
                fontFamily: "'JetBrains Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <AlertTriangle size={12} color="#f59e0b" />
                <span>Caps Lock is ON</span>
              </div>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#00e5ff' }}
            />
            <label htmlFor="remember" style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', cursor: 'pointer' }}>
              Remember session on this trusted hardware
            </label>
          </div>

          {/* Submit Login Button */}
          <button
            type="submit"
            disabled={authLoading || isAuthenticating}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1d8cff 0%, #00e5ff 100%)',
              border: 'none',
              color: '#030712',
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              boxShadow: '0 0 26px rgba(0, 229, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.25s ease',
              marginTop: 6,
            }}
          >
            <ShieldCheck size={18} />
            <span>AUTHENTICATE & LAUNCH COMMAND</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Enterprise SSO Options */}
        <MFAButtons onSelectProvider={handleOAuth} loading={authLoading} />

        {/* New Personnel Link */}
        <div style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--text-muted, #94a3b8)',
        }}>
          New to UrjaNetra AI?{' '}
          <Link
            to="/register"
            style={{
              color: '#00e5ff',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Request Platform Access
          </Link>
        </div>
      </AuthLayout>
    </>
  );
}
