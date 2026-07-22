/**
 * OTPInput — 6-digit animated input boxes with auto-tab, paste support, and status indicators.
 */
import React, { useRef, useState, useEffect } from 'react';

export default function OTPInput({ length = 6, onComplete, disabled = false, error = false }) {
  const [digits, setDigits] = useState(Array(length).fill(''));
  const inputsRef = useRef([]);

  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (disabled) return;
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) {
      // Clear digit
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Handle single digit input
    const next = [...digits];
    next[index] = cleanValue[cleanValue.length - 1];
    setDigits(next);

    // Auto-advance
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Check complete
    if (next.every(d => d !== '') && onComplete) {
      onComplete(next.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);

    const focusIdx = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIdx]?.focus();

    if (next.every(d => d !== '') && onComplete) {
      onComplete(next.join(''));
    }
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '20px 0' }}>
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={el => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          style={{
            width: 48,
            height: 56,
            borderRadius: 10,
            background: digit
              ? 'rgba(0, 229, 255, 0.08)'
              : 'rgba(8, 18, 38, 0.8)',
            border: error
              ? '1.5px solid #ef4444'
              : digit
              ? '1.5px solid #00e5ff'
              : '1px solid rgba(90, 130, 255, 0.25)',
            boxShadow: digit
              ? '0 0 16px rgba(0, 229, 255, 0.25)'
              : 'none',
            fontSize: 22,
            fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
            color: error ? '#ef4444' : '#ffffff',
            textAlign: 'center',
            outline: 'none',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      ))}
    </div>
  );
}
