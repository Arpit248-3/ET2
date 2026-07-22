import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, User, Mail, Phone, FileText, Building2, Lock, KeyRound,
  CheckCircle2, ArrowRight, ArrowLeft, Upload, FileCheck, AlertTriangle
} from 'lucide-react';
import QuantumCanvas from '../../components/ui/QuantumCanvas.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

const DEPARTMENTS = [
  'National Energy Management Centre (NEMC)',
  'Ministry of Petroleum & Natural Gas (MoPNG)',
  'Indian Oil Corporation Limited (IOCL)',
  'Bharat Petroleum Corporation Limited (BPCL)',
  'Hindustan Petroleum Corporation Limited (HPCL)',
  'Reliance Industries Limited (RIL Jamnagar)',
  'Oil & Natural Gas Corporation (ONGC)',
];

const CLEARANCE_LEVELS = [
  { level: 'LEVEL-1', title: 'Level 1: Public Read-Only', desc: 'Standard data feeds & public reports' },
  { level: 'LEVEL-3', title: 'Level 3: Restricted Operational', desc: 'Refinery compatibility, SPR inventory & routing' },
  { level: 'LEVEL-5', title: 'Level 5: Executive Command (Eyes Only)', desc: 'Crisis mode escalation, PMO briefs & overrides' },
];

export default function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    idType: 'Aadhaar Card',
    idNumber: '',
    department: DEPARTMENTS[0],
    designation: '',
    clearanceLevel: 'LEVEL-3',
    operationalDomain: 'Maritime Logistics & Procurement',
    password: '',
    confirmPassword: '',
    twoFactorMethod: 'Authenticator App (TOTP)',
    dutyJustification: '',
    uploadedFileName: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleChange('uploadedFileName', file.name);
      addToast(`Attached authorization order: ${file.name}`, 'info');
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.fullName || !formData.email || !formData.email.includes('@')) {
        addToast('Please enter your full name and valid government/enterprise email.', 'error');
        return;
      }
    }
    if (currentStep === 3) {
      if (formData.password.length < 6) {
        addToast('Security passcode must be at least 6 characters.', 'error');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        addToast('Passcodes do not match.', 'error');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSubmitting(false);
    setSubmittedSuccess(true);
    addToast('Clearance request submitted to NEMC Security Officer.', 'success');
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100vw',
      overflowX: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#020712',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '40px 20px',
      boxSizing: 'border-box',
    }}>
      <QuantumCanvas accentColor="#00e5ff" />

      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: 640,
        background: 'rgba(8, 18, 35, 0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(0, 229, 255, 0.2)',
        borderRadius: 20,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 229, 255, 0.1)',
        padding: '36px 32px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0066cc, #00e5ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
            }}>
              <Shield size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                UrjaNetra <span style={{ color: '#00e5ff' }}>AI</span>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.05em', fontWeight: 600 }}>
                ENTERPRISE OPERATOR ONBOARDING
              </div>
            </div>
          </div>

          <Link to="/login" style={{ fontSize: 12, color: '#00e5ff', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={14} /> Back to Gateway
          </Link>
        </div>

        {/* Progress Bar */}
        {!submittedSuccess && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              {['Identity', 'Clearance', 'Credentials', 'Authorization'].map((stepName, i) => (
                <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: currentStep === i + 1 ? '#00e5ff' : currentStep > i + 1 ? '#22c55e' : '#64748b',
                  }}>
                    STEP {i + 1}
                  </div>
                  <div style={{ fontSize: 10, color: currentStep === i + 1 ? '#ffffff' : '#64748b', fontWeight: 600 }}>
                    {stepName}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${(currentStep / 4) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #1d8cff, #00e5ff)', transition: 'all 0.3s' }} />
            </div>
          </div>
        )}

        {/* ── SUCCESS STATE ───────────────────────────────────────────────────── */}
        {submittedSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '2px solid #22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle2 size={36} color="#22c55e" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 8 }}>
              Clearance Application Transmitted
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 24px' }}>
              Your Enterprise Registration for <strong style={{ color: '#00e5ff' }}>{formData.fullName}</strong> ({formData.department}) has been submitted. Level-5 Security Officers will verify your official credentials within 2 hours.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 28px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #1d8cff, #00e5ff)',
                color: '#081223',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Return to Login Gateway
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitRegistration}>
            {/* ── STEP 1: IDENTITY ─────────────────────────────────────────────── */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Arjun Mehta"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Government / Official Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="arjun.mehta@nemc.gov.in"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Official Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Government ID Type</label>
                    <select
                      value={formData.idType}
                      onChange={(e) => handleChange('idType', e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0b1526', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="Aadhaar Card">Aadhaar Card (12-digit)</option>
                      <option value="Permanent Employee ID">Permanent Employee ID</option>
                      <option value="Diplomatic / Official Passport">Official Passport</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>ID Document Number</label>
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => handleChange('idNumber', e.target.value)}
                      placeholder="XXXX-XXXX-XXXX"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: CLEARANCE LEVEL & DEPARTMENT ────────────────────────── */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Department / Organization</label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0b1526', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Official Title / Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => handleChange('designation', e.target.value)}
                    placeholder="Chief Logistics Strategist"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Security Clearance Tier Request</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {CLEARANCE_LEVELS.map((c) => (
                      <div
                        key={c.level}
                        onClick={() => handleChange('clearanceLevel', c.level)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${formData.clearanceLevel === c.level ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
                          background: formData.clearanceLevel === c.level ? 'rgba(0, 229, 255, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>{c.title}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: CREDENTIALS & 2FA ────────────────────────────────────── */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Create Security Passcode</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Enter strong password"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Confirm Security Passcode</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Preferred 2FA Hardware / App</label>
                  <select
                    value={formData.twoFactorMethod}
                    onChange={(e) => handleChange('twoFactorMethod', e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0b1526', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="Authenticator App (TOTP)">Authenticator App (Google/YubiKey TOTP)</option>
                    <option value="Hardware Token Key">FIDO2 Hardware Security Key</option>
                    <option value="SMS OTP (Government Mobile)">SMS OTP to Registered Government Mobile</option>
                  </select>
                </div>
              </div>
            )}

            {/* ── STEP 4: AUTHORIZATION DOCUMENT ──────────────────────────────── */}
            {currentStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Operational Reason / Duty Assignment</label>
                  <textarea
                    rows={3}
                    value={formData.dutyJustification}
                    onChange={(e) => handleChange('dutyJustification', e.target.value)}
                    placeholder="Briefly state your assignment reason (e.g. Assigned to Strait of Hormuz maritime disruption response team)..."
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Official Assignment Order (PDF/Image)</label>
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    borderRadius: 10,
                    border: '1px dashed rgba(0, 229, 255, 0.4)',
                    background: 'rgba(0, 229, 255, 0.03)',
                    cursor: 'pointer',
                  }}>
                    <Upload size={24} color="#00e5ff" style={{ marginBottom: 6 }} />
                    <span style={{ fontSize: 12, color: '#ffffff', fontWeight: 600 }}>
                      {formData.uploadedFileName || 'Click or drag official clearance order file'}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>PDF, PNG, JPG up to 10MB</span>
                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            )}

            {/* Form Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Previous
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    marginLeft: 'auto',
                    padding: '12px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #1d8cff, #00e5ff)',
                    color: '#081223',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Next Step <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginLeft: 'auto',
                    padding: '12px 28px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #22c55e, #00e5ff)',
                    color: '#081223',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Submitting Application...' : 'Submit Clearance Request'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
