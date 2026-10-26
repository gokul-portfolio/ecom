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
  Sparkles,
  HelpCircle,
  Keyboard,
} from "lucide-react";
import { shiftSchema, shiftUpdateSchema } from "@/lib/validations/shift";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { cn } from "@/lib/utils";

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

  // Initial load
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
            const shift: ShiftData = json.data;
            setName(shift.name || "");
            setAutoCode(shift.code || "SHF001");
            setStartTime(shift.startTime || "09:00 AM");
            setEndTime(shift.endTime || "06:00 PM");
            setGracePeriodMins(String(shift.gracePeriodMins ?? 15));
            setDescription(shift.description || "");
            setStatus(shift.isActive ? "ACTIVE" : "INACTIVE");
            if (shift._count) {
              setAssignedStaffCount(shift._count.staff);
            }
          }
        } else {
          const res = await fetch("/api/admin/shifts?limit=100");
          const json = await res.json();

          if (isMounted) {
            const count = json.pagination?.totalItems ?? (json.data?.length || 0);
            const nextCode = `SHF${String(count + 1).padStart(3, "0")}`;
            setAutoCode(nextCode);
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
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
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
    const firstInput = containerRef.current?.querySelector<HTMLInputElement>("input:not([type='hidden'])");
    firstInput?.focus();
  };

  const submitForm = async () => {
    if (isSubmitting || !canWriteShift) {
      if (!canWriteShift) {
        toast.error("Permission Denied", "You do not have permission to manage operational shifts.");
      }
      return;
    }

    const trimmedName = name.trim();
    const graceMins = parseInt(gracePeriodMins, 10) || 0;

    if (isEditMode) {
      const validation = shiftUpdateSchema.safeParse({
        name: trimmedName,
        startTime,
        endTime,
        gracePeriodMins: graceMins,
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
        toast.warning("Validation Error", validation.error.issues[0]?.message || "Please check the required fields.");
        return;
      }
    } else {
      const validation = shiftSchema.safeParse({
        code: autoCode,
        name: trimmedName,
        startTime,
        endTime,
        gracePeriodMins: graceMins,
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
        toast.warning("Validation Error", validation.error.issues[0]?.message || "Please check the required fields.");
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
            gracePeriodMins: graceMins,
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
            code: autoCode,
            name: trimmedName,
            startTime,
            endTime,
            gracePeriodMins: graceMins,
            description: description.trim() || undefined,
            isActive: status === "ACTIVE",
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to create shift");
        }

        toast.success("Shift Created", `"${trimmedName}" created with code *${autoCode}.`);

        setName("");
        setStartTime("09:00 AM");
        setEndTime("06:00 PM");
        setGracePeriodMins("15");
        setDescription("");
        setStatus("ACTIVE");
        setErrors({});

        try {
          const countRes = await fetch("/api/admin/shifts?limit=1");
          const countJson = await countRes.json();
          if (countJson.success) {
            const count = countJson.pagination?.totalItems ?? 0;
            const nextCode = `SHF${String(count + 1).padStart(3, "0")}`;
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
      f4: (e) => {
        e.preventDefault();
        handleClearForm();
      },
      escape: (e) => {
        e.preventDefault();
        router.push("/shifts");
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
            href="/shifts"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Shifts (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{isEditMode ? "Edit Operational Shift" : "Create Operational Shift"}</span>
                <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-900/60">
                  *{autoCode}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure working hours, punch-in grace allowances, and staff roster schedules.
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
            href="/shifts"
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
            disabled={isSubmitting || !canWriteShift}
            className="rounded-xl shadow-xs"
          >
            {isEditMode ? "Save Changes" : "Create Shift"}
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
            {/* Step 01: Identification & Timing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    01
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Shift Name & Status
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 1 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Shift Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                    Shift Title <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    ref={nameInputRef}
                    autoFocus
                    disabled={isSubmitting}
                    placeholder="e.g. Morning General Operations"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    error={Boolean(errors.name)}
                    className="text-xs font-medium rounded-xl"
                  />
                  {errors.name && (
                    <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Descriptive schedule name for attendance rosters and rosters.
                  </p>
                </div>

                {/* Operational Status */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
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
                    className="text-xs rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">
                    Inactive shifts cannot be scheduled on upcoming rosters.
                  </p>
                </div>
              </div>

              {/* Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
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

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
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

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-amber-500" />
                    Grace Period
                  </label>
                  <SelectInput
                    options={GRACE_PERIOD_OPTIONS}
                    value={gracePeriodMins}
                    onChange={(val) => setGracePeriodMins(typeof val === "string" ? val : val?.target?.value || "15")}
                    disabled={isSubmitting}
                    clearable={false}
                    placeholder="Select Grace Period"
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Step 02: Shift Description */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    02
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Schedule Scope & Notes
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 2 of 2</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Shift Scope & Responsibilities
                </label>
                <TextArea
                  rows={4}
                  disabled={isSubmitting}
                  placeholder="e.g. Standard morning shift for administrative, accounting, and warehouse dispatch teams..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  showCount
                  maxLength={500}
                  className="text-xs rounded-xl"
                />
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
                  onClick={() => router.push("/shifts")}
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
                disabled={isSubmitting || !canWriteShift}
                className="rounded-xl shadow-xs"
              >
                {isEditMode ? "Save Shift (Ctrl+S)" : "Create Shift (Ctrl+S)"}
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
                Shift Badge
              </span>
            </div>

            {/* Card Output */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {name.trim() || "Untitled Shift"}
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
                  {status === "ACTIVE" ? "Active" : "Archived"}
                </span>
              </div>

              {/* Schedule pill */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {startTime} - {endTime}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                  +{gracePeriodMins}m Grace
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {description.trim() || "No shift notes added. Add details on the left."}
              </p>

              {isEditMode && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{assignedStaffCount} staff scheduled</span>
                </div>
              )}
            </div>
          </div>

          {/* Shift Policies Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Attendance Policies
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Clock-ins within the grace window (<code className="font-mono text-amber-500 font-bold">+{gracePeriodMins}m</code>) are recorded as on-time.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Shift timings calculate daily operational hours for automated payroll export.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
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
