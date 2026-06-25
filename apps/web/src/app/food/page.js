'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FoodPage() {
  const router = useRouter();

  const [mealType, setMealType] = useState('breakfast');

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Food Management
        </h1>

        <p className="text-slate-600 mt-2">
          Manage breakfast, lunch and dinner distribution.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500 text-sm">
            Total Meals Served
          </p>

          <h2 className="text-4xl font-bold mt-2">
            1250
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500 text-sm">
            Breakfast
          </p>

          <h2 className="text-4xl font-bold mt-2 text-orange-500">
            430
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500 text-sm">
            Lunch
          </p>

          <h2 className="text-4xl font-bold mt-2 text-green-600">
            520
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500 text-sm">
            Dinner
          </p>

          <h2 className="text-4xl font-bold mt-2 text-violet-600">
            300
          </h2>
        </div>

      </div>

      {/* Meal Selection */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-8">

        <h2 className="text-xl font-semibold mb-4">
          Meal Selection
        </h2>

        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="w-full border rounded-xl p-4"
        >
          <option value="breakfast">
            Breakfast
          </option>

          <option value="high_tea">High Tea</option>
          
          <option value="lunch">
            Lunch
          </option>

          <option value="dinner">
            Dinner
          </option>
        </select>

      </div>

      {/* Scanner Launch */}
      <div
        onClick={() =>
          router.push(`/food/scanner?meal=${mealType}`)
        }
        className="
          bg-white
          rounded-3xl
          border
          shadow-sm
          p-10
          cursor-pointer
          hover:scale-[1.01]
          transition
        "
      >

        <div className="text-center">

          <div className="text-7xl mb-5">
            🍽️
          </div>

          <h2 className="text-3xl font-bold">
            Start Food Scanner
          </h2>

          <p className="text-slate-500 mt-3">
            Current Meal: {mealType.toUpperCase()}
          </p>

        </div>

      </div>

    </div>
  );
}