'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function EventsPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    venue: '',
    start_date: '',
    end_date: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post('/api/events/', form);

      alert('Event created successfully');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Create Event</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          placeholder="Event Title"
          className="w-full border p-3 rounded"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Venue"
          className="w-full border p-3 rounded"
          value={form.venue}
          onChange={(e) =>
            setForm({ ...form, venue: e.target.value })
          }
          required
        />

        <input
          type="date"
          className="w-full border p-3 rounded"
          value={form.start_date}
          onChange={(e) =>
            setForm({ ...form, start_date: e.target.value })
          }
          required
        />

        <input
          type="date"
          className="w-full border p-3 rounded"
          value={form.end_date}
          onChange={(e) =>
            setForm({ ...form, end_date: e.target.value })
          }
          required
        />

        <textarea
          placeholder="Description"
          className="w-full border p-3 rounded"
          rows="5"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded"
        >
          {loading ? 'Creating...' : 'Create Event'}
        </button>

      </form>
    </div>
  );
}