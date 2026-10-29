# Phase 07: Dynamic Variant Generation & Cartesian Matrix Engine

---

## 1. Domain Overview & Mathematical Formulation

### The Need for a Cartesian Matrix
In e-commerce, a single product frequently exists in multiple variations (e.g., a T-shirt in 3 colors and 4 sizes). Instead of manually entering 12 individual items, administrators select the variant options, and the system computes the **Cartesian Product**:

$$\text{Variants} = A_1 \times A_2 \times \dots \times A_n$$

**Example**:
$$\{\text{Midnight Black}, \text{Ruby Red}\} \times \{\text{S}, \text{M}, \text{L}\} \implies 6 \text{ distinct variants}$$

Each generated variant is an independent stock-keeping unit (SKU) with its own:
- Unique SKU string (e.g., `TSH-BLK-S`).
- Unique Barcode (EAN-13 / UPC).
- Price override (e.g., size XXL costs ₹100 more than S).
- Assigned Cloudinary image (e.g., selecting Midnight Black shows the black product photo).
- Opening stock balance.

---

## 2. Cartesian Generation Algorithm

```typescript
// src/lib/utils/cartesian.ts

export interface VariantAxisOption {
  attributeCode: string;
  attributeName: string;
  selectedValues: string[];
}

export interface GeneratedVariantCandidate {
  title: string;
  optionValues: Record<string, string>;
  skuSuffix: string;
}

/**
 * Computes the Cartesian Product of selected variant attribute axes
 */
export function generateCartesianVariants(
  axes: VariantAxisOption[]
): GeneratedVariantCandidate[] {
  const activeAxes = axes.filter((a) => a.selectedValues.length > 0);
  if (activeAxes.length === 0) return [];

  return activeAxes.reduce<GeneratedVariantCandidate[]>(
    (acc, axis) => {
      if (acc.length === 0) {
        return axis.selectedValues.map((val) => ({
          title: val,
          optionValues: { [axis.attributeCode]: val },
          skuSuffix: val.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        }));
      }

      const nextAcc: GeneratedVariantCandidate[] = [];
      for (const item of acc) {
        for (const val of axis.selectedValues) {
          nextAcc.push({
            title: `${item.title} / ${val}`,
            optionValues: {
              ...item.optionValues,
              [axis.attributeCode]: val,
            },
            skuSuffix: `${item.skuSuffix}-${val.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
          });
        }
      }
      return nextAcc;
    },
    []
  );
}
```

---

## 3. UI/UX: Interactive Variant Matrix Table

### Workflow in Step 5:
1. **Dynamic Attribute Loading**:
   - As soon as the administrator selects the Primary Category in Step 1, the wizard queries:
     `GET /api/admin/categories/[categoryId]/attributes`
   - All applicable attributes are displayed. Non-variant attributes are filled as general specifications (e.g., *Fabric: 100% Cotton*, *Sleeve: Short Sleeve*).
2. **Selecting Variant Axes**:
   - Attributes with `isVariantAxis: true` render multi-select chip pickers (e.g., *Colors: Navy, White, Olive*; *Sizes: 38, 40, 42*).
   - A live counter displays: **"9 variant combinations will be generated"**.
3. **Editable Matrix Table**:
   - Columns:
     - **Variant**: `Navy / 40` (Badge tag with color swatch indicator).
     - **Image**: Mini thumbnail picker linking to uploaded gallery images from Step 4.
     - **SKU**: Auto-generated (`SHIRT-NAVY-40`) with inline edit.
     - **Barcode**: Optional GTIN input.
     - **Price (₹)**: Pre-filled with Master Price; editable for surcharges.
     - **Opening Stock**: Initial stock for the default warehouse.
     - **Weight**: Shipping weight.
     - **Enabled**: Toggle to disable unavailable or invalid combinations (e.g., *Olive in Size 38 is out of production*).
4. **Bulk Actions**:
   - "Apply Price to All Variants"
   - "Apply Stock to All Variants"
   - "Regenerate All SKUs"
