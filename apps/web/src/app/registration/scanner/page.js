'use client';

import { useState, useEffect } from 'react';
import QRCodeScanner from '@/components/QRCodeScanner';
import api from '@/utils/api';
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

function RegistrationScannerContent() {
  const [scanResult, setScanResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    loadEvent();
  }, []);

  const loadEvent = async () => {
    try {
      const savedEvent = localStorage.getItem(
        'registrationSelectedEvent'
      );

      const { data } = await api.get('/api/events/');

      const events = data.events || [];

      if (
        savedEvent &&
        events.some((e) => e.id === savedEvent)
      ) {
        setSelectedEvent(savedEvent);

        const event = events.find(
          (e) => e.id === savedEvent
        );

        if (event) {
          setEventName(event.title);
        }
      } else if (events.length > 0) {
        setSelectedEvent(events[0].id);
        setEventName(events[0].title);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScan = async (qrData) => {
    if (processing) return;

    if (!selectedEvent) {
      alert('No event selected.');
      return;
    }

    setProcessing(true);

    try {
      const response = await api.post('/api/scan/', {
        qr_token: qrData,
        event_id: selectedEvent,
        scan_type: 'kit_collection',
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
          email: delegate.email,
          phone: delegate.phone,
          food: delegate.food_pref,
          accommodation:
            delegate.accommodation_required
              ? 'Yes'
              : 'No',
          qr: qrData,
          status: response.data.message,
        });
      }
    } catch (error) {
      console.error(error);

      setScanResult({
        error: true,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          'Scan failed',
      });
    }

    setTimeout(() => {
      setScanResult(null);
      setProcessing(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Kit Distribution Scanner
        </h1>

        <p className="text-slate-600 mt-2">
          Scan delegate QR codes and distribute kits.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">

        <div className="grid md:grid-cols-2 gap-6">

          <div>

            <label className="block text-sm font-medium mb-2">
              Current Event
            </label>

            <div className="border rounded-lg p-3 bg-gray-100 font-medium">
              {eventName}
            </div>

          </div>

          <div>

            <label className="block text-sm font-medium mb-2">
              Distribution Status
            </label>

            <div className="border rounded-lg p-3 bg-green-50 text-green-700 font-medium">
              Ready to Scan
            </div>

          </div>

        </div>

      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

          <h2 className="text-2xl font-semibold mb-4">
            Live QR Scanner
          </h2>

          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[500px]">

            <QRCodeScanner onScan={handleScan} />

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

                <p className="mt-3 text-red-600">
                  {scanResult.message}
                </p>

              </div>

            </div>

          ) : (

            <div className="space-y-5">

              <div>
                <p className="text-sm text-slate-500">
                  Full Name
                </p>

                <p className="text-xl font-semibold">
                  {scanResult.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  College
                </p>

                <p>
                  {scanResult.college}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Email
                </p>

                <p>
                  {scanResult.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Phone
                </p>

                <p>
                  {scanResult.phone || '-'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Food Preference
                </p>

                <p>
                  {scanResult.food}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Accommodation
                </p>

                <p>
                  {scanResult.accommodation}
                </p>
              </div>

              <div>

                <p className="text-sm text-slate-500">
                  Kit Status
                </p>

                <span className="inline-flex px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
                  ✓ {scanResult.status}
                </span>

              </div>

              <div>

                <p className="text-sm text-slate-500">
                  QR Data
                </p>

                <div className="bg-slate-100 rounded-xl p-3 text-sm break-all">
                  {scanResult.qr}
                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default function RegistrationScannerPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.REGISTRATION}>
      <RegistrationScannerContent />
    </RoleGuard>
  );
}