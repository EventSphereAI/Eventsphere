'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext'; // Fix #6 — auth guard
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

function ReportsContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // Fix #6

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [attendance, setAttendance] = useState(null);
  const [food, setFood] = useState(null);
  const [accommodation, setAccommodation] = useState(null);
  const [registration, setRegistration] = useState(null); // Fix #5 — now rendered
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventsError, setEventsError] = useState(''); // Fix #4
  const [lastUpdated, setLastUpdated] = useState('');

  // Fix #6 — auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchEvents();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (selectedEvent) {
      loadReports();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      setEventsError('');
      const { data } = await api.get('/api/events/'); // untouched
      setEvents(data.events || []);
      if (data.events?.length > 0) {
        setSelectedEvent(data.events[0].id);
      }
    } catch (err) {
      console.error(err);
      setEventsError('Failed to load events. Please refresh.'); // Fix #4
    }
  };

  // Fix #1 & #2 — loadReports is now a proper standalone async function
  // Fix #16 — setLoading(false) moved to finally block
  const loadReports = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        attendanceRes,
        registrationRes,
        foodRes,
        accommodationRes,
      ] = await Promise.all([
        api.get(`/api/reports/attendance/${selectedEvent}`),       // untouched
        api.get(`/api/reports/registration/${selectedEvent}`),     // untouched
        api.get(`/api/reports/food/${selectedEvent}`),             // untouched
        api.get(`/api/reports/accommodation/${selectedEvent}`),    // untouched
      ]);

      setAttendance(attendanceRes.data);
      setRegistration(registrationRes.data); // Fix #5 — now rendered below
      setFood(foodRes.data);
      // Fix #3 — removed debug console.log("Food Response:", foodRes.data)
      setAccommodation(accommodationRes.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false); // Fix #16 — single finally block
    }
  }; // Fix #2 — properly closed

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const downloadReport = async (type, filename) => {
  try {
    const response = await api.get(
      `/api/reports/${type}/${selectedEvent}`,
      {
        responseType: 'blob',
      }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement('a');

    link.href = url;

    link.setAttribute(
      'download',
      filename
    );

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    setError('Failed to export report.');
  }
};

  // Fix #1 — JSX return is now correctly at component level, NOT inside try block
  return (
    <div className="max-w-6xl mx-auto p-8">

      {/* Header row with title, last updated and refresh */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-2">
        <h1 className="text-3xl font-bold">Event Report Dashboard</h1>

        <div className="flex items-center gap-4">
          {/* Fix #10 — lastUpdated moved next to header */}
          <p className="text-sm text-slate-500">
            Last Updated: {lastUpdated || '—'}
          </p>

          {/* Fix #9 — refresh button */}
          <button
            onClick={loadReports}
            disabled={loading || !selectedEvent}
            className="text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Fix #4 — events error */}
      {eventsError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {eventsError}
        </div>
      )}

      {/* Fix #7 & #8 — label + empty state on event select */}
      {/* Fix #13 — event selector always visible, not hidden during loading */}
      <div className="mb-6">
        <label htmlFor="report-event-select" className="block text-sm font-medium mb-1">
          Select Event
        </label>
        <select
          id="report-event-select"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full border p-3 rounded"
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

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-100 text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadReports} className="text-sm underline ml-4">Retry</button>
        </div>
      )}

      {/* Fix #17 — loading skeleton cards instead of hiding everything */}
      {loading && (
        <div className="grid md:grid-cols-3 gap-4 mb-8 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded shadow">
              <div className="h-3 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      )}

      {/* ── Attendance ─────────────────────────────────── */}
      {!loading && attendance && (
        <>
          <h2 className="text-2xl font-bold mb-4">Attendance</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-8">

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Total Delegates</p>
              <h3 className="text-3xl font-bold">{attendance.total_delegates ?? 0}</h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Checked In</p>
              <h3 className="text-3xl font-bold text-emerald-600">{attendance.checked_in ?? 0}</h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Attendance Rate</p>
              <h3 className="text-3xl font-bold text-violet-600">{attendance.attendance_rate ?? 0}%</h3>
            </div>

          </div>

          <div className="mb-10">
  <button
   onClick={() =>
  downloadReport(
    'attendance-export',
    'attendance_report.csv'
  )
}
    className="
      bg-blue-600
      hover:bg-blue-700
      text-white
      px-5
      py-2
      rounded-lg
      transition
    "
  >
    Export Attendance CSV
  </button>
</div>
        </>
      )}

      {/* ── Registration — Fix #5 & #12: now rendered ─── */}
      {!loading && registration && (
        <>
          <h2 className="text-2xl font-bold mb-4">Registration & Kit Distribution</h2>
          <div className="grid md:grid-cols-4 gap-4 mb-8">

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Total Delegates</p>
              <h3 className="text-3xl font-bold">{registration.total_delegates ?? 0}</h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Kits Distributed</p>
              <h3 className="text-3xl font-bold text-emerald-600">{registration.kits_distributed ?? 0}</h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Pending</p>
              <h3 className="text-3xl font-bold text-amber-500">{registration.pending_distribution ?? 0}</h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Distribution Rate</p>
              <h3 className="text-3xl font-bold text-violet-600">{registration.distribution_rate ?? 0}%</h3>
            </div>

          </div>
          <div className="mb-10">
  <button
    onClick={() =>
      downloadReport(
        'registration-export',
        'registration_report.csv'
      )
    }
    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
  >
    Export Registration CSV
  </button>
</div>
        </>
      )}

      {/* ── Food Distribution ───────────────────────────── */}
      {!loading && food && (
        <>
          <h2 className="text-2xl font-bold mb-4">Food Distribution</h2>
          <div className="grid md:grid-cols-5 gap-4 mb-8">

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Breakfast</p>
              <h3 className="text-3xl font-bold text-orange-500">{food.breakfast}</h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Lunch</p>
              <h3 className="text-3xl font-bold text-green-600">{food.lunch}</h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">High Tea</p>
              <h3 className="text-3xl font-bold text-yellow-600">{food.high_tea}</h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Dinner</p>
              <h3 className="text-3xl font-bold text-violet-600">{food.dinner}</h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Total Meals</p>
              <h3 className="text-3xl font-bold">{food.total_meals}</h3>
            </div>

          </div>
          <div className="mb-10">
  <button
    onClick={() =>
      downloadReport(
        'food-export',
        'food_report.csv'
      )
    }
    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
  >
    Export Food CSV
  </button>
</div>
        </>
      )}

      {/* ── Accommodation — Fix #11: proper table instead of plain text ── */}
      {!loading && accommodation && (
        <>
          <h2 className="text-2xl font-bold mb-4">Accommodation</h2>
          <div className="bg-white p-6 rounded shadow mb-8">

            {accommodation.occupancy?.length === 0 ? (
              <p className="text-gray-500">No rooms created yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-4 py-2 text-left text-sm font-semibold text-gray-600">Hostel</th>
                      <th className="border px-4 py-2 text-left text-sm font-semibold text-gray-600">Occupied</th>
                      <th className="border px-4 py-2 text-left text-sm font-semibold text-gray-600">Capacity</th>
                      <th className="border px-4 py-2 text-left text-sm font-semibold text-gray-600">Available</th>
                      <th className="border px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accommodation.occupancy.map((room, index) => {
                      const available = Number(room.capacity) - Number(room.occupied ?? 0);
                      const isFull = available <= 0;
                      return (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="border px-4 py-2">{room.hostel_name}</td>
                          <td className="border px-4 py-2">{room.occupied ?? 0}</td>
                          <td className="border px-4 py-2">{room.capacity}</td>
                          <td className="border px-4 py-2">{available}</td>
                          <td className="border px-4 py-2">
                            {isFull
                              ? <span className="text-red-600 font-medium">Full</span>
                              : <span className="text-green-600 font-medium">Available</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="mb-10">
  <button
    onClick={() =>
      downloadReport(
        'accommodation-export',
        'accommodation_report.csv'
      )
    }
    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
  >
    Export Accommodation CSV
  </button>
</div>
        </>
      )}

    </div>
  );
} // Fix #2 — ReportsContent properly closed

export default function ReportsPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.REPORTS}>
      <ReportsContent />
    </RoleGuard>
  );
}