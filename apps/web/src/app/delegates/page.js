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
const [selectedDelegateId, setSelectedDelegateId] = useState(null);

const [searchTerm, setSearchTerm] = useState('');

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

  alert(
    JSON.stringify(
      err.response?.data,
      null,
      2
    )
  );
}


};

const viewQr = async (delegateId) => {
try {
const { data } = await api.get(
`/api/delegates/${delegateId}/qr-pass`
);


  setQrData(data);
  setSelectedDelegateId(delegateId);
} catch (err) {
  console.error(err);
  alert('Failed to load QR');
}


};

const exportDelegates = () => {
let csvContent =
'Name,Email,Phone,College,Food Preference,Accommodation Required\n';


delegates.forEach((delegate) => {
  csvContent +=
    `"${delegate.full_name}","${delegate.email}","${delegate.phone}","${delegate.college}","${delegate.food_pref}","${delegate.accommodation_required}"\n`;
});

const blob = new Blob(
  [csvContent],
  { type: 'text/csv;charset=utf-8;' }
);

const link = document.createElement('a');

link.href = URL.createObjectURL(blob);
link.download = 'delegates.csv';
link.click();


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
return ( <div className="flex items-center justify-center min-h-screen">
Loading... </div>
);
}

if (!user) return null;

return ( <div className="max-w-6xl mx-auto p-8">


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
        setForm({
          ...form,
          full_name: e.target.value
        })
      }
      className="w-full border p-3 rounded"
      required
    />

    <input
      type="email"
      placeholder="Email"
      value={form.email}
      onChange={(e) =>
        setForm({
          ...form,
          email: e.target.value
        })
      }
      className="w-full border p-3 rounded"
      required
    />

    <input
      type="tel"
      placeholder="Phone Number"
      value={form.phone}
      maxLength={10}
      onChange={(e) =>
        setForm({
          ...form,
          phone: e.target.value
            .replace(/\D/g, '')
            .slice(0, 10)
        })
      }
      className="w-full border p-3 rounded"
      required
    />

    <input
      type="text"
      placeholder="College / Organization"
      value={form.college}
      onChange={(e) =>
        setForm({
          ...form,
          college: e.target.value
        })
      }
      className="w-full border p-3 rounded"
    />

    <select
      value={form.food_pref}
      onChange={(e) =>
        setForm({
          ...form,
          food_pref: e.target.value
        })
      }
      className="w-full border p-3 rounded"
    >
      <option value="veg">Veg</option>
      <option value="non_veg">Non Veg</option>
      <option value="vegan">Vegan</option>
    </select>

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

    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">

  <h2 className="text-2xl font-bold">
    Registered Delegates
  </h2>

  <div className="flex gap-2">

    <p className="text-sm text-gray-500 mb-4">
  Showing {filteredDelegates.length} of {delegates.length} delegates
</p>
    <input
      type="text"
      placeholder="Search delegates..."
      value={searchTerm}
      onChange={(e) =>
        setSearchTerm(e.target.value)
      }
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
      <p className="text-gray-500">
        No delegates registered yet.
      </p>
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
              <tr key={delegate.id}>

                <td className="border px-4 py-2">
                  {delegate.full_name}
                </td>

                <td className="border px-4 py-2">
                  {delegate.email}
                </td>

                <td className="border px-4 py-2">
                  {delegate.phone}
                </td>

                <td className="border px-4 py-2">
                  {delegate.college}
                </td>

                <td className="border px-4 py-2">
                  {delegate.food_pref}
                </td>

                <td className="border px-4 py-2">
                  {delegate.accommodation_required
                    ? 'Yes'
                    : 'No'}
                </td>

                <td className="border px-4 py-2">

                  <button
                    onClick={() => viewQr(delegate.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    View QR
                  </button>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>
    )}

    {qrData && (

      <div className="mt-8 border rounded p-6 bg-gray-50">

        <h2 className="text-xl font-bold mb-3">
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

  </div>

</div>


);
}
