import { LucideIcon } from "lucide-react";

export interface NavigationSubItem {
  title: string;
  href: string;
  badge?: string | number;
}

export interface NavigationItem {
  id: string;
  title: string;
  href?: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: "primary" | "warning" | "success" | "danger";
  children?: NavigationSubItem[];
}

export interface NavigationGroup {
  id: string;
  groupTitle: string;
  items: NavigationItem[];
}
