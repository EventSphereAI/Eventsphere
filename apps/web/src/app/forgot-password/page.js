'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/utils/api';

export default function ForgotPasswordPage() {
  const [orgSlug, setOrgSlug] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/api/auth/forgot-password', {
        org_slug: orgSlug.trim(),
        email: email.trim(),
      });

      setMessage(
        'If an account exists, a password reset link has been sent.'
      );

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to send reset link.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">

      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md">

        <h1 className="text-3xl font-bold mb-6">
          Forgot Password
        </h1>

        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Organization Slug"
            value={orgSlug}
            onChange={(e) => setOrgSlug(e.target.value)}
            className="input-field mb-4"
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field mb-6"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading
              ? 'Sending...'
              : 'Send Reset Link'}
          </button>

        </form>

        <div className="text-center mt-5">

          <Link
            href="/login"
            className="text-primary hover:underline"
          >
            Back to Login
          </Link>

        </div>

      </div>

    </div>
  );
}