'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext'; // Fix — auth guard
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

function FoodContent() {
  const router = useRouter();
  const { user, loading } = useAuth(); // Fix — auth guard

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventsError, setEventsError] = useState('');  // Fix — silent failure
  const [statsError, setStatsError] = useState('');    // Fix — silent failure
  const [exportError, setExportError] = useState('');  // Fix — silent failure
  const [statsLoading, setStatsLoading] = useState(false); // Fix — loading state

  const [stats, setStats] = useState({
    total_meals: 0,
    breakfast: 0,
    lunch: 0,
    high_tea: 0,
    dinner: 0,
  });

  const [mealType, setMealType] = useState('breakfast');

  // Fix — auth redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user) {
      loadEvents();
    }
  }, [loading, user]);

  useEffect(() => {
    if (selectedEvent) {
      loadFoodStats();
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      setEventsError('');
      const { data } = await api.get('/api/events/'); // untouched

      setEvents(data.events || []); // Fix — added || [] fallback

      if (data.events?.length > 0) {
        setSelectedEvent(data.events[0].id);
      }
    } catch (err) {
      console.error(err);
      setEventsError('Failed to load events. Please refresh.'); // Fix — silent failure
    }
  };

  const loadFoodStats = async () => {
    try {
      setStatsLoading(true); // Fix — loading state
      setStatsError('');

      // Fix — removed debug console.logs
      const { data } = await api.get(
        `/api/reports/food/${selectedEvent}` // untouched
      );

      setStats(data);
    } catch (err) {
      console.error(err);
      setStatsError('Failed to load food stats.'); // Fix — silent failure
    } finally {
      setStatsLoading(false);
    }
  };

  const exportCSV = async () => {
    setExportError('');
    try {
      // Fix — same URL logic, untouched
      let url = `/api/reports/food-export/${selectedEvent}`;
      if (mealType !== 'all') {
        url += `?meal=${mealType}`;
      }

      const response = await api.get(url, { responseType: 'blob' }); // untouched

      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = mealType === 'all' ? 'food_all.csv' : `food_${mealType}.csv`; // untouched
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      setExportError('Failed to export CSV. Please try again.'); // Fix — silent failure
    }
  };

  // Fix — extracted from inline onClick, SSR guard on localStorage
  const openScanner = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('foodSelectedEvent', selectedEvent); // untouched key
    }
    router.push(`/food/scanner?meal=${mealType}`); // untouched route
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) return null;

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

      {/* Error displays */}
      {eventsError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {eventsError}
        </div>
      )}
      {exportError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {exportError}
        </div>
      )}
      {statsError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {statsError}
        </div>
      )}

      {/* Event selector + Meal type + Scanner + Export — all in one header row */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div className="w-full md:w-96">
          <label className="block text-sm font-medium mb-2">Select Event</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full border rounded-xl p-3"
          >
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

        <div className="w-full md:w-64">
          <label className="block text-sm font-medium mb-2">Meal Type</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full border rounded-xl p-3"
          >
            <option value="all">All Meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="high_tea">High Tea</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>

        {/* Fix — same button style as accommodation/attendance/registration */}
        <div className="flex gap-3 md:mt-5">
          <button
            onClick={openScanner}
            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl"
          >
            Open Scanner
          </button>

          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
          >
            Export CSV
          </button>
        </div>

      </div>

      {/* Stats — Fix: show — while loading */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 mb-8">

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500 text-sm">Total Meals Served</p>
          <h2 className="text-4xl font-bold mt-2">
            {statsLoading ? '—' : stats.total_meals}
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500 text-sm">Breakfast</p>
          <h2 className="text-4xl font-bold mt-2 text-orange-500">
            {statsLoading ? '—' : stats.breakfast}
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500 text-sm">Lunch</p>
          <h2 className="text-4xl font-bold mt-2 text-green-600">
            {statsLoading ? '—' : stats.lunch}
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500 text-sm">Dinner</p>
          <h2 className="text-4xl font-bold mt-2 text-violet-600">
            {statsLoading ? '—' : stats.dinner}
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500 text-sm">High Tea</p>
          <h2 className="text-4xl font-bold mt-2 text-amber-600">
            {statsLoading ? '—' : stats.high_tea}
          </h2>
        </div>

      </div>

    </div>
  );
}

export default function FoodPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.FOOD}>
      <FoodContent />
    </RoleGuard>
  );
}