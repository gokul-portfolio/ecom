import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { productSchema } from "../../src/lib/validations/product";
import { categorySchema } from "../../src/lib/validations/category";
import { brandSchema } from "../../src/lib/validations/brand";

describe("Catalog Zod Validation Schemas", () => {
  describe("productSchema", () => {
    it("should accept valid product input", () => {
      const validProduct = {
        title: "Wireless Noise-Canceling Headphones",
        slug: "wireless-noise-canceling-headphones",
        code: "PRD001",
        basePrice: 14999,
        status: "PUBLISHED",
        categoryIds: ["123e4567-e89b-12d3-a456-426614174000"],
        primaryCategoryId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = productSchema.safeParse(validProduct);
      assert.equal(result.success, true);
    });

    it("should reject negative base price", () => {
      const invalidProduct = {
        title: "Wireless Headphones",
        slug: "wireless-headphones",
        basePrice: -500,
        status: "DRAFT",
        categoryIds: ["123e4567-e89b-12d3-a456-426614174000"],
      };

      const result = productSchema.safeParse(invalidProduct);
      assert.equal(result.success, false);
    });

    it("should reject uppercase or invalid characters in slugs", () => {
      const invalidSlugProduct = {
        title: "Wireless Headphones",
        slug: "Wireless_Headphones!@#",
        basePrice: 1999,
        status: "DRAFT",
        categoryIds: ["123e4567-e89b-12d3-a456-426614174000"],
      };

      const result = productSchema.safeParse(invalidSlugProduct);
      assert.equal(result.success, false);
    });
  });

  describe("categorySchema", () => {
    it("should accept valid category with auto slug formatting", () => {
      const validCat = {
        name: "Home & Kitchen",
        slug: "home-kitchen",
        sortOrder: 1,
        isActive: true,
      };

      const result = categorySchema.safeParse(validCat);
      assert.equal(result.success, true);
    });

    it("should reject empty category name", () => {
      const invalidCat = {
        name: "",
        slug: "valid-slug",
      };

      const result = categorySchema.safeParse(invalidCat);
      assert.equal(result.success, false);
    });
  });

  describe("brandSchema", () => {
    it("should accept valid brand with website URL", () => {
      const validBrand = {
        name: "Sony",
        slug: "sony",
        websiteUrl: "https://www.sony.com",
        isActive: true,
      };

      const result = brandSchema.safeParse(validBrand);
      assert.equal(result.success, true);
    });

    it("should reject invalid website URL format", () => {
      const invalidBrand = {
        name: "Sony",
        slug: "sony",
        websiteUrl: "not-a-valid-url",
      };

      const result = brandSchema.safeParse(invalidBrand);
      assert.equal(result.success, false);
    });
  });
});
