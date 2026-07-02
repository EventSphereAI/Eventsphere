import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  QrCode,
  UtensilsCrossed,
  Bed,
  BarChart3,
  UserCog,
} from "lucide-react";

export const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    always: true,
  },

  {
    title: "Events",
    href: "/events",
    icon: Calendar,
    organizerOnly: true,
  },

  {
    title: "Delegates",
    href: "/delegates",
    icon: Users,
    permissions: ["registration", "accommodation"],
  },

  {
    title: "Registration",
    href: "/registration",
    icon: ClipboardCheck,
    permissions: ["registration"],
  },

  {
    title: "Attendance",
    href: "/attendance",
    icon: QrCode,
    permissions: ["attendance"],
  },

  {
    title: "Food",
    href: "/food",
    icon: UtensilsCrossed,
    permissions: ["food"],
  },

  {
    title: "Accommodation",
    href: "/accommodation",
    icon: Bed,
    permissions: ["accommodation"],
  },

  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    organizerOnly: true,
  },

  {
    title: "Staff",
    href: "/staff",
    icon: UserCog,
    organizerOnly: true,
  },
];