import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const icons = { success: CheckCircle, warning: AlertTriangle, error: XCircle, info: Info };
  const colors = {
    success: { border: 'rgba(34,197,94,0.3)', icon: '#22c55e', bg: 'rgba(34,197,94,0.05)' },
    warning: { border: 'rgba(245,158,11,0.3)', icon: '#f59e0b', bg: 'rgba(245,158,11,0.05)' },
    error: { border: 'rgba(239,68,68,0.3)', icon: '#ef4444', bg: 'rgba(239,68,68,0.05)' },
    info: { border: 'rgba(29,140,255,0.3)', icon: '#1d8cff', bg: 'rgba(29,140,255,0.05)' },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => {
          const Icon = icons[toast.type] || Info;
          const c = colors[toast.type] || colors.info;
          return (
            <div key={toast.id} className="toast animate-slide-in-right" style={{ borderColor: c.border, background: `rgba(8,18,35,0.97)` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Icon size={18} style={{ color: c.icon, flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#f8fafc', flex: 1 }}>{toast.message}</span>
                <button onClick={() => removeToast(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
