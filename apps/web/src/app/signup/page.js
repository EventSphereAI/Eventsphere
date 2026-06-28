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

  // Fix #6 & #18 — independent show/hide state for each password field
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signup } = useAuth();

  // Fix #10 & #15 — clear error when user types in any field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Fix #1 — trim all relevant fields before validation and submit
    const trimmedSlug = formData.orgSlug.trim();
    const trimmedOrgName = formData.orgName.trim();
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    // Fix #2 — whitespace-only guard
    if (!trimmedSlug) {
      setError('Organization slug cannot be empty.');
      return;
    }
    if (!trimmedOrgName) {
      setError('Organization name cannot be empty.');
      return;
    }
    if (!trimmedName) {
      setError('Your name cannot be empty.');
      return;
    }
    if (!trimmedEmail) {
      setError('Email cannot be empty.');
      return;
    }

    // Fix #4 — validate orgSlug format: only lowercase letters, numbers, hyphens
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(trimmedSlug)) {
      setError('Organization slug can only contain lowercase letters, numbers, and hyphens.');
      return;
    }

    // Fix #3 — minimum password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    // Fix #5 — compare passwords after trimming context is clear
    // (passwords themselves are not trimmed intentionally)
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await signup(
        trimmedSlug,
        trimmedOrgName,
        trimmedEmail,
        formData.password,  // password not trimmed intentionally
        trimmedName
      ); // same signup() call, untouched
    } catch (err) {
      // Fix #2 — safe fallback if err.message is undefined
      setError(
        err?.message ||
        err?.response?.data?.detail ||
        'Signup failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-8 text-primary">EventSphere</h1>
        <h2 className="text-xl text-center mb-6 text-gray-600">Create Organization</h2>

        {/* Fix #16 — role="alert" for screen readers */}
        {error && (
          <div role="alert" className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Organization Slug */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Organization Slug</label>
            <input
              type="text"
              name="orgSlug"
              value={formData.orgSlug}
              onChange={handleChange}
              className="input-field"
              placeholder="my-university"
              autoFocus              // Fix #13
              autoComplete="organization" // Fix #8
              maxLength={60}         // Fix #9
              required
            />
            {/* Fix #12 — dynamic slug preview */}
            <p className="text-xs text-gray-500 mt-1">
              Will be:{' '}
              <span className="font-medium text-primary">
                {formData.orgSlug.trim() || 'my-university'}.eventsphere.app
              </span>
            </p>
          </div>

          {/* Organization Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Organization Name</label>
            <input
              type="text"
              name="orgName"
              value={formData.orgName}
              onChange={handleChange}
              className="input-field"
              placeholder="My University"
              autoComplete="organization-title" // Fix #8
              maxLength={100}                   // Fix #9
              required
            />
          </div>

          {/* Your Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="John Doe"
              autoComplete="name" // Fix #8
              maxLength={100}     // Fix #9
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="admin@university.edu"
              autoComplete="email" // Fix #8
              maxLength={200}      // Fix #9
              required
            />
          </div>

          {/* Password — Fix #6: show/hide toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} // Fix #6
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pr-12"
                placeholder="••••••••"
                autoComplete="new-password" // Fix #8
                minLength={8}               // Fix #14
                maxLength={200}             // Fix #9
                required
              />
              {/* Fix #6 — toggle button */}
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

          {/* Confirm Password — Fix #6 & #18: independent show/hide */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'} // Fix #18
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field pr-12"
                placeholder="••••••••"
                autoComplete="new-password" // Fix #17
                maxLength={200}             // Fix #9
                required
              />
              {/* Fix #18 — independent toggle */}
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Fix #7 — real-time password match indicator */}
            {formData.confirmPassword.length > 0 && (
              <p className={`text-xs mt-1 ${
                formData.password === formData.confirmPassword
                  ? 'text-green-600'
                  : 'text-red-500'
              }`}>
                {formData.password === formData.confirmPassword
                  ? '✓ Passwords match'
                  : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          {/* Fix #11 — spinner on loading button */}
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