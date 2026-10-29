import { z } from "zod";

export const brandSchema = z.object({
  name: z
    .string()
    .min(2, "Brand name must be at least 2 characters")
    .max(100, "Brand name cannot exceed 100 characters")
    .trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(120, "Slug cannot exceed 120 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and single hyphens"
    )
    .trim(),
  logoUrl: z.string().url("Invalid logo URL").optional().nullable().or(z.literal("")),
  logoPublicId: z.string().optional().nullable().or(z.literal("")),
  websiteUrl: z.string().url("Invalid website URL").optional().nullable().or(z.literal("")),
  countryOfOrigin: z.string().max(100).optional().nullable().or(z.literal("")),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(70, "Meta title cannot exceed 70 characters").optional().nullable().or(z.literal("")),
  metaDescription: z.string().max(160, "Meta description cannot exceed 160 characters").optional().nullable().or(z.literal("")),
});

export const brandUpdateSchema = brandSchema.partial();

export type BrandInput = z.infer<typeof brandSchema>;
export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>;
