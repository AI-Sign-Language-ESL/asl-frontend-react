import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, userService } from '../services/api'; // ✅ FIX: import userService

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setIsAuthenticated(true);
        }
        setLoading(false);
        return;
      }


      try {
        const response = await userService.me(); // ✅ FIX (authService.me didn't exist)
        setUser(response.data);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // =========================
  // LOGIN
  // =========================
  const login = async (email, password) => {
    const response = await authService.login({ email, password });

    const data = response.data;

    if (data.requires_2fa) {
      return data;
    }

    if (data.access) {
      localStorage.setItem('token', data.access);
    } else if (data.token) {
      localStorage.setItem('token', data.token);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }

    setIsAuthenticated(true);
    return data;
  };

  // =========================
  // LOGIN 2FA
  // =========================
  const login2FA = async (userId, token) => {
    const response = await authService.login2FA({ user_id: userId, token });
    const data = response.data;

    if (data.access) {
      localStorage.setItem('token', data.access);
    } else if (data.token) {
      localStorage.setItem('token', data.token);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }

    setIsAuthenticated(true);
    return data;
  };

  // =========================
  // GOOGLE LOGIN (BASIC USERS ONLY)
  // =========================
  const loginGoogle = async (googleToken) => {
    const response = await authService.loginGoogle?.({ token: googleToken });
    const data = response.data;

    // ✅ RESTRICT: Only allow basic users
    if (data.user?.role !== 'basic_user') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Google Sign-In is only available for Basic Users.');
    }

    if (data.access) {
      localStorage.setItem('token', data.access);
    } else if (data.token) {
      localStorage.setItem('token', data.token);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }

    setIsAuthenticated(true);
    return data;
  };

  // =========================
  // REGISTER (FIXED)
  // =========================
  const register = async (userData, userType = 'basic') => {
    // ✅ FIX: call correct API endpoint based on userType
    let response;
    if (userType === 'organization') {
      response = await userService.registerOrg(userData);
    } else {
      response = await userService.registerBasic(userData);
    }

    const data = response.data;

    // Some backends don't return token on register
    if (data.access) {
      localStorage.setItem('token', data.access);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
    } else {
      // If no user returned, just continue (email verification flow)
      setIsAuthenticated(false);
    }

    return data;
  };

  // =========================
  // VERIFY EMAIL
  // =========================
  const verifyEmail = async (email, code) => {
    const response = await authService.verifyEmail({ email, code });
    const data = response.data;

    // Organization accounts: requires payment, don't authenticate yet
    if (data.requires_payment) {
      return data;
    }

    if (data.access) {
      localStorage.setItem('token', data.access);
    }
    if (data.refresh) {
      localStorage.setItem('refresh', data.refresh);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }

    setIsAuthenticated(true);
    return data;
  };

  // =========================
  const logout = async () => {
    try {
      if (authService.logout) {
        await authService.logout();
      }
    } catch {
      // silent fail
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // =========================
  // UPDATE USER
  // =========================
  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
    const currentUser = user ? { ...user, ...userData } : userData;
    localStorage.setItem('user', JSON.stringify(currentUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        login2FA,
        loginGoogle,
        register,
        verifyEmail,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};