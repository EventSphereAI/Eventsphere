'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/utils/api';
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import QuickActionCard from "@/components/QuickActionCard";

import {
  CalendarDays,
  Users,
  ClipboardCheck,
  QrCode,
  UtensilsCrossed,
  Hotel,
  Upload,
  UserCog,
  FileBarChart,
  UserPlus,
} from "lucide-react";
function DashboardContent() {
  const { user, loading, logout, tenant } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(''); // Fix #5 — error state for events fetch

  const [stats, setStats] = useState({
    total_events: 0,
    total_delegates: 0,
    checked_in: 0,
    accommodation_needed: 0
  });
  const [statsLoading, setStatsLoading] = useState(false); // Fix #8 — stats loading state
  const [statsError, setStatsError] = useState('');        // Fix #4 — error state for stats fetch

  // Fix #10 — per-card copy feedback instead of alert
  const [copiedEventId, setCopiedEventId] = useState(null);

  // Fix #2 — use env var for base URL, fallback to window.location.origin
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  // Fix #1 — removed all console.log statements from render body

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchStats();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      setEventsError(''); // Fix #5
      const { data } = await api.get('/api/events/'); // same API call, untouched
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEventsError('Failed to load events. Please try refreshing.'); // Fix #5
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true); // Fix #8
      setStatsError('');     // Fix #4
      const { data } = await api.get('/api/reports/dashboard'); // same API call, untouched
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setStatsError('Failed to load stats.'); // Fix #4
    } finally {
      setStatsLoading(false); // Fix #8
    }
  };

  // Fix #10 — inline copy feedback, no alert()
  const handleCopyLink = (eventId) => {
    // Fix #9 — guard against undefined tenant
    if (!tenant?.id) return;

    const link = `${getBaseUrl()}/register?event=${eventId}&tenant=${tenant.id}`; // Fix #2
    navigator.clipboard.writeText(link);
    setCopiedEventId(eventId);
    setTimeout(() => setCopiedEventId(null), 2000); // reset after 2s
  };

  // Fix #11 — status badge color mapping
  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const quickActions = [
  {
    title: "Events",
    description: "Create and manage events",
    href: "/events",
    icon: CalendarDays,
    color: "from-cyan-500 to-blue-500",
  },
  {
    title: "Delegates",
    description: "Manage delegate records",
    href: "/delegates",
    icon: Users,
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "Attendance",
    description: "Track delegate check-ins",
    href: "/attendance",
    icon: ClipboardCheck,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Scanner",
    description: "Scan delegate QR codes",
    href: "/scanner",
    icon: QrCode,
    color: "from-pink-500 to-rose-500",
  },
  {
    title: "Registration",
    description: "Manage registrations",
    href: "/registration",
    icon: UserPlus,
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Food",
    description: "Manage food distribution",
    href: "/food",
    icon: UtensilsCrossed,
    color: "from-orange-500 to-red-500",
  },
  {
    title: "Accommodation",
    description: "Manage room allocation",
    href: "/accommodation",
    icon: Hotel,
    color: "from-teal-500 to-cyan-500",
  },
  {
    title: "Reports",
    description: "View reports & analytics",
    href: "/reports",
    icon: FileBarChart,
    color: "from-slate-500 to-gray-600",
  },
  {
    title: "Staff",
    description: "Manage event staff",
    href: "/staff",
    icon: UserCog,
    color: "from-fuchsia-500 to-pink-500",
  },
  {
    title: "Bulk Import",
    description: "Import delegates & send emails",
    href: "/bulk-import",
    icon: Upload,
    color: "from-emerald-500 to-green-600",
  },
];

  return (
  <AppShell>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Fix #4 — stats error display */}
        {statsError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
            {statsError}
          </div>
        )}

        {/* Stats Section — Fix #8: show — while loading */}
    <section className="grid gap-6 grid-cols-2 lg:grid-cols-4">

  <StatCard
    title="Total Events"
    value={statsLoading ? "—" : stats.total_events}
    icon={CalendarDays}
    color="from-cyan-400 to-cyan-500"
  />

  <StatCard
    title="Delegates"
    value={statsLoading ? "—" : stats.total_delegates}
    icon={Users}
    color="from-green-400 to-green-500"
  />

  <StatCard
    title="Checked In"
    value={statsLoading ? "—" : stats.checked_in}
    icon={QrCode}
    color="from-violet-400 to-violet-500"
  />

  <StatCard
    title="Accommodation"
    value={statsLoading ? "—" : stats.accommodation_needed}
    icon={Hotel}
    color="from-orange-400 to-orange-500"
  />

</section>
        {/* Events Section */}
        <section className="card mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Events</h3>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Fix #6 — manual refresh button */}
              <button
                onClick={() => { fetchEvents(); fetchStats(); }}
                className="px-3 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
              >
                ↻ Refresh
              </button>

              <button
                onClick={() => router.push('/events')} // same, untouched
                className="btn-primary"
              >
                Create Event
              </button>

                <button
    onClick={() => router.push('/manage-events')}
    className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition"
  >
    Manage Events
  </button>
  
            </div>
          </div>

          {/* Fix #5 — events error display */}
          {eventsError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
              {eventsError}
            </div>
          )}

          {eventsLoading ? (
            <p className="text-gray-500">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No events yet. Create your first event!
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <div
  key={event.id}
className="bg-white border border-border rounded-2xl p-5 hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
>

  {/* Title */}

  <div className="flex items-start justify-between">

    <div>

      <h3 className="text-xl font-semibold text-text">
        {event.title}
      </h3>

      <p className="text-sm text-muted mt-1">
        📍 {event.venue}
      </p>

    </div>

    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
        event.status
      )}`}
    >
      {event.status}
    </span>

  </div>

  {/* Date */}

   <div className="mt-4 text-sm text-gray-600">

    📅{" "}
    {new Date(event.start_date).toLocaleDateString()}

    {"  "}—{"  "}

    {new Date(event.end_date).toLocaleDateString()}

  </div>

  {/* Registration Link */}

  {tenant?.id && (

    <div className="mt-4">

      <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">

        Registration Link

      </p>

      <input
        readOnly
        value={`${getBaseUrl()}/register?event=${event.id}&tenant=${tenant.id}`}
        className="input-field text-sm"
      />

    </div>

  )}

  {/* Buttons */}

  <div className="flex gap-3 mt-4">

    {tenant?.id && (

      <button
        onClick={() => handleCopyLink(event.id)}
        className="btn-secondary flex-1"
      >

        {copiedEventId === event.id
          ? "Copied ✓"
          : "Copy Link"}

      </button>

    )}

    <button
      onClick={() =>
        router.push(`/delegates?event=${event.id}`)
      }
      className="btn-primary flex-1"
    >

      Register

    </button>

  </div>

</div>
               
              ))}
            </div>
          )}
        </section>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

  {quickActions.map((action) => (
    <QuickActionCard
      key={action.title}
      {...action}
    />
  ))}

</div>

      </main>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.DASHBOARD}>
      <DashboardContent />
    </RoleGuard>
  );
}