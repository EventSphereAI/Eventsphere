'use client';
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import { PERMISSIONS } from "@/config/permissions";
import OrganizerDashboard from "@/components/dashboard/OrganizerDashboard";
import RegistrationDashboard from "@/components/dashboard/RegistrationDashboard";
import AttendanceDashboard from "@/components/dashboard/AttendanceDashboard";
import FoodDashboard from "@/components/dashboard/FoodDashboard";
import AccommodationDashboard from "@/components/dashboard/AccommodationDashboard";

function DashboardContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  switch (user.role) {
  case "organizer":
  case "super_admin":
    return <OrganizerDashboard />;

  case "registration_team":
    return <RegistrationDashboard />;

  case "technical_team":
    return <AttendanceDashboard />;

  case "food_staff":
    return <FoodDashboard />;

  case "hospitality_team":
    return <AccommodationDashboard />;

  case "logistics_team":
    return <OrganizerDashboard />; // Temporary

  case "volunteer_coordinator":
  case "volunteer":
    return <OrganizerDashboard />; // Temporary

  default:
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold">
          No dashboard assigned.
        </h2>
      </div>
    );
}
}

export default function DashboardPage() {
  return (
    <RoleGuard allowedRoles={PERMISSIONS.DASHBOARD}>
      <DashboardContent />
    </RoleGuard>
  );
}