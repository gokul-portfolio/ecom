import { z } from "zod";

export const shiftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Shift name is required")
    .min(3, "Shift name must be at least 3 characters")
    .max(100, "Shift name cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z0-9\s&,.'\-_/()]+$/,
      "Shift name contains invalid characters. Use letters, numbers, and standard symbols."
    ),
  code: z
    .string()
    .trim()
    .min(2, "Shift code must be at least 2 characters")
    .max(20, "Shift code cannot exceed 20 characters")
    .regex(
      /^[A-Z0-9_]+$/,
      "Shift code must only contain uppercase letters, numbers, and underscores"
    )
    .optional(),
  startTime: z
    .string()
    .trim()
    .min(1, "Start time is required"),
  endTime: z
    .string()
    .trim()
    .min(1, "End time is required"),
  gracePeriodMins: z
    .coerce
    .number()
    .min(0, "Grace period cannot be negative")
    .max(180, "Grace period cannot exceed 180 minutes")
    .default(15),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  isActive: z.boolean().default(true),
});

export const shiftUpdateSchema = shiftSchema.partial();

export type ShiftFormValues = z.infer<typeof shiftSchema>;
export type ShiftUpdateValues = z.infer<typeof shiftUpdateSchema>;
