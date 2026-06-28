'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import QRCodeScanner from '@/components/QRCodeScanner';
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

function AccommodationScannerContent() {

  const [scanMode, setScanMode] = useState('checkin');
  const [selectedEvent, setSelectedEvent] = useState('');

  const [scanResult, setScanResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {

    const event = localStorage.getItem(
      'accommodationSelectedEvent'
    );

    if (event) {
      setSelectedEvent(event);
    }

  }, []);

  const handleScan = async (qrData) => {

    if (processing) return;

    if (!selectedEvent) {
      alert("Please select an event.");
      return;
    }

    setProcessing(true);

    try {

      const { data } = await api.post(
        '/api/scan/',
        {
          qr_token: qrData,
          event_id: selectedEvent,
          scan_type:
            scanMode === 'checkin'
              ? 'accommodation_checkin'
              : 'accommodation_checkout'
        }
      );

      if (!data.success) {

        setScanResult({
          error: true,
          message: data.message
        });

      } else {

        setScanResult({
          error: false,
          name: data.delegate.full_name,
          college: data.delegate.college,
          email: data.delegate.email,
          message: data.message
        });

      }

    } catch (err) {

      console.error(err);

      setScanResult({
        error: true,
        message: 'Scan failed.'
      });

    }

    setTimeout(() => {

      setProcessing(false);

      setScanResult(null);

    }, 2500);

  };

  return (

    <div className="min-h-screen bg-slate-100 p-6">

      <div className="mb-8">

        <h1 className="text-4xl font-bold">
          Accommodation Scanner
        </h1>

        <p className="text-slate-500 mt-2">
          Scan delegate QR for accommodation check-in/check-out.
        </p>

      </div>

      <div className="bg-white rounded-2xl p-6 border shadow-sm mb-6">

        <label className="block text-sm font-medium mb-2">
          Scan Mode
        </label>

        <select
          value={scanMode}
          onChange={(e) => setScanMode(e.target.value)}
          className="border rounded-xl p-3 w-72"
        >
          <option value="checkin">
            Accommodation Check In
          </option>

          <option value="checkout">
            Accommodation Check Out
          </option>

        </select>

      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-3xl p-6 border shadow-sm">

          <h2 className="text-2xl font-semibold mb-4">
            Live Scanner
          </h2>

          <div className="rounded-2xl overflow-hidden border min-h-[500px]">

            <QRCodeScanner
              onScan={handleScan}
            />

          </div>

        </div>

        <div className="bg-white rounded-3xl p-6 border shadow-sm">

          <h2 className="text-2xl font-semibold mb-6">
            Delegate Details
          </h2>

          {!scanResult ? (

            <div className="h-[500px] flex items-center justify-center text-slate-400">

              Waiting for Scan...

            </div>

          ) : scanResult.error ? (

            <div className="h-[500px] flex items-center justify-center">

              <div className="bg-red-100 border border-red-200 rounded-2xl p-8">

                <h2 className="text-2xl font-bold text-red-700">

                  ❌ Scan Failed

                </h2>

                <p className="mt-3">

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

                  Status

                </p>

                <span className="inline-flex px-4 py-2 rounded-full bg-green-100 text-green-700">

                  {scanResult.message}

                </span>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}
export default function AccommodationScannerPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.ACCOMMODATION}>
      <AccommodationScannerContent />
    </RoleGuard>
  );
}