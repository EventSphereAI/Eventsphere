'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';

export default function ReportsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');

  const [attendance, setAttendance] = useState(null);
  const [food, setFood] = useState(null);
  const [accommodation, setAccommodation] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadReports();
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

  const loadReports = async () => {
    try {
      const attendanceRes = await api.get(
        `/api/reports/attendance/${selectedEvent}`
      );

      const foodRes = await api.get(
        `/api/reports/food/${selectedEvent}`
      );

      const accommodationRes = await api.get(
        `/api/reports/accommodation/${selectedEvent}`
      );

      setAttendance(attendanceRes.data);
      setFood(foodRes.data);
      setAccommodation(accommodationRes.data);

    } catch (err) {
      console.error(err);
      alert('Failed to load reports');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        Reports Dashboard
      </h1>

      <select
        value={selectedEvent}
        onChange={(e) => setSelectedEvent(e.target.value)}
        className="w-full border p-3 rounded mb-8"
      >
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>

      {attendance && (
        <>
          <h2 className="text-2xl font-bold mb-4">
            Attendance
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-8">

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Total Delegates</p>
              <h3 className="text-3xl font-bold">
                {attendance.total_delegates}
              </h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Checked In</p>
              <h3 className="text-3xl font-bold">
                {attendance.checked_in}
              </h3>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <p className="text-gray-500">Attendance %</p>
              <h3 className="text-3xl font-bold">
                {attendance.attendance_rate}%
              </h3>
            </div>

          </div>
        </>
      )}

      {food && (
        <>
          <h2 className="text-2xl font-bold mb-4">
            Food Distribution
          </h2>

          <div className="bg-white p-6 rounded shadow mb-8">

            {food.food_stats.length === 0 ? (
              <p>No food records yet.</p>
            ) : (
              food.food_stats.map((item, index) => (
                <div
                  key={index}
                  className="border-b py-2"
                >
                  {item.meal_type} — {item.count}
                </div>
              ))
            )}

          </div>
        </>
      )}

      {accommodation && (
        <>
          <h2 className="text-2xl font-bold mb-4">
            Accommodation
          </h2>

          <div className="bg-white p-6 rounded shadow">

            {accommodation.occupancy.length === 0 ? (
              <p>No rooms created yet.</p>
            ) : (
              accommodation.occupancy.map((room, index) => (
                <div
                  key={index}
                  className="border-b py-2"
                >
                  {room.hostel_name}
                  {' | '}
                  Occupied: {room.occupied}
                  {' / '}
                  Capacity: {room.capacity}
                </div>
              ))
            )}

          </div>
        </>
      )}

    </div>
  );
}