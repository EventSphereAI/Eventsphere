'use client';

import { useEffect, useState, useCallback } from 'react'; // Fix #14 — added useCallback
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

function DelegatesContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [eventsError, setEventsError] = useState(''); // Fix #18 — error state for event fetch
  const [selectedEvent, setSelectedEvent] = useState('');

  const [delegates, setDelegates] = useState([]);
  const [delegatesLoading, setDelegatesLoading] = useState(false);

  const [qrData, setQrData] = useState(null);
  const [selectedDelegateId, setSelectedDelegateId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false); // Fix #5 — separate submit loading
  const [formError, setFormError] = useState(''); // Fix #1 — inline error instead of alert

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    college: '',
    food_pref: 'veg',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    accommodation_required: false
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Fix #3 — only fetch events once auth is resolved and user exists
  useEffect(() => {
    if (!loading && user) {
      fetchEvents();
    }
  }, [loading, user]);

  // Fix #14 — wrapped in useCallback so it's stable across renders
  const fetchDelegates = useCallback(async () => {
    try {
      setDelegatesLoading(true);
      const { data } = await api.get(
        `/api/delegates/?event_id=${selectedEvent}` // same API call, untouched
      );
      setDelegates(data.delegates || []);
    } catch (err) {
      console.error('Failed to load delegates:', err);
    } finally {
      setDelegatesLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedEvent) {
      // Fix #10 — reset QR when event changes
      setQrData(null);
      setSelectedDelegateId(null);
      fetchDelegates();
    }
  }, [selectedEvent, fetchDelegates]);

  const fetchEvents = async () => {
    try {
      setEventsError('');
      const { data } = await api.get('/api/events/'); // same API call, untouched
      setEvents(data.events || []);
      if (data.events?.length > 0) {
        setSelectedEvent(data.events[0].id);
      }
    } catch (err) {
      console.error(err);
      setEventsError('Failed to load events. Please refresh the page.'); // Fix #18
    }
  };

  const registerDelegate = async (e) => {
    e.preventDefault();
    setFormError('');

    // Fix #2 — validate phone length before submit
    if (form.phone.length !== 10) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }

    if (
      form.emergency_contact_phone &&
      form.emergency_contact_phone.length !== 10
    ) {
      setFormError('Emergency contact phone must be exactly 10 digits.');
      return;
    }

    try {
      setSubmitLoading(true); // Fix #5 — loading state on submit

      await api.post('/api/delegates/', { // same API call, untouched
        ...form,
        event_id: selectedEvent
      });

      setFormError('');
      alert('Delegate Registered Successfully');

      fetchDelegates(); // same, untouched

      // Fix #10 — reset form after success (was already doing this, kept same)
      setForm({
        full_name: '',
        email: '',
        phone: '',
        college: '',
        food_pref: 'veg',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        accommodation_required: false
      });

    } catch (err) {
      console.error(err);
      // Fix #1 — show readable error inline instead of JSON.stringify alert
      const errData = err.response?.data;
      const message = errData
        ? Object.entries(errData)
            .map(([key, val]) =>
              `${key}: ${Array.isArray(val) ? val.join(', ') : val}`
            )
            .join(' | ')
        : 'Failed to register delegate. Please try again.';
      setFormError(message);
    } finally {
      setSubmitLoading(false); // Fix #5
    }
  };

  const viewQr = async (delegateId) => {
    try {
      const { data } = await api.get(
        `/api/delegates/${delegateId}/qr-pass` // same API call, untouched
      );
      setQrData(data);
      setSelectedDelegateId(delegateId);
    } catch (err) {
      console.error(err);
      alert('Failed to load QR');
    }
  };

  // Fix #13 — QR download button handler
  const downloadQr = () => {
    if (!qrData?.qr_code) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrData.qr_code}`;
    link.download = `qr-pass-${selectedDelegateId}.png`;
    link.click();
  };

  const exportDelegates = () => {
    // Fix #12 — export filteredDelegates instead of all delegates
    // Fix #4 — properly escape CSV fields
    const escapeCSV = (val) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    let csvContent =
      'Name,Email,Phone,College,Food Preference,Accommodation Required\n';

    filteredDelegates.forEach((delegate) => { // Fix #12 — was `delegates`, now `filteredDelegates`
      csvContent +=
        `${escapeCSV(delegate.full_name)},${escapeCSV(delegate.email)},${escapeCSV(delegate.phone)},${escapeCSV(delegate.college)},${escapeCSV(delegate.food_pref)},${escapeCSV(delegate.accommodation_required)}\n`;
    });

    const blob = new Blob(
      [csvContent],
      { type: 'text/csv;charset=utf-8;' }
    );

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'delegates.csv';
    link.click();
    URL.revokeObjectURL(url); // Fix #16 — revoke to prevent memory leak
  };

  const filteredDelegates = delegates.filter((delegate) => {
    const search = searchTerm.toLowerCase();
    return (
      delegate.full_name?.toLowerCase().includes(search) ||
      delegate.email?.toLowerCase().includes(search) ||
      delegate.phone?.toLowerCase().includes(search) ||
      delegate.college?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">Delegate Registration</h1>

      {/* Fix #1 — inline form error display */}
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {formError}
        </div>
      )}

      {/* Fix #18 — events fetch error */}
      {eventsError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {eventsError}
        </div>
      )}

      <form
        onSubmit={registerDelegate}
        className="space-y-4 bg-white p-6 rounded shadow"
      >
        {/* Fix #14 — added labels for accessibility */}
        <div>
          <label className="block text-sm font-medium mb-1">Select Event</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full border p-3 rounded"
            required
          >
            {/* Fix #17 — empty state when no events */}
            {events.length === 0 ? (
              <option value="">No events available — create one first</option>
            ) : (
              events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full border p-3 rounded"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border p-3 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            maxLength={10}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value.replace(/\D/g, '').slice(0, 10) // same logic, untouched
              })
            }
            className="w-full border p-3 rounded"
            required
          />
          {/* Fix #2 — show length hint */}
          {form.phone.length > 0 && form.phone.length < 10 && (
            <p className="text-xs text-red-500 mt-1">
              {10 - form.phone.length} more digit(s) required
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">College / Organization</label>
          <input
            type="text"
            placeholder="College / Organization"
            value={form.college}
            onChange={(e) => setForm({ ...form, college: e.target.value })}
            className="w-full border p-3 rounded"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Food Preference</label>
          <select
            value={form.food_pref}
            onChange={(e) => setForm({ ...form, food_pref: e.target.value })}
            className="w-full border p-3 rounded"
          >
            <option value="veg">Veg</option>
            <option value="non_veg">Non Veg</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Emergency Contact Name</label>
          <input
            type="text"
            placeholder="Emergency Contact Name"
            value={form.emergency_contact_name}
            onChange={(e) =>
              setForm({ ...form, emergency_contact_name: e.target.value })
            }
            className="w-full border p-3 rounded"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Emergency Contact Phone</label>
          <input
            type="tel"
            placeholder="Emergency Contact Phone"
            value={form.emergency_contact_phone}
            maxLength={10}
            onChange={(e) =>
              setForm({
                ...form,
                emergency_contact_phone: e.target.value
                  .replace(/\D/g, '')
                  .slice(0, 10) // same logic, untouched
              })
            }
            className="w-full border p-3 rounded"
          />
          {/* Fix #2 — show length hint for emergency phone */}
          {form.emergency_contact_phone.length > 0 &&
            form.emergency_contact_phone.length < 10 && (
              <p className="text-xs text-red-500 mt-1">
                {10 - form.emergency_contact_phone.length} more digit(s) required
              </p>
            )}
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.accommodation_required}
            onChange={(e) =>
              setForm({ ...form, accommodation_required: e.target.checked })
            }
          />
          Accommodation Required
        </label>

        {/* Fix #5 — disabled + spinner during submit */}
        <button
          type="submit"
          disabled={submitLoading || events.length === 0}
          className="bg-blue-600 text-white px-6 py-3 rounded disabled:opacity-60 flex items-center gap-2"
        >
          {submitLoading && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {submitLoading ? 'Registering...' : 'Register Delegate'}
        </button>

      </form>

      <div className="mt-10 bg-white p-6 rounded shadow">

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">

          <h2 className="text-2xl font-bold">Registered Delegates</h2>

          <div className="flex gap-2 items-center">

            {/* Fix #11 — don't show count while loading */}
            {!delegatesLoading && (
              <p className="text-sm text-gray-500">
                Showing {filteredDelegates.length} of {delegates.length} delegates
              </p>
            )}

            <input
              type="text"
              placeholder="Search delegates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded px-3 py-2"
            />

            <button
              onClick={exportDelegates}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Export
            </button>

          </div>

        </div>

        {delegatesLoading ? (
          <p>Loading delegates...</p>
        ) : delegates.length === 0 ? (
          <p className="text-gray-500">No delegates registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Phone</th>
                  <th className="border px-4 py-2">College</th>
                  <th className="border px-4 py-2">Food</th>
                  <th className="border px-4 py-2">Accommodation</th>
                  <th className="border px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDelegates.map((delegate) => (
                  <tr
                    key={delegate.id}
                    className={
                      selectedDelegateId === delegate.id
                        ? 'bg-green-50' // Fix #8 — highlight active QR row
                        : ''
                    }
                  >
                    <td className="border px-4 py-2">{delegate.full_name}</td>
                    <td className="border px-4 py-2">{delegate.email}</td>
                    <td className="border px-4 py-2">{delegate.phone}</td>
                    <td className="border px-4 py-2">{delegate.college}</td>
                    <td className="border px-4 py-2">{delegate.food_pref}</td>
                    <td className="border px-4 py-2">
                      {delegate.accommodation_required ? 'Yes' : 'No'}
                    </td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => viewQr(delegate.id)} // same function, untouched
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        {/* Fix #8 — show active state on button */}
                        {selectedDelegateId === delegate.id ? 'Viewing QR' : 'View QR'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Fix #7 — QR panel with close button | Fix #13 — download button */}
        {qrData && (
          <div className="mt-8 border rounded p-6 bg-gray-50 relative">

            {/* Fix #7 — close button */}
            <button
              onClick={() => {
                setQrData(null);
                setSelectedDelegateId(null);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
              aria-label="Close QR panel"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-3">QR Pass</h2>
            <p className="mb-4">{qrData.name}</p>

            <img
              src={`data:image/png;base64,${qrData.qr_code}`} // same, untouched
              alt="QR Pass"
              className="w-64 h-64 border"
            />

            {/* Fix #13 — download QR button */}
            <button
              onClick={downloadQr}
              className="mt-4 block bg-gray-700 text-white px-4 py-2 rounded"
            >
              Download QR
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

export default function DelegatesPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.DELEGATES}>
      <DelegatesContent />
    </RoleGuard>
  );
}
