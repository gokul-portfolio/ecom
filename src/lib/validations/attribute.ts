import { z } from "zod";

export const attributeDataTypeEnum = z.enum([
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "MEASUREMENT",
  "DATE",
]);

export const attributeSchema = z.object({
  name: z
    .string()
    .min(2, "Attribute name must be at least 2 characters")
    .max(100, "Attribute name cannot exceed 100 characters")
    .trim(),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(80, "Code cannot exceed 80 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Code must be lowercase alphanumeric with underscores only (e.g. apparel_size, spf_rating)"
    )
    .trim(),
  dataType: attributeDataTypeEnum.default("TEXT"),
  allowedOptions: z
    .array(z.string().min(1, "Option cannot be empty").trim())
    .optional()
    .nullable()
    .default([]),
  unitGroup: z.string().max(50).optional().nullable().or(z.literal("")),
  defaultUnit: z.string().max(20).optional().nullable().or(z.literal("")),
  isFilterable: z.boolean().default(true),
  isSearchable: z.boolean().default(false),
  isVariantAxis: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const attributeUpdateSchema = attributeSchema.partial();

export const categoryAttributeMappingSchema = z.object({
  attributeId: z.string().uuid("Invalid attribute ID"),
  isRequired: z.boolean().default(false),
  displayGroup: z.string().max(100).default("General Specifications"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type AttributeInput = z.infer<typeof attributeSchema>;
export type AttributeUpdateInput = z.infer<typeof attributeUpdateSchema>;
