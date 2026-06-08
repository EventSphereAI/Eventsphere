'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';

export default function AccommodationPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');

  const [rooms, setRooms] = useState([]);

  const [delegates, setDelegates] = useState([]);
  const [allocations, setAllocations] = useState([]);

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

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
  fetchRooms();
  fetchDelegates();
  fetchAllocations();
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

  const fetchRooms = async () => {
    try {
      const { data } = await api.get(
        `/api/accommodation/rooms/${selectedEvent}`
      );

      setRooms(data.rooms || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDelegates = async () => {
  try {
    const { data } = await api.get(
      `/api/delegates/?event_id=${selectedEvent}`
    );

    setDelegates(data.delegates || []);
  } catch (err) {
    console.error(err);
  }
};

const fetchAllocations = async () => {
  try {
    const { data } = await api.get(
      `/api/accommodation/allocations/${selectedEvent}`
    );

    setAllocations(data.allocations || []);
  } catch (err) {
    console.error(err);
  }
};

  const createRoom = async (e) => {
    e.preventDefault();

    try {
      await api.post('/api/accommodation/rooms', {
        event_id: selectedEvent,
        ...roomForm
      });

      alert('Room created');

      setRoomForm({
        room_number: '',
        hostel_name: '',
        capacity: 2,
        room_type: 'shared'
      });

      fetchRooms();
    } catch (err) {
      console.error(err);
      alert('Failed to create room');
    }
  };

  const allocateDelegate = async (e) => {
  e.preventDefault();

  try {
    await api.post('/api/accommodation/allocate', {
      delegate_id: allocationForm.delegate_id,
      room_id: allocationForm.room_id,
      event_id: selectedEvent
    });

    alert('Delegate allocated successfully');

    setAllocationForm({
      delegate_id: '',
      room_id: ''
    });

    fetchAllocations();

  } catch (err) {
    console.error(err);

    alert(
      err?.response?.data?.detail ||
      'Failed to allocate delegate'
    );
  }
};

const checkInAllocation = async (allocationId) => {
  try {
    await api.post(
      `/api/accommodation/checkin/${allocationId}`
    );

    fetchAllocations();

  } catch (err) {
    console.error(err);
    alert('Check-in failed');
  }
};

const checkOutAllocation = async (allocationId) => {
  try {
    await api.post(
      `/api/accommodation/checkout/${allocationId}`
    );

    fetchAllocations();

  } catch (err) {
    console.error(err);
    alert('Check-out failed');
  }
};

  return (
    <div className="max-w-6xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        Accommodation Management
      </h1>

      <select
        value={selectedEvent}
        onChange={(e) => setSelectedEvent(e.target.value)}
        className="w-full border p-3 rounded mb-6"
      >
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>

      <form
        onSubmit={createRoom}
        className="bg-white p-6 rounded shadow mb-8 space-y-4"
      >

        <h2 className="text-xl font-bold">
          Create Room
        </h2>

        <input
          type="text"
          placeholder="Room Number"
          className="w-full border p-3 rounded"
          value={roomForm.room_number}
          onChange={(e) =>
            setRoomForm({
              ...roomForm,
              room_number: e.target.value
            })
          }
          required
        />

        <input
          type="text"
          placeholder="Hostel Name"
          className="w-full border p-3 rounded"
          value={roomForm.hostel_name}
          onChange={(e) =>
            setRoomForm({
              ...roomForm,
              hostel_name: e.target.value
            })
          }
          required
        />

        <input
          type="number"
          placeholder="Capacity"
          className="w-full border p-3 rounded"
          value={roomForm.capacity}
          onChange={(e) =>
            setRoomForm({
              ...roomForm,
              capacity: Number(e.target.value)
            })
          }
        />

        <select
          className="w-full border p-3 rounded"
          value={roomForm.room_type}
          onChange={(e) =>
            setRoomForm({
              ...roomForm,
              room_type: e.target.value
            })
          }
        >
          <option value="shared">Shared</option>
          <option value="single">Single</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded"
        >
          Create Room
        </button>

      </form>

      <form
  onSubmit={allocateDelegate}
  className="bg-white p-6 rounded shadow mb-8 space-y-4"
>

  <h2 className="text-xl font-bold">
    Allocate Delegate
  </h2>

  <select
    value={allocationForm.delegate_id}
    onChange={(e) =>
      setAllocationForm({
        ...allocationForm,
        delegate_id: e.target.value
      })
    }
    className="w-full border p-3 rounded"
    required
  >
    <option value="">
      Select Delegate
    </option>

    {delegates.map((delegate) => (
      <option
        key={delegate.id}
        value={delegate.id}
      >
        {delegate.full_name}
      </option>
    ))}
  </select>

  <select
    value={allocationForm.room_id}
    onChange={(e) =>
      setAllocationForm({
        ...allocationForm,
        room_id: e.target.value
      })
    }
    className="w-full border p-3 rounded"
    required
  >
    <option value="">
      Select Room
    </option>

    {rooms.map((room) => (
      <option
        key={room.id}
        value={room.id}
      >
        {room.hostel_name} - Room {room.room_number}
      </option>
    ))}
  </select>

  <button
    type="submit"
    className="bg-green-600 text-white px-6 py-3 rounded"
  >
    Allocate Delegate
  </button>

</form>

      <div className="bg-white p-6 rounded shadow">

        <h2 className="text-xl font-bold mb-4">
          Rooms
        </h2>

        {rooms.length === 0 ? (
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
            <td className="border px-4 py-2">
              {room.hostel_name}
            </td>

            <td className="border px-4 py-2">
              {room.room_number}
            </td>

            <td className="border px-4 py-2">
              {room.capacity}
            </td>

            <td className="border px-4 py-2">
            {room.occupied}/{room.capacity}
          </td>

          <td className="border px-4 py-2">
            {Number(room.occupied) >= Number(room.capacity)
              ? 'Full'
              : 'Available'}
          </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
      <div className="bg-white p-6 rounded shadow mt-8">

  <h2 className="text-xl font-bold mb-4">
    Current Allocations
  </h2>

  {allocations.length === 0 ? (
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
        <td className="border px-4 py-2">
          {allocation.full_name}
        </td>

        <td className="border px-4 py-2">
          {allocation.hostel_name}
        </td>

        <td className="border px-4 py-2">
          {allocation.room_number}
        </td>

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
      <span className="text-green-600 font-medium">
        Checked In
      </span>
    )}

    {allocation.checkin_time &&
 !allocation.checkout_time ? (
      <button
        onClick={() => checkOutAllocation(allocation.id)}
        className="bg-red-600 text-white px-3 py-1 rounded"
      >
        Check Out
      </button>
    ) : (
      <span className="text-red-600 font-medium">
        Checked Out
      </span>
    )}

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

    </div>
  );
}
