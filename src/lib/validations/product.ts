import { z } from "zod";

export const productTypeEnum = z.enum(["PHYSICAL", "DIGITAL", "SERVICE"]);
export const productStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const productMediaItemSchema = z.object({
  url: z.string().url("Valid image URL required"),
  publicId: z.string().min(1, "Public ID required"),
  altText: z.string().max(255).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isThumbnail: z.boolean().default(false),
  variantId: z.string().optional().nullable(),
});

export const productVariantItemSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(2, "SKU required").max(100),
  barcode: z.string().max(100).optional().nullable().or(z.literal("")),
  title: z.string().min(1, "Variant title required"),
  optionValues: z.record(z.string(), z.string()).default({}),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  weight: z.coerce.number().min(0).optional().nullable(),
  weightUnit: z.string().default("kg"),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  initialStock: z.coerce.number().int().min(0).optional().default(0),
});

export const productAttributeValueItemSchema = z.object({
  attributeId: z.string().uuid("Invalid attribute ID"),
  textValue: z.string().optional().nullable(),
  numValue: z.coerce.number().optional().nullable(),
  boolValue: z.boolean().optional().nullable(),
  jsonValue: z.any().optional().nullable(),
  unit: z.string().optional().nullable(),
});

export const productSchema = z.object({
  title: z
    .string()
    .min(2, "Product title must be at least 2 characters")
    .max(255, "Product title cannot exceed 255 characters")
    .trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(255, "Slug cannot exceed 255 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .trim(),
  shortDescription: z.string().max(500).optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable().or(z.literal("")),
  productType: productTypeEnum.default("PHYSICAL"),
  status: productStatusEnum.default("DRAFT"),
  basePrice: z.coerce.number().min(0, "Base price must be greater than or equal to 0"),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  isTaxInclusive: z.boolean().default(true),
  taxClassId: z.string().optional().nullable().or(z.literal("")),
  brandId: z.string().optional().nullable().or(z.literal("")),
  manufacturerId: z.string().optional().nullable().or(z.literal("")),
  metaTitle: z.string().max(70).optional().nullable().or(z.literal("")),
  metaDescription: z.string().max(160).optional().nullable().or(z.literal("")),
  canonicalUrl: z.string().url().optional().nullable().or(z.literal("")),
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
  primaryCategoryId: z.string().optional().nullable(),
  media: z.array(productMediaItemSchema).default([]),
  variants: z.array(productVariantItemSchema).default([]),
  attributeValues: z.array(productAttributeValueItemSchema).default([]),
});

export const productUpdateSchema = productSchema.partial();

export const taxClassSchema = z.object({
  name: z.string().min(2, "Name required").max(100),
  code: z.string().min(2, "Code required").max(50),
  rate: z.coerce.number().min(0, "Rate must be >= 0").max(100, "Rate cannot exceed 100%"),
  hsnCode: z.string().max(30).optional().nullable().or(z.literal("")),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type TaxClassInput = z.infer<typeof taxClassSchema>;
