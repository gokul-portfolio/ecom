import { z } from "zod";

export const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role title is required")
    .min(3, "Role title must be at least 3 characters")
    .max(100, "Role title cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z0-9\s&,.'\-_/()]+$/,
      "Role title contains invalid characters. Use letters, numbers, and standard symbols."
    ),
  slug: z
    .string()
    .trim()
    .min(2, "Role slug must be at least 2 characters")
    .max(50, "Role slug cannot exceed 50 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Role slug must only contain lowercase letters, numbers, and underscores"
    )
    .optional(),
  departmentId: z
    .string()
    .trim()
    .min(1, "Please select an organizational department"),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  permissions: z
    .array(z.string())
    .default([])
    .optional(),
});

export const roleUpdateSchema = roleSchema.partial();

export type RoleFormValues = z.infer<typeof roleSchema>;
export type RoleUpdateValues = z.infer<typeof roleUpdateSchema>;

