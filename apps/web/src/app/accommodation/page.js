'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // single import — Fix #1
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

function AccommodationContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ── Event state ──────────────────────────────────────────
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventsError, setEventsError] = useState('');

  // ── Room state ───────────────────────────────────────────
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState('');

  // ── Delegate state ───────────────────────────────────────
  const [delegates, setDelegates] = useState([]);
  const [delegatesError, setDelegatesError] = useState('');

  // ── Allocation state ─────────────────────────────────────
  const [allocations, setAllocations] = useState([]);
  const [allocationsLoading, setAllocationsLoading] = useState(false);
  const [allocationsError, setAllocationsError] = useState('');

  // Fix #3 — stats state declared at top before useEffects
  const [stats, setStats] = useState({
    total_rooms: 0,
    occupied_rooms: 0,
    available_beds: 0,
    checked_in: 0,
    checked_out: 0,
  });

  // ── Form state ───────────────────────────────────────────
  const [allocationForm, setAllocationForm] = useState({
    delegate_id: '',
    room_id: ''
  });

  const [roomForm, setRoomForm] = useState({
    room_number: '',
    hostel_name: '',
    capacity: 2,
    room_type: 'shared'
  });

  const [roomSubmitLoading, setRoomSubmitLoading] = useState(false);
  const [allocationSubmitLoading, setAllocationSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [exportError, setExportError] = useState(''); // Fix #4 — export error state

  // ── Auth guard ───────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user) {
      fetchEvents();
    }
  }, [loading, user]);

  useEffect(() => {
    if (selectedEvent) {
      setAllocationForm({ delegate_id: '', room_id: '' });
      setRoomForm({
        room_number: '',
        hostel_name: '',
        capacity: 2,
        room_type: 'shared'
      });
      fetchRooms();
      fetchDelegates();
      fetchAllocations();
      fetchStats(); // Fix #3 — now safe to call, defined below
    }
  }, [selectedEvent]);

  // ── Fetch functions ──────────────────────────────────────

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
      setEventsError('Failed to load events. Please refresh.');
    }
  };

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      setRoomsError('');
      const { data } = await api.get(
        `/api/accommodation/rooms/${selectedEvent}` // untouched
      );
      setRooms(data.rooms || []);
    } catch (err) {
      console.error(err);
      setRoomsError('Failed to load rooms.');
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchDelegates = async () => {
    try {
      setDelegatesError('');
      const { data } = await api.get(
        `/api/delegates/?event_id=${selectedEvent}` // untouched
      );
      setDelegates(data.delegates || []);
    } catch (err) {
      console.error(err);
      setDelegatesError('Failed to load delegates.');
    }
  };

  const fetchAllocations = async () => {
    try {
      setAllocationsLoading(true);
      setAllocationsError('');
      const { data } = await api.get(
        `/api/accommodation/allocations/${selectedEvent}` // untouched
      );
      setAllocations(data.allocations || []);
    } catch (err) {
      console.error(err);
      setAllocationsError('Failed to load allocations.');
    } finally {
      setAllocationsLoading(false);
    }
  };

  // Fix #3 — fetchStats defined before it's called in useEffect
  const fetchStats = async () => {
    try {
      const { data } = await api.get(
        `/api/accommodation/stats/${selectedEvent}` // untouched
      );
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Form handlers ─────────────────────────────────────────

  const createRoom = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (roomForm.capacity < 1) {
      setFormError('Capacity must be at least 1.');
      return;
    }

    try {
      setRoomSubmitLoading(true);
      await api.post('/api/accommodation/rooms', { // untouched
        event_id: selectedEvent,
        ...roomForm
      });
      setFormSuccess('Room created successfully.');
      setRoomForm({
        room_number: '',
        hostel_name: '',
        capacity: 2,
        room_type: 'shared'
      });
      fetchRooms();
      fetchStats(); // refresh stats after room creation
    } catch (err) {
      console.error(err);
      setFormError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Failed to create room.'
      );
    } finally {
      setRoomSubmitLoading(false);
    }
  };

  const allocateDelegate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      setAllocationSubmitLoading(true);
      await api.post('/api/accommodation/allocate', { // untouched
        delegate_id: allocationForm.delegate_id,
        room_id: allocationForm.room_id,
        event_id: selectedEvent
      });
      setFormSuccess('Delegate allocated successfully.');
      setAllocationForm({ delegate_id: '', room_id: '' });
      fetchAllocations();
      fetchStats(); // refresh stats after allocation
    } catch (err) {
      console.error(err);
      setFormError(
        err?.response?.data?.detail ||
        'Failed to allocate delegate.'
      );
    } finally {
      setAllocationSubmitLoading(false);
    }
  };

  const checkInAllocation = async (allocationId) => {
    if (!window.confirm('Confirm check-in for this delegate?')) return;
    try {
      await api.post(
        `/api/accommodation/checkin/${allocationId}` // untouched
      );
      fetchAllocations();
      fetchStats(); // refresh stats after check-in
    } catch (err) {
      console.error(err);
      setAllocationsError('Check-in failed. Please try again.');
    }
  };

  const checkOutAllocation = async (allocationId) => {
    if (!window.confirm('Confirm check-out for this delegate?')) return;
    try {
      await api.post(
        `/api/accommodation/checkout/${allocationId}` // untouched
      );
      fetchAllocations();
      fetchStats(); // refresh stats after check-out
    } catch (err) {
      console.error(err);
      setAllocationsError('Check-out failed. Please try again.');
    }
  };

  const exportCSV = async () => {
    setExportError('');
    try {
      const response = await api.get(
        `/api/reports/accommodation-export/${selectedEvent}`, // untouched
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'accommodation.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setExportError('Failed to export CSV. Please try again.'); // Fix #4
    }
  };

  // Fix #5 — safe localStorage with SSR guard + URL param approach
  const openScanner = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accommodationSelectedEvent', selectedEvent);
    }
    router.push(`/accommodation/scanner?event=${selectedEvent}`); // untouched route
  };

  // ── Derived values ────────────────────────────────────────

  const availableRooms = rooms.filter(
    (room) => Number(room.occupied ?? 0) < Number(room.capacity)
  );

  const allocatedDelegateIds = new Set(
    allocations.map((a) => String(a.delegate_id))
  );

  const availableRoomCount = rooms.filter(
    (room) => Number(room.occupied ?? 0) < Number(room.capacity)
  ).length;

  // ── Render guards ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  // ── JSX — Fix #2: correct structure, no extra closing divs ───
  return (
    <div className="max-w-6xl mx-auto p-8">

      {/* Header row */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Accommodation Management</h1>

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

      {/* Fix #4 — export error display */}
      {exportError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {exportError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 mb-8">

        <div className="bg-white rounded-2xl shadow-sm p-6 border">
          <p className="text-slate-500 text-sm">Total Rooms</p>
          <h2 className="text-4xl font-bold mt-3">{stats.total_rooms}</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border">
          <p className="text-slate-500 text-sm">Occupied Rooms</p>
          <h2 className="text-4xl font-bold mt-3 text-orange-600">{stats.occupied_rooms}</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border">
          <p className="text-slate-500 text-sm">Available Beds</p>
          <h2 className="text-4xl font-bold mt-3 text-green-600">{stats.available_beds}</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border">
          <p className="text-slate-500 text-sm">Checked In</p>
          <h2 className="text-4xl font-bold mt-3 text-blue-600">{stats.checked_in}</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border">
          <p className="text-slate-500 text-sm">Checked Out</p>
          <h2 className="text-4xl font-bold mt-3 text-red-600">{stats.checked_out}</h2>
        </div>

      </div>

      {/* Events error */}
      {eventsError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {eventsError}
        </div>
      )}

      {/* Form success / error */}
      {formSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-300">
          {formSuccess}
        </div>
      )}
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {formError}
        </div>
      )}

      {/* Event selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Select Event</label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full border p-3 rounded"
        >
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

      {/* Create Room Form */}
      <form
        onSubmit={createRoom}
        className="bg-white p-6 rounded shadow mb-8 space-y-4"
      >
        <h2 className="text-xl font-bold">Create Room</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Room Number</label>
          <input
            type="text"
            placeholder="Room Number"
            className="w-full border p-3 rounded"
            value={roomForm.room_number}
            onChange={(e) =>
              setRoomForm({ ...roomForm, room_number: e.target.value })
            }
            maxLength={20}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Hostel Name</label>
          <input
            type="text"
            placeholder="Hostel Name"
            className="w-full border p-3 rounded"
            value={roomForm.hostel_name}
            onChange={(e) =>
              setRoomForm({ ...roomForm, hostel_name: e.target.value })
            }
            maxLength={100}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Capacity</label>
          <input
            type="number"
            placeholder="Capacity"
            className="w-full border p-3 rounded"
            value={roomForm.capacity}
            min={1}
            onChange={(e) =>
              setRoomForm({ ...roomForm, capacity: Number(e.target.value) })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Room Type</label>
          <select
            className="w-full border p-3 rounded"
            value={roomForm.room_type}
            onChange={(e) =>
              setRoomForm({ ...roomForm, room_type: e.target.value })
            }
          >
            <option value="shared">Shared</option>
            <option value="single">Single</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={roomSubmitLoading || events.length === 0}
          className="bg-blue-600 text-white px-6 py-3 rounded disabled:opacity-60 flex items-center gap-2"
        >
          {roomSubmitLoading && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {roomSubmitLoading ? 'Creating...' : 'Create Room'}
        </button>
      </form>

      {/* Allocate Delegate Form */}
      <form
        onSubmit={allocateDelegate}
        className="bg-white p-6 rounded shadow mb-8 space-y-4"
      >
        <h2 className="text-xl font-bold">Allocate Delegate</h2>

        {delegatesError && (
          <p className="text-red-600 text-sm">{delegatesError}</p>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Select Delegate</label>
          <select
            value={allocationForm.delegate_id}
            onChange={(e) =>
              setAllocationForm({ ...allocationForm, delegate_id: e.target.value })
            }
            className="w-full border p-3 rounded"
            required
          >
            <option value="">Select Delegate</option>
            {delegates
              .filter((d) => !allocatedDelegateIds.has(String(d.id)))
              .map((delegate) => (
                <option key={delegate.id} value={delegate.id}>
                  {delegate.full_name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Select Room</label>
          <select
            value={allocationForm.room_id}
            onChange={(e) =>
              setAllocationForm({ ...allocationForm, room_id: e.target.value })
            }
            className="w-full border p-3 rounded"
            required
          >
            <option value="">Select Room</option>
            {availableRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.hostel_name} - Room {room.room_number} ({Number(room.occupied ?? 0)}/{room.capacity} occupied)
              </option>
            ))}
          </select>
          {availableRooms.length === 0 && rooms.length > 0 && (
            <p className="text-sm text-red-500 mt-1">All rooms are currently full.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={allocationSubmitLoading || availableRooms.length === 0}
          className="bg-green-600 text-white px-6 py-3 rounded disabled:opacity-60 flex items-center gap-2"
        >
          {allocationSubmitLoading && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {allocationSubmitLoading ? 'Allocating...' : 'Allocate Delegate'}
        </button>
      </form>

      {/* Rooms Table */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Rooms</h2>
          {rooms.length > 0 && (
            <span className="text-sm text-gray-500">
              {availableRoomCount} of {rooms.length} room(s) available
            </span>
          )}
        </div>

        {roomsError && (
          <p className="text-red-600 text-sm mb-2">{roomsError}</p>
        )}

        {roomsLoading ? (
          <p className="text-gray-500">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p>No rooms created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Hostel</th>
                  <th className="border px-4 py-2 text-left">Room Number</th>
                  <th className="border px-4 py-2 text-left">Capacity</th>
                  <th className="border px-4 py-2 text-left">Occupied</th>
                  <th className="border px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="border px-4 py-2">{room.hostel_name}</td>
                    <td className="border px-4 py-2">{room.room_number}</td>
                    <td className="border px-4 py-2">{room.capacity}</td>
                    <td className="border px-4 py-2">{room.occupied ?? 0}/{room.capacity}</td>
                    <td className="border px-4 py-2">
                      {Number(room.occupied ?? 0) >= Number(room.capacity)
                        ? <span className="text-red-600 font-medium">Full</span>
                        : <span className="text-green-600 font-medium">Available</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Allocations Table */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Current Allocations</h2>

        {allocationsError && (
          <p className="text-red-600 text-sm mb-2">{allocationsError}</p>
        )}

        {allocationsLoading ? (
          <p className="text-gray-500">Loading allocations...</p>
        ) : allocations.length === 0 ? (
          <p>No allocations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Delegate</th>
                  <th className="border px-4 py-2 text-left">Hostel</th>
                  <th className="border px-4 py-2 text-left">Room</th>
                  <th className="border px-4 py-2 text-left">Check-In</th>
                  <th className="border px-4 py-2 text-left">Check-Out</th>
                  <th className="border px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((allocation) => (
                  <tr key={allocation.id}>
                    <td className="border px-4 py-2">{allocation.full_name}</td>
                    <td className="border px-4 py-2">{allocation.hostel_name}</td>
                    <td className="border px-4 py-2">{allocation.room_number}</td>
                    <td className="border px-4 py-2">
                      {allocation.checkin_time
                        ? new Date(allocation.checkin_time).toLocaleString()
                        : 'Pending'}
                    </td>
                    <td className="border px-4 py-2">
                      {allocation.checkout_time
                        ? new Date(allocation.checkout_time).toLocaleString()
                        : 'Pending'}
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex gap-2">

                        {!allocation.checkin_time ? (
                          <button
                            onClick={() => checkInAllocation(allocation.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded"
                          >
                            Check In
                          </button>
                        ) : (
                          <span className="text-green-600 font-medium">Checked In</span>
                        )}

                        {allocation.checkin_time && !allocation.checkout_time ? (
                          <button
                            onClick={() => checkOutAllocation(allocation.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded"
                          >
                            Check Out
                          </button>
                        ) : allocation.checkout_time ? (
                          <span className="text-red-600 font-medium">Checked Out</span>
                        ) : null}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default function AccommodationPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.ACCOMMODATION}>
      <AccommodationContent />
    </RoleGuard>
  );
}