"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useServerTable } from "@/hooks/useServerTable";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/components/ui/feedback/Toast";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, Pagination } from "@/components/ui/table";
import { ActionMenu } from "@/components/ui/dropdown";
import { Drawer, DeleteConfirmDialog } from "@/components/ui/modal";
import { FormField, TextInput, TextArea, SelectInput, Switch } from "@/components/ui/form";
import { Button, AddButton } from "@/components/ui/button";
import { ShieldCheck, Search, Users, Building2, RefreshCw, Key, Check } from "lucide-react";

interface RoleRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  departmentId: string;
  permissions: string[];
  createdAt: string;
  department: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    staff: number;
  };
}

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

// Granular Permission Matrix Groupings
const PERMISSION_GROUPS = [
  {
    category: "Financial Operations & Invoicing",
    permissions: [
      { key: "finance:read", label: "View Financial Reports & Revenue Analytics" },
      { key: "finance:write", label: "Manage Payment Gateways & Reconciliations" },
      { key: "invoices:manage", label: "Generate & Dispatch Tax Invoices" },
      { key: "orders:refund", label: "Authorize Order Refunds & Credit Notes" },
    ],
  },
  {
    category: "Store Catalog & Stock Inventory",
    permissions: [
      { key: "products:read", label: "Browse Product Directory & SKUs" },
      { key: "products:write", label: "Create & Update Product Information" },
      { key: "products:delete", label: "Permanently Delete Catalog Items" },
      { key: "inventory:manage", label: "Adjust Stock Levels & Warehouse Bins" },
    ],
  },
  {
    category: "Order Management & Logistics",
    permissions: [
      { key: "orders:read", label: "View Customer Orders & Receipts" },
      { key: "orders:write", label: "Update Fulfillment & Shipment Statuses" },
      { key: "customers:read", label: "View Customer Directory & Profiles" },
    ],
  },
  {
    category: "Administrative & Staff Governance",
    permissions: [
      { key: "departments:read", label: "View Organizational Departments" },
      { key: "departments:write", label: "Create & Edit Departments" },
      { key: "roles:manage", label: "Manage Staff Roles & Access Tokens" },
      { key: "staff:manage", label: "Invite & Provision Staff Accounts" },
    ],
  },
];

export default function RolesPage() {
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  const [departmentsList, setDepartmentsList] = useState<DepartmentOption[]>([]);

  // Fetch departments for select dropdown
  useEffect(() => {
    fetch("/api/admin/departments?limit=100")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setDepartmentsList(
            json.data.map((d: DepartmentOption) => ({
              id: d.id,
              name: d.name,
              code: d.code,
            }))
          );
        }
      })
      .catch(console.error);
  }, []);

  // Server-side Table Controller with live Socket.io sync
  const {
    data: roles,
    isLoading,
    isSubmitting,
    setIsSubmitting,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
    search,
    setSearch,
    refetch,
  } = useServerTable<RoleRecord>({
    endpoint: "/api/admin/roles",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    socketEventName: "roles:changed",
  });

  // Same-Page Drawer State for Create / Edit
  const [drawerState, setDrawerState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    record: Partial<RoleRecord> | null;
  }>({
    isOpen: false,
    mode: "create",
    record: null,
  });

  // Delete Confirm Dialog State
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Open Create Drawer
  const openCreateDrawer = () => {
    setFormName("");
    setFormSlug("");
    setFormDeptId(departmentsList[0]?.id || "");
    setFormDesc("");
    setSelectedPermissions(["orders:read"]);
    setDrawerState({ isOpen: true, mode: "create", record: null });
  };

  // Open Edit Drawer
  const openEditDrawer = (role: RoleRecord) => {
    setFormName(role.name);
    setFormSlug(role.slug);
    setFormDeptId(role.departmentId);
    setFormDesc(role.description || "");
    setSelectedPermissions(Array.isArray(role.permissions) ? role.permissions : []);
    setDrawerState({ isOpen: true, mode: "edit", record: role });
  };

  // Toggle permission in form
  const togglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  // Save Role (Create or Edit with Double-Click Lock)
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double-clicks

    if (selectedPermissions.length === 0) {
      toast.warning("Permissions Required", "Please select at least one permission capability.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (drawerState.mode === "create") {
        const res = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            slug: formSlug.trim().toLowerCase(),
            departmentId: formDeptId,
            description: formDesc.trim() || undefined,
            permissions: selectedPermissions,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to create role");
        }

        toast.success("Role Created", `"${formName}" created successfully.`);
      } else {
        const res = await fetch(`/api/admin/roles/${drawerState.record?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            departmentId: formDeptId,
            description: formDesc.trim() || null,
            permissions: selectedPermissions,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to update role");
        }

        toast.success("Role Updated", `"${formName}" updated successfully.`);
      }

      setDrawerState({ isOpen: false, mode: "create", record: null });
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error("Operation Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Delete Role
  const handleDeleteRole = async () => {
    if (!deleteTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/roles/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete role");
      }

      toast.success("Role Removed", `Deleted "${deleteTarget.name}".`);
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error("Cannot Delete Role", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // TanStack Table Columns
  const columns: ColumnDef<RoleRecord>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Role Title",
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
              {row.original.name}
            </span>
            {row.original.isSystem && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                SYSTEM
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-400">{row.original.slug}</span>
        </div>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
          {row.original.department?.name || "General"}
        </span>
      ),
    },
    {
      id: "permissions",
      header: "Capabilities",
      cell: ({ row }) => {
        const perms = Array.isArray(row.original.permissions) ? row.original.permissions : [];
        if (perms.includes("*")) {
          return (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Unrestricted (Wildcard *)
            </span>
          );
        }
        return (
          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            {perms.length} permission grant{perms.length === 1 ? "" : "s"}
          </span>
        );
      },
    },
    {
      id: "staff",
      header: "Assigned Staff",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          {row.original._count?.staff ?? 0} staff
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ActionMenu
          onEdit={
            hasPermission("roles:manage") || hasPermission("*")
              ? () => openEditDrawer(row.original)
              : undefined
          }
          onDelete={
            !row.original.isSystem && (hasPermission("roles:manage") || hasPermission("*"))
              ? () => setDeleteTarget(row.original)
              : undefined
          }
        />
      ),
      enableSorting: false,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 pb-20 text-left">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Roles & Permission Matrix
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Define operational staff roles, functional privileges, and granular module access tokens.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>

            {(hasPermission("roles:manage") || hasPermission("*")) && (
              <AddButton size="sm" onClick={openCreateDrawer}>
                Add Role
              </AddButton>
            )}
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="w-full max-w-sm">
            <TextInput
              placeholder="Search by role title, slug, or scope..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {/* TanStack Data Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <DataTable
            columns={columns}
            data={roles}
            searchPlaceholder="Filter listed roles..."
            exportFileName="roles-permissions-catalog"
          />

          {/* Reusable Server Pagination Bar */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              variant="numbered"
              showPageSize={true}
              showTotal={true}
            />
          </div>
        </div>
      </div>

      {/* Same-Page Slide-over Drawer for Create & Edit */}
      <Drawer
        isOpen={drawerState.isOpen}
        onClose={() => setDrawerState({ isOpen: false, mode: "create", record: null })}
        title={drawerState.mode === "create" ? "Create Staff Role" : `Edit Role: ${drawerState.record?.name}`}
        description="Configure role identity and assign modular permission toggles."
        size="lg"
      >
        <form onSubmit={handleSaveRole} className="space-y-5 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Role Title" required>
              <TextInput
                placeholder="e.g. Inventory Supervisor"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (drawerState.mode === "create") {
                    setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_"));
                  }
                }}
                required
              />
            </FormField>

            <FormField label="Role Slug" required helperText="Lowercase identifier">
              <TextInput
                placeholder="e.g. inventory_supervisor"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value.toLowerCase())}
                disabled={drawerState.mode === "edit"}
                required
              />
            </FormField>
          </div>

          <FormField label="Department Assignment" required>
            <SelectInput
              options={departmentsList.map((d) => ({
                value: d.id,
                label: `${d.name} (${d.code})`,
              }))}
              value={formDeptId}
              onChange={(e) => setFormDeptId(e.target.value)}
            />
          </FormField>

          <FormField label="Description">
            <TextArea
              rows={2}
              placeholder="Scope of authority and duties assigned to this role..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
          </FormField>

          {/* Granular Permission Matrix */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-500" />
                Granular Permission Matrix
              </span>
              <span className="text-[11px] font-mono text-indigo-500 font-semibold">
                {selectedPermissions.includes("*") ? "All Wildcard (*)" : `${selectedPermissions.length} active`}
              </span>
            </div>

            {selectedPermissions.includes("*") ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
                This root system administrator role holds permanent wildcard access to all current and future platform modules.
              </div>
            ) : (
              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                {PERMISSION_GROUPS.map((group) => (
                  <div
                    key={group.category}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-2.5"
                  >
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                      {group.category}
                    </span>
                    <div className="space-y-2">
                      {group.permissions.map((p) => {
                        const isChecked = selectedPermissions.includes(p.key);
                        return (
                          <div
                            key={p.key}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {p.label}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">{p.key}</span>
                            </div>
                            <Switch
                              checked={isChecked}
                              onCheckedChange={() => togglePermission(p.key)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="sm"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {drawerState.mode === "create" ? "Create Role" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDrawerState({ isOpen: false, mode: "create", record: null })}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Reusable Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={handleDeleteRole}
        itemName={deleteTarget?.name || "Role"}
      />
    </AppLayout>
  );
}
