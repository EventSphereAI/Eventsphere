'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '@/utils/api';

export default function ScannerPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const { data } = await api.post('/api/scan/', {
            qr_token: decodedText,
            event_id: selectedEvent,
            scan_type: 'entry',
          });

          setResult(data);
        } catch (err) {
          console.error(err);

          setResult({
            success: false,
            code: 'ERROR',
            message: 'Scan failed',
          });
        }
      },
      (error) => {
        // ignore continuous scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
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

  return (
    <div className="max-w-5xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        QR Attendance Scanner
      </h1>

      <div className="bg-white p-6 rounded shadow mb-6">

        <label className="block mb-2 font-semibold">
          Select Event
        </label>

        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full border p-3 rounded"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>

      </div>

      <div
        id="reader"
        className="bg-white p-4 rounded shadow"
      />

      {result && (
        <div
          className={`mt-6 p-6 rounded shadow ${
            result.success
              ? 'bg-green-100'
              : result.code === 'DUPLICATE'
              ? 'bg-yellow-100'
              : 'bg-red-100'
          }`}
        >
          <h2 className="text-xl font-bold mb-2">
            {result.success ? '✅ Success' : '⚠ Result'}
          </h2>

          <p>
            <strong>Code:</strong> {result.code}
          </p>

          <p>
            <strong>Message:</strong> {result.message}
          </p>

          {result.delegate && (
            <div className="mt-4">
              <p>
                <strong>Name:</strong>{' '}
                {result.delegate.full_name}
              </p>

              <p>
                <strong>College:</strong>{' '}
                {result.delegate.college}
              </p>

              <p>
                <strong>Food Preference:</strong>{' '}
                {result.delegate.food_pref}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}