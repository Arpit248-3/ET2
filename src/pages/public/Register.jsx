import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowRight, Check, User, Mail, Phone, Lock, Building, Briefcase, MapPin } from 'lucide-react';

function GlowingIndiaMap() {
  const nodes = [
    { x: 148, y: 148, color: '#00bfff', pulse: 2 },
    { x: 295, y: 175, color: '#00e5ff', pulse: 2.4 },
    { x: 290, y: 205, color: '#8b5cf6', pulse: 1.8 },
    { x: 190, y: 190, color: '#22c55e', pulse: 2.2 },
    { x: 240, y: 265, color: '#1d8cff', pulse: 2.6 },
    { x: 185, y: 260, color: '#8b5cf6', pulse: 2.1 },
    { x: 258, y: 118, color: '#f59e0b', pulse: 1.6 },
  ];
  return (
    <svg viewBox="0 0 400 340" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <radialGradient id="bgGlow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0a1628" />
          <stop offset="100%" stopColor="#020810" />
        </radialGradient>
        <radialGradient id="indiaGlow2" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="rgba(0,191,255,0.18)" />
          <stop offset="60%" stopColor="rgba(29,140,255,0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="strongGlow2">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="400" height="340" fill="url(#bgGlow2)" />
      {[...Array(10)].map((_, i) => [...Array(9)].map((_, j) => (
        <circle key={`${i}-${j}`} cx={i * 44 + 2} cy={j * 40 + 2} r="0.8" fill="rgba(29,140,255,0.12)" />
      )))}
      <ellipse cx="210" cy="200" rx="110" ry="145" fill="url(#indiaGlow2)" />
      <polygon
        points="130,30 180,25 220,32 255,38 280,55 300,75 318,100 325,130 320,160 310,185 325,210 330,235 318,265 300,290 275,305 250,310 225,308 200,295 178,275 160,255 150,230 142,205 138,180 135,155 138,128 148,105 155,80 148,55"
        fill="rgba(0,191,255,0.05)" stroke="rgba(0,191,255,0.7)" strokeWidth="1.5" filter="url(#glow2)"
      />
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="18" fill="none" stroke={n.color} strokeWidth="0.8" opacity="0.3">
            <animate attributeName="r" values="8;22;8" dur={`${n.pulse}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur={`${n.pulse}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={n.x} cy={n.y} r="5" fill={n.color} filter="url(#strongGlow2)" opacity="0.9" />
          <circle cx={n.x} cy={n.y} r="2.5" fill="white" opacity="0.9" />
        </g>
      ))}
      <ellipse cx="210" cy="330" rx="130" ry="18" fill="rgba(0,191,255,0.15)" filter="url(#glow2)" />
    </svg>
  );
}

const InputField = ({ icon: Icon, placeholder, type = 'text', value, onChange, children }) => (
  <div style={{ position: 'relative' }}>
    {Icon && <Icon size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', zIndex: 1 }} />}
    {children || (
      <input
        className="input-field"
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ paddingLeft: Icon ? 36 : 13, fontSize: 12.5 }}
      />
    )}
  </div>
);

export default function Register() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', preferredName: '', email: '', confirmEmail: '',
    mobile: '', altMobile: '', password: '', confirmPassword: '',
    ministry: '', org: '', designation: '', employeeId: '',
    location: '', workAddress: '', dob: '', gender: '',
    clearance: '', reportingAuth: '', areas: '',
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const pwChecks = [
    { label: '8+ characters', ok: form.password.length >= 8 },
    { label: '1 uppercase', ok: /[A-Z]/.test(form.password) },
    { label: '1 lowercase', ok: /[a-z]/.test(form.password) },
    { label: '1 number', ok: /\d/.test(form.password) },
    { label: '1 special character', ok: /[^A-Za-z0-9]/.test(form.password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    localStorage.setItem('urja_auth', JSON.stringify({ name: form.fullName || 'New User', role: form.designation || 'User', email: form.email }));
    navigate('/command-center');
    setLoading(false);
  };

  const inputStyle = { paddingLeft: 36, fontSize: 12.5 };
  const inputStyleNoIcon = { fontSize: 12.5 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#020810', overflow: 'hidden' }}>
      {/* ─── LEFT PANEL ─── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, #030f22 0%, #020810 100%)',
        borderRight: '1px solid rgba(0,191,255,0.12)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 48px',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.7 }}>
          <GlowingIndiaMap />
        </div>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 460 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #0066cc, #00e5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0,229,255,0.4)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="#fff" strokeWidth="1.5" fill="none" />
                <circle cx="12" cy="12" r="3" fill="#00e5ff" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                UrjaNetra <span style={{ background: 'linear-gradient(90deg,#1d8cff,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b', letterSpacing: '0.05em', fontWeight: 500 }}>National Energy Resilience Platform</div>
            </div>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
            <span style={{ color: '#f1f5f9' }}>AI-Powered </span>
            <span style={{ background: 'linear-gradient(90deg,#1d8cff,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence.</span>
            <br />
            <span style={{ color: '#f1f5f9' }}>National Energy </span>
            <span style={{ background: 'linear-gradient(90deg,#8b5cf6,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Resilience.</span>
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 32, maxWidth: 380 }}>
            Secure India's energy future with real-time risk intelligence, scenario simulation, and AI-driven decision support.
          </p>
          {[
            { icon: '🛡️', title: 'Detect Risks', sub: 'Real-time monitoring of global threats & disruptions' },
            { icon: '🤖', title: 'Simulate Scenarios', sub: 'AI models predict impacts across supply chains' },
            { icon: '🎯', title: 'Optimize Decisions', sub: 'Find the best options for procurement & reserves' },
            { icon: '📊', title: 'Act with Confidence', sub: 'AI-validated recommendations for national readiness' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, fontSize: 14, background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 1 }}>{f.title}</div>
                <div style={{ fontSize: 10.5, color: '#475569', lineHeight: 1.5 }}>{f.sub}</div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 16, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            {[['🔒', '256-bit Encryption'], ['🏛️', 'Secure Command Env.'], ['🎛️', 'Role-Based Access Control']].map(([icon, label]) => (
              <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>{icon}</span>
                <span style={{ fontSize: 9.5, color: '#475569', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div style={{
        width: 520, minWidth: 520,
        background: 'rgba(5,12,28,0.97)',
        display: 'flex', flexDirection: 'column',
        padding: '32px 36px',
        overflowY: 'auto',
        borderLeft: '1px solid rgba(90,130,255,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 3, letterSpacing: '-0.02em' }}>Create Your Account</h2>
            <p style={{ fontSize: 11.5, color: '#64748b' }}>Join the UrjaNetra AI Command Platform</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '5px 10px' }}>
            <Shield size={11} style={{ color: '#4ade80' }} />
            <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>Secure Registration</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Personal Info */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Personal Information</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <User size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" placeholder="Full Name" value={form.fullName} onChange={set('fullName')} style={inputStyle} />
              </div>
              <div style={{ position: 'relative' }}>
                <User size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" placeholder="Preferred Name (Optional)" value={form.preferredName} onChange={set('preferredName')} style={inputStyle} />
              </div>
              <div style={{ position: 'relative' }}>
                <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" type="email" placeholder="Work Email" value={form.email} onChange={set('email')} style={inputStyle} />
              </div>
              <div style={{ position: 'relative' }}>
                <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" type="email" placeholder="Confirm Email" value={form.confirmEmail} onChange={set('confirmEmail')} style={inputStyle} />
              </div>
              <div style={{ position: 'relative', display: 'flex', gap: 0 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#64748b', zIndex: 1, fontWeight: 600 }}>+91</span>
                <input className="input-field" placeholder="Mobile Number" value={form.mobile} onChange={set('mobile')} style={{ paddingLeft: 44, fontSize: 12.5 }} />
              </div>
              <div style={{ position: 'relative' }}>
                <Phone size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" placeholder="Alternate Number (Optional)" value={form.altMobile} onChange={set('altMobile')} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Security</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Lock size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} style={{ ...inputStyle, paddingRight: 38 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" type={showConfirmPass ? 'text' : 'password'} placeholder="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} style={{ ...inputStyle, paddingRight: 38 }} />
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
                  {showConfirmPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              {pwChecks.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.ok ? '#22c55e' : 'rgba(255,255,255,0.08)', border: `1px solid ${c.ok ? '#22c55e' : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.ok && <Check size={7} style={{ color: 'white' }} />}
                  </div>
                  <span style={{ fontSize: 9.5, color: c.ok ? '#4ade80' : '#475569' }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Organization */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Organization Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Building size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <select className="input-field" value={form.ministry} onChange={set('ministry')} style={{ paddingLeft: 36 }}>
                  <option value="">Ministry / Department</option>
                  <option>Ministry of Petroleum</option>
                  <option>Ministry of Power</option>
                  <option>NEMC</option>
                  <option>PMO</option>
                  <option>Cabinet Secretariat</option>
                </select>
              </div>
              <div style={{ position: 'relative' }}>
                <Building size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" placeholder="Organization / Institution" value={form.org} onChange={set('org')} style={inputStyle} />
              </div>
              <div style={{ position: 'relative' }}>
                <Briefcase size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <select className="input-field" value={form.designation} onChange={set('designation')} style={{ paddingLeft: 36 }}>
                  <option value="">Designation / Role</option>
                  <option>Commander</option>
                  <option>Analyst</option>
                  <option>Director</option>
                  <option>Secretary</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ position: 'relative' }}>
                <Briefcase size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" placeholder="Employee ID (Optional)" value={form.employeeId} onChange={set('employeeId')} style={inputStyle} />
              </div>
              <div style={{ position: 'relative' }}>
                <MapPin size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <select className="input-field" value={form.location} onChange={set('location')} style={{ paddingLeft: 36 }}>
                  <option value="">Office Location</option>
                  <option>New Delhi</option>
                  <option>Mumbai</option>
                  <option>Chennai</option>
                  <option>Kolkata</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ position: 'relative' }}>
                <MapPin size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" placeholder="Work Address" value={form.workAddress} onChange={set('workAddress')} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Additional */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Additional Information</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input className="input-field" type="date" placeholder="Date of Birth" value={form.dob} onChange={set('dob')} style={inputStyleNoIcon} />
              <select className="input-field" value={form.gender} onChange={set('gender')} style={inputStyleNoIcon}>
                <option value="">Gender</option>
                <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
              </select>
              <select className="input-field" value={form.clearance} onChange={set('clearance')} style={inputStyleNoIcon}>
                <option value="">Security Clearance Level</option>
                <option>Unclassified</option><option>Restricted</option><option>Confidential</option><option>Secret</option><option>Top Secret</option>
              </select>
              <div style={{ position: 'relative' }}>
                <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="input-field" type="email" placeholder="Reporting Authority (Email)" value={form.reportingAuth} onChange={set('reportingAuth')} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginTop: 8, position: 'relative' }}>
              <textarea className="input-field" placeholder="Areas of Responsibility" value={form.areas} onChange={set('areas')} rows={2}
                style={{ resize: 'none', fontSize: 12.5, paddingRight: 60 }} />
              <span style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 9.5, color: '#475569' }}>{form.areas.length}/500</span>
            </div>
          </div>

          {/* Terms */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ accentColor: '#1d8cff', width: 14, height: 14 }} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              I agree to the{' '}
              <span style={{ color: '#60b4ff', cursor: 'pointer' }}>Terms of Service</span>
              {' '}and{' '}
              <span style={{ color: '#60b4ff', cursor: 'pointer' }}>Privacy Policy</span>
            </span>
          </label>

          {/* Submit */}
          <button type="submit" disabled={loading || !agreed} style={{
            padding: '12px', borderRadius: 8, border: 'none',
            cursor: (loading || !agreed) ? 'not-allowed' : 'pointer',
            background: (loading || !agreed) ? 'rgba(29,140,255,0.3)' : 'linear-gradient(135deg, #1d8cff 0%, #8b5cf6 100%)',
            color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: agreed ? '0 4px 20px rgba(29,140,255,0.35)' : 'none',
            transition: 'all 0.2s',
          }}>
            {loading ? (
              <>
                <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Creating Account...
              </>
            ) : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12.5, color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#60b4ff', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
