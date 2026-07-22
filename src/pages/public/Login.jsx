import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Lock, Mail, Eye, EyeOff, CheckCircle2, AlertCircle,
  ArrowRight, Server, Activity, Globe, KeyRound, Cpu, Shield, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginOAuth, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('arjun.mehta@nemc.gov.in');
  const [password, setPassword] = useState('UrjaNetra#2026');
  const [role, setRole] = useState('Cabinet Secretariat');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [statusState, setStatusState] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter your work email and security key.');
      setStatusState('error');
      return;
    }

    setStatusState('loading');
    try {
      await login(email, password, role);
      setStatusState('success');
      setTimeout(() => {
        navigate('/command-center');
      }, 900);
    } catch (err) {
      setStatusState('error');
      setErrorMessage(err.message || 'Invalid credentials or security token expired.');
    }
  };

  const handleSSO = async (provider) => {
    setStatusState('loading');
    try {
      await loginOAuth(provider);
      setStatusState('success');
      setTimeout(() => {
        navigate('/command-center');
      }, 900);
    } catch (err) {
      setStatusState('error');
      setErrorMessage(`${provider} authentication failed.`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* Classified Top Security Status Bar */}
      <div className="h-7 bg-[#040a18] border-b border-slate-800/80 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-red-500 font-bold">
            <Shield className="w-3 h-3 text-red-500" />
            <span>CLASSIFICATION: OFFICIAL (UNCLASSIFIED)</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>AUTH SYSTEM: <strong className="text-emerald-400">OPERATIONAL</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5">
            <Server className="w-3 h-3 text-cyan-400" />
            <span>REGION: <strong className="text-slate-200">DELHI DR SITE</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>LATENCY: 18ms</span>
          </div>
        </div>
      </div>

      {/* Main Split-Screen Container */}
      <div className="flex-1 flex min-h-[calc(100vh-28px)] relative">
        {/* ─── LEFT SIDE (Interactive Graphic & Branding HUD) ─── */}
        <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#070e1c] via-[#091326] to-[#030712] border-r border-slate-800/60 p-8 flex-col justify-between overflow-hidden">
          {/* Ambient Glowing Mesh Gradients */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Logo & Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="z-10 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070e1c] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-white">
                Urja<span className="text-cyan-400">Netra</span> <span className="text-blue-500">AI</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
                National Energy Resilience Command
              </div>
            </div>
          </motion.div>

          {/* Center Dynamic Glassmorphism Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="z-10 my-auto bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-black/80 relative"
          >
            {/* Pulsing Security Badge Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
                />
                <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                  Zero-Trust Identity Sentinel
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-1 rounded-full">
                HSM FIPS 140-3
              </span>
            </div>

            {/* Platform Metrics HUD Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Security Standard', val: 'AES-256-GCM', icon: Lock, color: 'text-cyan-400' },
                { label: 'Session Integrity', val: '99.99% Verified', icon: ShieldCheck, color: 'text-emerald-400' },
                { label: 'Active Pipelines', val: '48 Synchronized', icon: Activity, color: 'text-blue-400' },
                { label: 'Threat Sentinel', val: '0 Intrusions', icon: Globe, color: 'text-purple-400' },
              ].map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={i}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
                      <Icon className={`w-4 h-4 ${metric.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                        {metric.label}
                      </div>
                      <div className="text-xs font-bold text-white truncate">
                        {metric.val}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Terminal Log Readout */}
            <div className="bg-[#040812] border border-slate-800/90 rounded-lg p-3 font-mono text-[10px] text-slate-400 space-y-1">
              <div className="text-cyan-400 font-bold flex items-center gap-1.5 mb-1.5">
                <Server className="w-3 h-3" /> LIVE AUDIT TELEMETRY STREAM
              </div>
              <div className="text-emerald-400 flex items-center gap-2">
                <span className="text-slate-500">[08:42:01]</span>
                <span>mTLS 1.3 Handshake Confirmed with Cabinet Cell</span>
              </div>
              <div className="text-slate-300 flex items-center gap-2">
                <span className="text-slate-500">[08:42:04]</span>
                <span>2-Factor Hardware Token Synced via FIDO2</span>
              </div>
            </div>
          </motion.div>

          {/* Bottom Security Compliance Footer */}
          <div className="z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-4 border-t border-slate-800/60">
            <span>SOC2 TYPE II COMPLIANT</span>
            <span>•</span>
            <span>NITI AAYOG CERTIFIED</span>
            <span>•</span>
            <span>ISO 27001</span>
          </div>
        </div>

        {/* ─── RIGHT SIDE (Clean Enterprise Form Area) ─── */}
        <div className="flex-1 bg-[#030712] flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 rounded-2xl p-8 shadow-2xl shadow-black/80"
          >
            {/* Header & Title */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 text-xs font-mono font-semibold mb-3">
                <Shield className="w-3.5 h-3.5" />
                CLASSIFIED AUTHENTICATION
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Command Portal
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Enter your credentials to access India's National Energy Command Platform.
              </p>
            </div>

            {/* Validation Error Banner (Framer Motion Shake) */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10, x: [-10, 10, -5, 5, 0] }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="mb-6 p-3.5 rounded-xl bg-red-950/80 border border-red-800/70 text-red-300 text-xs font-mono flex items-start gap-2.5"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-200">Authentication Error</span>
                    {errorMessage}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Scope Selection */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  AUTHENTICATION SCOPE / ROLE
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    tabIndex={0}
                    aria-label="Select Authentication Role"
                    className="w-full bg-slate-950/90 border border-slate-700/70 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all cursor-pointer"
                  >
                    <option value="Cabinet Secretariat">Cabinet Secretariat (Level-5 Eyes Only)</option>
                    <option value="Petroleum Ministry">Ministry of Petroleum & Natural Gas (Level-4)</option>
                    <option value="OMC Executive">OMC Executive (IOCL / BPCL / HPCL)</option>
                    <option value="Refinery Manager">Refinery Logistics Manager</option>
                    <option value="Supply Chain Analyst">SPR & Supply Chain Analyst</option>
                    <option value="Intelligence Officer">National Crisis Cell Officer</option>
                  </select>
                </div>
              </div>

              {/* Work Email Input */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  OFFICIAL WORK EMAIL
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className={`w-4 h-4 transition-colors ${focusedInput === 'email' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  </div>
                  <input
                    type="email"
                    required
                    tabIndex={0}
                    aria-label="Official Work Email"
                    value={email}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@nemc.gov.in"
                    className="w-full bg-slate-950/90 border border-slate-700/70 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input with Visibility Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                    CLEARANCE PASSWORD
                  </label>
                  <Link
                    to="/forgot-password"
                    tabIndex={0}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors focus:outline-none focus:underline"
                  >
                    Forgot Key?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className={`w-4 h-4 transition-colors ${focusedInput === 'password' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    tabIndex={0}
                    aria-label="Clearance Password"
                    value={password}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/90 border border-slate-700/70 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  />
                  <button
                    type="button"
                    tabIndex={0}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Action Button with Smooth State Transitions */}
              <motion.button
                type="submit"
                tabIndex={0}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={statusState === 'loading' || statusState === 'success'}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  statusState === 'success'
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-slate-950 shadow-cyan-500/25'
                }`}
              >
                {statusState === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                    <span>AUTHENTICATING HANDSHAKE...</span>
                  </>
                ) : statusState === 'success' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    <span>ACCESS AUTHORIZED</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-slate-950" />
                    <span>AUTHENTICATE & LAUNCH COMMAND</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Social / Enterprise SSO Options */}
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <div className="text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">
                OR CONTINUE WITH ENTERPRISE SSO
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'GovID', name: 'eSign Gov', icon: ShieldCheck, color: 'text-cyan-400' },
                  { id: 'Microsoft', name: 'Azure AD', icon: KeyRound, color: 'text-blue-400' },
                  { id: 'Google', name: 'Google Workspace', icon: Globe, color: 'text-purple-400' },
                ].map((sso) => {
                  const Icon = sso.icon;
                  return (
                    <button
                      key={sso.id}
                      type="button"
                      tabIndex={0}
                      aria-label={`Login with ${sso.name}`}
                      onClick={() => handleSSO(sso.id)}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 p-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 transition-all hover:scale-[1.02]"
                    >
                      <Icon className={`w-4 h-4 ${sso.color}`} />
                      <span className="truncate">{sso.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Request Access Link */}
            <div className="mt-6 text-center text-xs text-slate-400">
              New to UrjaNetra AI?{' '}
              <Link
                to="/register"
                tabIndex={0}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors focus:outline-none focus:underline"
              >
                Request Platform Access
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
