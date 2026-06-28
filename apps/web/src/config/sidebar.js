import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Shield,
  ClipboardCheck,
  UtensilsCrossed,
  Hotel,
  BarChart3,
  Settings,
  QrCode,
  Building2,
  UserCog,
  FileText,
} from "lucide-react";

export const sidebarConfig = {
  organizer: [
    {
      section: "GENERAL",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Events",
          href: "/events",
          icon: CalendarDays,
        },
        {
          title: "Delegates",
          href: "/delegates",
          icon: Users,
        },
      ],
    },

    {
      section: "OPERATIONS",
      items: [
        {
          title: "Registration",
          href: "/registration",
          icon: ClipboardCheck,
        },
        {
          title: "Attendance",
          href: "/attendance",
          icon: QrCode,
        },
        {
          title: "Food",
          href: "/food",
          icon: UtensilsCrossed,
        },
        {
          title: "Accommodation",
          href: "/accommodation",
          icon: Hotel,
        },
      ],
    },

    {
      section: "MANAGEMENT",
      items: [
        {
          title: "Staff",
          href: "/staff",
          icon: Shield,
        },
        {
          title: "Reports",
          href: "/reports",
          icon: BarChart3,
        },
        {
          title: "Settings",
          href: "/settings",
          icon: Settings,
        },
      ],
    },
  ],

  registration_team: [
    {
      section: "REGISTRATION",
      items: [
        {
          title: "Registration",
          href: "/registration",
          icon: ClipboardCheck,
        },
        {
          title: "Delegates",
          href: "/delegates",
          icon: Users,
        },
      ],
    },
  ],

  technical_team: [
    {
      section: "ATTENDANCE",
      items: [
        {
          title: "Attendance",
          href: "/attendance",
          icon: QrCode,
        },
      ],
    },
  ],

  food_staff: [
    {
      section: "FOOD",
      items: [
        {
          title: "Food",
          href: "/food",
          icon: UtensilsCrossed,
        },
      ],
    },
  ],

  hospitality_team: [
    {
      section: "HOSPITALITY",
      items: [
        {
          title: "Accommodation",
          href: "/accommodation",
          icon: Hotel,
        },
      ],
    },
  ],

  logistics_team: [
    {
      section: "LOGISTICS",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
  ],

  volunteer_coordinator: [
    {
      section: "VOLUNTEERS",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
  ],

  volunteer: [
    {
      section: "VOLUNTEERS",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
  ],

  super_admin: [
    {
      section: "PLATFORM",
      items: [
        {
          title: "Dashboard",
          href: "/super-admin",
          icon: LayoutDashboard,
        },
        {
          title: "Organizations",
          href: "/super-admin",
          icon: Building2,
        },
        {
          title: "Users",
          href: "/super-admin/users",
          icon: UserCog,
        },
        {
          title: "Founders",
          href: "/super-admin/founders",
          icon: Users,
        },
        {
          title: "Audit Logs",
          href: "/super-admin/audit-logs",
          icon: FileText,
        },
      ],
    },
  ],
};