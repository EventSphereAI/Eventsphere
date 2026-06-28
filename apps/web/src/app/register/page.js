'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/utils/api';
import { QRCodeCanvas } from 'qrcode.react';

function RegisterForm() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [eventInfo, setEventInfo] = useState(null);

  // Fix #9 — loading state for event info
  const [eventLoading, setEventLoading] = useState(false);
  // Fix #5 — error state for event load failure
  const [eventError, setEventError] = useState('');
  // Fix #10 — inline error state instead of alert
  const [formError, setFormError] = useState('');
  // Fix #4 & #13 — track if params are missing
  const [invalidLink, setInvalidLink] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    college: '',
    food_pref: 'veg',
    accommodation_required: false,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    event_id: '',
    tenant_id: ''
  });

  useEffect(() => {
    const eventId = searchParams.get('event');
    const tenantId = searchParams.get('tenant');

    // Fix #12 — removed debug console.logs
    // Fix #4 & #13 — show invalid link message if params missing
    if (!eventId || !tenantId) {
      setInvalidLink(true);
      return;
    }

    setForm((prev) => ({
      ...prev,
      event_id: eventId,
      tenant_id: tenantId
    }));

    loadEvent(eventId, tenantId);
  }, [searchParams]);

  const loadEvent = async (eventId, tenantId) => {
    try {
      // Fix #9 — show loading while event info fetches
      setEventLoading(true);
      setEventError('');

      const { data } = await api.get(
        `/api/public/event/${eventId}?tenant_id=${tenantId}` // same API call, untouched
      );

      setEventInfo(data);
    } catch (err) {
      console.error(err);
      // Fix #5 — show error instead of silent failure
      setEventError('Failed to load event details. Please check your link or try again.');
    } finally {
      setEventLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Fix #1 — validate phone before submit
    if (form.phone.length !== 10) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }

    // Fix #2 — validate emergency phone if filled
    if (
      form.emergency_contact_phone &&
      form.emergency_contact_phone.length !== 10
    ) {
      setFormError('Emergency contact phone must be exactly 10 digits.');
      return;
    }

    // Fix #6 — trim text fields before sending
    const trimmedForm = {
      ...form,
      full_name: form.full_name.trim(),
      college: form.college.trim(),
      emergency_contact_name: form.emergency_contact_name.trim()
    };

    try {
      setLoading(true);

      const response = await api.post(
        '/api/public/register',
        trimmedForm // same API call, untouched — only trimmed values
      );

      setQrToken(response.data.qr_token);   // same, untouched
      setRegisteredName(form.full_name);     // same, untouched
      setRegistered(true);                   // same, untouched

      // Fix #3 — removed alert() for success; registered state handles UI
    } catch (err) {
      console.error(err);
      // Fix #3 & #10 — show error inline instead of alert
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Registration failed. Please try again.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('event-qr');

    // Fix #15 — show feedback if canvas not found
    if (!canvas) {
      alert('QR code not ready. Please wait and try again.');
      return;
    }

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eventsphere-qr.png'; // same, untouched
    link.click();
  };

  // Fix #14 — print QR pass
  const printQR = () => {
    window.print();
  };

  // Fix #13 — show invalid link page if params are missing
  if (invalidLink) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <div className="p-6 border rounded bg-red-50 border-red-200">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid Registration Link</h2>
          <p className="text-gray-600">
            This registration link is invalid or has expired. Please contact the event organizer for a valid link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">Event Registration</h1>

      {/* Fix #9 — loading state for event info */}
      {eventLoading && (
        <div className="mb-6 p-4 border rounded bg-gray-50 text-gray-500 animate-pulse">
          Loading event details...
        </div>
      )}

      {/* Fix #5 — event load error */}
      {eventError && !eventLoading && (
        <div className="mb-6 p-4 border rounded bg-red-50 border-red-200 text-red-600">
          {eventError}
        </div>
      )}

      {/* Event info card — same structure, untouched */}
      {eventInfo && !eventLoading && (
        <div className="mb-6 p-4 border rounded bg-white shadow">
          <h2 className="text-xl font-bold">{eventInfo.title}</h2>
          <p className="text-gray-600">{eventInfo.venue}</p>
          <p className="text-sm text-gray-500">
            {new Date(eventInfo.start_date).toLocaleDateString()}
          </p>
          {eventInfo.description && (
            <p className="mt-2 text-gray-700">{eventInfo.description}</p>
          )}
        </div>
      )}

      {/* Fix #10 — inline form error */}
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {formError}
        </div>
      )}

      {/* Fix #18 — don't show form after successful registration */}
      {!registered && (
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Fix #8 — added <label> for all fields */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border p-3 rounded"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              maxLength={100} // Fix #7
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Email"
              className="w-full border p-3 rounded"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={200} // Fix #7
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            {/* Fix #1 — digit-only filter + maxLength */}
            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full border p-3 rounded"
              value={form.phone}
              maxLength={10}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 10)
                })
              }
              required
            />
            {/* Fix #1 — live digit hint */}
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
              placeholder="College"
              className="w-full border p-3 rounded"
              value={form.college}
              onChange={(e) => setForm({ ...form, college: e.target.value })}
              maxLength={200} // Fix #7
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Food Preference</label>
            <select
              className="w-full border p-3 rounded"
              value={form.food_pref}
              onChange={(e) => setForm({ ...form, food_pref: e.target.value })}
            >
              <option value="veg">Veg</option>
              <option value="non_veg">Non Veg</option>
              <option value="vegan">Vegan</option>
            </select>
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

          <div>
            <label className="block text-sm font-medium mb-1">Emergency Contact Name</label>
            <input
              type="text"
              placeholder="Emergency Contact Name"
              className="w-full border p-3 rounded"
              value={form.emergency_contact_name}
              onChange={(e) =>
                setForm({ ...form, emergency_contact_name: e.target.value })
              }
              maxLength={100} // Fix #7
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Emergency Contact Phone</label>
            {/* Fix #2 — digit-only filter + maxLength */}
            <input
              type="tel"
              placeholder="Emergency Contact Phone"
              className="w-full border p-3 rounded"
              value={form.emergency_contact_phone}
              maxLength={10}
              onChange={(e) =>
                setForm({
                  ...form,
                  emergency_contact_phone: e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 10)
                })
              }
            />
            {/* Fix #2 — live digit hint */}
            {form.emergency_contact_phone.length > 0 &&
              form.emergency_contact_phone.length < 10 && (
                <p className="text-xs text-red-500 mt-1">
                  {10 - form.emergency_contact_phone.length} more digit(s) required
                </p>
              )}
          </div>

          {/* Fix #11 — spinner on submit button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded disabled:opacity-60 flex items-center gap-2"
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
            {loading ? 'Registering...' : 'Register'}
          </button>

        </form>
      )}

      {/* Success + QR — same structure, untouched */}
      {registered && qrToken && (
        <div className="mt-10 p-6 border rounded bg-white shadow">

          <h2 className="text-2xl font-bold text-green-600 mb-4">
            🎉 Registration Successful
          </h2>

          <p className="mb-2">Welcome {registeredName}</p>
          <p className="text-gray-500 mb-6">Your event pass is ready.</p>

          <QRCodeCanvas
            id="event-qr"
            value={qrToken} // same, untouched
            size={250}
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={downloadQR}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Download QR
            </button>

            {/* Fix #14 — print button */}
            <button
              onClick={printQR}
              className="bg-gray-700 text-white px-4 py-2 rounded"
            >
              Print Pass
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-3xl mx-auto p-8">
                    Loading...
                </div>
            }
        >
            <RegisterForm />
        </Suspense>
    );
}