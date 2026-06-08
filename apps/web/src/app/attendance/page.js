'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/utils/api';

export default function AttendancePage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');

  const [attendance, setAttendance] = useState(null);
  const [delegates, setDelegates] = useState([]);

  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadAttendance();
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

  const loadAttendance = async () => {
    try {
      const attendanceRes = await api.get(
        `/api/reports/attendance/${selectedEvent}`
      );

      const detailsRes = await api.get(
        `/api/reports/attendance-details/${selectedEvent}`
      );

      setAttendance(attendanceRes.data);
      setDelegates(detailsRes.data.delegates || []);

    } catch (err) {
      console.error(err);
      alert('Failed to load attendance');
    }
  };

  const filteredDelegates = useMemo(() => {
    return delegates.filter((delegate) => {
      const term = search.toLowerCase();

      return (
        delegate.full_name?.toLowerCase().includes(term) ||
        delegate.email?.toLowerCase().includes(term) ||
        delegate.college?.toLowerCase().includes(term)
      );
    });
  }, [delegates, search]);

  return (
    <div className="max-w-7xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        Attendance Management
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

      {attendance && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-500">
              Total Delegates
            </p>
            <h3 className="text-3xl font-bold">
              {attendance.total_delegates}
            </h3>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-500">
              Checked In
            </p>
            <h3 className="text-3xl font-bold text-green-600">
              {attendance.checked_in}
            </h3>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-500">
              Pending
            </p>
            <h3 className="text-3xl font-bold text-red-600">
              {attendance.total_delegates - attendance.checked_in}
            </h3>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-500">
              Attendance %
            </p>
            <h3 className="text-3xl font-bold">
              {attendance.attendance_rate}%
            </h3>
          </div>

        </div>
      )}

      <input
        type="text"
        placeholder="Search by name, email or college..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border p-3 rounded mb-6"
      />

      <div className="bg-white rounded shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">College</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Check-In Time</th>
            </tr>
          </thead>

          <tbody>

            {filteredDelegates.map((delegate) => (
              <tr
                key={delegate.id}
                className="border-t"
              >
                <td className="p-4">
                  {delegate.full_name}
                </td>

                <td className="p-4">
                  {delegate.email}
                </td>

                <td className="p-4">
                  {delegate.college}
                </td>

                <td className="p-4">

                  {delegate.checked_in ? (
                    <span className="px-3 py-1 rounded bg-green-100 text-green-700">
                      Checked In
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded bg-red-100 text-red-700">
                      Pending
                    </span>
                  )}

                </td>

                <td className="p-4">
                  {delegate.checked_in_at
                    ? new Date(
                        delegate.checked_in_at
                      ).toLocaleString()
                    : '-'}
                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}