'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AttendancePage() {
  const router = useRouter();

  const [attendanceMode, setAttendanceMode] = useState('entry');

  const openScanner = () => {
    localStorage.setItem(
      'attendanceMode',
      attendanceMode
    );

    router.push('/attendance/scanner');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Attendance Management
        </h1>

        <p className="text-slate-600 mt-2">
          Scan delegates and manage event attendance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">
            Present Today
          </p>
          <h2 className="text-4xl font-bold mt-3">
            1245
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">
            Currently Inside
          </p>
          <h2 className="text-4xl font-bold mt-3 text-emerald-600">
            982
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">
            Checked Out
          </p>
          <h2 className="text-4xl font-bold mt-3 text-amber-500">
            263
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">
            Attendance Rate
          </p>
          <h2 className="text-4xl font-bold mt-3 text-violet-600">
            78%
          </h2>
        </div>

      </div>

      {/* Mode Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">

        <h2 className="text-xl font-semibold mb-4">
          Attendance Mode
        </h2>

        <select
          value={attendanceMode}
          onChange={(e) =>
            setAttendanceMode(e.target.value)
          }
          className="w-full md:w-72 border border-slate-300 rounded-xl px-4 py-3"
        >
          <option value="entry">
            Check In
          </option>

          <option value="exit">
            Check Out
          </option>
        </select>

        <div className="mt-4">

          {attendanceMode === 'entry' ? (
            <span className="px-4 py-2 rounded-full bg-green-100 text-green-700">
              🟢 Check In Mode Active
            </span>
          ) : (
            <span className="px-4 py-2 rounded-full bg-red-100 text-red-700">
              🔴 Check Out Mode Active
            </span>
          )}

        </div>

      </div>

      {/* Scanner Launch */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

        <h2 className="text-2xl font-semibold mb-2">
          Attendance Scanner
        </h2>

        <p className="text-slate-500 mb-6">
          Click below to start scanning delegate QR codes.
        </p>

        <div
          onClick={openScanner}
          className="
            h-72 md:h-96
            rounded-2xl
            bg-gradient-to-br
            from-violet-50
            to-slate-50
            border-2
            border-dashed
            border-violet-300
            flex
            items-center
            justify-center
            cursor-pointer
            hover:scale-[1.01]
            transition
          "
        >
          <div className="text-center">

            <div className="text-6xl md:text-7xl mb-4">
              📷
            </div>

            <h3 className="text-xl md:text-2xl font-semibold">
              Open Scanner
            </h3>

            <p className="text-slate-500 mt-2">
              Tap anywhere in this area
            </p>

          </div>
        </div>

      </div>

    </div>
  );
}