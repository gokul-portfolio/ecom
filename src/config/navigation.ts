import {
  LayoutDashboard,
  Settings,
  Building2,
  ShieldCheck,
  KeyRound,
  Clock,
} from "lucide-react";
import { NavigationGroup } from "@/types/navigation.types";

/**
 * Active Sidebar Navigation Configuration
 */
export const navigationConfig: NavigationGroup[] = [
  {
    id: "overview",
    groupTitle: "Overview",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "settings",
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
  {
    id: "organization",
    groupTitle: "Organization & Access",
    items: [
      {
        id: "departments",
        title: "Departments",
        href: "/departments",
        icon: Building2,
      },
      {
        id: "roles",
        title: "Roles",
        href: "/roles",
        icon: ShieldCheck,
      },
      {
        id: "shifts",
        title: "Shifts",
        href: "/shifts",
        icon: Clock,
      },
      {
        id: "permissions",
        title: "Access Control",
        href: "/permissions",
        icon: KeyRound,
      },
    ],
  },
];
