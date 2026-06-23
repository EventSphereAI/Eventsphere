'use client';

import { useState } from 'react';
import QRCodeScanner from '@/components/QRCodeScanner';

export default function RegistrationScannerPage() {
  const [scanResult, setScanResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleScan = async (qrData) => {
    if (processing) return;

    setProcessing(true);

    try {
      // Dummy data for frontend testing
      const delegate = {
        name: 'Rahul Sharma',
        college: 'Pimpri Chinchwad University',
        email: 'rahul@gmail.com',
        phone: '9876543210',
        food: 'Veg',
        accommodation: 'Yes',
        qr: qrData,
        kitDistributed: false,
      };

      setScanResult(delegate);

      setTimeout(() => {
        setProcessing(false);
      }, 1000);

    } catch (error) {
      console.error(error);

      setScanResult({
        error: true,
        message: 'Invalid QR Code',
      });

      setTimeout(() => {
        setScanResult(null);
        setProcessing(false);
      }, 2000);
    }
  };

  const markKitDistributed = () => {
    setScanResult({
      ...scanResult,
      kitDistributed: true,
    });

    alert('Kit Distributed Successfully');
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

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Scanner */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

          <h2 className="text-2xl font-semibold mb-4">
            Live QR Scanner
          </h2>

          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[500px]">

            {!processing && (
              <QRCodeScanner
                onScan={handleScan}
              />
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

        {/* Delegate Details */}
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
                  Invalid QR
                </h3>

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

                <p className="font-medium">
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
                  {scanResult.phone}
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

                {scanResult.kitDistributed ? (
                  <span className="inline-flex px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
                    ✓ Kit Distributed
                  </span>
                ) : (
                  <span className="inline-flex px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                    Pending Distribution
                  </span>
                )}
              </div>

              {!scanResult.kitDistributed && (
                <button
                  onClick={markKitDistributed}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
                >
                  Mark Kit Distributed
                </button>
              )}

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