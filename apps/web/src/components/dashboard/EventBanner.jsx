'use client';

import {
  CalendarDays,
  MapPin,
} from "lucide-react";

export default function EventBanner({
  event,
}) {

  if (!event) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">

        <h2 className="text-xl font-semibold">
          Assigned Event
        </h2>

        <p className="text-slate-500 mt-4">
          No event assigned yet.
        </p>

      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white">

      <p className="uppercase text-sm opacity-90">
        Assigned Event
      </p>

      <h2 className="text-3xl font-bold mt-3">
        {event.title}
      </h2>

      <div className="flex flex-wrap gap-6 mt-6">

        <div className="flex items-center gap-2">
          <CalendarDays size={18}/>
          {event.start_date || "Date not available"}
        </div>

        <div className="flex items-center gap-2">
          <MapPin size={18}/>
          {event.venue || "Venue not available"}
        </div>

      </div>

    </div>
  );
}