"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/feedback/Toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useFormKeyboardNavigation,
  useKeyboardShortcuts,
} from "@/hooks/useKeyboardNavigation";
import {
  ArrowLeft,
  Users,
  Lock,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { roleSchema, roleUpdateSchema } from "@/lib/validations/role";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface RoleData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  departmentId: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    staff: number;
  };
}

function RoleFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { hasPermission } = useAdminAuth();
  const canManageRoles = hasPermission("roles:manage") || hasPermission("roles:write") || hasPermission("*");

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Departments List for Select
  const [departmentsList, setDepartmentsList] = useState<DepartmentOption[]>([]);

  // Form Fields & Validation Errors State
  const [name, setName] = useState("");
  const [autoSlug, setAutoSlug] = useState("role_001");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string; departmentId?: string }>({});
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [assignedStaffCount, setAssignedStaffCount] = useState<number>(0);

  // Auto focus first field immediately once data is ready
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Initial Load (Only on mount or when editId changes)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch active departments for dropdown
        const deptRes = await fetch("/api/admin/departments?limit=100");
        const deptJson = await deptRes.json();
        if (isMounted && deptJson.success && deptJson.data) {
          const list = deptJson.data.map((d: DepartmentOption) => ({
            id: d.id,
            name: d.name,
            code: d.code,
          }));
          setDepartmentsList(list);
          if (!editId && list.length > 0) {
            setDepartmentId((prev) => prev || list[0].id);
          }
        }

        if (isEditMode && editId) {
          const res = await fetch(`/api/admin/roles/${editId}`);
          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to load role details");
          }

          if (isMounted && json.data) {
            const r: RoleData = json.data;
            setName(r.name || "");
            setAutoSlug(r.slug || "role_001");
            setDepartmentId(r.departmentId || "");
            setDescription(r.description || "");
            setIsSystemRole(Boolean(r.isSystem));
            if (r._count?.staff !== undefined) {
              setAssignedStaffCount(r._count.staff);
            }
          }
        } else {
          // In Create Mode: Fetch existing roles count to auto-generate next sequential code
          const countRes = await fetch("/api/admin/roles?limit=1");
          const countJson = await countRes.json();
          if (isMounted && countJson.success) {
            const count = countJson.pagination?.totalItems ?? 0;
            const nextKey = `role_${String(count + 1).padStart(3, "0")}`;
            setAutoSlug(nextKey);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading data";
        if (isEditMode) {
          toast.error("Not Found", msg);
          router.push("/roles");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [editId, isEditMode, router, toast]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleClearForm = () => {
    if (isEditMode) return;
    setName("");
    if (departmentsList.length > 0) setDepartmentId(departmentsList[0].id);
    setDescription("");
    setErrors({});
    const firstInput = containerRef.current?.querySelector<HTMLInputElement>("input:not([type='hidden'])");
    firstInput?.focus();
  };

  const submitForm = async () => {
    if (isSubmitting || !canManageRoles) {
      if (!canManageRoles) {
        toast.error("Permission Denied", "You do not have permission to create or edit roles.");
      }
      return;
    }

    const trimmedName = name.trim();

    // Validate using Zod schemas
    if (isEditMode) {
      const validation = roleUpdateSchema.safeParse({
        name: trimmedName,
        departmentId: departmentId || undefined,
        description: description.trim() || undefined,
      });

      if (!validation.success) {
        const fieldErrors: { name?: string; departmentId?: string } = {};
        for (const issue of validation.error.issues) {
          const key = issue.path[0] as "name" | "departmentId";
          if (key && !fieldErrors[key]) {
            fieldErrors[key] = issue.message;
          }
        }
        setErrors(fieldErrors);
        toast.warning("Validation Error", validation.error.issues[0]?.message || "Please complete all required fields.");
        const firstInput = containerRef.current?.querySelector<HTMLInputElement>("input:not([type='hidden'])");
        firstInput?.focus();
        return;
      }
    } else {
      const validation = roleSchema.safeParse({
        name: trimmedName,
        slug: autoSlug,
        departmentId,
        description: description.trim() || undefined,
      });

      if (!validation.success) {
        const fieldErrors: { name?: string; departmentId?: string } = {};
        for (const issue of validation.error.issues) {
          const key = issue.path[0] as "name" | "departmentId";
          if (key && !fieldErrors[key]) {
            fieldErrors[key] = issue.message;
          }
        }
        setErrors(fieldErrors);
        toast.warning("Validation Error", validation.error.issues[0]?.message || "Please complete all required fields.");
        const firstInput = containerRef.current?.querySelector<HTMLInputElement>("input:not([type='hidden'])");
        firstInput?.focus();
        return;
      }
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const res = await fetch(`/api/admin/roles/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            departmentId,
            description: description.trim() || null,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to update role");
        }

        toast.success("Role Updated", `"${trimmedName}" updated successfully.`);
      } else {
        const res = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            slug: autoSlug,
            departmentId,
            description: description.trim() || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to create role");
        }

        toast.success("Role Created", `"${trimmedName}" created with key *${autoSlug}.`);

        // Reset form for rapid continuous data entry
        setName("");
        setDescription("");
        setErrors({});

        // Fetch new count and increment slug sequence
        try {
          const countRes = await fetch("/api/admin/roles?limit=1");
          const countJson = await countRes.json();
          if (countJson.success) {
            const count = countJson.pagination?.totalItems ?? 0;
            const nextKey = `role_${String(count + 1).padStart(3, "0")}`;
            setAutoSlug(nextKey);
          }
        } catch {
          // Keep current or increment fallback
        }

        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 50);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while saving";
      toast.error("Operation Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  // Enterprise Common Form Keyboard Navigation Hook (Enter/Arrow navigation + autoFocusFirst)
  const { containerRef, handleKeyDown: handleFormKeyDown } = useFormKeyboardNavigation<HTMLFormElement>({
    enableEnterNavigation: true,
    enableArrowKeys: true,
    submitOnCtrlEnter: true,
    autoFocusFirst: true,
    onSubmit: submitForm,
    onCancel: () => router.push("/roles"),
  });

  // Enterprise Global Function Keys & Hotkeys Hook (F2=Save, F4=Clear, Ctrl+S=Save, Esc=Back)
  useKeyboardShortcuts(
    {
      "f2, ctrl+s, meta+s": (e) => {
        e.preventDefault();
        submitForm();
      },
      "f4": (e) => {
        e.preventDefault();
        handleClearForm();
      },
      "escape": (e) => {
        e.preventDefault();
        router.push("/roles");
      },
    },
    { enableInInputs: true, preventDefault: true }
  );

  if (isLoading) {
    return (
      <div className="w-full space-y-4 text-left animate-pulse">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 text-left pb-16">
      {/* Top Header Bar with fixed auto-generated slug */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>{isEditMode ? "Edit Staff Role" : "Create Staff Role"}</span>
            <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
              *{autoSlug}
            </span>
          </h1>

          {isEditMode && (
            <div className="hidden sm:flex items-center gap-2 ml-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <Users className="w-3 h-3 text-emerald-500" />
                {assignedStaffCount} Staff Member{assignedStaffCount === 1 ? "" : "s"}
              </span>
              {isSystemRole && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                  <Lock className="w-3 h-3" /> System Protected
                </span>
              )}
            </div>
          )}
        </div>

        <Link
          href="/roles"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to List
        </Link>
      </div>

      {/* Main Single Master Card Form */}
      <form
        ref={containerRef}
        onKeyDown={handleFormKeyDown}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
          {/* Row 1: 2-Column Grid for Role Title and Assigned Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Role Title with Dedicated Inline Error */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Role Title <span className="text-rose-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                autoFocus
                suppressHydrationWarning
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. Accounts & Tax Specialist"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={cn(
                  "w-full h-10 px-3 text-xs font-medium rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-colors",
                  isSubmitting && "opacity-60 cursor-not-allowed",
                  errors.name
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 dark:border-rose-500"
                    : "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                )}
              />
              {errors.name && (
                <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Assigned Department Dropdown with Error */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Assigned Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={departmentId}
                disabled={isSubmitting}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  if (errors.departmentId) setErrors((prev) => ({ ...prev, departmentId: undefined }));
                }}
                className={cn(
                  "w-full h-10 px-3 text-xs font-medium rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none transition-colors cursor-pointer",
                  isSubmitting && "opacity-60 cursor-not-allowed",
                  errors.departmentId
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 dark:border-rose-500"
                    : "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                )}
              >
                {departmentsList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.departmentId}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Role Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Role Scope & Responsibilities
            </label>
            <textarea
              rows={4}
              disabled={isSubmitting}
              placeholder="e.g. Authority over financial reconciliations, payment dispatch, ledger audits, and reporting..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                "w-full p-3 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors resize-y",
                isSubmitting && "opacity-60 cursor-not-allowed"
              )}
            />
          </div>

          {/* Integrated Card Footer Actions */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            {!isEditMode ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearForm}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                disabled={isSubmitting}
                className="rounded-md focus:ring-2 focus:ring-indigo-500/30"
              >
                Clear Form
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/roles")}
                disabled={isSubmitting}
                className="rounded-md focus:ring-2 focus:ring-indigo-500/30"
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              disabled={isSubmitting || !canManageRoles}
              className="rounded-md focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
            >
              {isEditMode ? "Save Role" : "Create Role"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function RoleFormPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-12 space-y-4">
          <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      }
    >
      <RoleFormContent />
    </Suspense>
  );
}
