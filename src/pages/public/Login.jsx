import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight, ChevronRight } from 'lucide-react';

// Animated India outline with glowing nodes
function GlowingIndiaMap() {
  const nodes = [
    { x: 148, y: 148, color: '#00bfff', pulse: 2 },
    { x: 295, y: 175, color: '#00e5ff', pulse: 2.4 },
    { x: 290, y: 205, color: '#8b5cf6', pulse: 1.8 },
    { x: 190, y: 190, color: '#22c55e', pulse: 2.2 },
    { x: 240, y: 265, color: '#1d8cff', pulse: 2.6 },
    { x: 185, y: 260, color: '#8b5cf6', pulse: 2.1 },
    { x: 258, y: 118, color: '#f59e0b', pulse: 1.6 },
    { x: 220, y: 308, color: '#00e5ff', pulse: 2.8 },
    { x: 268, y: 60, color: '#1d8cff', pulse: 3 },
  ];
  const lines = [[0,3],[3,1],[1,2],[3,4],[4,5],[0,6],[3,7]];

  return (
    <svg viewBox="0 0 400 340" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0a1628" />
          <stop offset="100%" stopColor="#020810" />
        </radialGradient>
        <radialGradient id="indiaGlow" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="rgba(0,191,255,0.18)" />
          <stop offset="60%" stopColor="rgba(29,140,255,0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="strongGlow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="400" height="340" fill="url(#bgGlow)" />

      {/* Grid dots */}
      {[...Array(10)].map((_, i) => [...Array(9)].map((_, j) => (
        <circle key={`${i}-${j}`} cx={i * 44 + 2} cy={j * 40 + 2} r="0.8" fill="rgba(29,140,255,0.12)" />
      )))}

      {/* India glow fill */}
      <ellipse cx="210" cy="200" rx="110" ry="145" fill="url(#indiaGlow)" />

      {/* India outline — glowing blue */}
      <polygon
        points="130,30 180,25 220,32 255,38 280,55 300,75 318,100 325,130 320,160 310,185 325,210 330,235 318,265 300,290 275,305 250,310 225,308 200,295 178,275 160,255 150,230 142,205 138,180 135,155 138,128 148,105 155,80 148,55"
        fill="rgba(0,191,255,0.05)"
        stroke="rgba(0,191,255,0.7)"
        strokeWidth="1.5"
        filter="url(#glow)"
      />
      {/* Inner glow border */}
      <polygon
        points="130,30 180,25 220,32 255,38 280,55 300,75 318,100 325,130 320,160 310,185 325,210 330,235 318,265 300,290 275,305 250,310 225,308 200,295 178,275 160,255 150,230 142,205 138,180 135,155 138,128 148,105 155,80 148,55"
        fill="none"
        stroke="rgba(0,229,255,0.3)"
        strokeWidth="0.5"
      />

      {/* Connection lines */}
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(0,229,255,0.2)"
          strokeWidth="0.8"
          strokeDasharray="3 4"
        >
          <animate attributeName="stroke-opacity" values="0.1;0.35;0.1" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
        </line>
      ))}

      {/* Energy nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="18" fill="none" stroke={n.color} strokeWidth="0.8" opacity="0.3">
            <animate attributeName="r" values={`8;22;8`} dur={`${n.pulse}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur={`${n.pulse}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={n.x} cy={n.y} r="5" fill={n.color} filter="url(#strongGlow)" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur={`${n.pulse * 0.8}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={n.x} cy={n.y} r="2.5" fill="white" opacity="0.9" />
        </g>
      ))}

      {/* Particle dots floating */}
      {[...Array(18)].map((_, i) => {
        const sx = 90 + Math.random() * 220;
        const sy = 20 + Math.random() * 290;
        return (
          <circle key={`p${i}`} cx={sx} cy={sy} r="1" fill="rgba(0,229,255,0.5)" opacity="0.4">
            <animate attributeName="opacity" values="0.1;0.7;0.1" dur={`${2 + (i % 5) * 0.7}s`} repeatCount="indefinite" begin={`${i * 0.2}s`} />
          </circle>
        );
      })}

      {/* Bottom horizon glow */}
      <ellipse cx="210" cy="330" rx="130" ry="18" fill="rgba(0,191,255,0.15)" filter="url(#glow)" />
      <ellipse cx="210" cy="330" rx="80" ry="10" fill="rgba(0,229,255,0.2)" />
    </svg>
  );
}

const ssoOptions = [
  { icon: '🔐', label: 'SSO / SAML Login', sub: 'Login with your organization' },
  { icon: '🛡️', label: 'Two-Factor Authentication', sub: 'Secure your account with 2FA' },
  { icon: '🔑', label: 'API Key Access', sub: 'For developers & service accounts' },
  { icon: '👁️', label: 'Biometric Login', sub: 'Use fingerprint or face ID' },
  { icon: '💳', label: 'Smart Card Login', sub: 'Use your digital smart card' },
  { icon: '📋', label: 'Backup Code Login', sub: 'Login using recovery codes' },
  { icon: '👤', label: 'Guest Access', sub: 'Limited read-only access' },
  { icon: '🎧', label: 'Help & Support', sub: 'Get assistance to access' },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1100));
    localStorage.setItem('urja_auth', JSON.stringify({ name: 'Arjun Mehta', role: 'Commander, NEMC', email: email || 'arjun.mehta@nemc.gov.in' }));
    navigate('/command-center');
    setLoading(false);
  };

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
        {/* Animated map background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.7 }}>
          <GlowingIndiaMap />
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 460 }}>
          {/* Logo */}
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
                <path d="M12 2v10M3 7l9 5M21 7l-9 5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                UrjaNetra <span style={{ background: 'linear-gradient(90deg,#1d8cff,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b', letterSpacing: '0.05em', fontWeight: 500 }}>National Energy Resilience Platform</div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
            <span style={{ color: '#f1f5f9' }}>AI-Powered </span>
            <span style={{ background: 'linear-gradient(90deg,#1d8cff,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence.</span>
            <br />
            <span style={{ color: '#f1f5f9' }}>National Energy </span>
            <span style={{ background: 'linear-gradient(90deg,#8b5cf6,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Resilience.</span>
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 36, maxWidth: 380 }}>
            Secure India's energy future with real-time risk intelligence, scenario simulation, and AI-driven decision support.
          </p>

          {/* Feature bullets */}
          {[
            { icon: '🛡️', title: 'Detect Risks', sub: 'Real-time monitoring of global threats & disruptions' },
            { icon: '🤖', title: 'Simulate Scenarios', sub: 'AI models predict impacts across supply chains' },
            { icon: '🎯', title: 'Optimize Decisions', sub: 'Find the best options for procurement & reserves' },
            { icon: '📊', title: 'Act with Confidence', sub: 'AI-validated recommendations for national readiness' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0, fontSize: 15,
                background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f1f5f9', marginBottom: 1 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{f.sub}</div>
              </div>
            </div>
          ))}

          {/* Security strip */}
          <div style={{ display: 'flex', gap: 20, marginTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
            {[['🔒', '256-bit Encryption', 'End-to-end data protection'], ['🏛️', 'Secure Command Env.', 'Isolated, monitored, & resilient'], ['🎛️', 'Role-Based Access Control', 'Least-privilege, every time']].map(([icon, label, sub]) => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{ fontSize: 13, marginBottom: 3 }}>{icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 1 }}>{label}</div>
                <div style={{ fontSize: 9, color: '#374151' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div style={{
        width: 460, minWidth: 460,
        background: 'rgba(5,12,28,0.97)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 36px',
        overflowY: 'auto',
        borderLeft: '1px solid rgba(90,130,255,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4, letterSpacing: '-0.02em' }}>Welcome Back</h2>
            <p style={{ fontSize: 12, color: '#64748b' }}>Access the UrjaNetra AI Command Platform</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '5px 10px' }}>
            <Shield size={11} style={{ color: '#4ade80' }} />
            <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, letterSpacing: '0.06em' }}>Secure Access</span>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569', zIndex: 1 }} />
            <input
              className="input-field"
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{ paddingLeft: 38 }}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569', zIndex: 1 }} />
            <input
              className="input-field"
              type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ paddingLeft: 38, paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0,
            }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: '#1d8cff', width: 14, height: 14 }} />
              <span style={{ fontSize: 12.5, color: '#94a3b8' }}>Remember me</span>
            </label>
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#60b4ff', fontFamily: 'inherit' }}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '12px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'rgba(29,140,255,0.5)' : 'linear-gradient(135deg, #1d8cff 0%, #8b5cf6 100%)',
            color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(29,140,255,0.35)',
            transition: 'all 0.2s',
            marginTop: 2,
          }}>
            {loading ? (
              <>
                <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Signing In...
              </>
            ) : (
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 14px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
          <span style={{ fontSize: 11, color: '#475569' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
        </div>

        {/* Social providers */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11.5, color: '#64748b', marginBottom: 10, fontWeight: 500 }}>Sign in with</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Microsoft', logo: '⊞', color: '#0078d4' },
              { label: 'Google', logo: 'G', color: '#ea4335' },
              { label: 'gov.in', logo: '🇮🇳', color: '#f59e0b' },
              { label: 'Apple', logo: '', color: '#f8fafc' },
            ].map(p => (
              <button key={p.label} onClick={() => handleLogin()} style={{
                padding: '9px 6px', borderRadius: 8, border: '1px solid var(--border-soft)',
                background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(29,140,255,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
              >
                <span style={{ fontSize: 16 }}>{p.logo}</span>
                <span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 600 }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Create account CTA */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, padding: '10px 14px',
          background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 10,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>New to UrjaNetra AI?</div>
            <div style={{ fontSize: 10.5, color: '#64748b' }}>Create an account in minutes</div>
          </div>
          <Link to="/register" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
            color: '#a78bfa', fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
          }}>
            Create New Account <ArrowRight size={12} />
          </Link>
        </div>

        {/* More SSO options */}
        <p style={{ fontSize: 10.5, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>More Sign In Options</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
          {ssoOptions.map(opt => (
            <button key={opt.label} onClick={() => handleLogin()} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(29,140,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>{opt.icon}</span>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8' }}>{opt.label}</div>
                <div style={{ fontSize: 9.5, color: '#475569' }}>{opt.sub}</div>
              </div>
              <ChevronRight size={10} style={{ color: '#374151', marginLeft: 'auto' }} />
            </button>
          ))}
        </div>

        {/* Security footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Lock size={11} style={{ color: '#374151' }} />
            <span style={{ fontSize: 10, color: '#374151' }}>Your data is secure, encrypted, and protected. All access is monitored and authorized.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
