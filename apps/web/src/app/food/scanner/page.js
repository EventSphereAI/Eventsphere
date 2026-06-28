'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useSearchParams } from 'next/navigation';
import QRCodeScanner from '@/components/QRCodeScanner';

import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

function FoodScannerContent() {
  const searchParams = useSearchParams();

  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventName, setEventName] = useState('');
  const [loadError, setLoadError] = useState(''); // Fix — silent failure

  const mealType = searchParams.get('meal') || 'breakfast'; // untouched

  const [scanResult, setScanResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEvent();
  }, []);

  const loadEvent = async () => {
    try {
      // Fix — SSR guard on localStorage
      const savedEvent = typeof window !== 'undefined'
        ? localStorage.getItem('foodSelectedEvent')
        : null;

      const { data } = await api.get('/api/events/'); // untouched
      const events = data.events || [];

      if (savedEvent && events.some((e) => e.id === savedEvent)) {
        setSelectedEvent(savedEvent);
        const event = events.find((e) => e.id === savedEvent);
        if (event) setEventName(event.title);
      } else if (events.length > 0) {
        setSelectedEvent(events[0].id);
        setEventName(events[0].title);
      }
    } catch (err) {
      console.error(err);
      setLoadError('Failed to load event. Please go back and try again.'); // Fix — silent failure
    }
  };

  const handleScan = async (qrData) => {
    if (processing) return;

    if (!selectedEvent) {
      setScanResult({ error: true, message: 'No event selected.' }); // Fix — alert() removed
      return;
    }

    setProcessing(true);

    // Fix — removed 3 debug console.logs

    try {
      const response = await api.post('/api/scan/', { // untouched
        qr_token: qrData,
        event_id: selectedEvent,
        scan_type: `food_${mealType}`,
      });

      if (!response.data.success) {
        setScanResult({
          error: true,
          message: response.data.message,
        });
      } else {
        const delegate = response.data.delegate;
        setScanResult({
          name: delegate.full_name,
          college: delegate.college,
          food_pref: delegate.food_pref,
          meal: mealType,
          status: response.data.message,
        });
      }
    } catch (err) {
      console.error(err);
      setScanResult({
        error: true,
        message:
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          'Scan failed',
      });
    }

    setTimeout(() => {
      setScanResult(null);
      setProcessing(false);
    }, 2500); // untouched
  };

  return (
    // Fix — single root div, no mismatched nesting
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Food Scanner
        </h1>
        <p className="text-slate-600 mt-2">
          Meal: <span className="font-semibold text-green-700">{mealType.toUpperCase()}</span>
        </p>
      </div>

      {/* Fix — load error display */}
      {loadError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {loadError}
        </div>
      )}

      {/* Fix — event + meal info bar, now properly inside root div */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 mb-6">
        <div className="grid md:grid-cols-2 gap-5">

          <div>
            <p className="text-sm text-slate-500">Current Event</p>
            <div className="mt-2 border rounded-xl p-3 bg-slate-100 font-medium">
              {eventName || '—'}
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-500">Meal</p>
            <div className="mt-2 border rounded-xl p-3 bg-green-50 text-green-700 font-semibold">
              {mealType.toUpperCase()}
            </div>
          </div>

        </div>
      </div>

      {/* Fix — scanner + result in proper 2-col grid, both inside root div */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Scanner */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-5">Live Scanner</h2>

          <div className="rounded-2xl overflow-hidden border min-h-[450px]">
            <QRCodeScanner onScan={handleScan} /> {/* untouched */}
          </div>
        </div>

        {/* Result */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-5">Food Details</h2>

          {!scanResult ? (

            <div className="h-[450px] flex items-center justify-center text-slate-400 text-xl">
              Waiting For Scan...
            </div>

          ) : scanResult.error ? (

            <div className="h-[450px] flex items-center justify-center">
              <div className="bg-red-100 text-red-700 px-8 py-5 rounded-2xl font-semibold text-center">
                {scanResult.message}
              </div>
            </div>

          ) : (

            <div className="space-y-5">

              <div>
                <p className="text-slate-500 text-sm">Delegate Name</p>
                <p className="text-xl font-semibold">{scanResult.name}</p>
              </div>

              <div>
                <p className="text-slate-500 text-sm">College</p>
                <p>{scanResult.college}</p>
              </div>

              <div>
                <p className="text-slate-500 text-sm">Food Preference</p>
                <span className="inline-flex px-4 py-2 rounded-full bg-green-100 text-green-700">
                  {scanResult.food_pref}
                </span>
              </div>

              <div>
                <p className="text-slate-500 text-sm">Meal</p>
                <span className="inline-flex px-4 py-2 rounded-full bg-violet-100 text-violet-700">
                  {scanResult.meal.toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-slate-500 text-sm">Status</p>
                <span className="inline-flex px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  ✓ {scanResult.status}
                </span>
              </div>

            </div>

          )}
        </div>

      </div>
    </div>
  );
}
export default function FoodScannerPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.FOOD}>
      <FoodScannerContent />
    </RoleGuard>
  );
}