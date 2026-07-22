/**
 * VaultDoor — High-Grade Military / Enterprise Titanium Vault Door.
 * Engineered for photo-realistic depth, metallic brushed surfaces, bevels, 3D mechanical gears,
 * locking pistons, rotary combination dial, and biometric laser scanning reticle.
 */
import React, { useEffect, useState } from 'react';
import { Shield, Fingerprint, Lock, Unlock, Zap, Activity } from 'lucide-react';

export default function VaultDoor({ status = 'LOCKED', onUnlock, size = 340 }) {
  const [dialAngle, setDialAngle] = useState(0);
  const [scanPulse, setScanPulse] = useState(0);
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    // Gear & dial continuous mechanical rotation
    const interval = setInterval(() => {
      setDialAngle(prev => (prev + 0.3) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanPulse(prev => (prev >= 100 ? 0 : prev + 2.5));
    }, 35);
    return () => clearInterval(scanInterval);
  }, []);

  const isUnlocked = status === 'UNLOCKED' || status === 'ACCESS GRANTED';
  const isUnlocking = status === 'UNLOCKING' || status === 'AUTHENTICATING';

  // Calculate piston extension (0 = retracted/unlocked, 18 = extended/locked)
  const pistonOffset = isUnlocked ? 0 : 16;

  return (
    <div
      onMouseEnter={() => setScannerActive(true)}
      onMouseLeave={() => setScannerActive(false)}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {/* Outer Atmospheric Security Glow */}
      <div style={{
        position: 'absolute',
        inset: -24,
        borderRadius: '50%',
        background: isUnlocked
          ? 'radial-gradient(circle, rgba(34,197,94,0.28) 0%, rgba(34,197,94,0) 70%)'
          : isUnlocking
          ? 'radial-gradient(circle, rgba(0,229,255,0.32) 0%, rgba(29,140,255,0) 70%)'
          : 'radial-gradient(circle, rgba(29,140,255,0.2) 0%, rgba(0,0,0,0) 75%)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }} />

      {/* SVG Photo-Realistic Mechanical Vault */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        style={{
          filter: isUnlocked
            ? 'drop-shadow(0 15px 35px rgba(34,197,94,0.35))'
            : isUnlocking
            ? 'drop-shadow(0 20px 45px rgba(0,229,255,0.35))'
            : 'drop-shadow(0 25px 50px rgba(0,0,0,0.85))',
          transition: 'all 0.5s ease',
        }}
      >
        <defs>
          {/* Metallic Brushed Titanium Gradient */}
          <radialGradient id="titaniumMain" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#2a384e" />
            <stop offset="30%" stopColor="#182335" />
            <stop offset="70%" stopColor="#0b121e" />
            <stop offset="100%" stopColor="#04070d" />
          </radialGradient>

          {/* Heavy Beveled Rim Metallic Gradient */}
          <linearGradient id="rimMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b4d68" />
            <stop offset="25%" stopColor="#1c283a" />
            <stop offset="50%" stopColor="#0f1724" />
            <stop offset="75%" stopColor="#25354a" />
            <stop offset="100%" stopColor="#080e18" />
          </linearGradient>

          {/* Dark Gunmetal Inner Core */}
          <radialGradient id="gunmetalCore" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e2c40" />
            <stop offset="60%" stopColor="#0a111c" />
            <stop offset="100%" stopColor="#020509" />
          </radialGradient>

          {/* Neon Energy Glow */}
          <linearGradient id="cyanLaser" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#00e5ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </linearGradient>

          {/* Gold Brass Lock Accent */}
          <linearGradient id="brassAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Specular Filter for Real 3D Bevels */}
          <filter id="metallicBevel" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lightingColor="#ffffff" result="specOut">
              <feDistantLight azimuth="225" elevation="45" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
          </filter>
        </defs>

        {/* Outer Heavy Reinforced Armor Ring */}
        <circle cx="250" cy="250" r="235" fill="url(#rimMetallic)" stroke="#475569" strokeWidth="2" filter="url(#metallicBevel)" />
        <circle cx="250" cy="250" r="222" fill="none" stroke="rgba(0,229,255,0.25)" strokeWidth="1.5" strokeDasharray="12 6 4 6" />

        {/* Outer Heavy Bolt Array (16 Industrial Hex Bolts) */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 22.5 * Math.PI) / 180;
          const bx = 250 + 228 * Math.cos(angle);
          const by = 250 + 228 * Math.sin(angle);
          return (
            <g key={i} transform={`translate(${bx}, ${by})`}>
              {/* Counter-sunk Bolt Recess */}
              <circle cx="0" cy="0" r="9" fill="#040810" stroke="#1e293b" strokeWidth="1.5" />
              {/* Hex Bolt Head */}
              <polygon
                points="-5,-2 -2,-5 2,-5 5,-2 5,2 2,5 -2,5 -5,2"
                fill={isUnlocked ? '#22c55e' : '#1d8cff'}
                opacity={isUnlocked ? 0.9 : 0.6}
              />
            </g>
          );
        })}

        {/* 4 Heavy Hydraulic Locking Pistons (Spokes) */}
        {[0, 90, 180, 270].map((angleDeg, i) => {
          const rad = (angleDeg * Math.PI) / 180;
          const startDist = 120;
          const endDist = 200 + pistonOffset;
          const x1 = 250 + startDist * Math.cos(rad);
          const y1 = 250 + startDist * Math.sin(rad);
          const x2 = 250 + endDist * Math.cos(rad);
          const y2 = 250 + endDist * Math.sin(rad);
          return (
            <g key={i}>
              {/* Cylinder casing */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0b1320" strokeWidth="22" strokeLinecap="square" />
              {/* Steel Piston Shaft */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#rimMetallic)" strokeWidth="14" strokeLinecap="round" />
              {/* Hydraulic Seal Ring */}
              <circle cx={x2} cy={y2} r="8" fill={isUnlocked ? '#22c55e' : '#00e5ff'} opacity="0.8" />
            </g>
          );
        })}

        {/* Rotating Industrial Gear Ring */}
        <g transform={`rotate(${dialAngle}, 250, 250)`}>
          <circle cx="250" cy="250" r="185" fill="none" stroke="rgba(29, 140, 255, 0.35)" strokeWidth="3" strokeDasharray="24 12" />
          {/* Gear Teeth */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const tx = 250 + 185 * Math.cos(angle);
            const ty = 250 + 185 * Math.sin(angle);
            return (
              <rect
                key={i}
                x={tx - 4}
                y={ty - 4}
                width="8"
                height="8"
                fill="#1e293b"
                stroke="#00e5ff"
                strokeWidth="0.8"
                transform={`rotate(${i * 15}, ${tx}, ${ty})`}
              />
            );
          })}
        </g>

        {/* Counter-Rotating Combination Dial Ring */}
        <g transform={`rotate(${-dialAngle * 1.8}, 250, 250)`}>
          <circle cx="250" cy="250" r="150" fill="url(#titaniumMain)" stroke="rgba(0, 229, 255, 0.4)" strokeWidth="2.5" />
          {/* Dial Calibration Ticks (00 to 90) */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const x1 = 250 + 138 * Math.cos(angle);
            const y1 = 250 + 138 * Math.sin(angle);
            const x2 = 250 + 148 * Math.cos(angle);
            const y2 = 250 + 148 * Math.sin(angle);
            const isMajor = i % 3 === 0;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? '#00e5ff' : 'rgba(148, 163, 184, 0.4)'}
                strokeWidth={isMajor ? 2 : 1}
              />
            );
          })}
        </g>

        {/* Inner Dark Gunmetal Core Container */}
        <circle cx="250" cy="250" r="120" fill="url(#gunmetalCore)" stroke="rgba(90, 130, 255, 0.4)" strokeWidth="3" />
        <circle cx="250" cy="250" r="105" fill="none" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="1" strokeDasharray="6 3" />

        {/* Biometric Laser Scanner Beam */}
        <g opacity={isUnlocking || scannerActive ? 1 : 0.4}>
          <line
            x1="145"
            y1={145 + (scanPulse / 100) * 210}
            x2="355"
            y2={145 + (scanPulse / 100) * 210}
            stroke="url(#cyanLaser)"
            strokeWidth="3"
          />
        </g>

        {/* Center Optical Biometric Reticle */}
        <circle
          cx="250"
          cy="250"
          r="65"
          fill={isUnlocked ? 'rgba(34, 197, 94, 0.12)' : 'rgba(8, 18, 38, 0.9)'}
          stroke={isUnlocked ? '#22c55e' : '#00e5ff'}
          strokeWidth="2.5"
        />

        {/* Crosshair Precision Lines */}
        <line x1="250" y1="185" x2="250" y2="315" stroke="rgba(0,229,255,0.3)" strokeWidth="1" />
        <line x1="185" y1="250" x2="315" y2="250" stroke="rgba(0,229,255,0.3)" strokeWidth="1" />
        <circle cx="250" cy="250" r="42" fill="none" stroke="rgba(0,229,255,0.2)" strokeWidth="1" strokeDasharray="3 3" />
      </svg>

      {/* Center Icon & Status Telemetry Overlay */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        {isUnlocked ? (
          <Unlock size={42} color="#22c55e" style={{ filter: 'drop-shadow(0 0 14px #22c55e)' }} />
        ) : (
          <Lock size={42} color="#00e5ff" style={{ filter: 'drop-shadow(0 0 14px #00e5ff)' }} />
        )}
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          fontFamily: "'JetBrains Mono', monospace",
          color: isUnlocked ? '#22c55e' : '#00e5ff',
          letterSpacing: '0.14em',
          marginTop: 6,
          textTransform: 'uppercase',
        }}>
          {status}
        </div>
      </div>

      {/* Military Vault Access Level Badge */}
      <div style={{
        position: 'absolute',
        top: -14,
        padding: '4px 12px',
        borderRadius: 20,
        background: 'rgba(4, 10, 24, 0.95)',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        fontSize: 9,
        fontWeight: 800,
        fontFamily: "'JetBrains Mono', monospace",
        color: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        letterSpacing: '0.1em',
      }}>
        <Shield size={11} color="#00e5ff" />
        NEMC COMMAND VAULT L5
      </div>
    </div>
  );
}
