import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const BACKEND = 'http://localhost:8000/api/auth';

const ROLES = [
  { value: 'National Energy Commander', icon: '⚡', desc: 'Supreme NEMC command authority' },
  { value: 'Executive Director (Cabinet Level)', icon: '🏛️', desc: 'Cabinet-level executive decisions' },
  { value: 'SPR Administrator', icon: '🛢️', desc: 'Strategic petroleum reserve ops' },
  { value: 'Procurement Director', icon: '🚢', desc: 'Supply chain & crude procurement' },
  { value: 'Risk Intelligence Analyst', icon: '🎯', desc: 'Real-time risk & threat analysis' },
  { value: 'Compliance Officer', icon: '🛡️', desc: 'Regulatory compliance & audit' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
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

  const handleChange = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError(''); };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setForm(f => ({ ...f, role: role.value }));
    setRoleOpen(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');
      setSessionTicket(data.session_ticket);
      setStep(2);
    } catch (err) { setError(err.message || 'Authentication failed.'); }
    finally { setLoading(false); }
  };

  const handleMfaInput = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...mfaCode]; next[idx] = val; setMfaCode(next);
    if (val && idx < 5) mfaRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) mfaRefs.current[idx - 1]?.focus();
  };

  const handleMfaKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !mfaCode[idx] && idx > 0) mfaRefs.current[idx - 1]?.focus();
  };

  const handleMfaPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) { setMfaCode(text.split('')); mfaRefs.current[5]?.focus(); }
  };

  const handleVerifyMFA = async () => {
    const code = mfaCode.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/verify-mfa`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code, session_ticket: sessionTicket, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'MFA verification failed');
      setSuccess(true);
      setTimeout(() => { login(data.token, data.user); navigate('/command-center', { replace: true }); }, 1500);
    } catch (err) { setError(err.message || 'Invalid code.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }

        .ln-page {
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: #020d1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          position: relative;
        }

        .ln-bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .ln-glow1 {
          position: absolute; top: -15%; left: -10%;
          width: 50vw; height: 50vw;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%);
          filter: blur(60px); pointer-events: none;
        }

        .ln-glow2 {
          position: absolute; bottom: -15%; right: -10%;
          width: 40vw; height: 40vw;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%);
          filter: blur(60px); pointer-events: none;
        }

        @keyframes ln-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes ln-scan {
          from { top: -2px; } to { top: 100%; }
        }

        @keyframes ln-pulse {
          0%,100% { opacity: 0.7; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.04); }
        }

        .ln-card {
          position: relative;
          z-index: 10;
          width: min(420px, 94vw);
          max-height: 95vh;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          background: rgba(8,18,38,0.88);
          border: 1px solid rgba(0,229,255,0.14);
          border-radius: 16px;
          padding: clamp(20px, 4vh, 32px) clamp(20px, 5vw, 36px);
          backdrop-filter: blur(20px);
          box-shadow: 0 0 60px rgba(0,229,255,0.05), 0 24px 48px rgba(0,0,0,0.55);
          animation: ln-slide-up 0.5s ease;
        }
        .ln-card::-webkit-scrollbar { display: none; }

        .ln-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,229,255,0.5), transparent);
        }

        .ln-scan {
          position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,229,255,0.25), transparent);
          animation: ln-scan 4s linear infinite;
          pointer-events: none;
        }

        .ln-logo {
          width: 52px; height: 52px; border-radius: 50%;
          border: 1.5px solid rgba(0,229,255,0.35);
          background: rgba(0,229,255,0.06);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin: 0 auto 12px;
          animation: ln-pulse 3s ease-in-out infinite;
        }

        .ln-brand { font-family: 'Orbitron', monospace; font-size: 9px; font-weight: 700; color: #00e5ff; letter-spacing: 0.2em; text-align: center; }
        .ln-sub   { font-size: 9px; color: rgba(148,163,184,0.55); letter-spacing: 0.1em; text-align: center; text-transform: uppercase; margin-top: 2px; }
        .ln-title { font-size: 15px; font-weight: 700; color: #e2e8f0; text-align: center; margin: 10px 0 2px; }
        .ln-hint  { font-size: 11px; color: rgba(148,163,184,0.55); text-align: center; margin-bottom: 14px; }

        .ln-label { font-size: 10px; color: rgba(148,163,184,0.65); letter-spacing: 0.06em; margin-bottom: 5px; display: block; }

        .ln-field { position: relative; margin-bottom: 12px; }

        .ln-input {
          width: 100%;
          padding: 10px 12px 10px 38px;
          background: rgba(0,229,255,0.04);
          border: 1px solid rgba(0,229,255,0.14);
          border-radius: 8px;
          color: #e2e8f0; font-size: 13px;
          font-family: 'Inter', sans-serif;
          outline: none; transition: all 0.2s;
        }
        .ln-input::placeholder { color: rgba(148,163,184,0.4); }
        .ln-input:focus {
          border-color: rgba(0,229,255,0.5);
          background: rgba(0,229,255,0.06);
          box-shadow: 0 0 0 2px rgba(0,229,255,0.07);
        }
        .ln-icon {
          position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
          font-size: 14px; pointer-events: none;
        }

        .ln-role-btn {
          width: 100%;
          padding: 10px 12px;
          background: rgba(0,229,255,0.04);
          border: 1px solid rgba(0,229,255,0.14);
          border-radius: 8px; color: #e2e8f0; font-size: 12px;
          font-family: 'Inter', sans-serif;
          display: flex; align-items: center; gap: 8px;
          cursor: pointer; transition: all 0.2s; text-align: left;
        }
        .ln-role-btn:hover {
          border-color: rgba(0,229,255,0.4);
          background: rgba(0,229,255,0.06);
        }

        .ln-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: rgba(6,15,32,0.99);
          border: 1px solid rgba(0,229,255,0.18);
          border-radius: 10px; overflow: hidden; z-index: 200;
          box-shadow: 0 16px 40px rgba(0,0,0,0.7);
        }

        .ln-option {
          padding: 9px 12px; display: flex; align-items: center; gap: 10px;
          cursor: pointer; transition: background 0.12s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .ln-option:last-child { border-bottom: none; }
        .ln-option:hover { background: rgba(0,229,255,0.07); }

        .ln-btn {
          width: 100%; padding: 11px;
          background: linear-gradient(135deg, #0ea5e9, #00e5ff);
          border: none; border-radius: 8px;
          color: #020d1a; font-size: 12px; font-weight: 700;
          font-family: 'Orbitron', monospace; letter-spacing: 0.08em;
          cursor: pointer; transition: all 0.25s; margin-top: 6px;
        }
        .ln-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,229,255,0.35); }
        .ln-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .ln-ghost-btn {
          width: 100%; padding: 10px;
          background: transparent; border: 1px solid rgba(0,229,255,0.18);
          border-radius: 8px; color: #00e5ff; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
          margin-top: 10px;
        }
        .ln-ghost-btn:hover { background: rgba(0,229,255,0.06); }

        .ln-error {
          background: rgba(239,68,68,0.09);
          border: 1px solid rgba(239,68,68,0.28);
          border-radius: 7px; padding: 8px 12px;
          color: #fca5a5; font-size: 11px;
          margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
        }

        .ln-mfa-grid {
          display: flex; gap: 8px; justify-content: center;
          margin: 14px 0 10px;
        }

        .ln-mfa-digit {
          width: 44px; height: 50px; text-align: center;
          font-size: 20px; font-weight: 700;
          font-family: 'Orbitron', monospace;
          background: rgba(0,229,255,0.05);
          border: 1px solid rgba(0,229,255,0.18);
          border-radius: 8px; color: #00e5ff; outline: none;
          transition: all 0.18s;
        }
        .ln-mfa-digit:focus {
          border-color: #00e5ff;
          box-shadow: 0 0 0 2px rgba(0,229,255,0.12);
          background: rgba(0,229,255,0.09);
        }

        .ln-divider {
          display: flex; align-items: center; gap: 10px; margin: 12px 0;
        }
        .ln-divider::before, .ln-divider::after {
          content: ''; flex: 1; height: 1px; background: rgba(0,229,255,0.09);
        }

        .ln-success-overlay {
          position: absolute; inset: 0;
          background: rgba(8,18,38,0.97);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          border-radius: 16px; z-index: 100;
          animation: ln-slide-up 0.4s ease;
        }

        .ln-footer {
          text-align: center; margin-top: 12px;
          font-size: 9px; color: rgba(148,163,184,0.28);
          letter-spacing: 0.07em;
        }

        @media (max-height: 600px) {
          .ln-card { padding: 14px 20px; }
          .ln-logo { width: 40px; height: 40px; font-size: 18px; margin-bottom: 8px; }
          .ln-title { font-size: 13px; margin: 6px 0 2px; }
          .ln-mfa-digit { width: 38px; height: 44px; font-size: 17px; }
          .ln-mfa-grid { gap: 6px; }
        }
      `}</style>

      <div className="ln-page">
        <div className="ln-bg-grid" />
        <div className="ln-glow1" />
        <div className="ln-glow2" />

        <div className="ln-card">
          <div className="ln-scan" />

          {/* Success overlay */}
          {success && (
            <div className="ln-success-overlay">
              <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 13, color: '#22c55e', fontWeight: 700 }}>ACCESS GRANTED</div>
              <div style={{ color: 'rgba(148,163,184,0.7)', fontSize: 11, marginTop: 6 }}>Deploying to Command Center…</div>
            </div>
          )}

          {/* Logo */}
          <div className="ln-logo">⚡</div>
          <div className="ln-brand">URJANETRA AI</div>
          <div className="ln-sub">National Energy Resilience Command Platform</div>

          {step === 1 ? (
            <>
              <div className="ln-title">Operator Authentication</div>
              <div className="ln-hint">Secure access — NEMC classified systems</div>

              {error && <div className="ln-error">⚠️ {error}</div>}

              <form onSubmit={handleLogin}>
                {/* Role */}
                <label className="ln-label">OPERATOR ROLE</label>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <button type="button" className="ln-role-btn" onClick={() => setRoleOpen(o => !o)}>
                    <span style={{ fontSize: 16 }}>{selectedRole.icon}</span>
                    <span style={{ flex: 1, fontSize: 12 }}>{selectedRole.value}</span>
                    <span style={{ color: 'rgba(148,163,184,0.4)', fontSize: 10 }}>{roleOpen ? '▲' : '▼'}</span>
                  </button>
                  {roleOpen && (
                    <div className="ln-dropdown">
                      {ROLES.map(r => (
                        <div key={r.value} className="ln-option" onClick={() => handleRoleSelect(r)}>
                          <span style={{ fontSize: 16 }}>{r.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{r.value}</div>
                            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>{r.desc}</div>
                          </div>
                          {selectedRole.value === r.value && <span style={{ color: '#00e5ff', fontSize: 11 }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="ln-field">
                  <span className="ln-icon">📧</span>
                  <input className="ln-input" type="email" name="email" required
                    placeholder="operator@nemc.gov.in" value={form.email} onChange={handleChange} />
                </div>

                {/* Password */}
                <div className="ln-field">
                  <span className="ln-icon">🔐</span>
                  <input className="ln-input" style={{ paddingRight: 38 }}
                    type={showPassword ? 'text' : 'password'} name="password" required
                    placeholder="Classified access key" value={form.password} onChange={handleChange} />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.45)', fontSize: 13 }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                <button className="ln-btn" type="submit" disabled={loading}>
                  {loading ? '⟳ AUTHENTICATING…' : '⚡ AUTHENTICATE'}
                </button>
              </form>

              <div className="ln-divider">
                <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.38)' }}>No clearance?</span>
              </div>
              <button className="ln-ghost-btn" onClick={() => navigate('/register')} style={{ marginTop: 0 }}>
                Register as NEMC Operator →
              </button>
            </>
          ) : (
            <>
              <div className="ln-title">TOTP Verification</div>
              <div className="ln-hint">Enter 6-digit code from your authenticator</div>
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: '#00e5ff', background: 'rgba(0,229,255,0.07)', borderRadius: 5, padding: '4px 10px' }}>📧 {form.email}</span>
              </div>

              {error && <div className="ln-error">⚠️ {error}</div>}

              <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.45)', textAlign: 'center', letterSpacing: '0.1em' }}>6-DIGIT TOTP CODE</div>
              <div className="ln-mfa-grid" onPaste={handleMfaPaste}>
                {mfaCode.map((d, i) => (
                  <input key={i} ref={el => mfaRefs.current[i] = el}
                    className="ln-mfa-digit" maxLength={1} value={d}
                    onChange={e => handleMfaInput(i, e.target.value)}
                    onKeyDown={e => handleMfaKeyDown(i, e)} inputMode="numeric" />
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.38)', textAlign: 'center', marginBottom: 12 }}>
                💡 Demo: enter any 6 digits (e.g. 123456)
              </div>

              <button className="ln-btn" onClick={handleVerifyMFA} disabled={loading || mfaCode.join('').length !== 6}>
                {loading ? '⟳ VERIFYING…' : '🔓 GRANT ACCESS'}
              </button>

              <button type="button" onClick={() => { setStep(1); setMfaCode(['','','','','','']); setError(''); }}
                style={{ width: '100%', marginTop: 8, padding: 9, background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, color: 'rgba(148,163,184,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter' }}>
                ← Back to credentials
              </button>
            </>
          )}

          <div className="ln-footer">🔒 MINISTRY OF PETROLEUM & NATURAL GAS · NEMC v2.1</div>
        </div>
      </div>
    </>
  );
}
