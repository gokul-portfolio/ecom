import {
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { NavigationGroup } from "@/types/navigation.types";

/**
 * Active Sidebar Navigation Configuration
 * Showing only Dashboard and Settings as requested
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
];
