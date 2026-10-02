import {
  LayoutDashboard,
  Settings,
  Building2,
  ShieldCheck,
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
        title: "Roles & Permissions",
        href: "/roles",
        icon: ShieldCheck,
      },
    ],
  },
];
