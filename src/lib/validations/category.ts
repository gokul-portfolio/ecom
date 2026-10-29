import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
  code: z
    .string()
    .trim()
    .max(30, "Category code cannot exceed 30 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim().toUpperCase() : null)),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(120, "Slug cannot exceed 120 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase alphanumeric characters and hyphens"),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  parentId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val !== "none" && val !== "" ? val : null)),
  sortOrder: z.coerce.number().int().min(0, "Sort order must be non-negative").default(0),
  isActive: z.boolean().default(true),

  // Media
  iconUrl: z
    .string()
    .url("Invalid icon URL format")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  iconPublicId: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  bannerUrl: z
    .string()
    .url("Invalid banner URL format")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  bannerPublicId: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),

  // SEO Metadata
  metaTitle: z
    .string()
    .trim()
    .max(70, "Meta title cannot exceed 70 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  metaDescription: z
    .string()
    .trim()
    .max(160, "Meta description cannot exceed 160 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  canonicalUrl: z
    .string()
    .url("Invalid canonical URL")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
});

export const categoryUpdateSchema = categorySchema.partial();

export type CategoryFormValues = z.infer<typeof categorySchema>;
export type CategoryUpdateValues = z.infer<typeof categoryUpdateSchema>;
