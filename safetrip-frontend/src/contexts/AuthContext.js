import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../api/services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
      setProfile(data.profile || null);
    } catch (e) {
      authService.logout();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    try {
      const data = await authService.getProfile();
      setProfile(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (username, password) => {
    const { user: u, profile: p } = await authService.login(username, password);
    setUser(u);
    setProfile(p || null);
  };

  const register = async (data) => {
    const { user: u, profile: p } = await authService.register(data);
    setUser(u);
    setProfile(p || null);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data) => {
    const updated = await authService.updateProfile(data);
    setProfile(updated);
    return updated;
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
