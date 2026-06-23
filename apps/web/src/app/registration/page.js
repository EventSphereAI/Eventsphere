'use client';

import { useRouter } from 'next/navigation';

export default function RegistrationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Registration Management
        </h1>

        <p className="text-slate-600 mt-2">
          Scan delegates and distribute registration kits.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">
            Registered Delegates
          </p>

          <h2 className="text-4xl font-bold mt-3 text-slate-900">
            1245
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">
            Kits Distributed
          </p>

          <h2 className="text-4xl font-bold mt-3 text-emerald-600">
            982
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">
            Pending Distribution
          </p>

          <h2 className="text-4xl font-bold mt-3 text-amber-500">
            263
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-slate-500 text-sm">
            Distribution Rate
          </p>

          <h2 className="text-4xl font-bold mt-3 text-violet-600">
            78%
          </h2>
        </div>

      </div>

      {/* Scanner Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Kit Distribution Scanner
        </h2>

        <p className="text-slate-500 mb-6">
          Click below to scan delegate QR codes and distribute kits.
        </p>

        <div
          onClick={() => router.push('/registration/scanner')}
          className="
            h-96
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
            hover:bg-violet-100
            transition
          "
        >
          <div className="text-center">

            <div className="text-7xl mb-4">
              📦
            </div>

            <h3 className="text-2xl font-semibold text-slate-800">
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