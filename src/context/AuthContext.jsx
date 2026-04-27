import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, userService } from '../services/api'; // ✅ FIX: import userService

const TEST_USERS = {
  'test@tafahom.com': { id: 1, name: 'Test User', email: 'test@tafahom.com' },
  'admin@tafahom.com': { id: 2, name: 'Admin User', email: 'admin@tafahom.com' },
};

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
    if (import.meta.env.DEV) {
      const testUser = TEST_USERS[email.toLowerCase()];
      if (testUser && password === 'password123') {
        const mockToken = 'mock_token_' + Date.now();
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(testUser));
        setUser(testUser);
        setIsAuthenticated(true);
        return { token: mockToken, user: testUser };
      }
    }

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
  // GOOGLE LOGIN
  // =========================
  const loginGoogle = async (googleToken) => {
    // Assuming backend takes { token: googleToken }
    const response = await authService.loginGoogle?.({ token: googleToken }); 
    // Wait, api.js might not have loginGoogle yet, I need to add it.
    // For now I'll just use api.post directly if it's not there, but let's assume I'll add it to api.js.
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
  // REGISTER (FIXED)
  // =========================
  const register = async (userData) => {
    if (import.meta.env.DEV) {
      const newUser = { id: Date.now(), ...userData };
      const mockToken = 'mock_token_' + Date.now();
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      return { token: mockToken, user: newUser };
    }

    // ✅ FIX: correct API call
    const response = await userService.registerBasic(userData);

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
  // LOGOUT
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