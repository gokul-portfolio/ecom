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
  Shield,
  Users,
  RotateCcw,
  AlertCircle,
  Building2,
  CheckCircle2,
  HelpCircle,
  Keyboard,
  Sparkles,
} from "lucide-react";
import { departmentSchema, departmentUpdateSchema } from "@/lib/validations/department";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface DepartmentData {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  _count?: {
    staff: number;
    roles: number;
  };
}

function DepartmentFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { hasPermission } = useAdminAuth();
  const canWriteDept = hasPermission("departments:write") || hasPermission("*");

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form Fields & Validation Errors State
  const [name, setName] = useState("");
  const [autoCode, setAutoCode] = useState("DEP001");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [deptStats, setDeptStats] = useState<{ staff: number; roles: number } | null>(null);

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

  // Initial load: Fetch edit data OR auto-generate next code sequence from database count
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        if (isEditMode && editId) {
          const res = await fetch(`/api/admin/departments/${editId}`);
          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to load department details");
          }

          if (isMounted && json.data) {
            const dept: DepartmentData = json.data;
            setName(dept.name || "");
            setAutoCode(dept.code || "DEP001");
            setDescription(dept.description || "");
            setStatus(dept.isActive ? "ACTIVE" : "INACTIVE");
            if (dept._count) {
              setDeptStats(dept._count);
            }
          }
        } else {
          const res = await fetch("/api/admin/departments?limit=100");
          const json = await res.json();

          if (isMounted) {
            const count = json.pagination?.totalItems ?? (json.data?.length || 0);
            const nextCode = `DEP${String(count + 1).padStart(3, "0")}`;
            setAutoCode(nextCode);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading data";
        if (isEditMode) {
          toast.error("Not Found", msg);
          router.push("/departments");
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

  const handleClearForm = () => {
    if (isEditMode) return;
    setName("");
    setDescription("");
    setStatus("ACTIVE");
    setErrors({});
    const firstInput = containerRef.current?.querySelector<HTMLInputElement>("input:not([type='hidden'])");
    firstInput?.focus();
  };

  const submitForm = async () => {
    if (isSubmitting || !canWriteDept) {
      if (!canWriteDept) {
        toast.error("Permission Denied", "You do not have permission to create or edit departments.");
      }
      return;
    }

    const trimmedName = name.trim();

    if (isEditMode) {
      const validation = departmentUpdateSchema.safeParse({
        name: trimmedName,
        description: description.trim() || undefined,
        isActive: status === "ACTIVE",
      });

      if (!validation.success) {
        const fieldErrors: { name?: string; description?: string } = {};
        for (const issue of validation.error.issues) {
          const key = issue.path[0] as "name" | "description";
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
      const validation = departmentSchema.safeParse({
        name: name.trim(),
        code: autoCode,
        description: description.trim() || undefined,
        isActive: status === "ACTIVE",
      });

      if (!validation.success) {
        const fieldErrors: { name?: string; description?: string } = {};
        for (const issue of validation.error.issues) {
          const key = issue.path[0] as "name" | "description";
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
        const res = await fetch(`/api/admin/departments/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            description: description.trim() || null,
            isActive: status === "ACTIVE",
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to update department");
        }

        toast.success("Department Updated", `"${trimmedName}" updated successfully.`);
      } else {
        const res = await fetch("/api/admin/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: autoCode,
            name: trimmedName,
            description: description.trim() || undefined,
            isActive: status === "ACTIVE",
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to create department");
        }

        toast.success("Department Created", `"${trimmedName}" created with code *${autoCode}.`);

        setName("");
        setDescription("");
        setStatus("ACTIVE");
        setErrors({});

        try {
          const countRes = await fetch("/api/admin/departments?limit=1");
          const countJson = await countRes.json();
          if (countJson.success) {
            const count = countJson.pagination?.totalItems ?? 0;
            const nextCode = `DEP${String(count + 1).padStart(3, "0")}`;
            setAutoCode(nextCode);
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

  // Keyboard Navigation Hook
  const { containerRef, handleKeyDown: handleFormKeyDown } = useFormKeyboardNavigation<HTMLFormElement>({
    enableEnterNavigation: true,
    enableArrowKeys: true,
    submitOnCtrlEnter: true,
    autoFocusFirst: true,
    onSubmit: submitForm,
    onCancel: () => router.push("/departments"),
  });

  // Hotkeys Hook
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
        router.push("/departments");
      },
    },
    { enableInInputs: true, preventDefault: true }
  );

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
            href="/departments"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Departments (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{isEditMode ? "Edit Department" : "Create Department"}</span>
                <span className="font-mono text-base font-semibold text-slate-400 dark:text-slate-500">
                  *{autoCode}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure department boundary, operational status, and functional responsibilities.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/departments"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Cancel
          </Link>
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
            {/* Step 01: Identification & Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    01
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Department Identification
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 1 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Department Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    autoFocus
                    suppressHydrationWarning
                    type="text"
                    disabled={isSubmitting}
                    placeholder="e.g. Accounts & Financial Operations"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
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
                    The functional organizational unit displayed across payroll, roles, and staff.
                  </p>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Operational Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={status}
                    disabled={isSubmitting}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    className={cn(
                      "w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer",
                      isSubmitting && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <option value="ACTIVE">Active (Available for assignments)</option>
                    <option value="INACTIVE">Inactive (Suspended)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Inactive departments cannot be assigned to new staff or roles.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 02: Operational Scope / Responsibilities */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    02
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Operational Scope & Mandate
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 2 of 2</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Scope Description / Responsibilities
                </label>
                <textarea
                  rows={4}
                  disabled={isSubmitting}
                  placeholder="e.g. Billing, payment gateways, reconciliations, invoice auditing, and tax compliance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(
                    "w-full p-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-y",
                    isSubmitting && "opacity-60 cursor-not-allowed"
                  )}
                />
                <p className="text-[11px] text-slate-400">
                  Brief summary of the business responsibilities handled by team members in this department.
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
                  onClick={() => router.push("/departments")}
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
                disabled={isSubmitting || !canWriteDept}
                className="rounded-xl shadow-xs"
              >
                {isEditMode ? "Save Department (Ctrl+S)" : "Create Department (Ctrl+S)"}
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
                
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Live Preview
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                Badge Card
              </span>
            </div>

            {/* Card Badge Output */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {name.trim() || "Untitled Department"}
                    </h4>
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      *{autoCode}
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border",
                    status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                  )}
                >
                  {status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {description.trim() || "No operational scope description added yet. Add details on the left."}
              </p>

              {isEditMode && deptStats && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    {deptStats.roles} role{deptStats.roles === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    {deptStats.staff} member{deptStats.staff === 1 ? "" : "s"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Operational Best Practices Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Department Governance
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Department codes are sequential identifiers (<code className="font-mono text-indigo-500 font-bold">*DEP00X</code>) used for automated payroll grouping.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Each staff member is assigned to exactly one department during initial profile onboarding.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Sub-roles inherit the functional boundary defined in the department operational scope.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DepartmentFormPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-12 space-y-4">
          <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      }
    >
      <DepartmentFormContent />
    </Suspense>
  );
}
