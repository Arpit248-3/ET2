import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

// ─── Auth is MEMORY-ONLY ─────────────────────────────────────────────────────
// Token is NOT persisted to localStorage/sessionStorage.
// Every fresh page load / refresh starts unauthenticated → /login
// Only keep urja_user for display helpers (profile page reads it), not for auth.
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const WARN_BEFORE_MS        = 30 * 1000;      // warn 30 s before logout

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];

export function AuthProvider({ children }) {
  // Always starts null — forces login on every page load / refresh
  const [token, setToken]           = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Inactivity warning state (shared so any component can read it)
  const [warnCountdown, setWarnCountdown] = useState(null); // null = no warning

  const logoutTimerRef = useRef(null);
  const warnTimerRef   = useRef(null);
  const countdownRef   = useRef(null);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback((reason = 'manual') => {
    clearTimeout(logoutTimerRef.current);
    clearTimeout(warnTimerRef.current);
    clearInterval(countdownRef.current);
    setToken(null);
    setCurrentUser(null);
    setWarnCountdown(null);
    localStorage.removeItem('urja_user');
    // Redirect to login
    window.location.replace('/login');
  }, []);

  // ─── Reset inactivity clock ────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    if (!token) return; // only track when logged in

    clearTimeout(logoutTimerRef.current);
    clearTimeout(warnTimerRef.current);
    clearInterval(countdownRef.current);
    setWarnCountdown(null);

    // Schedule warning 30 s before logout
    warnTimerRef.current = setTimeout(() => {
      let secs = 30;
      setWarnCountdown(secs);
      countdownRef.current = setInterval(() => {
        secs -= 1;
        setWarnCountdown(secs);
        if (secs <= 0) clearInterval(countdownRef.current);
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS - WARN_BEFORE_MS);

    // Schedule actual logout
    logoutTimerRef.current = setTimeout(() => {
      logout('inactivity');
    }, INACTIVITY_TIMEOUT_MS);
  }, [token, logout]);

  // ─── Attach / detach activity listeners ────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    resetTimer(); // start timer on login

    const handler = () => resetTimer();
    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, handler, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, handler));
      clearTimeout(logoutTimerRef.current);
      clearTimeout(warnTimerRef.current);
      clearInterval(countdownRef.current);
    };
  }, [token, resetTimer]);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback((newToken, user) => {
    setToken(newToken);
    setCurrentUser(user);
    // Store user profile for display (NOT used for auth gating)
    localStorage.setItem('urja_user', JSON.stringify(user));
  }, []);

  // ─── Update user fields ────────────────────────────────────────────────────
  const updateUser = useCallback((updatedFields) => {
    setCurrentUser(prev => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('urja_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const isAuthenticated = !!token && !!currentUser;

  return (
    <AuthContext.Provider value={{
      token,
      currentUser,
      isAuthenticated,
      warnCountdown,   // null = safe; number = seconds until auto-logout
      login,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthContext;
