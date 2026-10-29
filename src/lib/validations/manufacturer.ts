import { z } from "zod";

export const manufacturerSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(150, "Company name cannot exceed 150 characters")
    .trim(),
  registrationNo: z
    .string()
    .max(100, "Registration number cannot exceed 100 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z
    .string()
    .max(30, "Phone number cannot exceed 30 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  address: z
    .string()
    .max(500, "Address cannot exceed 500 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  countryOfOrigin: z
    .string()
    .max(100, "Country of origin cannot exceed 100 characters")
    .default("India"),
  isActive: z.boolean().default(true),
});

export const manufacturerUpdateSchema = manufacturerSchema.partial();

export type ManufacturerInput = z.infer<typeof manufacturerSchema>;
export type ManufacturerUpdateInput = z.infer<typeof manufacturerUpdateSchema>;
