import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const BACKEND = 'http://localhost:8000/api/auth';

const ROLES = [
  { value: 'National Energy Commander', icon: '⚡', color: '#ef4444', clearance: 'LEVEL-5 COSMIC TOP SECRET', dept: 'NEMC Command' },
  { value: 'Executive Director (Cabinet Level)', icon: '🏛️', color: '#f59e0b', clearance: 'LEVEL-5 EYES ONLY', dept: 'Cabinet Secretariat' },
  { value: 'SPR Administrator', icon: '🛢️', color: '#8b5cf6', clearance: 'LEVEL-4 SECRET', dept: 'Strategic Petroleum Reserve' },
  { value: 'Procurement Director', icon: '🚢', color: '#3b82f6', clearance: 'LEVEL-4 SECRET', dept: 'Supply Chain & Logistics' },
  { value: 'Risk Intelligence Analyst', icon: '🎯', color: '#22c55e', clearance: 'LEVEL-3 CONFIDENTIAL', dept: 'Risk Intelligence Division' },
  { value: 'Compliance Officer', icon: '🛡️', color: '#00e5ff', clearance: 'LEVEL-3 CONFIDENTIAL', dept: 'Regulatory Compliance' },
];

const DEPARTMENTS = [
  'NEMC Command', 'Cabinet Secretariat', 'Strategic Petroleum Reserve',
  'Supply Chain & Logistics', 'Risk Intelligence Division', 'Regulatory Compliance',
  'Operations Center', 'Economic Analysis', 'External Affairs',
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: 'Risk Intelligence Analyst', department: 'Risk Intelligence Division',
    designation: '',
  });
  const [selectedRole, setSelectedRole] = useState(ROLES[4]);
  const [roleOpen, setRoleOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState('');
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
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email || !form.email.includes('@')) errs.email = 'Valid email required';
    if (!form.phone || form.phone.length < 10) errs.phone = 'Valid phone number required (min 10 digits)';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
          department: form.department,
          designation: form.designation || form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      setSuccess(true);
      setTimeout(() => {
        login(data.token, data.user);
        navigate('/command-center', { replace: true });
      }, 2200);
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Avatar initials preview
  const initials = form.full_name.trim().split(' ').map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Orbitron:wght@400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .urja-reg-page {
          min-height: 100vh;
          background: #020d1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          padding: 32px 16px;
          position: relative;
          overflow: hidden;
        }

        .urja-reg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(139,92,246,0); }
        }

        @keyframes scanline {
          from { top: -2px; } to { top: 100%; }
        }

        @keyframes successIn {
          0% { opacity: 0; transform: scale(0.85); }
          70% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }

        .urja-reg-card {
          position: relative;
          width: 520px;
          max-width: 100%;
          background: rgba(8, 18, 38, 0.9);
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 22px;
          padding: 40px 44px;
          backdrop-filter: blur(24px);
          box-shadow: 0 0 80px rgba(139,92,246,0.06), 0 32px 64px rgba(0,0,0,0.65);
          animation: slideUp 0.6s ease;
          z-index: 10;
          overflow: hidden;
        }

        .urja-reg-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(0,229,255,0.3), transparent);
        }

        .urja-scanline {
          position: absolute;
          left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent);
          animation: scanline 5s linear infinite;
          pointer-events: none;
        }

        .urja-reg-input {
          width: 100%;
          padding: 13px 16px 13px 46px;
          background: rgba(139,92,246,0.04);
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.25s;
        }
        .urja-reg-input::placeholder { color: rgba(148,163,184,0.4); }
        .urja-reg-input:focus {
          border-color: rgba(139,92,246,0.5);
          background: rgba(139,92,246,0.07);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }
        .urja-reg-input.error-field {
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.04);
        }

        .urja-reg-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .urja-field-wrap {
          position: relative;
          margin-bottom: 14px;
        }

        .urja-field-label {
          font-size: 11px;
          color: rgba(148,163,184,0.65);
          letter-spacing: 0.06em;
          margin-bottom: 6px;
          display: block;
        }

        .urja-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 15px;
          pointer-events: none;
        }

        .urja-field-error {
          color: #fca5a5;
          font-size: 11px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .urja-role-selector { position: relative; margin-bottom: 14px; }

        .urja-role-btn {
          width: 100%;
          padding: 13px 16px;
          background: rgba(139,92,246,0.05);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; transition: all 0.2s; text-align: left;
        }
        .urja-role-btn:hover { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.08); }

        .urja-role-dropdown {
          position: absolute;
          top: calc(100% + 6px); left: 0; right: 0;
          background: rgba(8,18,38,0.99);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 12px; overflow: hidden;
          z-index: 999;
          box-shadow: 0 20px 60px rgba(0,0,0,0.75);
        }

        .urja-role-option {
          padding: 11px 16px;
          display: flex; align-items: center; gap: 12px;
          cursor: pointer; transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .urja-role-option:last-child { border-bottom: none; }
        .urja-role-option:hover { background: rgba(139,92,246,0.1); }

        .urja-submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6, #a855f7);
          border: none; border-radius: 10px;
          color: #fff;
          font-size: 14px; font-weight: 700;
          font-family: 'Orbitron', monospace;
          letter-spacing: 0.08em;
          cursor: pointer; transition: all 0.3s;
          margin-top: 8px;
        }
        .urja-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(139,92,246,0.5);
        }
        .urja-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .urja-error-banner {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 10px 14px;
          color: #fca5a5; font-size: 12px;
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }

        .urja-success-overlay {
          position: absolute; inset: 0;
          background: rgba(8,18,38,0.97);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          border-radius: 22px; z-index: 100;
          animation: successIn 0.6s ease;
        }

        .urja-avatar-preview {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 20px; color: white;
          border: 2px solid rgba(139,92,246,0.4);
          flex-shrink: 0;
        }
      `}</style>

      <div className="urja-reg-page">
        <div className="urja-reg-grid" />
        <div style={{ position: 'fixed', top: '-200px', right: '-200px', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />
        <div style={{ position: 'fixed', bottom: '-100px', left: '-100px', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />

        <div className="urja-reg-card">
          <div className="urja-scanline" />

          {/* Success Overlay */}
          {success && (
            <div className="urja-success-overlay">
              <div style={{ fontSize: 56, marginBottom: 16 }}>🚀</div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 16, color: '#8b5cf6', fontWeight: 700, marginBottom: 8 }}>OPERATOR DEPLOYED</div>
              <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{form.full_name}</div>
              <div style={{ color: 'rgba(148,163,184,0.6)', fontSize: 12 }}>{selectedRole.clearance}</div>
              <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>Redirecting to Command Center…</div>
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div className="urja-avatar-preview">{initials}</div>
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.18em' }}>URJANETRA AI</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>Operator Registration</div>
              <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>NEMC Classified Access Provisioning</div>
            </div>
          </div>

          {error && <div className="urja-error-banner">⚠️ {error}</div>}

          <form onSubmit={handleRegister}>
            {/* Row 1: Name */}
            <div className="urja-field-wrap">
              <label className="urja-field-label">FULL NAME</label>
              <span className="urja-input-icon" style={{ top: 'calc(50% + 10px)' }}>👤</span>
              <input
                className={`urja-reg-input ${fieldErrors.full_name ? 'error-field' : ''}`}
                type="text" name="full_name"
                placeholder="Arjun Kumar Mehta"
                value={form.full_name} onChange={handleChange}
                autoComplete="name"
              />
              {fieldErrors.full_name && <div className="urja-field-error">⚠ {fieldErrors.full_name}</div>}
            </div>

            {/* Row 2: Email + Phone */}
            <div className="urja-reg-row">
              <div className="urja-field-wrap">
                <label className="urja-field-label">EMAIL ADDRESS</label>
                <span className="urja-input-icon" style={{ top: 'calc(50% + 10px)' }}>📧</span>
                <input
                  className={`urja-reg-input ${fieldErrors.email ? 'error-field' : ''}`}
                  type="email" name="email"
                  placeholder="officer@nemc.gov.in"
                  value={form.email} onChange={handleChange}
                  autoComplete="email"
                />
                {fieldErrors.email && <div className="urja-field-error">⚠ {fieldErrors.email}</div>}
              </div>
              <div className="urja-field-wrap">
                <label className="urja-field-label">PHONE NUMBER</label>
                <span className="urja-input-icon" style={{ top: 'calc(50% + 10px)' }}>📞</span>
                <input
                  className={`urja-reg-input ${fieldErrors.phone ? 'error-field' : ''}`}
                  type="tel" name="phone"
                  placeholder="+91 98XXXXXXXX"
                  value={form.phone} onChange={handleChange}
                  autoComplete="tel"
                />
                {fieldErrors.phone && <div className="urja-field-error">⚠ {fieldErrors.phone}</div>}
                <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', marginTop: 3 }}>Used for Collaboration Room calls</div>
              </div>
            </div>

            {/* Role Selector */}
            <div style={{ marginBottom: 4 }}>
              <label className="urja-field-label">OPERATOR ROLE & CLEARANCE</label>
            </div>
            <div className="urja-role-selector">
              <button type="button" className="urja-role-btn" onClick={() => setRoleOpen(o => !o)}>
                <span style={{ fontSize: 20 }}>{selectedRole.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedRole.value}</div>
                  <div style={{ fontSize: 10, color: selectedRole.color, marginTop: 1 }}>{selectedRole.clearance}</div>
                </div>
                <span style={{ color: 'rgba(148,163,184,0.4)', fontSize: 12 }}>{roleOpen ? '▲' : '▼'}</span>
              </button>
              {roleOpen && (
                <div className="urja-role-dropdown">
                  {ROLES.map(r => (
                    <div key={r.value} className="urja-role-option" onClick={() => handleRoleSelect(r)}>
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{r.value}</div>
                        <div style={{ fontSize: 10, color: r.color }}>{r.clearance}</div>
                      </div>
                      {selectedRole.value === r.value && <span style={{ color: '#8b5cf6' }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Row 3: Designation + Department */}
            <div className="urja-reg-row">
              <div className="urja-field-wrap">
                <label className="urja-field-label">DESIGNATION</label>
                <span className="urja-input-icon" style={{ top: 'calc(50% + 10px)' }}>🎖️</span>
                <input
                  className="urja-reg-input"
                  type="text" name="designation"
                  placeholder="e.g. Senior Analyst"
                  value={form.designation} onChange={handleChange}
                />
              </div>
              <div className="urja-field-wrap">
                <label className="urja-field-label">DEPARTMENT</label>
                <span className="urja-input-icon" style={{ top: 'calc(50% + 10px)' }}>🏢</span>
                <select
                  className="urja-reg-input"
                  name="department" value={form.department}
                  onChange={handleChange}
                  style={{ appearance: 'none' }}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d} style={{ background: '#0c1829' }}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Row 4: Password + Confirm */}
            <div className="urja-reg-row">
              <div className="urja-field-wrap">
                <label className="urja-field-label">ACCESS KEY (PASSWORD)</label>
                <span className="urja-input-icon" style={{ top: 'calc(50% + 10px)' }}>🔐</span>
                <input
                  className={`urja-reg-input ${fieldErrors.password ? 'error-field' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  placeholder="Min 6 characters"
                  value={form.password} onChange={handleChange}
                  style={{ paddingRight: 36 }}
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 12, top: 'calc(50% + 10px)', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.4)', fontSize: 13 }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
                {fieldErrors.password && <div className="urja-field-error">⚠ {fieldErrors.password}</div>}
              </div>
              <div className="urja-field-wrap">
                <label className="urja-field-label">CONFIRM KEY</label>
                <span className="urja-input-icon" style={{ top: 'calc(50% + 10px)' }}>🔑</span>
                <input
                  className={`urja-reg-input ${fieldErrors.confirmPassword ? 'error-field' : ''}`}
                  type={showCpw ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={form.confirmPassword} onChange={handleChange}
                  style={{ paddingRight: 36 }}
                />
                <button type="button" onClick={() => setShowCpw(s => !s)}
                  style={{ position: 'absolute', right: 12, top: 'calc(50% + 10px)', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.4)', fontSize: 13 }}>
                  {showCpw ? '🙈' : '👁️'}
                </button>
                {fieldErrors.confirmPassword && <div className="urja-field-error">⚠ {fieldErrors.confirmPassword}</div>}
              </div>
            </div>

            {/* Clearance Preview */}
            <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🔒</span>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.06em' }}>AUTO-ASSIGNED CLEARANCE</div>
                <div style={{ fontSize: 13, color: selectedRole.color, fontWeight: 700 }}>{selectedRole.clearance}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)' }}>DEPARTMENT</div>
                <div style={{ fontSize: 12, color: '#e2e8f0' }}>{form.department}</div>
              </div>
            </div>

            <button className="urja-submit-btn" type="submit" disabled={loading}>
              {loading ? '⟳ DEPLOYING OPERATOR…' : '🚀 REGISTER & DEPLOY TO NEMC'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(139,92,246,0.1)' }} />
            <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)' }}>Already authorized?</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(139,92,246,0.1)' }} />
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{ width: '100%', padding: 12, background: 'transparent', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, color: '#8b5cf6', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter' }}
          >
            ← Sign in to existing account
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 10, color: 'rgba(148,163,184,0.25)', letterSpacing: '0.07em' }}>
            🔒 MINISTRY OF PETROLEUM & NATURAL GAS · NEMC CLASSIFIED ACCESS CONTROL v2.1
          </div>
        </div>
      </div>
    </>
  );
}
