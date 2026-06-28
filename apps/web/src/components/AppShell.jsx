"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AppShell({ children }) {
  return (
    <div className="h-screen bg-background flex overflow-hidden">

      {/* Sidebar */}

      <Sidebar />

      {/* Main */}

      <div className="flex-1 flex flex-col overflow-hidden">

        <Header />

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>

      </div>

    </div>
  );
}