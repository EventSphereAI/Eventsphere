'use client';

import { useEffect, useState } from "react";

import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

import AppShell from "@/components/AppShell";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSection from "@/components/dashboard/DashboardSection";
import EventBanner from "@/components/dashboard/EventBanner";
import TaskCard from "@/components/dashboard/TaskCard";

export default function FoodDashboard() {

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
          title="Food Committee"
          subtitle="Manage meal distribution for delegates."
          user={user}
        />

        <div className="mt-8">
          <EventBanner event={selectedEvent} />
        </div>

        <DashboardSection title="Quick Actions">

          <div className="grid md:grid-cols-2 gap-6">

            <TaskCard
              title="Food Module"
              description="Open food management."
              href="/food"
            />

            <TaskCard
              title="Meal Distribution"
              description="Manage delegate meal distribution."
              href="/food"
            />

          </div>

        </DashboardSection>

        <DashboardSection title="Today's Work">

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-white border rounded-2xl p-6">

              <h3 className="text-xl font-semibold">
                Food Distribution
              </h3>

              <p className="text-slate-500 mt-3">
                Verify meal eligibility, distribute meals,
                and monitor meal consumption.
              </p>

            </div>

            <div className="bg-white border rounded-2xl p-6">

              <h3 className="text-xl font-semibold">
                Distribution Status
              </h3>

              <p className="text-emerald-600 font-medium mt-3">
                ✓ Food Counter Ready
              </p>

            </div>

          </div>

        </DashboardSection>

      </main>
    </AppShell>
  );
}