/**
 * Register — Request Platform Access Page (Multi-Step Form)
 * Step 1: Personal Details
 * Step 2: Organization & Clearance
 * Step 3: Government Role Selection
 * Step 4: Security Verification Documents Upload
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import RoleCards from '../../components/auth/RoleCards.jsx';
import PasswordStrength from '../../components/auth/PasswordStrength.jsx';
import {
  User, Mail, Phone, Building2, Shield, FileCheck, ArrowRight,
  ArrowLeft, Upload, CheckCircle2, Lock
} from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    workEmail: '',
    mobileNumber: '',
    ministry: 'Ministry of Petroleum & Natural Gas',
    department: 'National Energy Command',
    designation: 'Senior Director',
    employeeId: 'NEMC-2026-8849',
    role: 'Cabinet Secretariat',
    password: '',
    confirmPassword: '',
    govIdFile: null,
    empIdFile: null,
    authLetterFile: null,
  });

  const [error, setError] = useState('');

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.fullName || !formData.workEmail || !formData.mobileNumber) {
        setError('Please fill in all personal details.');
        return;
      }
    } else if (step === 2) {
      if (!formData.password || formData.password !== formData.confirmPassword) {
        setError('Passwords do not match or are invalid.');
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      // Final Submit -> Security Verification Pending page
      navigate('/security-verification', { state: { user: formData } });
    }
  };

  return (
    <AuthLayout
      title="Request Platform Access"
      subtitle="Submit security clearance application for India's National Energy Command Platform"
      badge="CLEARANCE FORM AP-2026"
    >
      {/* Multi-step progress bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottom: '1px solid rgba(90, 130, 255, 0.15)',
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--text-dim, #64748b)',
      }}>
        {[
          { num: 1, label: 'PERSONAL' },
          { num: 2, label: 'ORGANIZATION' },
          { num: 3, label: 'ROLE' },
          { num: 4, label: 'DOCUMENTS' },
        ].map(s => (
          <div
            key={s.num}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: s.num === step ? '#00e5ff' : s.num < step ? '#22c55e' : '#64748b',
              fontWeight: s.num === step ? 800 : 600,
            }}
          >
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: s.num === step ? 'rgba(0,229,255,0.2)' : s.num < step ? 'rgba(34,197,94,0.2)' : 'transparent',
              border: `1px solid ${s.num === step ? '#00e5ff' : s.num < step ? '#22c55e' : '#64748b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
            }}>
              {s.num < step ? '✓' : s.num}
            </div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

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

      <form onSubmit={handleNextStep}>
        {/* STEP 1: PERSONAL DETAILS */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', display: 'block', marginBottom: 4 }}>FULL LEGAL NAME</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                placeholder="Dr. Arjun R. Mehta"
                style={{ width: '100%', background: 'rgba(8,18,38,0.8)', border: '1px solid rgba(90,130,255,0.25)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', display: 'block', marginBottom: 4 }}>OFFICIAL GOVT WORK EMAIL</label>
              <input
                type="email"
                required
                value={formData.workEmail}
                onChange={e => handleChange('workEmail', e.target.value)}
                placeholder="arjun.mehta@nemc.gov.in"
                style={{ width: '100%', background: 'rgba(8,18,38,0.8)', border: '1px solid rgba(90,130,255,0.25)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', display: 'block', marginBottom: 4 }}>MOBILE NUMBER</label>
                <input
                  type="tel"
                  required
                  value={formData.mobileNumber}
                  onChange={e => handleChange('mobileNumber', e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: '100%', background: 'rgba(8,18,38,0.8)', border: '1px solid rgba(90,130,255,0.25)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', display: 'block', marginBottom: 4 }}>PREFERRED NAME</label>
                <input
                  type="text"
                  value={formData.preferredName}
                  onChange={e => handleChange('preferredName', e.target.value)}
                  placeholder="Arjun"
                  style={{ width: '100%', background: 'rgba(8,18,38,0.8)', border: '1px solid rgba(90,130,255,0.25)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ORGANIZATION & CLEARANCE */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', display: 'block', marginBottom: 4 }}>MINISTRY / AGENCY</label>
                <input
                  type="text"
                  value={formData.ministry}
                  onChange={e => handleChange('ministry', e.target.value)}
                  style={{ width: '100%', background: 'rgba(8,18,38,0.8)', border: '1px solid rgba(90,130,255,0.25)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', display: 'block', marginBottom: 4 }}>EMPLOYEE ID</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={e => handleChange('employeeId', e.target.value)}
                  style={{ width: '100%', background: 'rgba(8,18,38,0.8)', border: '1px solid rgba(90,130,255,0.25)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', display: 'block', marginBottom: 4 }}>CREATE PASSWORD</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => handleChange('password', e.target.value)}
                placeholder="••••••••••••"
                style={{ width: '100%', background: 'rgba(8,18,38,0.8)', border: '1px solid rgba(90,130,255,0.25)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }}
              />
              <PasswordStrength password={formData.password} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', display: 'block', marginBottom: 4 }}>CONFIRM PASSWORD</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={e => handleChange('confirmPassword', e.target.value)}
                placeholder="••••••••••••"
                style={{ width: '100%', background: 'rgba(8,18,38,0.8)', border: '1px solid rgba(90,130,255,0.25)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }}
              />
            </div>
          </div>
        )}

        {/* STEP 3: ROLE SELECTION */}
        {step === 3 && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              SELECT ASSIGNED GOVERNMENT / ENTERPRISE ROLE
            </label>
            <RoleCards selectedRole={formData.role} onSelectRole={r => handleChange('role', r)} />
          </div>
        )}

        {/* STEP 4: DOCUMENTS UPLOAD */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', marginBottom: 4 }}>
              Upload official credential documentation for government verification & Level-5 security clearance.
            </div>

            {[
              { id: 'govIdFile', label: 'Government Photo ID (Aadhaar / Passport)' },
              { id: 'empIdFile', label: 'Official Employee ID Card' },
              { id: 'authLetterFile', label: 'Department Head Authorization Letter' },
            ].map(doc => (
              <div
                key={doc.id}
                style={{
                  background: 'rgba(8, 18, 38, 0.6)',
                  border: '1px stroke rgba(90,130,255,0.2)',
                  borderStyle: 'dashed',
                  borderColor: 'rgba(0,229,255,0.4)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Upload size={18} color="#00e5ff" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>{doc.label}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>PDF, PNG, JPG (Max 10MB)</div>
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(0,229,255,0.1)',
                    border: '1px solid rgba(0,229,255,0.3)',
                    color: '#00e5ff',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  UPLOAD
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Form Controls */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                background: 'rgba(8,18,38,0.8)',
                border: '1px solid rgba(90,130,255,0.25)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          <button
            type="submit"
            style={{
              flex: 1,
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
            }}
          >
            <span>{step === 4 ? 'SUBMIT CLEARANCE APPLICATION' : 'NEXT STEP'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
        Already have an authorized account?{' '}
        <Link to="/login" style={{ color: '#00e5ff', fontWeight: 700, textDecoration: 'none' }}>
          Sign In Here
        </Link>
      </div>
    </AuthLayout>
  );
}
