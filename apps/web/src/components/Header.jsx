"use client";

import { Bell, Search, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/events": "Events",
  "/delegates": "Delegates",
  "/registration": "Registration",
  "/attendance": "Attendance",
  "/food": "Food Management",
  "/accommodation": "Accommodation",
  "/reports": "Reports",
  "/staff": "Staff Management",
  "/settings": "Settings",
  "/super-admin": "Super Admin",
};

export default function Header() {
  const pathname = usePathname();
  const { user, tenant } = useAuth();

  const pageTitle = pageTitles[pathname] || "EventSphere";

  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  return (
    <header className="sticky top-0 z-40 h-20 bg-white border-b border-border px-8 flex items-center justify-between">

      {/* Left */}

      <div>

        <h1 className="text-2xl font-bold text-text">
          {pageTitle}
        </h1>

        <p className="text-sm text-muted mt-1">
          {greeting},{" "}
          <span className="font-medium">
            {user?.name || user?.email}
          </span>
        </p>

      </div>

      {/* Right */}

      <div className="flex items-center gap-4">

        {/* Search */}

        <div className="hidden lg:flex items-center gap-3 w-80 px-4 py-3 rounded-xl border border-border bg-background">

          <Search
            size={18}
            className="text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm flex-1"
          />

        </div>

        {/* Notifications */}

        <button className="relative h-11 w-11 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition">

          <Bell size={20} />

          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500"></span>

        </button>

        {/* User */}

        <button className="flex items-center gap-3 rounded-xl border border-border px-3 py-2 hover:bg-secondary transition">

          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-success text-white flex items-center justify-center font-semibold">

            {user?.email?.charAt(0).toUpperCase()}

          </div>

          <div className="text-left hidden md:block">

            <p className="font-semibold text-sm">

              {user?.name || "User"}

            </p>

            <p className="text-xs text-muted">

              {tenant?.name}

            </p>

          </div>

          <ChevronDown size={18} />

        </button>

      </div>

    </header>
  );
}