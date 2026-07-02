'use client';

import { useEffect, useState } from "react";

import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

import AppShell from "@/components/AppShell";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSection from "@/components/dashboard/DashboardSection";
import EventBanner from "@/components/dashboard/EventBanner";
import TaskCard from "@/components/dashboard/TaskCard";

export default function AccommodationDashboard() {

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const { data } = await api.get("/api/events/");

      if (data.events?.length > 0) {
        setSelectedEvent(data.events[0]);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-screen">
          Loading Dashboard...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>

      <main className="max-w-7xl mx-auto px-6 py-8">

        <DashboardHeader
          title="Hospitality Team"
          subtitle="Manage delegate accommodation and room allocation."
          user={user}
        />

        <div className="mt-8">
          <EventBanner event={selectedEvent} />
        </div>

        <DashboardSection title="Quick Actions">

          <div className="grid md:grid-cols-2 gap-6">

            <TaskCard
              title="Accommodation Module"
              description="Manage room allocation."
              href="/accommodation"
            />

            <TaskCard
              title="Accommodation Dashboard"
              description="View accommodation details."
              href="/accommodation"
            />

          </div>

        </DashboardSection>

        <DashboardSection title="Today's Work">

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-white border border-slate-200 rounded-2xl p-6">

              <h3 className="text-xl font-semibold">
                Accommodation Management
              </h3>

              <p className="text-slate-500 mt-3">
                Allocate rooms, manage check-ins, and monitor accommodation
                for delegates.
              </p>

            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">

              <h3 className="text-xl font-semibold">
                Accommodation Status
              </h3>

              <p className="text-emerald-600 font-medium mt-3">
                ✓ Accommodation Desk Ready
              </p>

            </div>

          </div>

        </DashboardSection>

      </main>

    </AppShell>
  );
}