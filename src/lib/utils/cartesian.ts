/**
 * Universal Cartesian Product Generator for E-Commerce Variant Matrix
 * Computes all possible mathematical combinations of multiple option axes.
 *
 * Example:
 * Input:
 *   [
 *     { name: "Color", values: ["Red", "Blue"] },
 *     { name: "Size", values: ["S", "M", "L"] }
 *   ]
 * Output:
 *   [
 *     { Color: "Red", Size: "S" },
 *     { Color: "Red", Size: "M" },
 *     { Color: "Red", Size: "L" },
 *     { Color: "Blue", Size: "S" },
 *     { Color: "Blue", Size: "M" },
 *     { Color: "Blue", Size: "L" }
 *   ]
 */

export interface VariantAxisInput {
  name: string;
  values: string[];
}

export interface GeneratedVariantCombination {
  title: string;
  sku: string;
  barcode: string;
  optionValues: Record<string, string>;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  weight?: number | null;
  weightUnit: string;
  isDefault: boolean;
  isActive: boolean;
  initialStock?: number;
}

export function cartesianProduct(
  axes: VariantAxisInput[]
): Array<Record<string, string>> {
  // Filter out any axis that has no values
  const activeAxes = axes.filter(
    (axis) => axis.values && axis.values.length > 0
  );

  if (activeAxes.length === 0) {
    return [];
  }

  return activeAxes.reduce<Array<Record<string, string>>>(
    (acc, currentAxis) => {
      const result: Array<Record<string, string>> = [];

      acc.forEach((existingComb) => {
        currentAxis.values.forEach((value) => {
          result.push({
            ...existingComb,
            [currentAxis.name]: value,
          });
        });
      });

      return result;
    },
    [{}]
  );
}

/**
 * Generates an automated EAN-13 compatible pseudo-barcode
 */
export function generateBarcode(prefix: string, seed: number): string {
  const numericSeed = Math.abs(seed).toString().padStart(9, "0").slice(-9);
  const base = `890${numericSeed}`; // 890 is GS1 India prefix
  
  // Calculate EAN-13 Check Digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${base}${checkDigit}`;
}

/**
 * Formats a combination into standard variant matrix rows with auto-generated SKUs
 */
export function generateVariantMatrix(
  baseCode: string,
  basePrice: number,
  axes: VariantAxisInput[]
): GeneratedVariantCombination[] {
  const combinations = cartesianProduct(axes);

  return combinations.map((comb, index) => {
    // Generate readable Title e.g. "Red / M"
    const titleParts = Object.values(comb);
    const title = titleParts.join(" / ");

    // Generate Clean SKU e.g. "PRD001-RED-M"
    const skuSuffix = titleParts
      .map((val) =>
        val
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 4)
      )
      .join("-");

    const sku = `${baseCode}-${skuSuffix || String(index + 1).padStart(2, "0")}`;
    const barcode = generateBarcode(baseCode, index + 1000);

    return {
      title,
      sku,
      barcode,
      optionValues: comb,
      price: basePrice,
      compareAtPrice: null,
      costPrice: null,
      weight: 0.5,
      weightUnit: "kg",
      isDefault: index === 0,
      isActive: true,
    };
  });
}
