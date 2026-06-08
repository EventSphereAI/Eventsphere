'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';


export default function DelegatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');

  const [delegates, setDelegates] = useState([]);
  const [delegatesLoading, setDelegatesLoading] = useState(false);

  const [qrData, setQrData] = useState(null);

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

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
  if (selectedEvent) {
    fetchDelegates();
  }
}, [selectedEvent]);


  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/api/events/');
      setEvents(data.events || []);

      if (data.events?.length > 0) {
        setSelectedEvent(data.events[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const registerDelegate = async (e) => {
    e.preventDefault();

    try {
      await api.post('/api/delegates/', {
        ...form,
        event_id: selectedEvent
      });

      alert('Delegate Registered Successfully');

      fetchDelegates();

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
      alert('Failed to register delegate');
    }
  };

  const fetchDelegates = async () => {
  try {
    setDelegatesLoading(true);

    const { data } = await api.get(
      `/api/delegates/?event_id=${selectedEvent}`
    );

    setDelegates(data.delegates || []);
  } catch (err) {
    console.error('Failed to load delegates:', err);
  } finally {
    setDelegatesLoading(false);
  }
};

const viewQr = async (delegateId) => {
  try {
    const { data } = await api.get(
      `/api/delegates/${delegateId}/qr-pass`
    );

    setQrData(data);
  } catch (err) {
    console.error(err);
    alert('Failed to load QR');
  }
};

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        Delegate Registration
      </h1>

      <form
        onSubmit={registerDelegate}
        className="space-y-4 bg-white p-6 rounded shadow"
      >

        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full border p-3 rounded"
          required
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) =>
            setForm({ ...form, full_name: e.target.value })
          }
          className="w-full border p-3 rounded"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          className="w-full border p-3 rounded"
          required
        />

      <input
      type="tel"
      placeholder="Phone"
      value={form.phone}
      maxLength={10}
      onChange={(e) =>
        setForm({
          ...form,
          phone: e.target.value.replace(/\D/g, '').slice(0, 10)
        })
      }
      className="w-full border p-3 rounded"
    />

        <input
          type="text"
          placeholder="College / Organization"
          value={form.college}
          onChange={(e) =>
            setForm({ ...form, college: e.target.value })
          }
          className="w-full border p-3 rounded"
        />

        <input
        type="text"
        placeholder="Emergency Contact Name"
        value={form.emergency_contact_name}
        onChange={(e) =>
          setForm({
            ...form,
            emergency_contact_name: e.target.value
          })
        }
        className="w-full border p-3 rounded"
      />

        <input
    type="tel"
    placeholder="Emergency Contact Phone"
    value={form.emergency_contact_phone}
    onChange={(e) =>
      setForm({
        ...form,
        emergency_contact_phone: e.target.value
          .replace(/\D/g, '')
          .slice(0, 10)
      })
    }
    className="w-full border p-3 rounded"
  />

        <select
          value={form.food_pref}
          onChange={(e) =>
            setForm({ ...form, food_pref: e.target.value })
          }
          className="w-full border p-3 rounded"
        >
          <option value="veg">Veg</option>
          <option value="non-veg">Non Veg</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.accommodation_required}
            onChange={(e) =>
              setForm({
                ...form,
                accommodation_required: e.target.checked
              })
            }
          />
          Accommodation Required
        </label>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded"
        >
          Register Delegate
        </button>

      </form>

      <div className="mt-10 bg-white p-6 rounded shadow">

  <h2 className="text-2xl font-bold mb-4">
    Registered Delegates
  </h2>

  {delegatesLoading ? (
    <p>Loading delegates...</p>
  ) : delegates.length === 0 ? (
    <p className="text-gray-500">
      No delegates registered yet.
    </p>
  ) : (
    <div className="space-y-4">

      {delegates.map((delegate) => (
        <div
          key={delegate.id}
          className="border rounded p-4 flex justify-between items-center"
        >
          <div>
            <h3 className="font-semibold">
              {delegate.full_name}
            </h3>

            <p className="text-sm text-gray-600">
              {delegate.email}
            </p>

            <p className="text-sm text-gray-500">
              {delegate.college}
            </p>
          </div>

          


        {qrData && (
  <div className="mt-8 bg-white p-6 rounded shadow">

    <h2 className="text-xl font-bold mb-4">
      QR Pass
    </h2>

    <p className="mb-4">
      {qrData.name}
    </p>

    <img
      src={`data:image/png;base64,${qrData.qr_code}`}
      alt="QR Pass"
      className="w-64 h-64 border"
    />

  </div>
)}

          <button
  onClick={() => viewQr(delegate.id)}
  className="bg-green-600 text-white px-4 py-2 rounded"
>
  View QR
</button>

        </div>
      ))}

    </div>
  )}

</div>
      
    </div>
  );
}