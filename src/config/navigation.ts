import {
  LayoutDashboard,
  Settings,
  Building2,
  ShieldCheck,
  KeyRound,
  Clock,
  Users,
  ShoppingBag,
  FolderTree,
  Tag,
  Factory,
  SlidersHorizontal,
  Boxes,
  Warehouse,
  History,
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
    id: "catalog",
    groupTitle: "Catalog Management",
    items: [
      {
        id: "products",
        title: "Products",
        href: "/products",
        icon: ShoppingBag,
      },
      {
        id: "categories",
        title: "Categories",
        href: "/categories",
        icon: FolderTree,
      },
      {
        id: "brands",
        title: "Brands",
        href: "/brands",
        icon: Tag,
      },
      {
        id: "manufacturers",
        title: "Manufacturers",
        href: "/manufacturers",
        icon: Factory,
      },
      {
        id: "attributes",
        title: "Attributes & Specs",
        href: "/attributes",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    id: "inventory",
    groupTitle: "Inventory & Fulfillment",
    items: [
      {
        id: "inventory-stocks",
        title: "Stock Balances",
        href: "/inventory",
        icon: Boxes,
      },
      {
        id: "warehouses",
        title: "Warehouses",
        href: "/warehouses",
        icon: Warehouse,
      },
      {
        id: "stock-ledger",
        title: "Stock Ledger",
        href: "/inventory/ledger",
        icon: History,
      },
    ],
  },
  {
    id: "organization",
    groupTitle: "Organization & Access",
    items: [
      {
        id: "staff",
        title: "Staff Members",
        href: "/staff",
        icon: Users,
      },
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
