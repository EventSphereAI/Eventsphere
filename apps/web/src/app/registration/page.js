'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext'; // Fix — auth guard
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

function RegistrationContent() {
  const router = useRouter();
  const { user, loading } = useAuth(); // Fix — auth guard

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventsError, setEventsError] = useState('');   // Fix — silent failure
  const [statsError, setStatsError] = useState('');     // Fix — silent failure
  const [exportError, setExportError] = useState('');   // Fix — alert() replaced
  const [statsLoading, setStatsLoading] = useState(false); // Fix — loading state

  const [stats, setStats] = useState({
    total_delegates: 0,
    kits_distributed: 0,
    pending_distribution: 0,
    distribution_rate: 0
  });

  // Fix — auth redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user) {
      loadEvents();
    }
  }, [loading, user]);

  useEffect(() => {
    if (selectedEvent) {
      loadRegistrationStats();
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      setEventsError('');
      const { data } = await api.get('/api/events/'); // untouched

      setEvents(data.events || []); // Fix — added || [] fallback

      if (data.events?.length > 0) {
        setSelectedEvent(data.events[0].id);
      }
    } catch (err) {
      console.error(err);
      setEventsError('Failed to load events. Please refresh.'); // Fix — silent failure
    }
  };

  const loadRegistrationStats = async () => {
    try {
      setStatsLoading(true); // Fix — loading state
      setStatsError('');
      const { data } = await api.get(
        `/api/reports/registration/${selectedEvent}` // untouched
      );
      setStats(data);
    } catch (err) {
      console.error(err);
      setStatsError('Failed to load registration stats.'); // Fix — silent failure
    } finally {
      setStatsLoading(false);
    }
  };

  const exportCSV = async () => {
    setExportError('');
    try {
      const { data } = await api.get(
        `/api/reports/registration-export/${selectedEvent}` // untouched
      );

      const rows = data.rows;

      if (!rows.length) {
        setExportError('No data found to export.'); // Fix — alert() replaced
        return;
      }

      // Fix — escape CSV fields to handle commas/quotes in values
      const escapeCSV = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      const csv = [
        ['Full Name', 'Email', 'College', 'Distributed At'],
        ...rows.map((r) => [
          escapeCSV(r.full_name),
          escapeCSV(r.email),
          escapeCSV(r.college),
          escapeCSV(r.distributed_at),
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registration-report.csv'; // untouched
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setExportError('Failed to export CSV. Please try again.'); // Fix — silent failure
    }
  };

  // Fix — SSR guard on localStorage + removed inline onClick clutter
  const openScanner = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('registrationSelectedEvent', selectedEvent); // untouched key
    }
    router.push('/registration/scanner'); // untouched route
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
    <div className="min-h-screen bg-slate-100 p-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Registration & Kit Management
        </h1>
        <p className="text-slate-600 mt-2">
          Scan delegates and distribute registration kits.
        </p>
      </div>

      {/* Error displays */}
      {eventsError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {eventsError}
        </div>
      )}
      {exportError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {exportError}
        </div>
      )}
      {statsError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {statsError}
        </div>
      )}

      {/* Event selector + Scanner + Export — same layout as accommodation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div className="w-full md:w-96">
          <label className="block text-sm font-medium mb-2">Select Event</label>
          <select
            className="w-full border border-slate-300 rounded-xl px-4 py-3"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            {events.length === 0 ? (
              <option value="">No events available</option>
            ) : (
              events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Fix — same button style as accommodation page, big div scanner removed */}
        <div className="flex gap-3">
          <button
            onClick={openScanner}
            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl"
          >
            Open Scanner
          </button>

          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
          >
            Export CSV
          </button>
        </div>

      </div>

      {/* Stats — Fix: show — while loading */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">Registered Delegates</p>
          <h2 className="text-4xl font-bold mt-3 text-slate-900">
            {statsLoading ? '—' : stats.total_delegates}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">Kits Distributed</p>
          <h2 className="text-4xl font-bold mt-3 text-emerald-600">
            {statsLoading ? '—' : stats.kits_distributed}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">Pending Distribution</p>
          <h2 className="text-4xl font-bold mt-3 text-amber-500">
            {statsLoading ? '—' : stats.pending_distribution}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">Distribution Rate</p>
          <h2 className="text-4xl font-bold mt-3 text-violet-600">
            {statsLoading ? '—' : `${stats.distribution_rate}%`}
          </h2>
        </div>

      </div>

    </div>
  );
}
export default function RegistrationPage() {
  return (
    <RoleGuard
      allowedRoles={PERMISSIONS.REGISTRATION}
    >
      <RegistrationContent />
    </RoleGuard>
  );
}