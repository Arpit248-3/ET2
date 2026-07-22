import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Starts null on fresh page load — token kept in memory during active session
  const [token, setToken]           = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback((reason = 'manual') => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('urja_user');
    window.location.replace('/login');
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback((newToken, user) => {
    setToken(newToken);
    setCurrentUser(user);
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
