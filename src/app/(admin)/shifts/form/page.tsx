"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/feedback/Toast";
import { Button } from "@/components/ui/button";
import {
  TextInput,
  TextArea,
  SelectInput,
  TimePicker,
} from "@/components/ui/form";
import {
  useFormKeyboardNavigation,
  useKeyboardShortcuts,
} from "@/hooks/useKeyboardNavigation";
import {
  ArrowLeft,
  Clock,
  Timer,
  Users,
  RotateCcw,
  AlertCircle,
  Briefcase,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { shiftSchema, shiftUpdateSchema } from "@/lib/validations/shift";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface ShiftData {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMins: number;
  description?: string | null;
  isActive: boolean;
  _count?: {
    staff: number;
  };
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active (Operational)" },
  { value: "INACTIVE", label: "Inactive (Archived)" },
];

const GRACE_PERIOD_OPTIONS = [
  { value: "0", label: "0 Minutes (No Grace Period)" },
  { value: "5", label: "5 Minutes" },
  { value: "10", label: "10 Minutes" },
  { value: "15", label: "15 Minutes (Standard)" },
  { value: "20", label: "20 Minutes" },
  { value: "30", label: "30 Minutes (Extended)" },
  { value: "45", label: "45 Minutes" },
  { value: "60", label: "60 Minutes (1 Hour)" },
];

function ShiftFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { hasPermission } = useAdminAuth();
  const canWriteShift =
    hasPermission("shifts:write") ||
    hasPermission("departments:write") ||
    hasPermission("*");

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form Fields & Validation Errors State
  const [name, setName] = useState("");
  const [autoCode, setAutoCode] = useState("SHF001");
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("06:00 PM");
  const [gracePeriodMins, setGracePeriodMins] = useState<string>("15");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [errors, setErrors] = useState<{
    name?: string;
    startTime?: string;
    endTime?: string;
    gracePeriodMins?: string;
    description?: string;
  }>({});
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

  // Initial load: Fetch edit data OR auto-generate next code sequence
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        if (isEditMode && editId) {
          const res = await fetch(`/api/admin/shifts/${editId}`);
          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to load shift details");
          }

          if (isMounted && json.data) {
            const s: ShiftData = json.data;
            setName(s.name || "");
            setAutoCode(s.code || "SHF001");
            setStartTime(s.startTime || "09:00 AM");
            setEndTime(s.endTime || "06:00 PM");
            setGracePeriodMins(String(s.gracePeriodMins ?? 15));
            setDescription(s.description || "");
            setStatus(s.isActive ? "ACTIVE" : "INACTIVE");
            if (s._count?.staff !== undefined) {
              setAssignedStaffCount(s._count.staff);
            }
          }
        } else {
          // Auto-generate code from count
          const countRes = await fetch("/api/admin/shifts?limit=1");
          const countJson = await countRes.json();
          if (isMounted && countJson.success) {
            const count = countJson.pagination?.totalItems ?? 0;
            const nextKey = `SHF${String(count + 1).padStart(3, "0")}`;
            setAutoCode(nextKey);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading data";
        if (isEditMode) {
          toast.error("Not Found", msg);
          router.push("/shifts");
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
    setStartTime("09:00 AM");
    setEndTime("06:00 PM");
    setGracePeriodMins("15");
    setDescription("");
    setStatus("ACTIVE");
    setErrors({});
    nameInputRef.current?.focus();
  };

  const submitForm = async () => {
    if (isSubmitting || !canWriteShift) {
      if (!canWriteShift) {
        toast.error("Permission Denied", "You do not have permission to create or edit shifts.");
      }
      return;
    }

    const trimmedName = name.trim();

    // Validate using Zod schemas
    if (isEditMode) {
      const validation = shiftUpdateSchema.safeParse({
        name: trimmedName,
        startTime,
        endTime,
        gracePeriodMins: Number(gracePeriodMins),
        description: description.trim() || undefined,
        isActive: status === "ACTIVE",
      });

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of validation.error.issues) {
          const key = issue.path[0] as string;
          if (key && !fieldErrors[key]) {
            fieldErrors[key] = issue.message;
          }
        }
        setErrors(fieldErrors);
        toast.warning("Validation Error", validation.error.issues[0]?.message || "Please fill in all required fields.");
        return;
      }
    } else {
      const validation = shiftSchema.safeParse({
        name: trimmedName,
        code: autoCode,
        startTime,
        endTime,
        gracePeriodMins: Number(gracePeriodMins),
        description: description.trim() || undefined,
        isActive: status === "ACTIVE",
      });

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of validation.error.issues) {
          const key = issue.path[0] as string;
          if (key && !fieldErrors[key]) {
            fieldErrors[key] = issue.message;
          }
        }
        setErrors(fieldErrors);
        toast.warning("Validation Error", validation.error.issues[0]?.message || "Please fill in all required fields.");
        return;
      }
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const res = await fetch(`/api/admin/shifts/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            startTime,
            endTime,
            gracePeriodMins: Number(gracePeriodMins),
            description: description.trim() || null,
            isActive: status === "ACTIVE",
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to update shift");
        }

        toast.success("Shift Updated", `"${trimmedName}" updated successfully.`);
      } else {
        const res = await fetch("/api/admin/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            code: autoCode,
            startTime,
            endTime,
            gracePeriodMins: Number(gracePeriodMins),
            description: description.trim() || undefined,
            isActive: status === "ACTIVE",
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to create shift");
        }

        toast.success("Shift Created", `Created "${trimmedName}" (*${json.data?.code || autoCode}).`);
      }

      router.push("/shifts");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
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
    onCancel: () => router.push("/shifts"),
  });

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
        router.push("/shifts");
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
      {/* Top Header Bar with auto-generated badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>{isEditMode ? "Edit Shift" : "Create Shift"}</span>
            <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
              *{autoCode}
            </span>
          </h1>

          {isEditMode && (
            <div className="hidden sm:flex items-center gap-2 ml-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <Users className="w-3 h-3 text-emerald-500" />
                {assignedStaffCount} Staff Member{assignedStaffCount === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        <Link
          href="/shifts"
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
          {/* Row 1: Shift Title & Operational Status Dropdown Component */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Shift Name using TextInput Component */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                Shift Name <span className="text-rose-500">*</span>
              </label>
              <TextInput
                ref={nameInputRef}
                autoFocus
                disabled={isSubmitting}
                placeholder="e.g. Morning General Operations"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                error={Boolean(errors.name)}
                className="text-xs font-medium"
              />
              {errors.name && (
                <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Operational Status using SelectInput Component */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                Operational Status
              </label>
              <SelectInput
                options={STATUS_OPTIONS}
                value={status}
                onChange={(val) => setStatus(typeof val === "string" ? val : val?.target?.value || "ACTIVE")}
                disabled={isSubmitting}
                clearable={false}
                placeholder="Select Status"
                className="text-xs"
              />
            </div>
          </div>

          {/* Row 2: Timing Schedule using TimePicker & Grace Period SelectInput Components */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Start Time using TimePicker Component */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Start Time <span className="text-rose-500">*</span>
              </label>
              <TimePicker
                value={startTime}
                onChange={(time) => setStartTime(time)}
                disabled={isSubmitting}
                placeholder="Select start time..."
              />
            </div>

            {/* End Time using TimePicker Component */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                End Time <span className="text-rose-500">*</span>
              </label>
              <TimePicker
                value={endTime}
                onChange={(time) => setEndTime(time)}
                disabled={isSubmitting}
                placeholder="Select end time..."
              />
            </div>

            {/* Grace Period using SelectInput Component */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-500" />
                Grace Period (Allowed)
              </label>
              <SelectInput
                options={GRACE_PERIOD_OPTIONS}
                value={gracePeriodMins}
                onChange={(val) => setGracePeriodMins(typeof val === "string" ? val : val?.target?.value || "15")}
                disabled={isSubmitting}
                clearable={false}
                placeholder="Select Grace Period"
                className="text-xs"
              />
            </div>
          </div>

          {/* Row 3: Shift Description using TextArea Component */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Description / Operational Scope
            </label>
            <TextArea
              rows={4}
              disabled={isSubmitting}
              placeholder="e.g. Standard morning shift for administrative, accounting, and warehouse dispatch teams..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              showCount
              maxLength={500}
              className="text-xs"
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
                onClick={() => router.push("/shifts")}
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
              disabled={isSubmitting || !canWriteShift}
              className="rounded-md focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
            >
              {isEditMode ? "Save Shift" : "Create Shift"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function ShiftFormPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-12 space-y-4">
          <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      }
    >
      <ShiftFormContent />
    </Suspense>
  );
}
