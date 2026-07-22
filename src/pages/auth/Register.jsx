import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const BACKEND = 'http://localhost:8000/api/auth';

const ROLES = [
  { value: 'System Administrator',              icon: '👑', color: '#a855f7', clearance: 'LEVEL-5 COSMIC TOP SECRET', dept: 'UrjaNetra System Admin' },
  { value: 'National Energy Commander',         icon: '⚡', color: '#ef4444', clearance: 'LEVEL-5 COSMIC TOP SECRET', dept: 'NEMC Command' },
  { value: 'Executive Director (Cabinet Level)', icon: '🏛️', color: '#f59e0b', clearance: 'LEVEL-5 EYES ONLY',         dept: 'Cabinet Secretariat' },
  { value: 'SPR Administrator',                  icon: '🛢️', color: '#8b5cf6', clearance: 'LEVEL-4 SECRET',            dept: 'Strategic Petroleum Reserve' },
  { value: 'Procurement Director',               icon: '🚢', color: '#3b82f6', clearance: 'LEVEL-4 SECRET',            dept: 'Supply Chain & Logistics' },
  { value: 'Risk Intelligence Analyst',          icon: '🎯', color: '#22c55e', clearance: 'LEVEL-3 CONFIDENTIAL',      dept: 'Risk Intelligence Division' },
  { value: 'Compliance Officer',                 icon: '🛡️', color: '#00e5ff', clearance: 'LEVEL-3 CONFIDENTIAL',      dept: 'Regulatory Compliance' },
];

const DEPARTMENTS = [
  'NEMC Command','Cabinet Secretariat','Strategic Petroleum Reserve',
  'Supply Chain & Logistics','Risk Intelligence Division','Regulatory Compliance',
  'Operations Center','Economic Analysis','External Affairs',
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: 'Risk Intelligence Analyst', department: 'Risk Intelligence Division', designation: '',
  });
  const [selectedRole, setSelectedRole] = useState(ROLES[4]);
  const [roleOpen, setRoleOpen] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [e.target.name]: '' }));
    setError('');
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setForm(f => ({ ...f, role: role.value, department: role.dept }));
    setRoleOpen(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim())               errs.full_name = 'Required';
    if (!form.email || !form.email.includes('@')) errs.email = 'Valid email required';
    if (!form.phone || form.phone.replace(/\D/g,'').length < 10) errs.phone = 'Min 10 digits';
    if (!form.password || form.password.length < 6) errs.password = 'Min 6 chars';
    if (form.password !== form.confirmPassword)     errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BACKEND}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name, email: form.email, phone: form.phone,
          password: form.password, role: form.role,
          department: form.department, designation: form.designation || form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      setSuccess(true);
      setTimeout(() => { login(data.token, data.user); navigate('/command-center', { replace: true }); }, 1800);
    } catch (err) { setError(err.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const initials = form.full_name.trim().split(' ').map(w => w[0]?.toUpperCase() || '').slice(0,2).join('') || '?';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rg-page {
          min-height: 100vh;
          width: 100%;
          background: #020d1a;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          padding: clamp(12px, 3vh, 28px) clamp(10px, 4vw, 20px);
          position: relative;
          overflow-y: auto;
        }

        .rg-bg-grid {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none; z-index: 0;
        }

        .rg-glow1 {
          position: fixed; top: -10%; right: -10%;
          width: 40vw; height: 40vw; border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%);
          filter: blur(60px); pointer-events: none; z-index: 0;
        }
        .rg-glow2 {
          position: fixed; bottom: -10%; left: -10%;
          width: 35vw; height: 35vw; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%);
          filter: blur(60px); pointer-events: none; z-index: 0;
        }

        @keyframes rg-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rg-scan {
          from { top: -1px; } to { top: 100%; }
        }
        @keyframes rg-success {
          0%   { opacity: 0; transform: scale(0.88); }
          70%  { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }

        .rg-card {
          position: relative; z-index: 10;
          width: min(500px, 100%);
          background: rgba(8,18,38,0.9);
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 16px;
          padding: clamp(18px, 3.5vh, 30px) clamp(18px, 4vw, 34px);
          backdrop-filter: blur(20px);
          box-shadow: 0 0 60px rgba(139,92,246,0.06), 0 24px 48px rgba(0,0,0,0.6);
          animation: rg-up 0.5s ease;
          overflow: hidden;
        }

        .rg-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139,92,246,0.55), rgba(0,229,255,0.25), transparent);
        }

        .rg-scan {
          position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent);
          animation: rg-scan 5s linear infinite; pointer-events: none;
        }

        .rg-success-overlay {
          position: absolute; inset: 0;
          background: rgba(8,18,38,0.97);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          border-radius: 16px; z-index: 100;
          animation: rg-success 0.5s ease;
        }

        /* Header row */
        .rg-header {
          display: flex; align-items: center; gap: 14px; margin-bottom: 16px;
        }

        .rg-avatar {
          width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 17px; color: white;
          border: 1.5px solid rgba(139,92,246,0.35);
        }

        .rg-brand    { font-family: 'Orbitron', monospace; font-size: 9px; color: #8b5cf6; letter-spacing: 0.18em; font-weight: 700; }
        .rg-title    { font-size: 15px; font-weight: 700; color: #e2e8f0; margin-top: 2px; }
        .rg-subtitle { font-size: 10px; color: rgba(148,163,184,0.5); margin-top: 1px; }

        /* 2-col grid */
        .rg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 420px) { .rg-row { grid-template-columns: 1fr; } }

        .rg-field { position: relative; margin-bottom: 10px; }

        .rg-label { font-size: 9.5px; color: rgba(148,163,184,0.6); letter-spacing: 0.06em; margin-bottom: 4px; display: block; }

        .rg-input {
          width: 100%;
          padding: 9px 11px 9px 36px;
          background: rgba(139,92,246,0.04);
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 8px; color: #e2e8f0; font-size: 12px;
          font-family: 'Inter', sans-serif; outline: none; transition: all 0.2s;
        }
        .rg-input::placeholder { color: rgba(148,163,184,0.38); }
        .rg-input:focus {
          border-color: rgba(139,92,246,0.5);
          background: rgba(139,92,246,0.07);
          box-shadow: 0 0 0 2px rgba(139,92,246,0.09);
        }
        .rg-input.err { border-color: rgba(239,68,68,0.45); }

        .rg-icon {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          font-size: 13px; pointer-events: none;
        }
        /* label adjusts icon top for fields that have a label above */
        .rg-field.has-label .rg-icon { top: calc(50% + 11px); }

        .rg-ferr { color: #fca5a5; font-size: 10px; margin-top: 3px; }

        /* Role selector */
        .rg-role-selector { position: relative; margin-bottom: 10px; }
        .rg-role-btn {
          width: 100%; padding: 9px 12px;
          background: rgba(139,92,246,0.05);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 8px; color: #e2e8f0; font-size: 12px;
          font-family: 'Inter', sans-serif;
          display: flex; align-items: center; gap: 8px;
          cursor: pointer; transition: all 0.2s; text-align: left;
        }
        .rg-role-btn:hover { border-color: rgba(139,92,246,0.45); background: rgba(139,92,246,0.08); }

        .rg-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: rgba(8,18,38,0.99);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 10px; overflow: hidden; z-index: 300;
          box-shadow: 0 16px 40px rgba(0,0,0,0.75);
        }
        .rg-option {
          padding: 9px 12px; display: flex; align-items: center; gap: 10px;
          cursor: pointer; transition: background 0.12s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .rg-option:last-child { border-bottom: none; }
        .rg-option:hover { background: rgba(139,92,246,0.09); }

        /* Clearance banner */
        .rg-clearance {
          display: flex; align-items: center; gap: 10px;
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.14);
          border-radius: 8px; padding: 8px 12px;
          margin-bottom: 10px;
        }

        .rg-submit-btn {
          width: 100%; padding: 11px;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6, #a855f7);
          border: none; border-radius: 8px;
          color: #fff; font-size: 12px; font-weight: 700;
          font-family: 'Orbitron', monospace; letter-spacing: 0.07em;
          cursor: pointer; transition: all 0.25s; margin-top: 6px;
        }
        .rg-submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139,92,246,0.45); }
        .rg-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .rg-ghost-btn {
          width: 100%; padding: 10px;
          background: transparent; border: 1px solid rgba(139,92,246,0.18);
          border-radius: 8px; color: #8b5cf6; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
          margin-top: 10px;
        }
        .rg-ghost-btn:hover { background: rgba(139,92,246,0.07); }

        .rg-error-banner {
          background: rgba(239,68,68,0.09);
          border: 1px solid rgba(239,68,68,0.28);
          border-radius: 7px; padding: 8px 12px;
          color: #fca5a5; font-size: 11px;
          margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
        }

        .rg-divider {
          display: flex; align-items: center; gap: 10px; margin: 10px 0 0;
        }
        .rg-divider::before, .rg-divider::after {
          content: ''; flex: 1; height: 1px; background: rgba(139,92,246,0.09);
        }

        .rg-footer { text-align: center; margin-top: 12px; font-size: 9px; color: rgba(148,163,184,0.25); letter-spacing: 0.06em; }
      `}</style>

      <div className="rg-page">
        <div className="rg-bg-grid" />
        <div className="rg-glow1" />
        <div className="rg-glow2" />

        <div className="rg-card">
          <div className="rg-scan" />

          {/* Success overlay */}
          {success && (
            <div className="rg-success-overlay">
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 14, color: '#8b5cf6', fontWeight: 700 }}>OPERATOR DEPLOYED</div>
              <div style={{ color: '#e2e8f0', fontSize: 13, marginTop: 6, fontWeight: 600 }}>{form.full_name}</div>
              <div style={{ color: 'rgba(148,163,184,0.55)', fontSize: 11, marginTop: 3 }}>{selectedRole.clearance}</div>
              <div style={{ color: 'rgba(148,163,184,0.4)', fontSize: 10, marginTop: 12 }}>Redirecting to Command Center…</div>
            </div>
          )}

          {/* Header */}
          <div className="rg-header">
            <div className="rg-avatar">{initials}</div>
            <div>
              <div className="rg-brand">URJANETRA AI</div>
              <div className="rg-title">Operator Registration</div>
              <div className="rg-subtitle">NEMC Classified Access Provisioning</div>
            </div>
          </div>

          {error && <div className="rg-error-banner">⚠️ {error}</div>}

          <form onSubmit={handleRegister}>

            {/* Full Name */}
            <div className="rg-field has-label">
              <label className="rg-label">FULL NAME</label>
              <span className="rg-icon">👤</span>
              <input className={`rg-input ${fieldErrors.full_name ? 'err' : ''}`}
                type="text" name="full_name" placeholder="Arjun Kumar Mehta"
                value={form.full_name} onChange={handleChange} autoComplete="name" />
              {fieldErrors.full_name && <div className="rg-ferr">⚠ {fieldErrors.full_name}</div>}
            </div>

            {/* Email + Phone */}
            <div className="rg-row">
              <div className="rg-field has-label">
                <label className="rg-label">EMAIL ADDRESS</label>
                <span className="rg-icon">📧</span>
                <input className={`rg-input ${fieldErrors.email ? 'err' : ''}`}
                  type="email" name="email" placeholder="officer@nemc.gov.in"
                  value={form.email} onChange={handleChange} autoComplete="email" />
                {fieldErrors.email && <div className="rg-ferr">⚠ {fieldErrors.email}</div>}
              </div>
              <div className="rg-field has-label">
                <label className="rg-label">📞 PHONE <span style={{ color: '#00e5ff', fontSize: 9 }}>(for calls)</span></label>
                <span className="rg-icon">📞</span>
                <input className={`rg-input ${fieldErrors.phone ? 'err' : ''}`}
                  type="tel" name="phone" placeholder="+91 98XXXXXXXX"
                  value={form.phone} onChange={handleChange} autoComplete="tel" />
                {fieldErrors.phone && <div className="rg-ferr">⚠ {fieldErrors.phone}</div>}
              </div>
            </div>

            {/* Role Selector */}
            <label className="rg-label" style={{ marginBottom: 4 }}>OPERATOR ROLE & CLEARANCE</label>
            <div className="rg-role-selector">
              <button type="button" className="rg-role-btn" onClick={() => setRoleOpen(o => !o)}>
                <span style={{ fontSize: 17 }}>{selectedRole.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{selectedRole.value}</div>
                  <div style={{ fontSize: 9.5, color: selectedRole.color, marginTop: 1 }}>{selectedRole.clearance}</div>
                </div>
                <span style={{ color: 'rgba(148,163,184,0.38)', fontSize: 10 }}>{roleOpen ? '▲' : '▼'}</span>
              </button>
              {roleOpen && (
                <div className="rg-dropdown">
                  {ROLES.map(r => (
                    <div key={r.value} className="rg-option" onClick={() => handleRoleSelect(r)}>
                      <span style={{ fontSize: 16 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{r.value}</div>
                        <div style={{ fontSize: 9.5, color: r.color }}>{r.clearance}</div>
                      </div>
                      {selectedRole.value === r.value && <span style={{ color: '#8b5cf6', fontSize: 12 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Designation + Department */}
            <div className="rg-row">
              <div className="rg-field has-label">
                <label className="rg-label">DESIGNATION</label>
                <span className="rg-icon">🎖️</span>
                <input className="rg-input" type="text" name="designation"
                  placeholder="e.g. Senior Analyst"
                  value={form.designation} onChange={handleChange} />
              </div>
              <div className="rg-field has-label">
                <label className="rg-label">DEPARTMENT</label>
                <span className="rg-icon">🏢</span>
                <select className="rg-input" name="department"
                  value={form.department} onChange={handleChange}
                  style={{ appearance: 'none', paddingRight: 8 }}>
                  {DEPARTMENTS.map(d => <option key={d} value={d} style={{ background: '#0c1829' }}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="rg-row">
              <div className="rg-field has-label">
                <label className="rg-label">ACCESS KEY</label>
                <span className="rg-icon">🔐</span>
                <input className={`rg-input ${fieldErrors.password ? 'err' : ''}`}
                  type={showPw ? 'text' : 'password'} name="password"
                  placeholder="Min 6 chars"
                  value={form.password} onChange={handleChange}
                  style={{ paddingRight: 30 }} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 9, top: 'calc(50% + 11px)', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.4)', fontSize: 12 }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
                {fieldErrors.password && <div className="rg-ferr">⚠ {fieldErrors.password}</div>}
              </div>
              <div className="rg-field has-label">
                <label className="rg-label">CONFIRM KEY</label>
                <span className="rg-icon">🔑</span>
                <input className={`rg-input ${fieldErrors.confirmPassword ? 'err' : ''}`}
                  type={showCpw ? 'text' : 'password'} name="confirmPassword"
                  placeholder="Re-enter"
                  value={form.confirmPassword} onChange={handleChange}
                  style={{ paddingRight: 30 }} />
                <button type="button" onClick={() => setShowCpw(s => !s)}
                  style={{ position: 'absolute', right: 9, top: 'calc(50% + 11px)', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.4)', fontSize: 12 }}>
                  {showCpw ? '🙈' : '👁️'}
                </button>
                {fieldErrors.confirmPassword && <div className="rg-ferr">⚠ {fieldErrors.confirmPassword}</div>}
              </div>
            </div>

            {/* Clearance preview */}
            <div className="rg-clearance">
              <span style={{ fontSize: 16 }}>🔒</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9.5, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.05em' }}>AUTO-ASSIGNED CLEARANCE</div>
                <div style={{ fontSize: 12, color: selectedRole.color, fontWeight: 700, marginTop: 1 }}>{selectedRole.clearance}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9.5, color: 'rgba(148,163,184,0.4)' }}>DEPT</div>
                <div style={{ fontSize: 11, color: '#e2e8f0', marginTop: 1 }}>{form.department.split(' ')[0]}</div>
              </div>
            </div>

            <button className="rg-submit-btn" type="submit" disabled={loading}>
              {loading ? '⟳ DEPLOYING OPERATOR…' : '🚀 REGISTER & DEPLOY TO NEMC'}
            </button>
          </form>

          <div className="rg-divider">
            <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.38)' }}>Already authorized?</span>
          </div>
          <button className="rg-ghost-btn" onClick={() => navigate('/login')}>
            ← Sign in to existing account
          </button>

          <div className="rg-footer">🔒 MINISTRY OF PETROLEUM & NATURAL GAS · NEMC CLASSIFIED ACCESS CONTROL v2.1</div>
        </div>
      </div>
    </>
  );
}
