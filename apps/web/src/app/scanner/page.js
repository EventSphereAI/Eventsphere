'use client';

import { useEffect, useState, useMemo } from 'react'; // Fix #18 — added useMemo
import QRCodeScanner from '@/components/QRCodeScanner';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

// Fix #17 — kept split but cleaned up; ScannerContent only used inside ScannerPage
function ScannerContent() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scanType, setScanType] = useState('entry');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [lastScanned, setLastScanned] = useState('');
  const [eventsError, setEventsError] = useState(''); // Fix #4 — error state
  const [noEventError, setNoEventError] = useState(''); // Fix #3 — no alert()

  const { user } = useAuth();

  // Fix #18 — scanOptions as useMemo, stable across renders
  const scanOptions = useMemo(() => {
    if (!user?.role) return [];

    if (user.role === 'organizer' || user.role === 'super_admin') {
      return [
        { value: 'entry', label: 'Attendance Entry' },
        { value: 'exit', label: 'Attendance Exit' },
        { value: 'accommodation_checkin', label: 'Accommodation Check-In' },
        { value: 'accommodation_checkout', label: 'Accommodation Check-Out' },
        { value: 'food_breakfast', label: 'Breakfast' },
        { value: 'food_lunch', label: 'Lunch' },
        { value: 'food_high_tea', label: 'High Tea' },
        { value: 'food_dinner', label: 'Dinner' },
        { value: 'kit_collection', label: 'Kit Collection' },
      ];
    }

    if (user.role === 'technical_team') {
      return [
        { value: 'entry', label: 'Attendance Entry' },
        { value: 'exit', label: 'Attendance Exit' },
      ];
    }

    if (user.role === 'registration_team') {
      return [{ value: 'kit_collection', label: 'Kit Collection' }];
    }

    if (user.role === 'food_staff') {
      return [
        { value: 'food_breakfast', label: 'Breakfast' },
        { value: 'food_lunch', label: 'Lunch' },
        { value: 'food_high_tea', label: 'High Tea' },
        { value: 'food_dinner', label: 'Dinner' },
      ];
    }

    if (user.role === 'hospitality_team') {
      return [
        { value: 'accommodation_checkin', label: 'Accommodation Check-In' },
        { value: 'accommodation_checkout', label: 'Accommodation Check-Out' },
      ];
    }

    return [];
  }, [user?.role]); // Fix #2 — stable dependency

  useEffect(() => {
    fetchEvents();
  }, []);

  // Fix #2 — now scanOptions is stable so this useEffect works correctly
  useEffect(() => {
    if (scanOptions.length > 0) {
      setScanType(scanOptions[0].value);
    }
  }, [scanOptions]);

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
      setEventsError('Failed to load events. Please retry.'); // Fix #4
    }
  };

  const handleScan = async (qrData) => {
    if (processing) return;
    if (lastScanned === qrData) return;

    if (!selectedEvent) {
      setNoEventError('Please select an event before scanning.'); // Fix #3 — no alert()
      return;
    }

    setNoEventError('');
    setProcessing(true);
    setLastScanned(qrData);

    try {
      const { data } = await api.post('/api/scan/', { // untouched
        qr_token: qrData,
        event_id: selectedEvent,
        scan_type: scanType,
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({
        success: false,
        code: 'ERROR',
        message:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'Scan failed',
      });
    }

    // Fix #19 — flattened nested setTimeout into two separate ones
    setTimeout(() => {
      setProcessing(false);
    }, 2000);

    setTimeout(() => {
      setLastScanned('');
    }, 7000); // Fix #19 — same 7s total window, cleaner implementation

    // Fix #6 — auto-clear result after 4 seconds
    setTimeout(() => {
      setResult(null);
    }, 4000);
  };

  // Fix #9 — get human-readable label for current scan type
  const currentModeLabel =
    scanOptions.find((o) => o.value === scanType)?.label || scanType;

  // Fix #15 — human-readable code mapping
  const getCodeLabel = (code) => {
    const map = {
      SUCCESS: '✅ Success',
      DUPLICATE: '⚠️ Already Scanned',
      ERROR: '❌ Error',
      NOT_FOUND: '❌ Delegate Not Found',
      INVALID: '❌ Invalid QR Code',
    };
    return map[code] || code;
  };

  return (
    <div className="max-w-5xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">Universal QR Scanner</h1>

      {/* Fix #4 — events error with retry */}
      {eventsError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300 flex justify-between items-center">
          <span>{eventsError}</span>
          <button onClick={fetchEvents} className="text-sm underline ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Fix #3 — no event selected error inline */}
      {noEventError && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded border border-yellow-300">
          {noEventError}
        </div>
      )}

      <div className="bg-white p-6 rounded shadow mb-6 space-y-4"> {/* Fix #13 — space-y-4 for gap */}

        {/* Fix #10 — labels properly connected with htmlFor */}
        <div>
          <label htmlFor="event-select" className="block text-sm font-medium mb-1">
            Select Event
          </label>
          <select
            id="event-select"
            value={selectedEvent}
            onChange={(e) => { setSelectedEvent(e.target.value); setNoEventError(''); }}
            className="w-full border p-3 rounded"
          >
            {/* Fix #5 — empty state placeholder */}
            {events.length === 0 ? (
              <option value="">No events available</option>
            ) : (
              events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Fix #10 — label for scan type | Fix #11 — empty scanOptions message */}
        <div>
          <label htmlFor="scan-type-select" className="block text-sm font-medium mb-1">
            Scan Type
          </label>
          {scanOptions.length === 0 ? (
            <div className="w-full border p-3 rounded bg-gray-50 text-gray-400">
              No scan options available for your role.
            </div>
          ) : (
            <select
              id="scan-type-select"
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full border p-3 rounded"
            >
              {scanOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Fix #16 — refresh events button */}
        <div className="flex justify-end">
          <button
            onClick={fetchEvents}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ↻ Refresh Events
          </button>
        </div>

      </div>

      {/* Fix #9 — mode badge shows human-readable label */}
      <div className="mb-4 p-3 bg-blue-100 rounded flex items-center gap-2">
        <strong>Current Mode:</strong>
        <span>{currentModeLabel}</span>
        {/* Fix #8 — processing indicator */}
        {processing && (
          <span className="ml-auto flex items-center gap-2 text-blue-700 text-sm font-medium">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Processing...
          </span>
        )}
      </div>

      {/* Scanner */}
      <div className="bg-white p-4 rounded shadow">
        <QRCodeScanner onScan={handleScan} /> {/* untouched */}
      </div>

      {/* Fix #6 & #14 — result auto-clears + dismiss button */}
      {result && (
        <div
          className={`mt-6 p-6 rounded shadow relative ${
            result.success
              ? 'bg-green-100'
              : result.code === 'DUPLICATE'
              ? 'bg-yellow-100'
              : 'bg-red-100'
          }`}
        >
          {/* Fix #14 — dismiss button */}
          <button
            onClick={() => setResult(null)}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
            aria-label="Dismiss result"
          >
            ✕
          </button>

          <h2 className="text-xl font-bold mb-2">
            {result.success ? '✅ Success' : '⚠ Result'}
          </h2>

          {/* Fix #15 — human-readable code */}
          <p>
            <strong>Code:</strong> {getCodeLabel(result.code)}
          </p>

          <p>
            <strong>Message:</strong> {result.message}
          </p>

          {result.delegate && (
            <div className="mt-4">
              <p><strong>Name:</strong> {result.delegate.full_name}</p>
              <p><strong>College:</strong> {result.delegate.college}</p>
              <p><strong>Food Preference:</strong> {result.delegate.food_pref}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function ScannerPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.ORGANIZER}>
      <ScannerContent />
    </RoleGuard>
  );
}