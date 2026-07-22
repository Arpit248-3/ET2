import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const BACKEND = 'http://localhost:8000/api/auth';

const ROLES = [
  { value: 'National Energy Commander', icon: '⚡', color: '#ef4444', desc: 'Supreme NEMC command authority' },
  { value: 'Executive Director (Cabinet Level)', icon: '🏛️', color: '#f59e0b', desc: 'Cabinet-level executive decisions' },
  { value: 'SPR Administrator', icon: '🛢️', color: '#8b5cf6', desc: 'Strategic petroleum reserve ops' },
  { value: 'Procurement Director', icon: '🚢', color: '#3b82f6', desc: 'Supply chain & crude procurement' },
  { value: 'Risk Intelligence Analyst', icon: '🎯', color: '#22c55e', desc: 'Real-time risk & threat analysis' },
  { value: 'Compliance Officer', icon: '🛡️', color: '#00e5ff', desc: 'Regulatory compliance & audit' },
];

function Particle({ style }) {
  return <div style={{ position: 'absolute', width: 2, height: 2, borderRadius: '50%', background: 'rgba(0,229,255,0.5)', animation: 'floatParticle 8s linear infinite', ...style }} />;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1); // 1 = credentials, 2 = MFA
  const [form, setForm] = useState({ email: '', password: '', role: 'National Energy Commander' });
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [sessionTicket, setSessionTicket] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [roleOpen, setRoleOpen] = useState(false);

  const mfaRefs = useRef([]);

  useEffect(() => {
    if (isAuthenticated) navigate('/command-center', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setForm(f => ({ ...f, role: role.value }));
    setRoleOpen(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');
      setSessionTicket(data.session_ticket);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaInput = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...mfaCode];
    next[idx] = val;
    setMfaCode(next);
    if (val && idx < 5) mfaRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) mfaRefs.current[idx - 1]?.focus();
  };

  const handleMfaKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !mfaCode[idx] && idx > 0) {
      mfaRefs.current[idx - 1]?.focus();
    }
  };

  const handleMfaPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setMfaCode(text.split(''));
      mfaRefs.current[5]?.focus();
    }
  };

  const handleVerifyMFA = async () => {
    const code = mfaCode.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/verify-mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code, session_ticket: sessionTicket, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'MFA verification failed');
      setSuccess(true);
      setTimeout(() => {
        login(data.token, data.user);
        navigate('/command-center', { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.message || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${(i * 5 + 3) % 100}%`,
    top: `${(i * 7 + 10) % 100}%`,
    animationDelay: `${(i * 0.4) % 8}s`,
    animationDuration: `${6 + (i % 4)}s`,
    opacity: 0.3 + (i % 5) * 0.1,
  }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Orbitron:wght@400;700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .urja-auth-page {
          min-height: 100vh;
          background: #020d1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .urja-auth-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .urja-auth-glow {
          position: fixed;
          width: 600px; height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }

        @keyframes floatParticle {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        @keyframes scanline {
          from { top: -2px; }
          to { top: 100%; }
        }

        @keyframes successPulse {
          0% { opacity: 0; transform: scale(0.8); }
          50% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }

        .urja-auth-card {
          position: relative;
          width: 460px;
          background: rgba(8, 18, 38, 0.85);
          border: 1px solid rgba(0,229,255,0.15);
          border-radius: 20px;
          padding: 40px 44px;
          backdrop-filter: blur(24px);
          box-shadow: 0 0 80px rgba(0,229,255,0.06), 0 32px 64px rgba(0,0,0,0.6);
          animation: slideUp 0.6s ease;
          z-index: 10;
          overflow: hidden;
        }

        .urja-auth-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,229,255,0.6), transparent);
        }

        .urja-scanline {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent);
          animation: scanline 4s linear infinite;
          pointer-events: none;
        }

        .urja-logo-ring {
          width: 72px; height: 72px;
          border-radius: 50%;
          border: 2px solid rgba(0,229,255,0.4);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          position: relative;
          animation: pulse-ring 3s ease-in-out infinite;
          background: rgba(0,229,255,0.06);
        }

        .urja-logo-ring::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid rgba(0,229,255,0.15);
        }

        .urja-field-wrap {
          position: relative;
          margin-bottom: 18px;
        }

        .urja-input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          background: rgba(0,229,255,0.04);
          border: 1px solid rgba(0,229,255,0.15);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.25s;
        }
        .urja-input::placeholder { color: rgba(148,163,184,0.5); }
        .urja-input:focus {
          border-color: rgba(0,229,255,0.6);
          background: rgba(0,229,255,0.07);
          box-shadow: 0 0 0 3px rgba(0,229,255,0.08);
        }

        .urja-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          pointer-events: none;
        }

        .urja-submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #0ea5e9, #00e5ff);
          border: none;
          border-radius: 10px;
          color: #020d1a;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Orbitron', monospace;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }
        .urja-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(0,229,255,0.4);
        }
        .urja-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .urja-mfa-grid {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 24px 0;
        }

        .urja-mfa-digit {
          width: 52px; height: 58px;
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          font-family: 'Orbitron', monospace;
          background: rgba(0,229,255,0.05);
          border: 1px solid rgba(0,229,255,0.2);
          border-radius: 10px;
          color: #00e5ff;
          outline: none;
          transition: all 0.2s;
          caret-color: #00e5ff;
        }
        .urja-mfa-digit:focus {
          border-color: #00e5ff;
          box-shadow: 0 0 0 3px rgba(0,229,255,0.15);
          background: rgba(0,229,255,0.1);
        }

        .urja-role-selector {
          position: relative;
          margin-bottom: 18px;
        }

        .urja-role-btn {
          width: 100%;
          padding: 13px 16px;
          background: rgba(0,229,255,0.04);
          border: 1px solid rgba(0,229,255,0.15);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .urja-role-btn:hover, .urja-role-btn.open {
          border-color: rgba(0,229,255,0.5);
          background: rgba(0,229,255,0.07);
        }

        .urja-role-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: rgba(8,18,38,0.98);
          border: 1px solid rgba(0,229,255,0.2);
          border-radius: 12px;
          overflow: hidden;
          z-index: 999;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7);
        }

        .urja-role-option {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .urja-role-option:last-child { border-bottom: none; }
        .urja-role-option:hover { background: rgba(0,229,255,0.08); }

        .urja-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 10px 14px;
          color: #fca5a5;
          font-size: 12px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .urja-success-overlay {
          position: absolute;
          inset: 0;
          background: rgba(8,18,38,0.97);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          z-index: 100;
          animation: successPulse 0.5s ease;
        }

        .urja-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }
        .urja-divider::before, .urja-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(0,229,255,0.1);
        }
      `}</style>

      <div className="urja-auth-page">
        {/* Animated background */}
        <div className="urja-auth-grid" />
        <div className="urja-auth-glow" style={{ top: '-200px', left: '-200px', background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)' }} />
        <div className="urja-auth-glow" style={{ bottom: '-200px', right: '-200px', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />
        {particles.map((p, i) => <Particle key={i} style={p} />)}

        <div className="urja-auth-card">
          <div className="urja-scanline" />

          {/* Success Overlay */}
          {success && (
            <div className="urja-success-overlay">
              <div style={{ fontSize: 60, marginBottom: 20, animation: 'pulse-ring 1s infinite' }}>✅</div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 16, color: '#22c55e', fontWeight: 700, marginBottom: 8 }}>ACCESS GRANTED</div>
              <div style={{ color: 'rgba(148,163,184,0.8)', fontSize: 13 }}>Deploying to Command Center…</div>
              <div style={{ marginTop: 24, display: 'flex', gap: 6 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: `pulse-ring ${0.5 + i * 0.15}s ease-in-out infinite alternate` }} />
                ))}
              </div>
            </div>
          )}

          {/* Logo + Title */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="urja-logo-ring">
              <span style={{ fontSize: 28 }}>⚡</span>
            </div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: '#00e5ff', letterSpacing: '0.2em', marginBottom: 4 }}>
              URJANETRA AI
            </div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              National Energy Resilience Command Platform
            </div>
          </div>

          {step === 1 ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Operator Authentication</div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>Secure access — NEMC classified systems</div>
              </div>

              {error && <div className="urja-error">⚠️ {error}</div>}

              <form onSubmit={handleLogin}>
                {/* Role Selector */}
                <div className="urja-role-selector">
                  <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', marginBottom: 6, letterSpacing: '0.05em' }}>OPERATOR ROLE</div>
                  <button type="button" className={`urja-role-btn ${roleOpen ? 'open' : ''}`} onClick={() => setRoleOpen(o => !o)}>
                    <span style={{ fontSize: 18 }}>{selectedRole.icon}</span>
                    <span style={{ flex: 1 }}>{selectedRole.value}</span>
                    <span style={{ color: 'rgba(148,163,184,0.5)', fontSize: 12 }}>{roleOpen ? '▲' : '▼'}</span>
                  </button>
                  {roleOpen && (
                    <div className="urja-role-dropdown">
                      {ROLES.map(r => (
                        <div key={r.value} className="urja-role-option" onClick={() => handleRoleSelect(r)}>
                          <span style={{ fontSize: 20 }}>{r.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{r.value}</div>
                            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.55)' }}>{r.desc}</div>
                          </div>
                          {selectedRole.value === r.value && <span style={{ marginLeft: 'auto', color: '#00e5ff' }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="urja-field-wrap">
                  <span className="urja-input-icon">📧</span>
                  <input
                    className="urja-input"
                    type="email" name="email" required
                    placeholder="operator@nemc.gov.in"
                    value={form.email} onChange={handleChange}
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="urja-field-wrap">
                  <span className="urja-input-icon">🔐</span>
                  <input
                    className="urja-input"
                    style={{ paddingRight: 46 }}
                    type={showPassword ? 'text' : 'password'}
                    name="password" required
                    placeholder="Classified access key"
                    value={form.password} onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.5)', fontSize: 14 }}
                  >{showPassword ? '🙈' : '👁️'}</button>
                </div>

                <button className="urja-submit-btn" type="submit" disabled={loading}>
                  {loading ? '⟳ AUTHENTICATING…' : '⚡ AUTHENTICATE'}
                </button>
              </form>

              <div className="urja-divider">
                <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)' }}>No clearance?</span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/register')}
                style={{ width: '100%', padding: 12, background: 'transparent', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 10, color: '#00e5ff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter' }}
              >
                Register as NEMC Operator →
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>TOTP Verification</div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>
                  Enter 6-digit code from your authenticator
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#00e5ff', background: 'rgba(0,229,255,0.07)', borderRadius: 6, padding: '6px 12px', display: 'inline-block' }}>
                  📧 {form.email}
                </div>
              </div>

              {error && <div className="urja-error">⚠️ {error}</div>}

              <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', textAlign: 'center', marginBottom: 4, letterSpacing: '0.1em' }}>
                6-DIGIT TOTP CODE
              </div>

              <div className="urja-mfa-grid" onPaste={handleMfaPaste}>
                {mfaCode.map((d, i) => (
                  <input
                    key={i}
                    ref={el => mfaRefs.current[i] = el}
                    className="urja-mfa-digit"
                    maxLength={1} value={d}
                    onChange={e => handleMfaInput(i, e.target.value)}
                    onKeyDown={e => handleMfaKeyDown(i, e)}
                    inputMode="numeric"
                  />
                ))}
              </div>

              <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', textAlign: 'center', marginBottom: 20 }}>
                💡 For demo: enter any 6-digit number (e.g. 123456)
              </div>

              <button className="urja-submit-btn" onClick={handleVerifyMFA} disabled={loading || mfaCode.join('').length !== 6}>
                {loading ? '⟳ VERIFYING…' : '🔓 GRANT ACCESS'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setMfaCode(['','','','','','']); setError(''); }}
                style={{ width: '100%', marginTop: 12, padding: 10, background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'rgba(148,163,184,0.6)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}
              >
                ← Back to credentials
              </button>
            </>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: 'rgba(148,163,184,0.3)', letterSpacing: '0.08em' }}>
            🔒 MINISTRY OF PETROLEUM & NATURAL GAS · LEVEL-5 CLASSIFIED · NEMC v2.1
          </div>
        </div>
      </div>
    </>
  );
}
