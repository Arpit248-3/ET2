import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check, AlertTriangle, Copy, Loader } from 'lucide-react';
import { useToast } from './Toast.jsx';

const SAMPLE_JSON = {
  "scenario_name": "Custom Gulf Escalation",
  "crude_price_change_pct": 18,
  "shipping_delay_days": 9,
  "insurance_spike_pct": 28,
  "supplier_disruption_pct": 35,
  "spr_coverage_days": 8,
  "route_risk": "critical",
  "affected_routes": ["Strait of Hormuz"],
  "affected_suppliers": ["Iraq", "Saudi Arabia", "UAE"],
  "timeline": [
    {
      "time": "09:00",
      "event": "Normal operations",
      "risk_score": 32
    },
    {
      "time": "10:15",
      "event": "Custom Gulf escalation crosses critical threshold",
      "risk_score": 86
    }
  ]
};

export default function CrisisUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const { addToast } = useToast();
  const [jsonText, setJsonText] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [isValidated, setIsValidated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validateFields = (parsed) => {
    if (typeof parsed !== 'object' || parsed === null) {
      return 'JSON must be an object.';
    }
    const required = [
      "scenario_name", "crude_price_change_pct", "shipping_delay_days",
      "insurance_spike_pct", "supplier_disruption_pct", "spr_coverage_days",
      "route_risk", "affected_routes", "affected_suppliers"
    ];
    for (const field of required) {
      if (!(field in parsed)) {
        return `Missing required field: "${field}"`;
      }
    }
    return null;
  };

  const handleValidate = () => {
    setValidationError(null);
    setIsValidated(false);
    try {
      if (!jsonText.trim()) {
        setValidationError('Please paste JSON or upload a file first.');
        return false;
      }
      const parsed = JSON.parse(jsonText);
      const error = validateFields(parsed);
      if (error) {
        setValidationError(error);
        return false;
      }
      setIsValidated(true);
      addToast('JSON schema validated successfully!', 'success');
      return true;
    } catch (e) {
      setValidationError(`Malformed JSON: ${e.message}`);
      return false;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setJsonText(text);
        setValidationError(null);
        setIsValidated(false);
        addToast(`Loaded ${file.name}`, 'info');
      }
    };
    reader.readAsText(file);
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(JSON.stringify(SAMPLE_JSON, null, 2));
    addToast('Sample JSON copied to clipboard', 'success');
  };

  const handleUploadAndRecalculate = async () => {
    // Validate first
    const ok = handleValidate();
    if (!ok) return;

    setUploading(true);
    try {
      const parsed = JSON.parse(jsonText);
      await onUploadSuccess(parsed);
      addToast('Custom crisis scenario recalculated successfully', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      setValidationError(err.message || 'Upload & Recalculate failed');
      addToast(err.message || 'Failed to process custom scenario', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 10, 20, 0.75)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div style={{
        background: 'rgba(10, 20, 38, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        width: '90%',
        maxWidth: 550,
        padding: '24px 28px',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: '50%',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <X size={18} />
        </button>

        {/* Title & Description */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Upload size={22} style={{ color: '#1d8cff' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Upload Custom Crisis Feed</h2>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
          Inject custom geopolitical alerts, supply bottlenecks, and oil pricing spikes. UrjaNetra AI will run the full simulation & mitigation pipeline immediately.
        </p>

        {/* Upload Dropzone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed rgba(29, 140, 255, 0.3)',
            borderRadius: 8,
            padding: '16px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(29, 140, 255, 0.02)',
            marginBottom: 16,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(29, 140, 255, 0.05)';
            e.currentTarget.style.borderColor = '#1d8cff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(29, 140, 255, 0.02)';
            e.currentTarget.style.borderColor = 'rgba(29, 140, 255, 0.3)';
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".json" 
            style={{ display: 'none' }} 
          />
          <FileText size={24} style={{ color: '#1d8cff', marginBottom: 8, display: 'inline-block' }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>Drag & drop JSON file or browse</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Supported format: .json</div>
        </div>

        {/* Textarea for JSON */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Or Paste JSON Content</label>
            <button 
              type="button" 
              onClick={handleCopySample} 
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-soft)',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 10.5,
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Copy size={11} /> Copy Sample JSON
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setValidationError(null);
              setIsValidated(false);
            }}
            placeholder="Paste your crisis feed JSON schema here..."
            style={{
              width: '100%',
              height: 140,
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-soft)',
              borderRadius: 6,
              padding: 10,
              fontSize: 11.5,
              color: '#ffffff',
              fontFamily: 'monospace',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Validation Errors or Success Status */}
        {validationError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 12,
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        {isValidated && !validationError && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 12,
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16
          }}>
            <Check size={14} style={{ flexShrink: 0 }} />
            <span>All required fields are present. Ready to upload.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={handleValidate}
            disabled={uploading}
          >
            Validate Schema
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm" 
            onClick={handleUploadAndRecalculate}
            disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {uploading ? (
              <>
                <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              'Upload & Recalculate'
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
