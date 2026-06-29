'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function ManageEventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [confirmName, setConfirmName] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await api.get('/api/events/');
setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    }
  };

 const deleteEvent = async () => {
  try {
    await api.delete(`/api/events/${selectedEvent.id}`);

    await loadEvents();

    setSelectedEvent(null);
    setConfirmName('');

    alert('Event deleted successfully');
  } catch (err) {
    console.error(err);
    alert('Failed to delete event');
  }
};

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-7xl mx-auto">

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-slate-900">
            Manage Events
          </h1>

          <p className="text-slate-500 mt-2">
            Manage all your created events.
          </p>

        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">

          <input
            placeholder="Search Events..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="w-full border rounded-xl p-3"
          />

        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          {filteredEvents.map(event => (

            <div
              key={event.id}
              className="bg-white rounded-2xl border shadow-sm p-6"
            >

              <div className="flex justify-between items-start">

                <h2 className="text-xl font-bold">
                  {event.title}
                </h2>

                <span className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                  {event.status || 'Draft'}
                </span>

              </div>

              <div className="mt-4 space-y-2 text-slate-600">

                <p>
                  📍 {event.venue}
                </p>

                <p>
                  📅 {event.start_date} - {event.end_date}
                </p>

              </div>

              <div className="flex gap-3 mt-6">

                <button
                  onClick={() =>
                    router.push(`/delegates?event=${event.id}`)
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl"
                >
                  Open Event
                </button>

                <button
                  onClick={() => setSelectedEvent(event)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl"
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

      {selectedEvent && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white rounded-3xl w-full max-w-lg p-8">

            <h2 className="text-3xl font-bold mb-4">
              Delete Event
            </h2>

            <p className="text-slate-600">

              You're about to remove

              <span className="font-bold">
                {' '} "{selectedEvent.title}"{' '}
              </span>

              from your dashboard.

            </p>

            <div className="mt-6 p-4 bg-yellow-50 border rounded-xl">

              <p className="font-semibold">
                Type the event name below to confirm.
              </p>

            </div>

            <div className="mt-6">

              <input
                value={confirmName}
                onChange={(e)=>setConfirmName(e.target.value)}
                placeholder={selectedEvent.title}
                className="w-full border rounded-xl p-3"
              />

            </div>

            <div className="flex justify-end gap-4 mt-8">

              <button
                onClick={()=>{
                  setSelectedEvent(null);
                  setConfirmName('');
                }}
                className="px-6 py-3 border rounded-xl"
              >
                Cancel
              </button>

              <button
                disabled={confirmName !== selectedEvent.title}
                onClick={deleteEvent}
                className={`px-6 py-3 rounded-xl text-white ${
                  confirmName === selectedEvent.title
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                Delete Event
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}