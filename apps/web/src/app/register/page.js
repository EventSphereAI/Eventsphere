'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/utils/api';
import { QRCodeCanvas } from 'qrcode.react';

export default function RegisterPage() {
const searchParams = useSearchParams();

const [loading, setLoading] = useState(false);
const [registered, setRegistered] = useState(false);
const [qrToken, setQrToken] = useState('');
const [registeredName, setRegisteredName] = useState('');
const [eventInfo, setEventInfo] = useState(null);

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

if (!eventId || !tenantId) return;

setForm((prev) => ({
  ...prev,
  event_id: eventId,
  tenant_id: tenantId
}));

loadEvent(eventId, tenantId);


}, [searchParams]);

const loadEvent = async (eventId, tenantId) => {
try {
const { data } = await api.get(
`/api/public/event/${eventId}?tenant_id=${tenantId}`
);


  setEventInfo(data);
} catch (err) {
  console.error(err);
}


};

const handleSubmit = async (e) => {
e.preventDefault();


try {
  setLoading(true);

  const response = await api.post(
    '/api/public/register',
    form
  );

  setQrToken(response.data.qr_token);
  setRegisteredName(form.full_name);
  setRegistered(true);

  alert(response.data.message);
} catch (err) {
  console.error(err);

  alert(
    err?.response?.data?.detail ||
      'Registration failed'
  );
} finally {
  setLoading(false);
}


};

const downloadQR = () => {
const canvas = document.getElementById('event-qr');


if (!canvas) return;

const url = canvas.toDataURL('image/png');

const link = document.createElement('a');

link.href = url;
link.download = 'eventsphere-qr.png';

link.click();


};

return ( <div className="max-w-3xl mx-auto p-8">


  <h1 className="text-3xl font-bold mb-6">
    Event Registration
  </h1>

  {eventInfo && (
    <div className="mb-6 p-4 border rounded bg-white shadow">
      <h2 className="text-xl font-bold">
        {eventInfo.title}
      </h2>

      <p className="text-gray-600">
        {eventInfo.venue}
      </p>

      <p className="text-sm text-gray-500">
        {new Date(
          eventInfo.start_date
        ).toLocaleDateString()}
      </p>

      {eventInfo.description && (
        <p className="mt-2 text-gray-700">
          {eventInfo.description}
        </p>
      )}
    </div>
  )}

  {!registered && (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >

      <input
        type="text"
        placeholder="Full Name"
        className="w-full border p-3 rounded"
        value={form.full_name}
        onChange={(e) =>
          setForm({
            ...form,
            full_name: e.target.value
          })
        }
        required
      />

      <input
        type="email"
        placeholder="Email"
        className="w-full border p-3 rounded"
        value={form.email}
        onChange={(e) =>
          setForm({
            ...form,
            email: e.target.value
          })
        }
        required
      />

      <input
        type="text"
        placeholder="Phone Number"
        className="w-full border p-3 rounded"
        value={form.phone}
        onChange={(e) =>
          setForm({
            ...form,
            phone: e.target.value
          })
        }
        required
      />

      <input
        type="text"
        placeholder="College"
        className="w-full border p-3 rounded"
        value={form.college}
        onChange={(e) =>
          setForm({
            ...form,
            college: e.target.value
          })
        }
      />

      <select
        className="w-full border p-3 rounded"
        value={form.food_pref}
        onChange={(e) =>
          setForm({
            ...form,
            food_pref: e.target.value
          })
        }
      >
        <option value="veg">Veg</option>
        <option value="non_veg">Non Veg</option>
        <option value="vegan">Vegan</option>
      </select>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.accommodation_required}
          onChange={(e) =>
            setForm({
              ...form,
              accommodation_required:
                e.target.checked
            })
          }
        />
        Accommodation Required
      </label>

      <input
        type="text"
        placeholder="Emergency Contact Name"
        className="w-full border p-3 rounded"
        value={form.emergency_contact_name}
        onChange={(e) =>
          setForm({
            ...form,
            emergency_contact_name:
              e.target.value
          })
        }
      />

      <input
        type="text"
        placeholder="Emergency Contact Phone"
        className="w-full border p-3 rounded"
        value={form.emergency_contact_phone}
        onChange={(e) =>
          setForm({
            ...form,
            emergency_contact_phone:
              e.target.value
          })
        }
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded"
      >
        {loading
          ? 'Registering...'
          : 'Register'}
      </button>

    </form>
  )}

  {registered && qrToken && (
    <div className="mt-10 p-6 border rounded bg-white shadow">

      <h2 className="text-2xl font-bold text-green-600 mb-4">
        🎉 Registration Successful
      </h2>

      <p className="mb-2">
        Welcome {registeredName}
      </p>

      <p className="text-gray-500 mb-6">
        Your event pass is ready.
      </p>

      <QRCodeCanvas
        id="event-qr"
        value={qrToken}
        size={250}
      />

      <button
        onClick={downloadQR}
        className="block mt-4 bg-green-600 text-white px-4 py-2 rounded"
      >
        Download QR
      </button>

    </div>
  )}

</div>


);
}
