import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = 'urja_auth_token';
const AUTH_USER_KEY = 'urja_auth_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback((newToken, user) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    // Also sync for other hooks that read urja_user
    localStorage.setItem('urja_user', JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem('urja_user');
    // Redirect to login
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setCurrentUser(prev => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
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
      isLoading,
      setIsLoading,
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
