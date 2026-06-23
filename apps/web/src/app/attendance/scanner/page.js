  'use client';

import { useState, useEffect } from 'react';
import QRCodeScanner from '@/components/QRCodeScanner';
import api from '@/utils/api';

  export default function AttendanceScannerPage() {
    const [scanResult, setScanResult] = useState(null);
    const [processing, setProcessing] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scanMode, setScanMode] = useState('entry');

    const handleScan = async (qrData) => {
      if (processing) return;

      setProcessing(true);

      try {
        // Later replace with API call
        // await api.post('/api/scanning', { qr_token: qrData });

        const delegate = {
          name: 'Rahul Sharma',
          college: 'Pimpri Chinchwad University',
          email: 'rahul@gmail.com',
          status: 'Checked In',
          qr: qrData,
        };

        setScanResult(delegate);

        // Optional success sound
        // new Audio('/success.mp3').play();

        setTimeout(() => {
          setScanResult(null);
          setProcessing(false);
        }, 2000);

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

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Scanner */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

            <h2 className="text-2xl font-semibold mb-4">
              Live QR Scanner
            </h2>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[500px]">

              <QRCodeScanner onScan={handleScan} />
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
                    Attendance Status
                  </p>

                  <span className="inline-flex px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
                    ✓ Attendance Marked Successfully
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