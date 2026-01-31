import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import authService from "../api/services/authService";

const AuthContext = createContext(null);
const USER_STORAGE_KEY = "safetrip_user";

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  } catch (_) {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setUser(null);
      setProfile(null);
      setStoredUser(null);
      setLoading(false);
      return;
    }
    const cached = getStoredUser();
    if (cached) {
      setUser(cached);
    }
    try {
      const data = await authService.getCurrentUser();
      const u = data.user;
      if (u && u.id && (!cached || cached.id === u.id)) {
        setUser(u);
        setStoredUser(u);
        setProfile(data.profile || null);
      }
    } catch (e) {
      authService.logout();
      setUser(null);
      setProfile(null);
      setStoredUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    try {
      const data = await authService.getProfile();
      // Backend returns {success, user, profile}
      if (data.user) setUser(data.user);
      if (data.profile) setProfile(data.profile);
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

    // Request location permission after successful login (non-blocking)
    setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log("User location after login:", { latitude, longitude });
          },
          (error) => {
            console.error("Location access denied or error:", error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser");
      }
    }, 100);
  };

  const register = async (data) => {
    // Backend returns {message: "..."} on successful registration
    // User needs to login with OTP after registration
    const response = await authService.register(data);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setProfile(null);
    setStoredUser(null);
  };

  const updateProfile = async (data) => {
    const response = await authService.updateProfile(data);
    // Backend returns {success, message, user, profile}
    if (response.user) setUser(response.user);
    if (response.profile) setProfile(response.profile);
    return response;
  };

  const setAuthData = (userData, profileData) => {
    setUser(userData);
    setProfile(profileData);
    setStoredUser(userData || null);
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
    setAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
