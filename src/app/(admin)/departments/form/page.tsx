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
  Shield,
  Users,
  RotateCcw,
  AlertCircle,
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
  const nameInputRef = React.useRef<HTMLInputElement>(null);

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
          // In Create Mode: Fetch existing department count to auto-generate next sequential code (e.g. DEP001, DEP005)
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
    // Refocus first element inside container
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

    // Validate using Zod schemas
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

        // Reset form for rapid continuous data entry
        setName("");
        setDescription("");
        setStatus("ACTIVE");
        setErrors({});

        // Fetch new count and increment code sequence
        try {
          const countRes = await fetch("/api/admin/departments?limit=1");
          const countJson = await countRes.json();
          if (countJson.success) {
            const count = countJson.pagination?.totalItems ?? 0;
            const nextCode = `DEP${String(count + 1).padStart(3, "0")}`;
            setAutoCode(nextCode);
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
    onCancel: () => router.push("/departments"),
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
        router.push("/departments");
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
      {/* Top Header Bar with Auto-Generated Sequence Code */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>{isEditMode ? "Edit Department" : "Create Department"}</span>
            <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
              *{autoCode}
            </span>
          </h1>

          {isEditMode && deptStats && (
            <div className="hidden sm:flex items-center gap-2 ml-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <Shield className="w-3 h-3 text-indigo-500" />
                {deptStats.roles} Role{deptStats.roles === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <Users className="w-3 h-3 text-emerald-500" />
                {deptStats.staff} Member{deptStats.staff === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        <Link
          href="/departments"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to List
        </Link>
      </div>

      {/* Main Single Master Card Form (noValidate disables browser balloon popups) */}
      <form
        ref={containerRef}
        onKeyDown={handleFormKeyDown}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
          {/* Row 1: 2-Column Grid for Department Name and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Department Name with Dedicated Inline Error */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                disabled={isSubmitting}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                className={cn(
                  "w-full h-10 px-3 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors cursor-pointer",
                  isSubmitting && "opacity-60 cursor-not-allowed"
                )}
              >
                <option value="ACTIVE">Active (Available for assignments)</option>
                <option value="INACTIVE">Inactive (Suspended)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Operational Scope / Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Description / Operational Scope
            </label>
            <textarea
              rows={4}
              disabled={isSubmitting}
              placeholder="e.g. Billing, payment gateways, reconciliations, invoice auditing, and tax compliance..."
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
                onClick={() => router.push("/departments")}
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
              disabled={isSubmitting || !canWriteDept}
              className="rounded-md focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
            >
              {isEditMode ? "Save Department" : "Create Department"}
            </Button>
          </div>
        </div>
      </form>
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
