'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext'; // Fix — auth guard
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

function AttendanceContent() {
  const router = useRouter();
  const { user, loading } = useAuth(); // Fix — auth guard

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventsError, setEventsError] = useState('');     // Fix — silent failure
  const [attendanceError, setAttendanceError] = useState(''); // Fix — silent failure
  const [exportError, setExportError] = useState('');     // Fix — alert() replaced
  const [statsLoading, setStatsLoading] = useState(false); // Fix — loading state

  const [stats, setStats] = useState({
    total_delegates: 0,
    present_today: 0,
    currently_inside: 0,
    checked_out: 0,
    attendance_rate: 0
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
      loadAttendance();
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      setEventsError('');
      const { data } = await api.get('/api/events/'); // untouched

      setEvents(data.events || []); // Fix — added || [] fallback

      // Fix — SSR guard on localStorage read
      const savedEvent = typeof window !== 'undefined'
        ? localStorage.getItem('attendanceSelectedEvent')
        : null;

      if (savedEvent && data.events?.some((e) => e.id === savedEvent)) {
        setSelectedEvent(savedEvent);
      } else if (data.events?.length > 0) {
        setSelectedEvent(data.events[0].id);
      }
    } catch (err) {
      console.error(err);
      setEventsError('Failed to load events. Please refresh.'); // Fix — silent failure
    }
  };

  const loadAttendance = async () => {
    try {
      setStatsLoading(true); // Fix — loading state
      setAttendanceError('');
      const { data } = await api.get(
        `/api/reports/attendance/${selectedEvent}` // untouched
      );
      setStats(data);
    } catch (err) {
      console.error(err);
      setAttendanceError('Failed to load attendance data.'); // Fix — silent failure
    } finally {
      setStatsLoading(false);
    }
  };

  const downloadAttendance = async () => {
    if (!selectedEvent) return;
    setExportError('');

    try {
      const response = await api.get(
        `/api/reports/attendance-export/${selectedEvent}`, // untouched
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_${selectedEvent}.csv`; // untouched
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setExportError('Failed to export attendance. Please try again.'); // Fix — no alert()
    }
  };

  // Fix — removed console.log, added SSR guard on localStorage
  const openScanner = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendanceSelectedEvent', selectedEvent);
    }
    router.push('/attendance/scanner'); // untouched
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
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Attendance Management
        </h1>
        <p className="text-slate-600 mt-2">
          Scan delegates and manage event attendance.
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
      {attendanceError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {attendanceError}
        </div>
      )}

      {/* Event selector + Export + Scanner — all in one header row like accommodation */}
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

        {/* Scanner + Export buttons — same style as accommodation page */}
        <div className="flex gap-3">
          <button
            onClick={openScanner}
            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl"
          >
            Open Scanner
          </button>

          <button
            onClick={downloadAttendance}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
          >
            Export CSV
          </button>
        </div>

      </div>

      {/* Stats — Fix: show — while loading */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">Present Today</p>
          <h2 className="text-4xl font-bold mt-3">
            {statsLoading ? '—' : stats.present_today}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">Currently Inside</p>
          <h2 className="text-4xl font-bold mt-3 text-emerald-600">
            {statsLoading ? '—' : stats.currently_inside}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">Checked Out</p>
          <h2 className="text-4xl font-bold mt-3 text-amber-500">
            {statsLoading ? '—' : stats.checked_out}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">Attendance Rate</p>
          <h2 className="text-4xl font-bold mt-3 text-violet-600">
            {statsLoading ? '—' : `${stats.attendance_rate}%`}
          </h2>
        </div>

      </div>

    </div>
  );
}

export default function AttendancePage() {
  return (
    <RoleGuard
      allowedRoles={PERMISSIONS.ATTENDANCE}
    >
      <AttendanceContent />
    </RoleGuard>
  );
}