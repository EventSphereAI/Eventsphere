'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from "next/image";
export default function LoginPage() {
  const [orgSlug, setOrgSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fix #4 — show/hide password toggle
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  // Fix #8 — clear error when user starts typing
  const handleOrgSlugChange = (e) => {
    setOrgSlug(e.target.value);
    if (error) setError('');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Fix #1 — trim inputs before sending
    const trimmedSlug = orgSlug.trim();
    const trimmedEmail = email.trim();

    // Fix #2 — whitespace-only guard
    if (!trimmedSlug) {
      setError('Organization slug cannot be empty.');
      return;
    }

    if (!trimmedEmail) {
      setError('Email cannot be empty.');
      return;
    }

    setLoading(true);

    try {
      await login(
        trimmedSlug,
        trimmedEmail,
        password    // password intentionally not trimmed
      ); // same login() call, untouched
    } catch (err) {
      // Fix #3 — safe fallback if err.message is undefined
      setError(
        err?.message ||
        err?.response?.data?.detail ||
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500 via-teal-400 to-emerald-200">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-[440px] border border-gray-100">

        <div className="flex flex-col items-center mb-8">

  <Image
    src="/logo-full.png"
    alt="EventSphere"
    width={300}
    height={90}
    priority
    className="h-auto w-72 object-contain"
  />

</div>

        {/* Fix #12 — role="alert" for screen readers */}
        {error && (
          <div
            role="alert"
            className="bg-red-100 text-red-700 p-3 rounded-lg mb-4"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Organization Slug */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Organization Slug
            </label>
            <input
              type="text"
              value={orgSlug}
              onChange={handleOrgSlugChange} // Fix #8
              className="input-field"
              placeholder="your-organization" // Fix #13
              autoComplete="organization"     // Fix #6
              autoFocus                       // Fix #10
              maxLength={100}                 // Fix #7
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange} // Fix #8
              className="input-field"
              placeholder="admin@organization.com"
              autoComplete="email"         // Fix #6
              maxLength={200}              // Fix #7
              required
            />
          </div>

          {/* Password — Fix #4: show/hide toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} // Fix #4
                value={password}
                onChange={handlePasswordChange} // Fix #8
                className="input-field pr-12"
                placeholder="••••••••"
                autoComplete="current-password" // Fix #6
                maxLength={200}                 // Fix #7
                required
              />
              {/* Fix #4 — toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Fix #5 + #14 — spinner on loading button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            )}
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        {/* Fix #9 — forgot password link */}
        <p className="text-center mt-3 text-sm text-gray-500">
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </p>

        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="text-primary font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}