/**
 * Enterprise Role-Based Access Control (RBAC) Permission Registry
 * Active Modules currently implemented in the platform: Dashboard, Organization (Departments, Roles & Shifts), and Settings.
 */

export type PermissionAction = "read" | "create" | "update" | "delete" | "export" | "notify";

export interface SubModulePermission {
  id: string;
  name: string;
  code: string;
  description: string;
  supportedActions: {
    read?: string;     // e.g. "departments:read"
    create?: string;   // e.g. "departments:write"
    update?: string;   // e.g. "departments:write"
    delete?: string;   // e.g. "departments:delete"
    export?: string;   // e.g. "departments:export"
    notify?: string;   // e.g. "departments:notify"
  };
}

export interface PermissionModuleGroup {
  id: string;
  name: string;
  description: string;
  iconName: "LayoutDashboard" | "Building2" | "ShoppingBag" | "Boxes" | "ShoppingCart" | "Users" | "Settings";
  subModules: SubModulePermission[];
}

export const PERMISSION_MATRIX_REGISTRY: PermissionModuleGroup[] = [
  {
    id: "dashboard",
    name: "Dashboard & Analytics",
    description: "Business analytics, real-time metrics, overview cards, and alerts",
    iconName: "LayoutDashboard",
    subModules: [
      {
        id: "dash_overview",
        name: "Overview Performance Stats",
        code: "dash:overview",
        description: "Gross revenue, active order counts, and visitor volume",
        supportedActions: {
          read: "dashboard:read",
          export: "dashboard:export",
        },
      },
      {
        id: "dash_sales_trend",
        name: "Sales & Performance Trends",
        code: "dash:sales_trend",
        description: "Historical metrics graphs and periodic trend forecasts",
        supportedActions: {
          read: "dashboard:read",
          export: "dashboard:export",
        },
      },
      {
        id: "dash_alerts",
        name: "System Alerts & Activity Feeds",
        code: "dash:alerts",
        description: "Critical activity alerts, failed jobs, and priority notifications",
        supportedActions: {
          read: "dashboard:read",
          notify: "dashboard:notify",
        },
      },
    ],
  },
  {
    id: "organization",
    name: "Organization & Shifts",
    description: "Departments hierarchy, staff titles, shifts schedules, and access control policies",
    iconName: "Building2",
    subModules: [
      {
        id: "org_departments",
        name: "Departments Management",
        code: "org:departments",
        description: "Create, view, and manage operational departments & headcounts",
        supportedActions: {
          read: "departments:read",
          create: "departments:write",
          update: "departments:write",
          delete: "departments:delete",
          export: "departments:export",
        },
      },
      {
        id: "org_roles",
        name: "Roles Directory",
        code: "org:roles",
        description: "Define staff titles, operational roles, and hierarchy rankings",
        supportedActions: {
          read: "roles:read",
          create: "roles:manage",
          update: "roles:manage",
          delete: "roles:manage",
          export: "roles:export",
        },
      },
      {
        id: "org_shifts",
        name: "Shifts Scheduling",
        code: "org:shifts",
        description: "Define operational work shifts, working hours, and grace times",
        supportedActions: {
          read: "shifts:read",
          create: "shifts:write",
          update: "shifts:write",
          delete: "shifts:delete",
          export: "shifts:export",
        },
      },
      {
        id: "org_staff",
        name: "Staff & Employee Directory",
        code: "org:staff",
        description: "Manage organizational personnel, employment contracts, payroll setup, and assigned shifts",
        supportedActions: {
          read: "staff:read",
          create: "staff:write",
          update: "staff:write",
          delete: "staff:delete",
          export: "staff:export",
        },
      },
      {
        id: "org_access_control",
        name: "Access Control & Policy Matrix",
        code: "org:access_control",
        description: "Configure granular permissions and policy matrix matrices per role",
        supportedActions: {
          read: "roles:manage",
          update: "roles:manage",
          export: "roles:export",
        },
      },
    ],
  },
  {
    id: "catalog",
    name: "Catalog Management",
    description: "Manage products, category taxonomies, brand trademarks, and dynamic attributes",
    iconName: "ShoppingBag",
    subModules: [
      {
        id: "cat_products",
        name: "Products Directory",
        code: "cat:products",
        description: "Create, publish, edit, and archive merchandise products and variants",
        supportedActions: {
          read: "products:read",
          create: "products:write",
          update: "products:write",
          delete: "products:delete",
          export: "products:export",
        },
      },
      {
        id: "cat_categories",
        name: "Categories & Taxonomies",
        code: "cat:categories",
        description: "Manage hierarchical nested categories, SEO slugs, and banners",
        supportedActions: {
          read: "categories:read",
          create: "categories:write",
          update: "categories:write",
          delete: "categories:delete",
        },
      },
      {
        id: "cat_brands",
        name: "Brands & Trademarks",
        code: "cat:brands",
        description: "Configure merchandise brands, logos, origin country, and official websites",
        supportedActions: {
          read: "brands:read",
          create: "brands:write",
          update: "brands:write",
          delete: "brands:delete",
        },
      },
      {
        id: "cat_manufacturers",
        name: "Manufacturers & Suppliers",
        code: "cat:manufacturers",
        description: "Maintain manufacturer compliance IDs, legal registrations, and contacts",
        supportedActions: {
          read: "manufacturers:read",
          create: "manufacturers:write",
          update: "manufacturers:write",
          delete: "manufacturers:delete",
        },
      },
      {
        id: "cat_attributes",
        name: "Dynamic Attributes Engine",
        code: "cat:attributes",
        description: "Define dynamic specifications, units of measure, and category mappings",
        supportedActions: {
          read: "attributes:read",
          create: "attributes:write",
          update: "attributes:write",
          delete: "attributes:delete",
        },
      },
    ],
  },
  {
    id: "inventory",
    name: "Inventory & Warehouses",
    description: "Multi-warehouse stock balances, movement ledgers, and low-stock monitor",
    iconName: "Boxes",
    subModules: [
      {
        id: "inv_balances",
        name: "Stock Balances & Tracking",
        code: "inv:balances",
        description: "Inspect on-hand, reserved, and available stock counts across warehouses",
        supportedActions: {
          read: "inventory:read",
          update: "inventory:write",
          export: "inventory:export",
        },
      },
      {
        id: "inv_warehouses",
        name: "Warehouse Facilities",
        code: "inv:warehouses",
        description: "Define fulfillment centers, storage depots, and geographic locations",
        supportedActions: {
          read: "warehouses:read",
          create: "warehouses:write",
          update: "warehouses:write",
          delete: "warehouses:delete",
        },
      },
      {
        id: "inv_adjustments",
        name: "Stock Adjustments & Transfers",
        code: "inv:adjustments",
        description: "Perform manual stock adjustments, damage write-offs, and transfers",
        supportedActions: {
          create: "inventory:adjust",
          update: "inventory:adjust",
        },
      },
      {
        id: "inv_ledger",
        name: "Movement Audit Ledger",
        code: "inv:ledger",
        description: "Examine immutable chronological transaction ledger of all inventory movements",
        supportedActions: {
          read: "inventory:read",
          export: "inventory:export",
        },
      },
    ],
  },
  {
    id: "settings",
    name: "System Settings",
    description: "Global system configurations and administrative audit trails",
    iconName: "Settings",
    subModules: [
      {
        id: "set_general",
        name: "General Application Settings",
        code: "set:general",
        description: "Store name, brand identity, currency, and global parameters",
        supportedActions: {
          read: "settings:read",
          update: "settings:write",
        },
      },
      {
        id: "set_audit",
        name: "Security Audit Logs",
        code: "set:audit",
        description: "Audit trail of administrative logins and critical changes",
        supportedActions: {
          read: "settings:read",
          export: "settings:export",
        },
      },
    ],
  },
];

// Helper to extract all distinct permission strings across the active system modules
export const ALL_SYSTEM_PERMISSIONS = Array.from(
  new Set(
    PERMISSION_MATRIX_REGISTRY.flatMap((group) =>
      group.subModules.flatMap((sub) => Object.values(sub.supportedActions))
    )
  )
);
