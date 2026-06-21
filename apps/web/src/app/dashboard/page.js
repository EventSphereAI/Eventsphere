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
  const [stats, setStats] = useState({
  total_events: 0,
  total_delegates: 0,
  checked_in: 0,
  accommodation_needed: 0
});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchStats();
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

  const fetchStats = async () => {
  try {
    const { data } = await api.get('/api/reports/dashboard');
    setStats(data);
  } catch (err) {
    console.error(
      'Failed to fetch dashboard stats:',
      err
    );
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">
            EventSphere
          </h1>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.email}
            </span>

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

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome, {user.email}
          </h2>

          <p className="text-gray-600 mt-2">
            Role: {user.role}
          </p>

          {tenant && (
            <p className="text-gray-500 text-sm mt-1">
              Organization: {tenant.name}

            </p>
          )}
        </div>

        <section className="grid gap-4 md:grid-cols-4 mb-8">

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-500 text-sm">
              Total Events
            </p>
            <h3 className="text-3xl font-bold">
              {stats.total_events}
            </h3>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-500 text-sm">
              Delegates
            </p>
            <h3 className="text-3xl font-bold">
              {stats.total_delegates}
            </h3>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-500 text-sm">
              Checked In
            </p>
            <h3 className="text-3xl font-bold">
              {stats.checked_in}
            </h3>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-500 text-sm">
              Accommodation
            </p>
            <h3 className="text-3xl font-bold">
              {stats.accommodation_needed}
            </h3>
          </div>

        </section>

        {/* Events Section */}
        <section className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">
              Events
            </h3>

            <button
              onClick={() => router.push('/events')}
              className="btn-primary"
            >
              Create Event
            </button>
          </div>

          {eventsLoading ? (
            <p className="text-gray-500">
              Loading events...
            </p>
          ) : events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No events yet. Create your first event!
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition"
                >
                  <h4 className="font-semibold text-lg mb-2">
                    {event.title}
                  </h4>

                  <p className="text-sm text-gray-600 mb-2">
                    {event.venue}
                  </p>

                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(event.start_date).toLocaleDateString()}
                    {' - '}
                    {new Date(event.end_date).toLocaleDateString()}
                  </p>

                  <div className="space-y-2">

                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {event.status}
                    </span>

                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Registration Link
                      </p>

                      <input
                        readOnly
                        value={`http://localhost:3000/register?event=${event.id}&tenant=${tenant?.id}`}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </div>

                    <button
                      onClick={() => {
                       navigator.clipboard.writeText(
                         `http://localhost:3000/register?event=${event.id}&tenant=${tenant?.id}`
                        );

                        alert('Registration link copied!');
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Copy Link
                    </button>

                  </div>
                </div>
              ))}

            </div>
          )}
        </section>

        {/* Quick Links */}
        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-6">

          <button
            onClick={() => router.push('/events')}
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">📋</p>
            <p className="font-semibold">Events</p>
          </button>

          <button
            onClick={() => router.push('/delegates')}
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">👥</p>
            <p className="font-semibold">Delegates</p>
          </button>

          <button
            onClick={() => router.push('/accommodation')}
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">🏠</p>
            <p className="font-semibold">Accommodation</p>
          </button>

                <button
        onClick={() => router.push('/reports')}
        className="card text-center hover:shadow-lg transition"
      >
        <p className="text-2xl mb-2">🔍</p>
        <p className="font-semibold">Reports</p>
      </button>

      <button
  onClick={() => router.push('/attendance')}
  className="card text-center hover:shadow-lg transition"
>
  <p className="text-2xl mb-2">📊</p>
  <p className="font-semibold">Attendance</p>
</button>

<button
  onClick={() => router.push('/scanner')}
  className="card text-center hover:shadow-lg transition"
>
  <p className="text-2xl mb-2">📷</p>
  <p className="font-semibold">Scanner</p>
</button>


        </section>

      </main>
    </div>
  );
}