"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useServerTable } from "@/hooks/useServerTable";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/components/ui/feedback/Toast";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table";
import { Modal, DeleteConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useTableKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Shield,
  ShieldCheck,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Lock,
  Search,
  Sparkles,
  ArrowRight,
  HeartHandshake,
  DollarSign,
  Palmtree,
  ExternalLink,
} from "lucide-react";

export interface StaffRecord {
  id: string;
  employeeCode: string | null;
  username?: string | null;
  hasLoginAccess?: boolean;
  email: string | null;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: "ACTIVE" | "SUSPENDED";
  gender: string;
  bloodGroup: string;
  maritalStatus: string;
  aadhaarNumber: string | null;
  panNumber: string | null;
  designation: string | null;
  employmentType: string;
  workMode: "ON_SITE" | "REMOTE" | "HYBRID";
  joiningDate: string | null;
  probationPeriodDays: number;
  noticePeriodDays: number;
  contractEndDate: string | null;
  salary: number | null;
  monthlyGrossSalary: number | null;
  basicSalary: number | null;
  hra: number | null;
  specialAllowance: number | null;
  taxRegime: "NEW_REGIME" | "OLD_REGIME";
  isPfEligible: boolean;
  pfUanNumber: string | null;
  isEsiEligible: boolean;
  esiNumber: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankIfscCode: string | null;
  bankBranch: string | null;
  upiId: string | null;
  annualCasualLeaves: number;
  annualSickLeaves: number;
  annualPaidLeaves: number;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyRelationship: string | null;
  currentAddress: string | null;
  permanentAddress: string | null;
  createdAt: string;
  updatedAt: string;
  department: { id: string; name: string; code: string } | null;
  role: { id: string; name: string; slug: string; isSystem: boolean; permissions: any } | null;
  shift: { id: string; name: string; code: string; startTime: string; endTime: string; gracePeriodMins: number } | null;
  reportingManager: { id: string; fullName: string; employeeCode: string | null; designation: string | null } | null;
}

interface StaffClientProps {
  initialData?: StaffRecord[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage?: number;
    pageSize?: number;
  };
  initialMetrics?: {
    totalHeadcount: number;
    activeHeadcount: number;
    monthlyPayrollVolume: number;
  };
  departmentsList: { id: string; name: string }[];
  rolesList: { id: string; name: string }[];
  shiftsList: { id: string; name: string }[];
}

export function StaffClient({
  initialData,
  initialPagination,
  initialMetrics,
  departmentsList,
  rolesList,
  shiftsList,
}: StaffClientProps) {
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  const canWrite = hasPermission("staff:write") || hasPermission("*");
  const canDelete = hasPermission("staff:delete") || hasPermission("*");

  // Filter States
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workModeFilter, setWorkModeFilter] = useState("all");

  // Construct URL with active filters
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (departmentFilter !== "all") params.set("departmentId", departmentFilter);
    if (roleFilter !== "all") params.set("roleId", roleFilter);
    if (shiftFilter !== "all") params.set("shiftId", shiftFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (workModeFilter !== "all") params.set("workMode", workModeFilter);
    const queryString = params.toString();
    return `/api/admin/staff${queryString ? `?${queryString}` : ""}`;
  }, [departmentFilter, roleFilter, shiftFilter, statusFilter, workModeFilter]);

  // Server-side Table Controller with live Socket.io sync
  const {
    data: staffList,
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
    sortBy,
    sortOrder,
    toggleSort,
    refetch,
  } = useServerTable<StaffRecord>({
    endpoint,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    socketEventName: "staff:changed",
    initialData,
    initialPagination,
  });

  // State for View Profile Modal
  const [viewTarget, setViewTarget] = useState<StaffRecord | null>(null);
  const [modalTab, setModalTab] = useState<"profile" | "payroll" | "leaves">("profile");

  // State for Delete Confirmation Dialog
  const [deleteTarget, setDeleteTarget] = useState<StaffRecord | null>(null);

  // Table Keyboard Navigation: Arrow Up/Down to navigate rows, Enter to View, E to Edit, Delete to remove
  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<StaffRecord>({
    data: staffList,
    onAdd: () => {
      if (canWrite) router.push("/staff/form");
    },
    onView: (item) => {
      setViewTarget(item);
      setModalTab("profile");
    },
    onEdit: (item) => {
      if (canWrite) router.push(`/staff/form?id=${item.id}`);
    },
    onDelete: (item) => {
      if (canDelete) setDeleteTarget(item);
    },
  });

  // Execute Status Toggle (Active / Suspended)
  const handleToggleStatus = async (item: StaffRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canWrite) {
      toast.error("Permission Denied", "You do not have permission to change staff status.");
      return;
    }

    const nextStatus = item.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/staff/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update staff status");
      }
      toast.success("Status Updated", `Staff status updated to ${nextStatus}.`);
      refetch();
    } catch (err: any) {
      toast.error("Update Failed", err.message || "Failed to update status");
    }
  };

  // Execute Permanent Delete
  const handleDeleteStaff = async () => {
    if (!deleteTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete staff member");
      }

      toast.success("Staff Deleted", json.message || "Staff member removed successfully.");
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      toast.error("Delete Failed", err.message || "An unexpected error occurred while deleting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // TanStack Table Column Definitions
  const columns: ColumnDef<StaffRecord>[] = useMemo(
    () => [
      {
        accessorKey: "fullName",
        header: "Staff Member",
        cell: ({ row }) => {
          const item = row.original;
          const initials = item.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

          return (
            <div className="flex items-center gap-3 py-1">
              {item.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.avatarUrl}
                  alt={item.fullName}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                    {item.fullName}
                  </span>
                  {item.employeeCode && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                      {item.employeeCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="truncate">{item.email}</span>
                  {item.workMode && (
                    <span
                      className={cn(
                        "text-[9px] font-black px-1.5 py-0.2 rounded uppercase",
                        item.workMode === "REMOTE"
                          ? "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300"
                          : item.workMode === "HYBRID"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {item.workMode.replace("_", "-")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "designation",
        header: "Designation & Dept",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{item.designation || "Staff Personnel"}</span>
              </div>
              {item.department ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                  <Building2 className="w-3 h-3 text-indigo-500" />
                  {item.department.name}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 italic">Unassigned Dept</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role & Access",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {item.role ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="truncate">{item.role.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No Role</span>
                )}

                {item.hasLoginAccess === false ? (
                  <span className="inline-flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                    No Portal Access
                  </span>
                ) : item.username ? (
                  <span className="inline-flex items-center text-[10px] font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-200/80 dark:border-sky-800/60">
                    @{item.username}
                  </span>
                ) : null}
              </div>

              {item.role?.isSystem && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  <Lock className="w-3 h-3" />
                  <span>System Protected</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "shift",
        header: "Work Shift",
        cell: ({ row }) => {
          const item = row.original;
          if (!item.shift) {
            return <span className="text-xs text-slate-400 italic">No Shift</span>;
          }
          return (
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{item.shift.name}</span>
              </div>
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {item.shift.startTime} - {item.shift.endTime}{" "}
                <span className="text-[10px] text-slate-400">({item.shift.gracePeriodMins}m grace)</span>
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "monthlyGrossSalary",
        header: "Payroll & Bank",
        cell: ({ row }) => {
          const item = row.original;
          const hasBank = Boolean(item.bankAccountNo && item.bankIfscCode);

          return (
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {item.monthlyGrossSalary
                  ? `₹${item.monthlyGrossSalary.toLocaleString("en-IN")}/mo`
                  : item.salary
                  ? `₹${item.salary.toLocaleString("en-IN")}/yr`
                  : "Salary Not Set"}
              </div>
              <div className="flex items-center gap-1.5">
                {hasBank ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{item.bankName || "Bank"} Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                    <CreditCard className="w-3 h-3" />
                    <span>No Bank Linked</span>
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        cell: ({ row }) => {
          const item = row.original;
          const isActive = item.status === "ACTIVE";

          return (
            <button
              type="button"
              onClick={(e) => handleToggleStatus(item, e)}
              disabled={!canWrite}
              title={`Click to switch to ${isActive ? "Suspended" : "Active"}`}
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none",
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
                !canWrite && "opacity-70 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full mr-1.5",
                  isActive ? "bg-emerald-500" : "bg-slate-400"
                )}
              />
              <span>{isActive ? "Active" : "Suspended"}</span>
            </button>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;
          const isSystem = item.role?.isSystem;

          return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {/* View Icon Button */}
              <button
                type="button"
                onClick={() => {
                  setViewTarget(item);
                  setModalTab("profile");
                }}
                title="View Staff Profile (Enter)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span className="sr-only">View</span>
              </button>

              {/* Edit Icon Button */}
              {canWrite && (
                <Link
                  href={`/staff/form?id=${item.id}`}
                  title="Edit Staff Member (Ctrl+E)"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 dark:hover:text-amber-400 transition-colors inline-flex items-center cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="sr-only">Edit</span>
                </Link>
              )}

              {/* Delete Icon Button */}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  disabled={isSystem}
                  title={isSystem ? "Cannot delete Super Admin" : "Delete Staff Member (Delete)"}
                  className={cn(
                    "p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors cursor-pointer",
                    isSystem && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sr-only">Delete</span>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [canWrite, canDelete, router]
  );

  return (
    <>
      <div className="space-y-6 pb-20 text-left">
        {/* Header Breadcrumb & Quick Cross-Module Action Links */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Staff Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure organizational staff profiles, payroll structures, shift schedules, and access governance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canWrite && (
              <Link href="/staff/form">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add Staff Member
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Clean, Unified TanStack Data Table with Single Integrated Toolbar and Pagination */}
        <DataTable
          columns={columns}
          data={staffList}
          isLoading={isLoading}
          searchPlaceholder="Search staff by name, email, code..."
          exportFileName="staff-directory"
          canExport={hasPermission("staff:export") || hasPermission("*")}
          searchValue={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={toggleSort}
          selectedIndex={selectedIndex}
          onSelectRowIndex={selectIndex}
          toolbarActions={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="all">All Roles</option>
                {rolesList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              {/* Reset Filters button */}
              {(departmentFilter !== "all" || roleFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDepartmentFilter("all");
                    setRoleFilter("all");
                    setStatusFilter("all");
                    setPage(1);
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 h-9 px-2.5"
                >
                  Reset
                </Button>
              )}
            </div>
          }
          serverPagination={{
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            pageSize: pageSize,
            pageSizeOptions: [5, 10, 20, 50],
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setPage(1);
            },
          }}
        />
      </div>

      {/* 5. Comprehensive View Details Modal */}
      <Modal
        isOpen={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        title={viewTarget ? `${viewTarget.fullName}` : "Staff Profile"}
        description={viewTarget ? `Employee Code: ${viewTarget.employeeCode || "N/A"} • ${viewTarget.designation || "Staff Personnel"}` : ""}
        size="lg"
      >
        {viewTarget && (
          <div className="space-y-5 text-left pt-2">
            {/* Modal Tabs: Profile | Payroll & Banking | Leave Balances */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
              <button
                type="button"
                onClick={() => setModalTab("profile")}
                className={cn(
                  "pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer",
                  modalTab === "profile"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                Profile & Schedule
              </button>
              <button
                type="button"
                onClick={() => setModalTab("payroll")}
                className={cn(
                  "pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer",
                  modalTab === "payroll"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                Payroll & Banking
              </button>
              <button
                type="button"
                onClick={() => setModalTab("leaves")}
                className={cn(
                  "pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer",
                  modalTab === "leaves"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                Leave Quotas & Emergency
              </button>
            </div>

            {/* TAB 1: Profile & Schedule */}
            {modalTab === "profile" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Department</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.department?.name || "Unassigned"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Assigned Role</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.role?.name || "No Role"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Work Shift</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.shift ? `${viewTarget.shift.name} (${viewTarget.shift.startTime} - ${viewTarget.shift.endTime})` : "Unassigned"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Employment Type</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.employmentType.replace("_", " ")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Work Mode</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.workMode.replace("_", "-")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Reporting Manager</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.reportingManager?.fullName || "Self / Top Executive"}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Contact Details:</span>
                  <div className="flex items-center gap-4 font-semibold text-slate-800 dark:text-slate-200">
                    <span>{viewTarget.phone || "No phone"}</span>
                    <span>•</span>
                    <span>{viewTarget.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Payroll & Banking */}
            {modalTab === "payroll" && (
              <div className="space-y-4">
                {/* Salary Breakdown Box */}
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/50 pb-2">
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Monthly Gross Salary
                    </span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                      ₹{(viewTarget.monthlyGrossSalary || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Basic (50%)</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ₹{(viewTarget.basicSalary || (viewTarget.monthlyGrossSalary || 0) * 0.5).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">HRA (25%)</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ₹{(viewTarget.hra || (viewTarget.monthlyGrossSalary || 0) * 0.25).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Special Allowance</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ₹{(viewTarget.specialAllowance || (viewTarget.monthlyGrossSalary || 0) * 0.25).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bank Account Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Bank Name</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.bankName || "Not Provided"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Account Number</p>
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.bankAccountNo || "Not Provided"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">IFSC Code</p>
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.bankIfscCode || "Not Provided"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">PAN Number</p>
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.panNumber || "Not Provided"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Tax Regime</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.taxRegime.replace("_", " ")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">PF UAN</p>
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewTarget.pfUanNumber || "Not Applicable"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Leave Quotas & Emergency Contacts */}
            {modalTab === "leaves" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                    <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Casual Leave</p>
                    <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1">
                      {viewTarget.annualCasualLeaves} Days
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                    <p className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">Sick Leave</p>
                    <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1">
                      {viewTarget.annualSickLeaves} Days
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                    <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Paid Leave</p>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                      {viewTarget.annualPaidLeaves} Days
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">Emergency Contact</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {viewTarget.emergencyContactName || "Not Provided"}{" "}
                    {viewTarget.emergencyRelationship ? `(${viewTarget.emergencyRelationship})` : ""}
                  </p>
                  <p className="text-slate-500">{viewTarget.emergencyContactPhone || "No emergency phone"}</p>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setViewTarget(null)}>
                Close
              </Button>
              {canWrite && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    router.push(`/staff/form?id=${viewTarget.id}`);
                  }}
                  leftIcon={<Pencil className="w-3.5 h-3.5" />}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 6. Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isSubmitting && setDeleteTarget(null)}
        onDelete={handleDeleteStaff}
        itemName={deleteTarget?.fullName || "Staff Member"}
        isLoading={isSubmitting}
      />
    </>
  );
}
