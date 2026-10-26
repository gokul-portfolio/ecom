"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
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
  ShieldCheck,
  Building2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Keyboard,
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
  const canManageRoles =
    hasPermission("roles:manage") ||
    hasPermission("roles:write") ||
    hasPermission("*");

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
        const deptRes = await fetch("/api/admin/departments?limit=100");
        const deptJson = await deptRes.json();
        if (isMounted && deptJson.success && deptJson.data) {
          const list = deptJson.data.map((d: DepartmentOption) => ({
            id: d.id,
            name: d.name,
            code: d.code,
          }));
          setDepartmentsList(list);

          if (!isEditMode && list.length > 0 && !departmentId) {
            setDepartmentId(list[0].id);
          }
        }

        if (isEditMode && editId) {
          const res = await fetch(`/api/admin/roles/${editId}`);
          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to load role details");
          }

          if (isMounted && json.data) {
            const role: RoleData = json.data;
            setName(role.name || "");
            setAutoSlug(role.slug || "role_001");
            setDepartmentId(role.departmentId || "");
            setDescription(role.description || "");
            setIsSystemRole(Boolean(role.isSystem));
            if (role._count) {
              setAssignedStaffCount(role._count.staff);
            }
          }
        } else {
          const res = await fetch("/api/admin/roles?limit=100");
          const json = await res.json();

          if (isMounted) {
            const count = json.pagination?.totalItems ?? (json.data?.length || 0);
            const nextSlug = `role_${String(count + 1).padStart(3, "0")}`;
            setAutoSlug(nextSlug);
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
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleClearForm = () => {
    if (isEditMode) return;
    setName("");
    setDescription("");
    setErrors({});
    if (departmentsList.length > 0) {
      setDepartmentId(departmentsList[0].id);
    }
    const firstInput = containerRef.current?.querySelector<HTMLInputElement>("input:not([type='hidden'])");
    firstInput?.focus();
  };

  const submitForm = async () => {
    if (isSubmitting || !canManageRoles) {
      if (!canManageRoles) {
        toast.error("Permission Denied", "You do not have permission to manage roles.");
      }
      return;
    }

    const trimmedName = name.trim();

    if (isEditMode) {
      const validation = roleUpdateSchema.safeParse({
        name: trimmedName,
        departmentId: departmentId,
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
        toast.warning("Validation Error", validation.error.issues[0]?.message || "Please fill in the required fields.");
        const firstInput = containerRef.current?.querySelector<HTMLInputElement>("input:not([type='hidden'])");
        firstInput?.focus();
        return;
      }
    } else {
      const validation = roleSchema.safeParse({
        name: trimmedName,
        slug: autoSlug,
        departmentId: departmentId,
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
        toast.warning("Validation Error", validation.error.issues[0]?.message || "Please fill in the required fields.");
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
            departmentId: departmentId,
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
            departmentId: departmentId,
            description: description.trim() || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to create role");
        }

        toast.success("Role Created", `"${trimmedName}" created with slug *${autoSlug}.`);

        setName("");
        setDescription("");
        setErrors({});

        try {
          const countRes = await fetch("/api/admin/roles?limit=1");
          const countJson = await countRes.json();
          if (countJson.success) {
            const count = countJson.pagination?.totalItems ?? 0;
            const nextSlug = `role_${String(count + 1).padStart(3, "0")}`;
            setAutoSlug(nextSlug);
          }
        } catch {
          // Keep current fallback
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

  const { containerRef, handleKeyDown: handleFormKeyDown } = useFormKeyboardNavigation<HTMLFormElement>({
    enableEnterNavigation: true,
    enableArrowKeys: true,
    submitOnCtrlEnter: true,
    autoFocusFirst: true,
    onSubmit: submitForm,
    onCancel: () => router.push("/roles"),
  });

  useKeyboardShortcuts(
    {
      "f2, ctrl+s, meta+s": (e) => {
        e.preventDefault();
        submitForm();
      },
      f4: (e) => {
        e.preventDefault();
        handleClearForm();
      },
      escape: (e) => {
        e.preventDefault();
        router.push("/roles");
      },
    },
    { enableInInputs: true, preventDefault: true }
  );

  const selectedDeptObj = departmentsList.find((d) => d.id === departmentId);

  if (isLoading) {
    return (
      <div className="w-full space-y-6 text-left animate-pulse">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md" />
            <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="lg:col-span-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-left pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/roles"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Roles (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{isEditMode ? "Edit Staff Role" : "Create Staff Role"}</span>
                <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-900/60">
                  *{autoSlug}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Define operational staff designation, hierarchy boundary, and department binding.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <Keyboard className="w-3.5 h-3.5 text-slate-500" />
            <span><kbd className="font-mono font-bold text-slate-700 dark:text-slate-300">Ctrl+S</kbd> save</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span><kbd className="font-mono font-bold text-slate-700 dark:text-slate-300">Esc</kbd> back</span>
          </div>

          <Link
            href="/roles"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Cancel
          </Link>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={submitForm}
            loading={isSubmitting}
            disabled={isSubmitting || !canManageRoles}
            className="rounded-xl shadow-xs"
          >
            {isEditMode ? "Save Changes" : "Create Role"}
          </Button>
        </div>
      </div>

      {/* 2-COLUMN SPLIT MASTER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 65% Primary Form Inputs */}
        <div className="lg:col-span-8 space-y-6">
          <form
            ref={containerRef}
            onKeyDown={handleFormKeyDown}
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 sm:p-7 space-y-6 text-left"
          >
            {/* Step 01: Identification & Department */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    01
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Role Definition & Department
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 1 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Role Title */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
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
                      "w-full h-10 px-3 text-xs font-medium rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all",
                      isSubmitting && "opacity-60 cursor-not-allowed",
                      errors.name
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                        : "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    )}
                  />
                  {errors.name && (
                    <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Functional title assigned to staff accounts and audit records.
                  </p>
                </div>

                {/* Assigned Department Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
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
                      "w-full h-10 px-3 text-xs font-medium rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer",
                      isSubmitting && "opacity-60 cursor-not-allowed",
                      errors.departmentId
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
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
                  <p className="text-[11px] text-slate-400">
                    The parent business unit governing this role.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 02: Role Scope & Responsibilities */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    02
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Authority Scope & Responsibilities
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 2 of 2</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Role Scope & Responsibilities
                </label>
                <textarea
                  rows={4}
                  disabled={isSubmitting}
                  placeholder="e.g. Authority over financial reconciliations, payment dispatch, ledger audits, and reporting..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(
                    "w-full p-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-y",
                    isSubmitting && "opacity-60 cursor-not-allowed"
                  )}
                />
                <p className="text-[11px] text-slate-400">
                  Detailed responsibilities that outline the job role expectations.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {!isEditMode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearForm}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  Clear Form (F4)
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/roles")}
                  disabled={isSubmitting}
                  className="rounded-xl"
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
                className="rounded-xl shadow-xs"
              >
                {isEditMode ? "Save Role (Ctrl+S)" : "Create Role (Ctrl+S)"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: 35% Live Preview & Sidebar Guidelines */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* Live Preview Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Live Preview
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                Role Card
              </span>
            </div>

            {/* Card Output */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {name.trim() || "Untitled Role"}
                    </h4>
                    <span className="font-mono text-[11px] font-bold text-violet-600 dark:text-violet-400">
                      *{autoSlug}
                    </span>
                  </div>
                </div>

                {isSystemRole && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                    <Lock className="w-3 h-3" /> System
                  </span>
                )}
              </div>

              {selectedDeptObj && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{selectedDeptObj.name} ({selectedDeptObj.code})</span>
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {description.trim() || "No scope description defined yet. Add details on the left."}
              </p>

              {isEditMode && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{assignedStaffCount} staff member{assignedStaffCount === 1 ? "" : "s"} assigned</span>
                </div>
              )}
            </div>
          </div>

          {/* Role Architecture & Security Policies Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-4 h-4 text-violet-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Security & RBAC Policies
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Role slugs are permanent token references (<code className="font-mono text-violet-500 font-bold">*role_00X</code>) used by security middleware.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Fine-grained module permissions can be configured directly in the Permissions Matrix page.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>System roles cannot be deleted or unlinked from root platform capabilities.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
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
