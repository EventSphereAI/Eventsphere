═══════════════════════════════════════════════════════════════════════════════
PART 3: FRONTEND FILES (apps/web/)
═══════════════════════════════════════════════════════════════════════════════

### FILE: package.json
Location: eventsphere/apps/web/package.json

{
  "name": "eventsphere-web",
  "version": "1.0.0",
  "description": "EventSphere - Multi-tenant event management platform",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "axios": "^1.6.0",
    "react-qr-scanner": "^1.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}

---

### FILE: next.config.js
Location: eventsphere/apps/web/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.eventsphere.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}

module.exports = nextConfig

---

### FILE: tailwind.config.js
Location: eventsphere/apps/web/tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3C3489',
        secondary: '#0F6E56',
        accent: '#EF9F27',
      },
    },
  },
  plugins: [],
}

---

### FILE: postcss.config.js
Location: eventsphere/apps/web/postcss.config.js

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

---

### FILE: .env.local.example
Location: eventsphere/apps/web/.env.local.example

NEXT_PUBLIC_API_URL=http://localhost:8000

---

### FILE: src/app/layout.js
Location: eventsphere/apps/web/src/app/layout.js

import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
  title: 'EventSphere AI - Event Management Platform',
  description: 'Multi-tenant event management and QR-based tracking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

---

### FILE: src/app/page.js
Location: eventsphere/apps/web/src/app/page.js

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

---

### FILE: src/app/globals.css
Location: eventsphere/apps/web/src/app/globals.css

@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-gray-50 text-gray-900;
}

/* Custom classes */
.btn-primary {
  @apply px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition;
}

.btn-secondary {
  @apply px-4 py-2 bg-secondary text-white rounded-lg hover:bg-opacity-90 transition;
}

.card {
  @apply bg-white rounded-lg shadow p-6;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary;
}

---

### FILE: src/app/login/page.js
Location: eventsphere/apps/web/src/app/login/page.js

'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-3xl font-bold text-center mb-8 text-primary">EventSphere</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@university.edu"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

---

### FILE: src/app/signup/page.js
Location: eventsphere/apps/web/src/app/signup/page.js

'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    orgSlug: '',
    orgName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup(
        formData.orgSlug,
        formData.orgName,
        formData.email,
        formData.password,
        formData.name
      );
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-primary">EventSphere</h1>
        <h2 className="text-xl text-center mb-6 text-gray-600">Create Organization</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Organization Slug</label>
            <input
              type="text"
              name="orgSlug"
              value={formData.orgSlug}
              onChange={handleChange}
              className="input-field"
              placeholder="my-university"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Will be: my-university.eventsphere.app</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Organization Name</label>
            <input
              type="text"
              name="orgName"
              value={formData.orgName}
              onChange={handleChange}
              className="input-field"
              placeholder="My University"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="admin@university.edu"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

---

### FILE: src/app/dashboard/page.js
Location: eventsphere/apps/web/src/app/dashboard/page.js

'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/utils/api';

export default function DashboardPage() {
  const { user, loading, logout, tenant } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const { data } = await api.get('/api/events/');
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">EventSphere</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.email}</h2>
          <p className="text-gray-600 mt-2">Role: {user.role}</p>
        </div>

        {/* Events Section */}
        <section className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Events</h3>
            <button className="btn-primary">Create Event</button>
          </div>

          {eventsLoading ? (
            <p className="text-gray-500">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No events yet. Create your first event!</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                  <h4 className="font-semibold text-lg mb-2">{event.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{event.venue}</p>
                  <div className="flex gap-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Links */}
        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button className="card text-center hover:shadow-lg transition">
            <p className="text-2xl mb-2">📋</p>
            <p className="font-semibold">Events</p>
          </button>
          <button className="card text-center hover:shadow-lg transition">
            <p className="text-2xl mb-2">👥</p>
            <p className="font-semibold">Delegates</p>
          </button>
          <button className="card text-center hover:shadow-lg transition">
            <p className="text-2xl mb-2">🏠</p>
            <p className="font-semibold">Accommodation</p>
          </button>
          <button className="card text-center hover:shadow-lg transition">
            <p className="text-2xl mb-2">🔍</p>
            <p className="font-semibold">Reports</p>
          </button>
        </section>
      </main>
    </div>
  );
}

---

### FILE: src/context/AuthContext.jsx
Location: eventsphere/apps/web/src/context/AuthContext.jsx

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
      setError(null);

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

---

### FILE: src/utils/api.js
Location: eventsphere/apps/web/src/utils/api.js

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;

---

END OF PART 3: FRONTEND FILES COMPLETE
