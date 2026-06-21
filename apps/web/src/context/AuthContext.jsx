"use client";
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Fetch current user info
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Register new organization
  const signup = async (orgSlug, orgName, email, password, name) => {
    try {
      const { data } = await api.post('/api/auth/register-tenant', {
        org_slug: orgSlug,
        org_name: orgName,
        email,
        password,
        name,
      });

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser({ email, role: 'organizer' });
      setTenant(data.tenant);
      setError(null);

      router.push('/dashboard');
      return data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Signup failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data.user || { email, role: data.role });
      setTenant(data.tenant);
      setError(null);

      // Route based on role
      const roleRoutes = {
        organizer: '/dashboard',
        food_staff: '/scan/food',
        hospitality_team: '/accommodation',
        registration_team: '/delegates',
      };
      const route = roleRoutes[data.role] || '/dashboard';
      router.push(route);

      return data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setTenant(null);
    setError(null);
    router.push('/login');
  };

  const value = {
    user,
    tenant,
    loading,
    error,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

