import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api';

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
        const response = await authService.me();
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
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return response.data;
  };

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

    const response = await authService.register(userData);
    const { token, user: newUser } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
    return response.data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Silent fail on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

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