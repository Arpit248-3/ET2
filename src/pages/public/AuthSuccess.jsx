/**
 * AuthSuccess — Mission Control Initialization & Authorization Success Page.
 * Displays progress bar loading sequence: Risk Engine, Economic Engine, AI Copilot, etc., then redirects to /command-center.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import { ShieldCheck, CheckCircle2, Cpu, ArrowRight } from 'lucide-react';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const [progress, setProgress] = useState(0);
  const [currentModule, setCurrentModule] = useState('Initializing National Energy Engine...');

  const modules = [
    'Loading Risk Engine...',
    'Loading Economic Impact Engine...',
    'Warming UrjaNetra AI Copilot...',
    'Loading Procurement Optimizer...',
    'Loading Compliance Shield...',
    'Loading Strategic Reserve Planner...',
    'Loading Timeline Engine...',
    'Mission Control Ready!',
  ];

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += 14;
      if (p <= 100) {
        setProgress(p);
        const moduleIdx = Math.min(Math.floor((p / 100) * modules.length), modules.length - 1);
        setCurrentModule(modules[moduleIdx]);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          navigate('/command-center');
        }, 600);
      }
    }, 350);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <AuthLayout
      title="Identity & Clearance Verified"
      subtitle="Access granted to India's National Energy Command Platform"
      badge="LEVEL-5 GRANTED"
      vaultStatus="ACCESS GRANTED"
    >
      <div style={{
        textAlign: 'center',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* Glowing Success Badge Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.15)',
          border: '2px solid #22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)',
        }}>
          <CheckCircle2 size={36} color="#22c55e" />
        </div>

        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
            NATIONAL COMMAND CENTER UNLOCKED
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)' }}>
            Session authenticated with Level-5 RSA-2048 encryption token
          </p>
        </div>

        {/* Progress Bar Container */}
        <div style={{ width: '100%', maxWidth: 420, marginTop: 10 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 6,
          }}>
            <span style={{ color: '#00e5ff' }}>{currentModule}</span>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>{progress}%</span>
          </div>

          <div style={{
            width: '100%',
            height: 8,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(0, 229, 255, 0.3)',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #1d8cff 0%, #00e5ff 50%, #22c55e 100%)',
              boxShadow: '0 0 16px rgba(0, 229, 255, 0.6)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/command-center')}
          style={{
            marginTop: 16,
            width: '100%',
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
            boxShadow: '0 0 24px rgba(0, 229, 255, 0.35)',
          }}
        >
          <Cpu size={18} />
          <span>ENTER MISSION CONTROL IMMEDIATELY</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </AuthLayout>
  );
}
