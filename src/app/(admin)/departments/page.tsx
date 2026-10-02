"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useServerTable } from "@/hooks/useServerTable";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/components/ui/feedback/Toast";
import { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  StatusBadgeCell,
  Pagination,
} from "@/components/ui/table";
import { ActionMenu } from "@/components/ui/dropdown";
import { Drawer, DeleteConfirmDialog } from "@/components/ui/modal";
import { FormField, TextInput, TextArea, Switch } from "@/components/ui/form";
import { Button, AddButton } from "@/components/ui/button";
import { Building2, Search, Users, Shield, RefreshCw } from "lucide-react";

interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    staff: number;
    roles: number;
  };
}

export default function DepartmentsPage() {
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  // Server-side Table Controller with live Socket.io sync
  const {
    data: departments,
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
  } = useServerTable<DepartmentRecord>({
    endpoint: "/api/admin/departments",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    socketEventName: "departments:changed",
  });

  // Same-Page Drawer State for Create / Edit
  const [drawerState, setDrawerState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    record: Partial<DepartmentRecord> | null;
  }>({
    isOpen: false,
    mode: "create",
    record: null,
  });

  // Delete Confirm Dialog State
  const [deleteTarget, setDeleteTarget] = useState<DepartmentRecord | null>(null);

  // Form Fields State
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Open Create Drawer
  const openCreateDrawer = () => {
    setFormCode("");
    setFormName("");
    setFormDesc("");
    setFormIsActive(true);
    setDrawerState({ isOpen: true, mode: "create", record: null });
  };

  // Open Edit Drawer
  const openEditDrawer = (dept: DepartmentRecord) => {
    setFormCode(dept.code);
    setFormName(dept.name);
    setFormDesc(dept.description || "");
    setFormIsActive(dept.isActive);
    setDrawerState({ isOpen: true, mode: "edit", record: dept });
  };

  // Submit Drawer Form (Create or Edit with Double-Click Lock)
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double-clicks

    setIsSubmitting(true);
    try {
      if (drawerState.mode === "create") {
        const res = await fetch("/api/admin/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: formCode.trim().toUpperCase(),
            name: formName.trim(),
            description: formDesc.trim() || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to create department");
        }

        toast.success("Department Created", `"${formName}" created successfully.`);
      } else {
        const res = await fetch(`/api/admin/departments/${drawerState.record?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim() || null,
            isActive: formIsActive,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to update department");
        }

        toast.success("Department Updated", `"${formName}" updated successfully.`);
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

  // Execute Delete
  const handleDeleteDepartment = async () => {
    if (!deleteTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/departments/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete department");
      }

      toast.success("Department Removed", `Deleted "${deleteTarget.name}".`);
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error("Cannot Delete", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // TanStack Table Columns
  const columns: ColumnDef<DepartmentRecord>[] = [
    {
      id: "code",
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          {row.original.code}
        </span>
      ),
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Department Name",
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {row.original.name}
          </span>
          {row.original.description && (
            <span className="text-[11px] text-slate-400 line-clamp-1">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "roles",
      header: "Configured Roles",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          {row.original._count?.roles ?? 0} role{row.original._count?.roles === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      id: "staff",
      header: "Assigned Staff",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          {row.original._count?.staff ?? 0} member{row.original._count?.staff === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadgeCell
          status={row.original.isActive ? "In Stock" : "Out of Stock"}
          variant={row.original.isActive ? "success" : "neutral"}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ActionMenu
          onEdit={
            hasPermission("departments:write") || hasPermission("*")
              ? () => openEditDrawer(row.original)
              : undefined
          }
          onDelete={
            hasPermission("departments:delete") || hasPermission("*")
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
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Department Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure organizational departments, team staffing, and functional boundaries.
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

            {(hasPermission("departments:write") || hasPermission("*")) && (
              <AddButton size="sm" onClick={openCreateDrawer}>
                Add Department
              </AddButton>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="w-full max-w-sm">
            <TextInput
              placeholder="Search by department name, code, or description..."
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
            data={departments}
            searchPlaceholder="Filter listed rows..."
            exportFileName="departments-catalog"
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
        title={drawerState.mode === "create" ? "Create New Department" : `Edit Department: ${drawerState.record?.name}`}
        description="Fill in department identifiers and operational status."
        size="md"
      >
        <form onSubmit={handleSaveDepartment} className="space-y-5 text-left">
          {/* Section 01: Department Identity */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center">
                01
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Department Identity
              </h4>
            </div>

            <FormField label="Department Name" required>
              <TextInput
                placeholder="e.g. Accounts & Financial Operations"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Department Code" required helperText="Unique uppercase identifier (e.g. FINANCE, LOGISTICS)">
              <TextInput
                placeholder="e.g. FINANCE"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                disabled={drawerState.mode === "edit"}
                required
              />
            </FormField>
          </div>

          {/* Section 02: Operational Scope */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center">
                02
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Operational Scope
              </h4>
            </div>

            <FormField label="Description">
              <TextArea
                rows={3}
                placeholder="Brief summary of department scope and responsibilities..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </FormField>
          </div>

          {/* Section 03: Operational Status */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center">
                03
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Operational Status
              </h4>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Active Department
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Inactive departments cannot have new roles or staff assigned
                </p>
              </div>
              <Switch
                checked={formIsActive}
                onCheckedChange={(val) => setFormIsActive(val)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="sm"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {drawerState.mode === "create" ? "Create Department" : "Save Changes"}
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
        onDelete={handleDeleteDepartment}
        itemName={deleteTarget?.name || "Department"}
      />
    </AppLayout>
  );
}
