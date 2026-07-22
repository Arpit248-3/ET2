import React, { useEffect, useState } from 'react';
import { Shield, Lock, Unlock, Cpu, CheckCircle } from 'lucide-react';

export default function Vault3DAnimation({ onUnlockComplete }) {
  const [phase, setPhase] = useState('authenticating'); // authenticating -> unlocking -> open -> complete

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('unlocking'), 400);
    const t2 = setTimeout(() => setPhase('open'), 1200);
    const t3 = setTimeout(() => {
      setPhase('complete');
      if (onUnlockComplete) onUnlockComplete();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onUnlockComplete]);

  const isUnlocked = phase === 'open' || phase === 'complete';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(2, 6, 16, 0.94)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Sleek Professional Security Dial Card */}
      <div style={{
        position: 'relative',
        width: 280,
        height: 280,
        borderRadius: 24,
        background: 'rgba(10, 20, 38, 0.9)',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 229, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
        transform: isUnlocked ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Outer Circular Precision Dial */}
        <div style={{
          position: 'relative',
          width: 130,
          height: 130,
          borderRadius: '50%',
          border: '2px solid rgba(0, 229, 255, 0.25)',
          background: 'radial-gradient(circle, #0b172a 0%, #030a17 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 0 25px rgba(0, 229, 255, 0.2)',
          marginBottom: 20,
        }}>
          {/* Pulsating Lock Ring */}
          <div style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: `1.5px solid ${isUnlocked ? '#22c55e' : '#00e5ff'}`,
            opacity: 0.6,
            transition: 'all 0.4s ease',
          }} />

          {/* Center Lock Icon */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: isUnlocked ? 'rgba(34, 197, 94, 0.12)' : 'rgba(0, 229, 255, 0.12)',
            border: `1px solid ${isUnlocked ? '#22c55e' : '#00e5ff'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            {isUnlocked ? (
              <Unlock size={28} color="#22c55e" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
            ) : (
              <Lock size={28} color="#00e5ff" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
            )}
          </div>
        </div>

        {/* Telemetry Status text */}
        <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', textAlign: 'center', marginBottom: 4 }}>
          {phase === 'authenticating' && 'VERIFYING IDENTITY...'}
          {phase === 'unlocking' && 'DECRYPTING SECURITY VAULT...'}
          {(phase === 'open' || phase === 'complete') && 'ACCESS AUTHORIZED'}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: isUnlocked ? '#22c55e' : '#00e5ff', letterSpacing: '0.06em' }}>
          {isUnlocked ? 'LEVEL-5 CLEARANCE GRANTED' : 'AES-256 SECURE HANDSHAKE'}
        </div>
      </div>
    </div>
  );
}

