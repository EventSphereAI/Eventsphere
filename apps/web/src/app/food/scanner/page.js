'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import QRCodeScanner from '@/components/QRCodeScanner';

export default function FoodScannerPage() {

  const searchParams = useSearchParams();

  const mealType =
    searchParams.get('meal') || 'breakfast';

  const [scanResult, setScanResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [lastScanned, setLastScanned] = useState('');

  const handleScan = async (qrData) => {

    if (processing) return;

    if (lastScanned === qrData) return;

    setProcessing(true);
    setLastScanned(qrData);

    try {

      /*
      LATER

      await api.post('/api/scan/', {
        qr_token: qrData,
        scan_type: `food_${mealType}`
      })
      */

      const delegate = {
        name: 'Rahul Sharma',
        college: 'Pimpri Chinchwad University',
        food_pref: 'Veg',
        meal: mealType,
      };

      setScanResult(delegate);

      setTimeout(() => {

        setScanResult(null);
        setProcessing(false);

        setTimeout(() => {
          setLastScanned('');
        }, 5000);

      }, 2000);

    } catch (err) {

      setScanResult({
        error: true,
      });

      setTimeout(() => {
        setScanResult(null);
        setProcessing(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl md:text-4xl font-bold">
          Food Scanner
        </h1>

        <p className="text-slate-600 mt-2">
          Meal: {mealType.toUpperCase()}
        </p>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Scanner */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">

          <h2 className="text-2xl font-semibold mb-5">
            Live Scanner
          </h2>

          <div className="rounded-2xl overflow-hidden border min-h-[450px]">

            <QRCodeScanner
              onScan={handleScan}
            />

          </div>

        </div>

        {/* Result */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">

          <h2 className="text-2xl font-semibold mb-5">
            Food Details
          </h2>

          {!scanResult ? (

            <div className="h-[450px] flex items-center justify-center text-slate-400 text-xl">
              Waiting For Scan...
            </div>

          ) : scanResult.error ? (

            <div className="h-[450px] flex items-center justify-center">

              <div className="bg-red-100 text-red-700 px-8 py-5 rounded-2xl font-semibold">
                Invalid QR
              </div>

            </div>

          ) : (

            <div className="space-y-5">

              <div>
                <p className="text-slate-500 text-sm">
                  Delegate Name
                </p>

                <p className="text-xl font-semibold">
                  {scanResult.name}
                </p>
              </div>

              <div>
                <p className="text-slate-500 text-sm">
                  College
                </p>

                <p>
                  {scanResult.college}
                </p>
              </div>

              <div>
                <p className="text-slate-500 text-sm">
                  Food Preference
                </p>

                <span className="inline-flex px-4 py-2 rounded-full bg-green-100 text-green-700">
                  {scanResult.food_pref}
                </span>
              </div>

              <div>
                <p className="text-slate-500 text-sm">
                  Meal
                </p>

                <span className="inline-flex px-4 py-2 rounded-full bg-violet-100 text-violet-700">
                  {scanResult.meal.toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-slate-500 text-sm">
                  Status
                </p>

                <span className="inline-flex px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  ✓ Meal Served Successfully
                </span>
              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}