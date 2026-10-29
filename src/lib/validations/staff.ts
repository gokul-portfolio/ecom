import { z } from "zod";

export const staffSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address format")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val && val.trim() !== "" ? val.trim().toLowerCase() : null)),
  hasLoginAccess: z.boolean().default(true),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(40, "Username cannot exceed 40 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, hyphens, and underscores")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val && val.trim() !== "" ? val.trim().toLowerCase() : null)),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number cannot exceed 20 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  employeeCode: z
    .string()
    .trim()
    .max(30, "Employee code cannot exceed 30 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  avatarUrl: z
    .string()
    .url("Invalid avatar URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  status: z.enum(["ACTIVE", "SUSPENDED"]).default("ACTIVE"),

  // 1. Personal & KYC Info
  gender: z.enum(["MALE", "FEMALE", "OTHER", "NOT_SPECIFIED"]).default("NOT_SPECIFIED"),
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  bloodGroup: z
    .enum([
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "NOT_SPECIFIED",
    ])
    .default("NOT_SPECIFIED"),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).default("SINGLE"),
  aadhaarNumber: z
    .string()
    .trim()
    .max(20, "Aadhaar number cannot exceed 20 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  panNumber: z
    .string()
    .trim()
    .max(20, "PAN number cannot exceed 20 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim().toUpperCase() : null)),

  // 2. Organization, Hierarchy & Shifts
  designation: z
    .string()
    .trim()
    .max(100, "Designation cannot exceed 100 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  departmentId: z
    .string()
    .trim()
    .uuid("Invalid department identifier")
    .optional()
    .nullable()
    .transform((val) => (val && val !== "none" ? val : null)),
  roleId: z
    .string()
    .trim()
    .uuid("Invalid role identifier")
    .optional()
    .nullable()
    .transform((val) => (val && val !== "none" ? val : null)),
  shiftId: z
    .string()
    .trim()
    .uuid("Invalid shift identifier")
    .optional()
    .nullable()
    .transform((val) => (val && val !== "none" ? val : null)),
  reportingManagerId: z
    .string()
    .trim()
    .uuid("Invalid manager identifier")
    .optional()
    .nullable()
    .transform((val) => (val && val !== "none" ? val : null)),

  // 3. Professional Employment Terms
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).default("FULL_TIME"),
  workMode: z.enum(["ON_SITE", "REMOTE", "HYBRID"]).default("ON_SITE"),
  joiningDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  probationPeriodDays: z.coerce.number().min(0).max(365).default(90),
  noticePeriodDays: z.coerce.number().min(0).max(180).default(30),
  contractEndDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),

  // 4. Payroll & Compensation (Salary Breakdown)
  salary: z.coerce.number().min(0).optional().nullable(),
  monthlyGrossSalary: z.coerce.number().min(0).optional().nullable(),
  basicSalary: z.coerce.number().min(0).optional().nullable(),
  hra: z.coerce.number().min(0).optional().nullable(),
  specialAllowance: z.coerce.number().min(0).optional().nullable(),
  taxRegime: z.enum(["NEW_REGIME", "OLD_REGIME"]).default("NEW_REGIME"),
  isPfEligible: z.boolean().default(true),
  pfUanNumber: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  isEsiEligible: z.boolean().default(false),
  esiNumber: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),

  // 5. Banking Details
  bankName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  bankAccountNo: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  bankIfscCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim().toUpperCase() : null)),
  bankBranch: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  upiId: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),

  // 6. Leave Quotas
  annualCasualLeaves: z.coerce.number().min(0).max(100).default(12),
  annualSickLeaves: z.coerce.number().min(0).max(100).default(12),
  annualPaidLeaves: z.coerce.number().min(0).max(100).default(18),

  // 7. Personal & Emergency Info
  emergencyContactName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  emergencyContactPhone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  emergencyRelationship: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  currentAddress: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  permanentAddress: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
});

export const staffUpdateSchema = staffSchema.partial();

export type StaffFormValues = z.infer<typeof staffSchema>;
export type StaffUpdateValues = z.infer<typeof staffUpdateSchema>;
