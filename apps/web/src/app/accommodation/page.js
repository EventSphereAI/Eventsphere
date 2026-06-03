'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';

export default function AccommodationPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');

  const [rooms, setRooms] = useState([]);

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

      <div className="bg-white p-6 rounded shadow">

        <h2 className="text-xl font-bold mb-4">
          Rooms
        </h2>

        {rooms.length === 0 ? (
          <p>No rooms created yet.</p>
        ) : (
          <div className="space-y-3">

            {rooms.map((room) => (
              <div
                key={room.id}
                className="border p-4 rounded"
              >
                <p>
                  <strong>{room.hostel_name}</strong>
                </p>

                <p>
                  Room: {room.room_number}
                </p>

                <p>
                  Capacity: {room.capacity}
                </p>

                <p>
                  Available: {room.is_available ? 'Yes' : 'No'}
                </p>
              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}