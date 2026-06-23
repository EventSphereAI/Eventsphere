'use client';

import React, { useEffect, useState } from 'react';
import QRCodeScanner from '@/components/QRCodeScanner';
import api from '@/utils/api';

export default function AttendanceScannerPage() {
  const [scanResult, setScanResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scanMode, setScanMode] = useState('entry');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/api/events/');

      const eventList = data.events || [];

      setEvents(eventList);

      if (eventList.length > 0) {
        setSelectedEvent(eventList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  const handleScan = async (qrData) => {
    if (processing) return;

    if (!selectedEvent) {
      alert('Please select an event first');
      return;
    }

    setProcessing(true);

    try {
      const { data } = await api.post('/api/scan/', {
        qr_token: qrData,
        event_id: selectedEvent,
        scan_type: scanMode,
      });

      setScanResult({
        success: true,
        ...data,
      });

      setTimeout(() => {
        setScanResult(null);
        setProcessing(false);
      }, 3000);
    } catch (error) {
      console.error(error);

      setScanResult({
        error: true,
        message:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          'Scan failed',
      });

      setTimeout(() => {
        setScanResult(null);
        setProcessing(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Attendance Scanner
        </h1>

        <p className="text-slate-600 mt-2">
          Scan delegate QR codes for attendance.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium">
              Select Event
            </label>

            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full border rounded p-3"
            >
              {events.map((event) => (
                <option
                  key={event.id}
                  value={event.id}
                >
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Scan Mode
            </label>

            <select
              value={scanMode}
              onChange={(e) => setScanMode(e.target.value)}
              className="w-full border rounded p-3"
            >
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="food_breakfast">Breakfast</option>
              <option value="food_lunch">Lunch</option>
              <option value="food_dinner">Dinner</option>
              <option value="kit_collection">Kit Collection</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Live QR Scanner
          </h2>

          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[500px]">
            {!processing && (
              <QRCodeScanner onScan={handleScan} />
            )}

            {processing && (
              <div className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4">
                    ⏳
                  </div>

                  <p className="text-lg font-medium">
                    Processing Scan...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-2xl font-semibold mb-6">
            Delegate Details
          </h2>

          {!scanResult ? (
            <div className="h-[500px] flex items-center justify-center text-slate-400 text-lg">
              Waiting for QR Scan...
            </div>
          ) : scanResult.error ? (
            <div className="h-[500px] flex items-center justify-center">
              <div className="bg-red-100 border border-red-200 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">
                  ❌
                </div>

                <h3 className="text-2xl font-bold text-red-700">
                  Scan Failed
                </h3>

                <p className="mt-2 text-red-600">
                  {scanResult.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-slate-500">
                  Response
                </p>

                <pre className="bg-slate-100 rounded-xl p-3 text-sm overflow-auto">
                  {JSON.stringify(
                    scanResult,
                    null,
                    2
                  )}
                </pre>
              </div>

              <div className="bg-green-100 border border-green-200 rounded-xl p-4">
                <p className="font-semibold text-green-700">
                  Scan Successful
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}