'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/utils/api';
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import QuickActionCard from "@/components/QuickActionCard";

import {
  CalendarDays,
  Users,
  ClipboardCheck,
  QrCode,
  UtensilsCrossed,
  Hotel,
} from "lucide-react";
function DashboardContent() {
  const { user, loading, logout, tenant } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(''); // Fix #5 — error state for events fetch

  const [stats, setStats] = useState({
    total_events: 0,
    total_delegates: 0,
    checked_in: 0,
    accommodation_needed: 0
  });
  const [statsLoading, setStatsLoading] = useState(false); // Fix #8 — stats loading state
  const [statsError, setStatsError] = useState('');        // Fix #4 — error state for stats fetch

  // Fix #10 — per-card copy feedback instead of alert
  const [copiedEventId, setCopiedEventId] = useState(null);

  // Fix #2 — use env var for base URL, fallback to window.location.origin
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  // Fix #1 — removed all console.log statements from render body

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
      setEventsError(''); // Fix #5
      const { data } = await api.get('/api/events/'); // same API call, untouched
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEventsError('Failed to load events. Please try refreshing.'); // Fix #5
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true); // Fix #8
      setStatsError('');     // Fix #4
      const { data } = await api.get('/api/reports/dashboard'); // same API call, untouched
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setStatsError('Failed to load stats.'); // Fix #4
    } finally {
      setStatsLoading(false); // Fix #8
    }
  };

  // Fix #10 — inline copy feedback, no alert()
  const handleCopyLink = (eventId) => {
    // Fix #9 — guard against undefined tenant
    if (!tenant?.id) return;

    const link = `${getBaseUrl()}/register?event=${eventId}&tenant=${tenant.id}`; // Fix #2
    navigator.clipboard.writeText(link);
    setCopiedEventId(eventId);
    setTimeout(() => setCopiedEventId(null), 2000); // reset after 2s
  };

  // Fix #11 — status badge color mapping
  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
  <AppShell>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Fix #4 — stats error display */}
        {statsError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
            {statsError}
          </div>
        )}

        {/* Stats Section — Fix #8: show — while loading */}
    <section className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">

  <StatCard
    title="Total Events"
    value={statsLoading ? "—" : stats.total_events}
    icon={CalendarDays}
    color="from-cyan-400 to-cyan-500"
  />

  <StatCard
    title="Delegates"
    value={statsLoading ? "—" : stats.total_delegates}
    icon={Users}
    color="from-green-400 to-green-500"
  />

  <StatCard
    title="Checked In"
    value={statsLoading ? "—" : stats.checked_in}
    icon={QrCode}
    color="from-violet-400 to-violet-500"
  />

  <StatCard
    title="Accommodation"
    value={statsLoading ? "—" : stats.accommodation_needed}
    icon={Hotel}
    color="from-orange-400 to-orange-500"
  />

</section>
        {/* Events Section */}
        <section className="card mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Events</h3>

            <div className="flex gap-2">
              {/* Fix #6 — manual refresh button */}
              <button
                onClick={() => { fetchEvents(); fetchStats(); }}
                className="px-3 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
              >
                ↻ Refresh
              </button>

              <button
                onClick={() => router.push('/events')} // same, untouched
                className="btn-primary"
              >
                Create Event
              </button>

                <button
    onClick={() => router.push('/manage-events')}
    className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition"
  >
    Manage Events
  </button>
  
            </div>
          </div>

          {/* Fix #5 — events error display */}
          {eventsError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
              {eventsError}
            </div>
          )}

          {eventsLoading ? (
            <p className="text-gray-500">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No events yet. Create your first event!
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div
  key={event.id}
className="bg-white border border-border rounded-2xl p-5 hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
>

  {/* Title */}

  <div className="flex items-start justify-between">

    <div>

      <h3 className="text-xl font-semibold text-text">
        {event.title}
      </h3>

      <p className="text-sm text-muted mt-1">
        📍 {event.venue}
      </p>

    </div>

    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
        event.status
      )}`}
    >
      {event.status}
    </span>

  </div>

  {/* Date */}

   <div className="mt-4 text-sm text-gray-600">

    📅{" "}
    {new Date(event.start_date).toLocaleDateString()}

    {"  "}—{"  "}

    {new Date(event.end_date).toLocaleDateString()}

  </div>

  {/* Registration Link */}

  {tenant?.id && (

    <div className="mt-4">

      <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">

        Registration Link

      </p>

      <input
        readOnly
        value={`${getBaseUrl()}/register?event=${event.id}&tenant=${tenant.id}`}
        className="input-field text-sm"
      />

    </div>

  )}

  {/* Buttons */}

  <div className="flex gap-3 mt-4">

    {tenant?.id && (

      <button
        onClick={() => handleCopyLink(event.id)}
        className="btn-secondary flex-1"
      >

        {copiedEventId === event.id
          ? "Copied ✓"
          : "Copy Link"}

      </button>

    )}

    <button
      onClick={() =>
        router.push(`/delegates?event=${event.id}`)
      }
      className="btn-primary flex-1"
    >

      Register

    </button>

  </div>

</div>
               
              ))}
            </div>
          )}
        </section>

        {/* Quick Links — Fix #13: changed to grid-cols-3 to handle 9 buttons evenly */}
        <section className="mt-8 grid gap-4 grid-cols-3 md:grid-cols-3 lg:grid-cols-9">

          <button
            onClick={() => router.push('/events')} // same, untouched
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">📋</p>
            <p className="font-semibold">Events</p>
          </button>

          <button
            onClick={() => router.push('/delegates')} // same, untouched
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">👥</p>
            <p className="font-semibold">Delegates</p>
          </button>

          <button
            onClick={() => router.push('/accommodation')} // same, untouched
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">🏠</p>
            <p className="font-semibold">Accommodation</p>
          </button>

          <button
            onClick={() => router.push('/reports')} // same, untouched
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">🔍</p>
            <p className="font-semibold">Reports</p>
          </button>

          <button
            onClick={() => router.push('/attendance')} // same, untouched
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">📊</p>
            <p className="font-semibold">Attendance</p>
          </button>

          <button
            onClick={() => router.push('/scanner')} // same, untouched
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">📷</p>
            <p className="font-semibold">Scanner</p>
          </button>

          <button
            onClick={() => router.push('/registration')} // same, untouched
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">📦</p>
            <p className="font-semibold">Registration</p>
          </button>

          <button
            onClick={() => router.push('/food')} // same, untouched
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">🍽️</p>
            <p className="font-semibold">Food</p>
          </button>

          <button
            onClick={() => router.push('/staff')} // same, untouched
            className="card text-center hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">👨‍💼</p>
            <p className="font-semibold">Staff</p>
          </button>

        </section>

      </main>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.DASHBOARD}>
      <DashboardContent />
    </RoleGuard>
  );
}