"use client";

import React, { useState, useEffect, Suspense, useRef, useMemo } from "react";
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
  Building2,
  ShieldCheck,
  Clock,
  Briefcase,
  CreditCard,
  DollarSign,
  AlertCircle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Eye,
  CheckCircle2,
  Calendar,
  Lock,
  HeartHandshake,
  MapPin,
  Home,
} from "lucide-react";
import { staffSchema, staffUpdateSchema } from "@/lib/validations/staff";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  SelectInput,
  PhoneInput,
  ImageUpload,
  AddressInput,
  AddressValue,
  Switch,
  PasswordInput,
} from "@/components/ui/form";
import { formatAddress } from "@/lib/utils";

interface OptionItem {
  id: string;
  name: string;
  departmentId?: string;
  code?: string;
  startTime?: string;
  endTime?: string;
}

interface ManagerOption {
  id: string;
  fullName: string;
  designation?: string | null;
}

function StaffFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { hasPermission } = useAdminAuth();
  const canWrite = hasPermission("staff:write") || hasPermission("*");
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reference Options fetched from database
  const [departments, setDepartments] = useState<OptionItem[]>([]);
  const [roles, setRoles] = useState<OptionItem[]>([]);
  const [shifts, setShifts] = useState<OptionItem[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [autoCode, setAutoCode] = useState("EMP001");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasLoginAccess, setHasLoginAccess] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE");

  // Auto-generate suggested username from full name or email
  const handleAutoSuggestUsername = () => {
    if (fullName.trim()) {
      const slug = fullName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ".");
      setUsername(slug);
    } else if (email.trim()) {
      const prefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
      setUsername(prefix);
    }
  };

  // Step 1: Personal
  const [gender, setGender] = useState("NOT_SPECIFIED");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("NOT_SPECIFIED");
  const [maritalStatus, setMaritalStatus] = useState("SINGLE");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");

  // Step 2: Org & Schedule
  const [departmentId, setDepartmentId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [reportingManagerId, setReportingManagerId] = useState("");
  const [designation, setDesignation] = useState("");
  const [workMode, setWorkMode] = useState<"ON_SITE" | "REMOTE" | "HYBRID">("ON_SITE");

  // Step 3: Employment
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [probationPeriodDays, setProbationPeriodDays] = useState(90);
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);

  // Step 4: Banking
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [upiId, setUpiId] = useState("");

  // Step 5: Payroll & Statutory
  const [monthlyGrossSalary, setMonthlyGrossSalary] = useState<number | "">("");
  const [basicSalary, setBasicSalary] = useState<number | "">("");
  const [hra, setHra] = useState<number | "">("");
  const [specialAllowance, setSpecialAllowance] = useState<number | "">("");
  const [taxRegime, setTaxRegime] = useState<"NEW_REGIME" | "OLD_REGIME">("NEW_REGIME");
  const [pfUanNumber, setPfUanNumber] = useState("");
  const [esiNumber, setEsiNumber] = useState("");

  // Step 6: Leave Quotas, Address & Emergency
  const [annualCasualLeaves, setAnnualCasualLeaves] = useState(12);
  const [annualSickLeaves, setAnnualSickLeaves] = useState(12);
  const [annualPaidLeaves, setAnnualPaidLeaves] = useState(18);
  const [currentAddress, setCurrentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);
  const [currentAddressVal, setCurrentAddressVal] = useState<Partial<AddressValue>>({
    country: "IN",
    state: "TN",
  });
  const [permanentAddressVal, setPermanentAddressVal] = useState<Partial<AddressValue>>({
    country: "IN",
    state: "TN",
  });
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");

  // Helper to parse stored address string or JSON
  const parseAddressData = (raw: string | null | undefined): Partial<AddressValue> => {
    if (!raw || !raw.trim()) return { country: "IN", state: "TN" };
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch {
      // not JSON
    }
    return { street: raw, country: "IN", state: "TN" };
  };

  const handleCurrentAddressChange = (val: AddressValue) => {
    setCurrentAddressVal(val);
    const formatted = formatAddress(val);
    setCurrentAddress(formatted);
    if (sameAsCurrentAddress) {
      setPermanentAddressVal(val);
      setPermanentAddress(formatted);
    }
  };

  const handlePermanentAddressChange = (val: AddressValue) => {
    setPermanentAddressVal(val);
    setPermanentAddress(formatAddress(val));
  };

  const handleSameAsCurrentToggle = (checked: boolean) => {
    setSameAsCurrentAddress(checked);
    if (checked) {
      setPermanentAddressVal(currentAddressVal);
      setPermanentAddress(currentAddress);
    }
  };

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper to clear a field error on input change
  const clearError = (fieldName: string) => {
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  // Preview Panel Tab
  const [previewTab, setPreviewTab] = useState<"badge" | "payroll" | "leaves">("badge");

  // Filter Roles cascading based on selected Department
  const filteredRoles = useMemo(() => {
    if (!departmentId) return roles;
    return roles.filter((r) => !r.departmentId || r.departmentId === departmentId);
  }, [roles, departmentId]);

  // When Monthly Gross is modified, auto-calculate standard Indian CTC breakups (50% Basic, 25% HRA, 25% Special)
  const handleGrossSalaryChange = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setMonthlyGrossSalary("");
      setBasicSalary("");
      setHra("");
      setSpecialAllowance("");
      return;
    }
    setMonthlyGrossSalary(num);
    const basic = Math.round(num * 0.5);
    const hraVal = Math.round(num * 0.25);
    const special = num - (basic + hraVal);
    setBasicSalary(basic);
    setHra(hraVal);
    setSpecialAllowance(special);
  };

  // Initial Data Load
  useEffect(() => {
    let isMounted = true;

    async function loadFormDependencies() {
      setIsLoading(true);
      try {
        // Fetch Reference lists
        const [deptRes, roleRes, shiftRes, staffRes] = await Promise.all([
          fetch("/api/admin/departments?limit=100"),
          fetch("/api/admin/roles?limit=100"),
          fetch("/api/admin/shifts?limit=100"),
          fetch("/api/admin/staff?limit=100"),
        ]);

        const [deptsJson, rolesJson, shiftsJson, staffJson] = await Promise.all([
          deptRes.json(),
          roleRes.json(),
          shiftRes.json(),
          staffRes.json(),
        ]);

        if (isMounted) {
          if (deptsJson.success && Array.isArray(deptsJson.data)) {
            setDepartments(deptsJson.data);
          }
          if (rolesJson.success && Array.isArray(rolesJson.data)) {
            setRoles(rolesJson.data);
          }
          if (shiftsJson.success && Array.isArray(shiftsJson.data)) {
            setShifts(shiftsJson.data);
          }
          if (staffJson.success && Array.isArray(staffJson.data)) {
            setManagers(staffJson.data);
          }
        }

        // If in Edit mode, load staff details
        if (isEditMode && editId) {
          const detailRes = await fetch(`/api/admin/staff/${editId}`);
          const detailJson = await detailRes.json();
          if (!detailRes.ok || !detailJson.success) {
            throw new Error(detailJson.error || "Failed to load staff details");
          }

          if (isMounted && detailJson.data) {
            const s = detailJson.data;
            setFullName(s.fullName || "");
            setAutoCode(s.employeeCode || "EMP001");
            setAvatarUrl(s.avatarUrl || null);
            setHasLoginAccess(s.hasLoginAccess ?? true);
            setUsername(s.username || "");
            setEmail(s.email || "");
            setPhone(s.phone || "");
            setStatus(s.status || "ACTIVE");
            setGender(s.gender || "NOT_SPECIFIED");
            setDateOfBirth(s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "");
            setBloodGroup(s.bloodGroup || "NOT_SPECIFIED");
            setMaritalStatus(s.maritalStatus || "SINGLE");
            setAadhaarNumber(s.aadhaarNumber || "");
            setPanNumber(s.panNumber || "");
            setDepartmentId(s.departmentId || "");
            setRoleId(s.roleId || "");
            setShiftId(s.shiftId || "");
            setReportingManagerId(s.reportingManagerId || "");
            setDesignation(s.designation || "");
            setWorkMode(s.workMode || "ON_SITE");
            setEmploymentType(s.employmentType || "FULL_TIME");
            setJoiningDate(s.joiningDate ? s.joiningDate.split("T")[0] : "");
            setProbationPeriodDays(s.probationPeriodDays ?? 90);
            setNoticePeriodDays(s.noticePeriodDays ?? 30);
            setBankName(s.bankName || "");
            setBankAccountNo(s.bankAccountNo || "");
            setBankIfscCode(s.bankIfscCode || "");
            setBankBranch(s.bankBranch || "");
            setUpiId(s.upiId || "");
            setMonthlyGrossSalary(s.monthlyGrossSalary ?? "");
            setBasicSalary(s.basicSalary ?? "");
            setHra(s.hra ?? "");
            setSpecialAllowance(s.specialAllowance ?? "");
            setTaxRegime(s.taxRegime || "NEW_REGIME");
            setPfUanNumber(s.pfUanNumber || "");
            setEsiNumber(s.esiNumber || "");
            setAnnualCasualLeaves(s.annualCasualLeaves ?? 12);
            setAnnualSickLeaves(s.annualSickLeaves ?? 12);
            setAnnualPaidLeaves(s.annualPaidLeaves ?? 18);
            setCurrentAddress(s.currentAddress || "");
            setPermanentAddress(s.permanentAddress || "");
            if (s.currentAddress) {
              setCurrentAddressVal(parseAddressData(s.currentAddress));
            }
            if (s.permanentAddress) {
              setPermanentAddressVal(parseAddressData(s.permanentAddress));
            }
            if (s.currentAddress && s.currentAddress === s.permanentAddress) {
              setSameAsCurrentAddress(true);
            }
            setEmergencyContactName(s.emergencyContactName || "");
            setEmergencyContactPhone(s.emergencyContactPhone || "");
            setEmergencyRelationship(s.emergencyRelationship || "");
          }
        } else {
          // Auto-generate code candidate
          if (staffJson.success && Array.isArray(staffJson.data)) {
            const nextIndex = staffJson.data.length + 1;
            setAutoCode(`EMP${String(nextIndex).padStart(3, "0")}`);
          }
        }
      } catch (err: any) {
        toast.error("Error", err.message || "Failed to load form dependencies");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFormDependencies();

    return () => {
      isMounted = false;
    };
  }, [editId, isEditMode, toast]);

  // Auto focus first field immediately
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Form Reset / Clear
  const handleClearForm = () => {
    if (isEditMode) return;
    setFullName("");
    setAvatarUrl(null);
    setHasLoginAccess(true);
    setUsername("");
    setEmail("");
    setPassword("");
    setPhone("");
    setDesignation("");
    setDepartmentId("");
    setRoleId("");
    setShiftId("");
    setMonthlyGrossSalary("");
    setBasicSalary("");
    setHra("");
    setSpecialAllowance("");
    setBankName("");
    setBankAccountNo("");
    setBankIfscCode("");
    setCurrentAddress("");
    setPermanentAddress("");
    setCurrentAddressVal({ country: "IN", state: "TN" });
    setPermanentAddressVal({ country: "IN", state: "TN" });
    setSameAsCurrentAddress(false);
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setEmergencyRelationship("");
    setErrors({});
    nameInputRef.current?.focus();
    toast.info("Notice", "Form has been reset.");
  };

  // Keyboard Navigation: Enter and Arrow keys advance through form inputs
  const { containerRef: formRef, handleKeyDown: handleFormKeyDown } = useFormKeyboardNavigation<HTMLFormElement>({
    enableArrowKeys: true,
    enableEnterNavigation: true,
  });

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onSave: () => {
      formRef.current?.requestSubmit();
    },
    onCancel: () => {
      router.push("/staff");
    },
    onReset: () => {
      if (!isEditMode) handleClearForm();
    },
  });

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !canWrite) return;

    setErrors({});

    const payload: any = {
      fullName,
      email: hasLoginAccess && email.trim() ? email.trim() : null,
      hasLoginAccess,
      username: hasLoginAccess && username.trim() ? username.trim().toLowerCase() : null,
      phone: phone || null,
      avatarUrl: avatarUrl || null,
      employeeCode: autoCode,
      status,
      gender,
      dateOfBirth: dateOfBirth || null,
      bloodGroup,
      maritalStatus,
      aadhaarNumber: aadhaarNumber || null,
      panNumber: panNumber ? panNumber.toUpperCase() : null,
      departmentId: departmentId || null,
      roleId: roleId || null,
      shiftId: shiftId || null,
      reportingManagerId: reportingManagerId || null,
      designation: designation || null,
      workMode,
      employmentType,
      joiningDate: joiningDate || null,
      probationPeriodDays: Number(probationPeriodDays) || 90,
      noticePeriodDays: Number(noticePeriodDays) || 30,
      bankName: bankName || null,
      bankAccountNo: bankAccountNo || null,
      bankIfscCode: bankIfscCode ? bankIfscCode.toUpperCase() : null,
      bankBranch: bankBranch || null,
      upiId: upiId || null,
      monthlyGrossSalary: monthlyGrossSalary !== "" ? Number(monthlyGrossSalary) : null,
      basicSalary: basicSalary !== "" ? Number(basicSalary) : null,
      hra: hra !== "" ? Number(hra) : null,
      specialAllowance: specialAllowance !== "" ? Number(specialAllowance) : null,
      taxRegime,
      pfUanNumber: pfUanNumber || null,
      esiNumber: esiNumber || null,
      annualCasualLeaves: Number(annualCasualLeaves) || 12,
      annualSickLeaves: Number(annualSickLeaves) || 12,
      annualPaidLeaves: Number(annualPaidLeaves) || 18,
      currentAddress: currentAddress || null,
      permanentAddress: sameAsCurrentAddress ? (currentAddress || null) : (permanentAddress || null),
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      emergencyRelationship: emergencyRelationship || null,
    };

    if (hasLoginAccess && password.trim()) {
      payload.password = password;
    }

    const schemaToUse = isEditMode ? staffUpdateSchema : staffSchema;
    const validation = schemaToUse.safeParse(payload);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Validation Failed", "Please fix the validation errors on the form.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditMode ? `/api/admin/staff/${editId}` : "/api/admin/staff";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errMsg = json.error || `Failed to ${isEditMode ? "update" : "create"} staff record`;
        const lower = errMsg.toLowerCase();
        const serverFieldErrors: Record<string, string> = {};
        if (lower.includes("email")) serverFieldErrors.email = errMsg;
        if (lower.includes("username")) serverFieldErrors.username = errMsg;
        if (lower.includes("phone")) serverFieldErrors.phone = errMsg;
        if (lower.includes("employee code") || lower.includes("employeecode") || lower.includes("code already")) serverFieldErrors.autoCode = errMsg;
        if (lower.includes("department")) serverFieldErrors.departmentId = errMsg;
        if (lower.includes("role")) serverFieldErrors.roleId = errMsg;
        if (lower.includes("shift")) serverFieldErrors.shiftId = errMsg;
        if (lower.includes("password")) serverFieldErrors.password = errMsg;
        if (Object.keys(serverFieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...serverFieldErrors }));
        }
        throw new Error(errMsg);
      }

      toast.success(
        "Staff Saved",
        `Staff member "${fullName}" ${isEditMode ? "updated" : "created"} successfully!`
      );
      router.push("/staff");
    } catch (err: any) {
      toast.error("Error", err.message || "An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDeptName = departments.find((d) => d.id === departmentId)?.name;
  const selectedRoleName = roles.find((r) => r.id === roleId)?.name;
  const selectedShift = shifts.find((s) => s.id === shiftId);

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* 1. Header (Standard Clean Back Arrow + Title + Plain text *CODE + Right Cancel link) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/staff"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {isEditMode ? "Edit Staff Member" : "Create Staff Member"}
              </h1>
              <span className="text-slate-400 font-mono text-base font-semibold select-none">
                *{autoCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure personnel identification, organizational allocation, compensation, and operational status.
            </p>
          </div>
        </div>

        {/* Header Right Action: Single Cancel Link */}
        <Link
          href="/staff"
          className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {/* 2. Form Layout Grid (65% Left Stepped Form / 35% Right Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 65% Stepped Form */}
        <div className="lg:col-span-8">
          <form
            ref={formRef}
            onKeyDown={handleFormKeyDown}
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1322] shadow-sm overflow-hidden"
          >
            <div className="p-6 sm:p-7 space-y-8">
                {/* STEP 1: Personal & Account Identification */}
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                      01
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Personal Profile & Authentication
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Step 1 of 5</span>
                </div>

                {/* Employee Profile Image Upload */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                  <ImageUpload
                    value={avatarUrl}
                    onChange={(url) => setAvatarUrl(url)}
                    folder="ecommerce/staff"
                    shape="circle"
                    size="md"
                    placeholderText="Staff Photo"
                    recommendedText="JPG, PNG, WebP (Max 5MB)"
                    disabled={isSubmitting}
                  />
                  <div className="text-center sm:text-left space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Employee Identification Photo
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                      Upload an official employee photograph. This portrait will appear on the staff ID card, roster dashboard, and live system preview.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearError("fullName");
                      }}
                      placeholder="e.g. Alex Morgan"
                      required
                      className={cn(
                        "w-full h-10 px-3.5 text-xs font-bold rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                        errors.fullName
                          ? "border-rose-400 focus:ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                      )}
                    />
                    {errors.fullName && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.fullName}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">Legal full name as registered in identity records.</p>
                  </div>

                  {/* Operational Status */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Operational Status <span className="text-rose-500">*</span>
                    </label>
                    <SelectInput
                      options={[
                        { value: "ACTIVE", label: "Active (Available for duty & login)" },
                        { value: "SUSPENDED", label: "Suspended (Restricted access)" },
                      ]}
                      value={status}
                      disabled={isSubmitting}
                      error={Boolean(errors.status)}
                      placeholder="Select status..."
                      clearable={false}
                      onChange={(e) => {
                        setStatus(e.target.value as "ACTIVE" | "SUSPENDED");
                        clearError("status");
                      }}
                    />
                    {errors.status && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.status}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">Suspended personnel cannot log in or perform duty actions.</p>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Phone Number
                    </label>
                    <PhoneInput
                      value={phone}
                      onChange={(val) => {
                        setPhone(val.e164 || `${val.dialCode} ${val.number}`.trim());
                        clearError("phone");
                      }}
                      defaultCountry="IN"
                      size="md"
                      disabled={isSubmitting}
                      error={Boolean(errors.phone)}
                      placeholder="98765 43210"
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Gender
                    </label>
                    <SelectInput
                      options={[
                        { value: "NOT_SPECIFIED", label: "Not Specified" },
                        { value: "MALE", label: "Male" },
                        { value: "FEMALE", label: "Female" },
                        { value: "OTHER", label: "Other" },
                      ]}
                      value={gender}
                      disabled={isSubmitting}
                      error={Boolean(errors.gender)}
                      placeholder="Select gender..."
                      clearable={false}
                      onChange={(e) => {
                        setGender(e.target.value);
                        clearError("gender");
                      }}
                    />
                    {errors.gender && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.gender}
                      </p>
                    )}
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Blood Group
                    </label>
                    <SelectInput
                      options={[
                        { value: "NOT_SPECIFIED", label: "Select Group" },
                        { value: "O_POSITIVE", label: "O +ve" },
                        { value: "A_POSITIVE", label: "A +ve" },
                        { value: "B_POSITIVE", label: "B +ve" },
                        { value: "AB_POSITIVE", label: "AB +ve" },
                        { value: "O_NEGATIVE", label: "O -ve" },
                        { value: "A_NEGATIVE", label: "A -ve" },
                        { value: "B_NEGATIVE", label: "B -ve" },
                        { value: "AB_NEGATIVE", label: "AB -ve" },
                      ]}
                      value={bloodGroup}
                      disabled={isSubmitting}
                      error={Boolean(errors.bloodGroup)}
                      placeholder="Select blood group..."
                      clearable={false}
                      onChange={(e) => {
                        setBloodGroup(e.target.value);
                        clearError("bloodGroup");
                      }}
                    />
                    {errors.bloodGroup && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.bloodGroup}
                      </p>
                    )}
                  </div>

                  <div className="hidden sm:block" />

                  {/* BOTTOM SECTION: Portal Login & Access Credentials */}
                  <div className="sm:col-span-2 pt-3 space-y-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        System Login & Authentication Credentials
                      </h3>
                    </div>

                    {/* Portal Login Access Toggle */}
                    <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Grant Portal / System Login Access
                            </label>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Enable this option to allow this staff member to sign in to the administrative portal. If disabled, this profile is retained for HR tracking, attendance rosters, and payroll without login credentials.
                          </p>
                        </div>
                        <Switch
                          checked={hasLoginAccess}
                          onChange={(e) => setHasLoginAccess(e.target.checked)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Login Details Grid (Only displayed when Portal Login Access is toggled ON) */}
                    {hasLoginAccess && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                        {/* Official Email Address */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Official Email Address <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              clearError("email");
                            }}
                            placeholder="alex.morgan@company.com"
                            required={hasLoginAccess}
                            className={cn(
                              "w-full h-10 px-3.5 text-xs font-medium rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                              errors.email
                                ? "border-rose-400 focus:ring-rose-400/20"
                                : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                            )}
                          />
                          {errors.email && (
                            <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.email}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400">Primary corporate email used for system notifications and login.</p>
                        </div>

                        {/* Username / Login User ID */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              Username / Login ID
                            </label>
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={handleAutoSuggestUsername}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              Auto-fill from Name
                            </button>
                          </div>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""));
                              clearError("username");
                            }}
                            placeholder="e.g. alex.morgan"
                            className={cn(
                              "w-full h-10 px-3.5 text-xs font-medium rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                              errors.username
                                ? "border-rose-400 focus:ring-rose-400/20"
                                : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                            )}
                          />
                          {errors.username && (
                            <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.username}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400">Can be used alternatively to email during portal sign-in.</p>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            {isEditMode ? "Account Password (Leave blank to keep existing)" : "Account Password"}{" "}
                            {!isEditMode && <span className="text-rose-500">*</span>}
                          </label>
                          <PasswordInput
                            size="md"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              clearError("password");
                            }}
                            placeholder={isEditMode ? "••••••••" : "Min 6 characters (Default: Staff@2026)"}
                            error={Boolean(errors.password)}
                          />
                          {errors.password && (
                            <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.password}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400">
                            {isEditMode
                              ? "Leave blank if you do not wish to reset this employee's password."
                              : "Staff member will enter this password alongside their Username or Email to access the system."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 2: Organizational Allocation & Work Schedule */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                      02
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Organizational Structure & Work Schedule
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Step 2 of 5</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Department Assignment
                    </label>
                    <SelectInput
                      options={[
                        { value: "", label: "Select Department..." },
                        ...departments.map((d) => ({
                          value: d.id,
                          label: `${d.name} (${d.code || "DEP"})`,
                        })),
                      ]}
                      value={departmentId}
                      disabled={isSubmitting}
                      error={Boolean(errors.departmentId)}
                      placeholder="Select department..."
                      clearable={false}
                      onChange={(e) => {
                        setDepartmentId(e.target.value);
                        setRoleId(""); // Reset role on department change
                        clearError("departmentId");
                      }}
                    />
                    {errors.departmentId && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.departmentId}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">Determines reporting hierarchy and role assignment scope.</p>
                  </div>

                  {/* Role (Cascaded) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Role & Security Permissions
                    </label>
                    <SelectInput
                      options={[
                        { value: "", label: "Select Role..." },
                        ...filteredRoles.map((r) => ({
                          value: r.id,
                          label: r.name,
                        })),
                      ]}
                      value={roleId}
                      disabled={isSubmitting}
                      error={Boolean(errors.roleId)}
                      placeholder="Select role..."
                      clearable={false}
                      onChange={(e) => {
                        setRoleId(e.target.value);
                        clearError("roleId");
                      }}
                    />
                    {errors.roleId && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.roleId}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">Controls portal access, granular actions, and admin capabilities.</p>
                  </div>

                  {/* Work Shift */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Assigned Work Shift
                    </label>
                    <SelectInput
                      options={[
                        { value: "", label: "Select Work Shift..." },
                        ...shifts.map((s) => ({
                          value: s.id,
                          label: `${s.name} (${s.startTime} - ${s.endTime})`,
                        })),
                      ]}
                      value={shiftId}
                      disabled={isSubmitting}
                      error={Boolean(errors.shiftId)}
                      placeholder="Select work shift..."
                      clearable={false}
                      onChange={(e) => {
                        setShiftId(e.target.value);
                        clearError("shiftId");
                      }}
                    />
                    {errors.shiftId && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.shiftId}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">Defines clock-in hours, attendance tracking, and grace window.</p>
                  </div>

                  {/* Reporting Manager */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Reporting Manager
                    </label>
                    <SelectInput
                      options={[
                        { value: "", label: "Top Management (No Manager)" },
                        ...managers
                          .filter((m) => m.id !== editId)
                          .map((m) => ({
                            value: m.id,
                            label: `${m.fullName} (${m.designation || "Staff"})`,
                          })),
                      ]}
                      value={reportingManagerId}
                      disabled={isSubmitting}
                      error={Boolean(errors.reportingManagerId)}
                      placeholder="Select reporting manager..."
                      clearable={false}
                      onChange={(e) => {
                        setReportingManagerId(e.target.value);
                        clearError("reportingManagerId");
                      }}
                    />
                    {errors.reportingManagerId && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.reportingManagerId}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">Direct supervisor for approval chains and performance appraisals.</p>
                  </div>

                  {/* Designation */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Official Designation / Title
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => {
                        setDesignation(e.target.value);
                        clearError("designation");
                      }}
                      placeholder="e.g. Accounts Operations Manager"
                      className={cn(
                        "w-full h-10 px-3.5 text-xs font-semibold rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                        errors.designation
                          ? "border-rose-400 focus:ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                      )}
                    />
                    {errors.designation && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.designation}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">Public title displayed across company staff directories.</p>
                  </div>

                  {/* Work Mode */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Work Mode
                    </label>
                    <SelectInput
                      options={[
                        { value: "ON_SITE", label: "On-site (Office)" },
                        { value: "REMOTE", label: "Remote (Work From Home)" },
                        { value: "HYBRID", label: "Hybrid (Flexible)" },
                      ]}
                      value={workMode}
                      disabled={isSubmitting}
                      error={Boolean(errors.workMode)}
                      placeholder="Select work mode..."
                      clearable={false}
                      onChange={(e) => {
                        setWorkMode(e.target.value as any);
                        clearError("workMode");
                      }}
                    />
                    {errors.workMode && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.workMode}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">Determines IP restriction checks and geolocation logging.</p>
                  </div>
                </div>
              </div>

              {/* STEP 3: Banking & Direct Deposit Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                      03
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Banking & Direct Salary Deposit
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Step 3 of 5</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
                  {/* Bank Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => {
                        setBankName(e.target.value);
                        clearError("bankName");
                      }}
                      placeholder="e.g. HDFC Bank"
                      className={cn(
                        "w-full h-10 px-3.5 text-xs font-medium rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                        errors.bankName
                          ? "border-rose-400 focus:ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                      )}
                    />
                    {errors.bankName && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.bankName}
                      </p>
                    )}
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccountNo}
                      onChange={(e) => {
                        setBankAccountNo(e.target.value);
                        clearError("bankAccountNo");
                      }}
                      placeholder="50100234567890"
                      className={cn(
                        "w-full h-10 px-3.5 text-xs font-mono font-medium rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                        errors.bankAccountNo
                          ? "border-rose-400 focus:ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                      )}
                    />
                    {errors.bankAccountNo && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.bankAccountNo}
                      </p>
                    )}
                  </div>

                  {/* IFSC Code */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Bank IFSC Code
                    </label>
                    <input
                      type="text"
                      value={bankIfscCode}
                      onChange={(e) => {
                        setBankIfscCode(e.target.value.toUpperCase());
                        clearError("bankIfscCode");
                      }}
                      placeholder="HDFC0001234"
                      className={cn(
                        "w-full h-10 px-3.5 text-xs font-mono font-bold rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                        errors.bankIfscCode
                          ? "border-rose-400 focus:ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                      )}
                    />
                    {errors.bankIfscCode && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.bankIfscCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 4: Payroll & Compensation (Auto Split) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                      04
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Payroll Architecture & Compensation
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Step 4 of 5</span>
                </div>

                <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Monthly Gross Salary (₹)
                    </label>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      ⚡ Automatically splits into Basic (50%), HRA (25%) & Special Allowance (25%)
                    </span>
                  </div>
                  <input
                    type="number"
                    value={monthlyGrossSalary}
                    onChange={(e) => {
                      handleGrossSalaryChange(e.target.value);
                      clearError("monthlyGrossSalary");
                    }}
                    placeholder="e.g. 50000"
                    className={cn(
                      "w-full h-11 px-4 text-sm font-black rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                      errors.monthlyGrossSalary
                        ? "border-rose-400 focus:ring-rose-400/30"
                        : "border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500/30"
                    )}
                  />
                  {errors.monthlyGrossSalary && (
                    <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.monthlyGrossSalary}
                    </p>
                  )}

                  {monthlyGrossSalary !== "" && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Basic (50%)</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                          ₹{Number(basicSalary).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">HRA (25%)</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                          ₹{Number(hra).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Special Allowance (25%)</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                          ₹{Number(specialAllowance).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Tax Regime
                    </label>
                    <SelectInput
                      options={[
                        { value: "NEW_REGIME", label: "New Tax Regime" },
                        { value: "OLD_REGIME", label: "Old Tax Regime" },
                      ]}
                      value={taxRegime}
                      disabled={isSubmitting}
                      error={Boolean(errors.taxRegime)}
                      placeholder="Select tax regime..."
                      clearable={false}
                      onChange={(e) => {
                        setTaxRegime(e.target.value as any);
                        clearError("taxRegime");
                      }}
                    />
                    {errors.taxRegime && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.taxRegime}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => {
                        setPanNumber(e.target.value.toUpperCase());
                        clearError("panNumber");
                      }}
                      placeholder="ABCDE1234F"
                      className={cn(
                        "w-full h-10 px-3.5 text-xs font-mono font-bold rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                        errors.panNumber
                          ? "border-rose-400 focus:ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                      )}
                    />
                    {errors.panNumber && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.panNumber}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      PF UAN Number
                    </label>
                    <input
                      type="text"
                      value={pfUanNumber}
                      onChange={(e) => {
                        setPfUanNumber(e.target.value);
                        clearError("pfUanNumber");
                      }}
                      placeholder="100123456789"
                      className={cn(
                        "w-full h-10 px-3.5 text-xs font-mono font-medium rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                        errors.pfUanNumber
                          ? "border-rose-400 focus:ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                      )}
                    />
                    {errors.pfUanNumber && (
                      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.pfUanNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 5: Residential Address, Emergency Contact & Leave Quotas */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                      05
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Residential Address, Emergency Contact & Leave Quotas
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Step 5 of 5</span>
                </div>

                {/* Sub-section 01: Residential Address Information (Reusable AddressInput) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] flex items-center justify-center">
                      A
                    </span>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Residential Address Information
                    </label>
                  </div>

                  <div className="space-y-4">
                    {/* Current Residential Address */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Current / Present Address <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <AddressInput
                        value={currentAddressVal}
                        onChange={(val) => {
                          handleCurrentAddressChange(val);
                          clearError("currentAddress");
                        }}
                        defaultCountry="IN"
                        defaultState="TN"
                        disabled={isSubmitting}
                        showPreview={true}
                      />
                      {errors.currentAddress && (
                        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.currentAddress}
                        </p>
                      )}
                    </div>

                    {/* Same as Current Address Checkbox */}
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <input
                        type="checkbox"
                        id="sameAsCurrentStaff"
                        checked={sameAsCurrentAddress}
                        onChange={(e) => handleSameAsCurrentToggle(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/30 border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                      />
                      <label
                        htmlFor="sameAsCurrentStaff"
                        className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none"
                      >
                        Permanent address is the same as current address
                      </label>
                    </div>

                    {/* Permanent Residential Address */}
                    {!sameAsCurrentAddress && (
                      <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-purple-500" />
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Permanent / Native Address
                          </label>
                        </div>
                        <AddressInput
                          value={permanentAddressVal}
                          onChange={(val) => {
                            handlePermanentAddressChange(val);
                            clearError("permanentAddress");
                          }}
                          defaultCountry="IN"
                          defaultState="TN"
                          disabled={isSubmitting}
                          showPreview={true}
                        />
                        {errors.permanentAddress && (
                          <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.permanentAddress}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-section 02: Emergency Contact & Next of Kin */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] flex items-center justify-center">
                      B
                    </span>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Emergency Contact & Next of Kin
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Emergency Contact Name */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Contact Person Name
                      </label>
                      <input
                        type="text"
                        value={emergencyContactName}
                        onChange={(e) => {
                          setEmergencyContactName(e.target.value);
                          clearError("emergencyContactName");
                        }}
                        placeholder="e.g. Sarah Morgan"
                        className={cn(
                          "w-full h-10 px-3.5 text-xs font-medium rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                          errors.emergencyContactName
                            ? "border-rose-400 focus:ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                        )}
                      />
                      {errors.emergencyContactName && (
                        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.emergencyContactName}
                        </p>
                      )}
                    </div>

                    {/* Relationship Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Relationship
                      </label>
                      <SelectInput
                        options={[
                          { value: "SPOUSE", label: "Spouse (Husband / Wife)" },
                          { value: "PARENT", label: "Parent (Father / Mother)" },
                          { value: "SIBLING", label: "Sibling (Brother / Sister)" },
                          { value: "CHILD", label: "Child (Son / Daughter)" },
                          { value: "GUARDIAN", label: "Legal Guardian" },
                          { value: "FRIEND", label: "Friend / Colleague" },
                          { value: "OTHER", label: "Other" },
                        ]}
                        value={emergencyRelationship}
                        disabled={isSubmitting}
                        error={Boolean(errors.emergencyRelationship)}
                        placeholder="Select relation..."
                        clearable
                        onChange={(e) => {
                          setEmergencyRelationship(e.target.value);
                          clearError("emergencyRelationship");
                        }}
                      />
                      {errors.emergencyRelationship && (
                        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.emergencyRelationship}
                        </p>
                      )}
                    </div>

                    {/* Emergency Contact Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Emergency Phone
                      </label>
                      <PhoneInput
                        value={emergencyContactPhone}
                        onChange={(val) => {
                          setEmergencyContactPhone(val.e164 || `${val.dialCode} ${val.number}`.trim());
                          clearError("emergencyContactPhone");
                        }}
                        defaultCountry="IN"
                        size="md"
                        disabled={isSubmitting}
                        error={Boolean(errors.emergencyContactPhone)}
                        placeholder="98765 00000"
                      />
                      {errors.emergencyContactPhone && (
                        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.emergencyContactPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-section 03: Annual Leave Allocations & Entitlements */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] flex items-center justify-center">
                      C
                    </span>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Annual Leave Entitlements & Policy Quotas
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        Casual Leaves (Days/Yr)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={annualCasualLeaves}
                        onChange={(e) => {
                          setAnnualCasualLeaves(Number(e.target.value));
                          clearError("annualCasualLeaves");
                        }}
                        className={cn(
                          "w-full h-10 px-3.5 text-xs font-bold rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none transition-all",
                          errors.annualCasualLeaves
                            ? "border-rose-400 focus:ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-800"
                        )}
                      />
                      {errors.annualCasualLeaves && (
                        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.annualCasualLeaves}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        Sick Leaves (Days/Yr)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={annualSickLeaves}
                        onChange={(e) => {
                          setAnnualSickLeaves(Number(e.target.value));
                          clearError("annualSickLeaves");
                        }}
                        className={cn(
                          "w-full h-10 px-3.5 text-xs font-bold rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none transition-all",
                          errors.annualSickLeaves
                            ? "border-rose-400 focus:ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-800"
                        )}
                      />
                      {errors.annualSickLeaves && (
                        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.annualSickLeaves}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Paid/Earned (Days/Yr)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={annualPaidLeaves}
                        onChange={(e) => {
                          setAnnualPaidLeaves(Number(e.target.value));
                          clearError("annualPaidLeaves");
                        }}
                        className={cn(
                          "w-full h-10 px-3.5 text-xs font-bold rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none transition-all",
                          errors.annualPaidLeaves
                            ? "border-rose-400 focus:ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-800"
                        )}
                      />
                      {errors.annualPaidLeaves && (
                        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.annualPaidLeaves}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Card Footer Actions (Department Form Alignment) */}
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between gap-3">
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
                  Clear Form
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/staff")}
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
                disabled={isSubmitting || !canWrite}
                className="rounded-xl shadow-xs"
              >
                {isEditMode ? "Save Staff Member" : "Create Staff Member"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: 35% Sticky Interactive Live Preview */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* Live Preview Multi-Tab Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1322] shadow-sm overflow-hidden">
            {/* Header Tabs */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Live Preview
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewTab("badge")}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                    previewTab === "badge"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  ID Badge
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("payroll")}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                    previewTab === "payroll"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Payroll
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("leaves")}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                    previewTab === "leaves"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Leaves
                </button>
              </div>
            </div>

            {/* Content: TAB 1 ID Badge */}
            {previewTab === "badge" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3.5">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={fullName || "Personnel"}
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 ring-2 ring-indigo-500/20 border border-slate-200 dark:border-slate-800"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                      {fullName
                        ? fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()
                        : "EM"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {fullName || "Personnel Name"}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                        *{autoCode}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        {status}
                      </span>
                      {hasLoginAccess ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/50">
                          Login ON
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          No Login
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Portal Access:</span>
                    <strong
                      className={cn(
                        "font-bold",
                        hasLoginAccess ? "text-sky-600 dark:text-sky-400" : "text-slate-400"
                      )}
                    >
                      {hasLoginAccess ? (username ? `@${username}` : "Enabled") : "Disabled"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Designation:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {designation || "Staff Personnel"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Department:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {selectedDeptName || "Unassigned"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Role:</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {selectedRoleName || "Unassigned"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Shift Schedule:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {selectedShift ? `${selectedShift.name} (${selectedShift.startTime}-${selectedShift.endTime})` : "Unassigned"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Work Mode:</span>
                    <span className="font-bold uppercase text-[10px] text-purple-600 dark:text-purple-400">
                      {workMode.replace("_", "-")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Content: TAB 2 Payroll Breakdown */}
            {previewTab === "payroll" && (
              <div className="p-5 space-y-3">
                <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                  <p className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">
                    Monthly Gross
                  </p>
                  <p className="text-xl font-black text-indigo-900 dark:text-white mt-0.5">
                    ₹{monthlyGrossSalary ? Number(monthlyGrossSalary).toLocaleString("en-IN") : "0"}
                  </p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                    <span>Basic Salary (50%):</span>
                    <strong className="text-slate-900 dark:text-white">
                      ₹{basicSalary ? Number(basicSalary).toLocaleString("en-IN") : "0"}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                    <span>House Rent (HRA 25%):</span>
                    <strong className="text-slate-900 dark:text-white">
                      ₹{hra ? Number(hra).toLocaleString("en-IN") : "0"}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                    <span>Special Allowance (25%):</span>
                    <strong className="text-slate-900 dark:text-white">
                      ₹{specialAllowance ? Number(specialAllowance).toLocaleString("en-IN") : "0"}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Direct Bank Deposit:</span>
                    <span>{bankName ? `${bankName} (${bankIfscCode})` : "Pending Link"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Content: TAB 3 Leave Quotas */}
            {previewTab === "leaves" && (
              <div className="p-5 space-y-3 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">Annual Leave Allowances</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Casual</p>
                    <p className="text-base font-black text-amber-900 dark:text-amber-200 mt-0.5">
                      {annualCasualLeaves}d
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                    <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400">Sick</p>
                    <p className="text-base font-black text-rose-900 dark:text-rose-200 mt-0.5">
                      {annualSickLeaves}d
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Paid</p>
                    <p className="text-base font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                      {annualPaidLeaves}d
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 italic pt-1">
                  Total annual entitlement: {annualCasualLeaves + annualSickLeaves + annualPaidLeaves} days / calendar year.
                </p>
              </div>
            )}
          </div>

          {/* Governance & Compliance Guidelines */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1322] p-5 space-y-3 text-xs shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>HRMS Governance Rules</span>
            </div>
            <ul className="space-y-2 text-slate-500 dark:text-slate-400 leading-relaxed list-disc list-inside">
              <li>
                <strong>Sequential Code</strong>: The code <code className="text-slate-700 dark:text-slate-300 font-mono font-bold">*{autoCode}</code> is auto-generated and permanently assigned.
              </li>
              <li>
                <strong>Cascading Roles</strong>: Selecting a Department automatically limits roles to those belonging to that department.
              </li>
              <li>
                <strong>Salary Calculation</strong>: Changing Gross Salary automatically divides into Statutory 50% Basic and 25% HRA.
              </li>
              <li>
                <strong>Keyboard Navigation</strong>: Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">Enter</kbd> to move to next input, <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">Ctrl+S</kbd> to save.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffFormPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-semibold text-slate-400">
          Loading Staff Form...
        </div>
      }
    >
      <StaffFormContent />
    </Suspense>
  );
}
