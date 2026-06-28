'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

function EventsContent() {
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0]; // Fix #8 — min date

  const [form, setForm] = useState({
    title: '',
    venue: '',
    start_date: '',
    end_date: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Fix #2 — inline error state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Fix #4 — trim inputs before sending
    const trimmedForm = {
      ...form,
      title: form.title.trim(),
      venue: form.venue.trim(),
      description: form.description.trim()
    };

    // Fix #1 — end date must be after start date
    if (trimmedForm.end_date && trimmedForm.start_date && trimmedForm.end_date < trimmedForm.start_date) {
      setError('End date cannot be before start date.');
      return;
    }

    try {
      setLoading(true);

      await api.post('/api/events/', trimmedForm); // same API call, untouched

      // Fix #13 — reset form on success
      setForm({
        title: '',
        venue: '',
        start_date: '',
        end_date: '',
        description: ''
      });

      alert('Event created successfully');
      router.push('/dashboard'); // same redirect, untouched

    } catch (err) {
      // Fix #11 — safely access err.response
      // Fix #2 — show actual API error inline instead of alert
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        'Failed to create event. Please try again.';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Create Event</h1>

      {/* Fix #2 — inline error display instead of alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Fix #14 — added <label> for accessibility */}
        <div>
          <label className="block text-sm font-medium mb-1">Event Title</label>
          <input
            type="text"
            placeholder="Event Title"
            className="w-full border p-3 rounded"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={100} // Fix #5
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Venue</label>
          <input
            type="text"
            placeholder="Venue"
            className="w-full border p-3 rounded"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            maxLength={200} // Fix #5
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            className="w-full border p-3 rounded"
            value={form.start_date}
            min={today} // Fix #8 — no past dates
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            className="w-full border p-3 rounded"
            value={form.end_date}
            min={form.start_date || today} // Fix #8 — end date min follows start date
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            placeholder="Description"
            className="w-full border p-3 rounded"
            rows="5"
            value={form.description}
            maxLength={1000} // Fix #5
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {/* Fix #6 — character counter */}
          <p className="text-xs text-gray-400 text-right mt-1">
            {form.description.length}/1000
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded disabled:opacity-60 flex items-center gap-2"
          >
            {/* Fix #10 — spinner on loading */}
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {loading ? 'Creating...' : 'Create Event'}
          </button>

          {/* Fix #9 — cancel/back button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

export default function EventsPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.EVENTS}>
      <EventsContent />
    </RoleGuard>
  );
}
