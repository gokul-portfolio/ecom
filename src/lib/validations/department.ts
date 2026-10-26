import { z } from "zod";

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .min(3, "Department name must be at least 3 characters")
    .max(100, "Department name cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z0-9\s&,.'\-_/()]+$/,
      "Department name contains invalid characters. Use letters, numbers, and standard symbols."
    ),
  code: z
    .string()
    .trim()
    .min(2, "Department code must be at least 2 characters")
    .max(20, "Department code cannot exceed 20 characters")
    .regex(
      /^[A-Z0-9_]+$/,
      "Department code must only contain uppercase letters, numbers, and underscores"
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  isActive: z.boolean().default(true),
});

export const departmentUpdateSchema = departmentSchema.partial();

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
export type DepartmentUpdateValues = z.infer<typeof departmentUpdateSchema>;
