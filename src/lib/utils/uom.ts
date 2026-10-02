/**
 * Unit of Measure (UOM) Utilities powered by `convert-units`
 */
import convert, { Unit } from "convert-units";

export type UOMCategory = "Mass / Weight" | "Volume / Liquid" | "Count / Packaging" | "Length & Area";

export interface UOMOptionItem {
  code: string;
  name: string;
  symbol: string;
  category: UOMCategory;
  convertUnit?: string;
}

export interface UnitConversionResult {
  label: string;
  value: string;
  numericValue: number;
}

export const UOM_DEFINITIONS: UOMOptionItem[] = [
  // Mass / Weight
  { code: "kg", name: "Kilogram", symbol: "kg", category: "Mass / Weight", convertUnit: "kg" },
  { code: "g", name: "Gram", symbol: "g", category: "Mass / Weight", convertUnit: "g" },
  { code: "mg", name: "Milligram", symbol: "mg", category: "Mass / Weight", convertUnit: "mg" },
  { code: "ton", name: "Metric Ton", symbol: "ton", category: "Mass / Weight", convertUnit: "mt" },
  { code: "lb", name: "Pound", symbol: "lb", category: "Mass / Weight", convertUnit: "lb" },
  { code: "oz", name: "Ounce", symbol: "oz", category: "Mass / Weight", convertUnit: "oz" },

  // Volume / Liquid
  { code: "l", name: "Liter", symbol: "L", category: "Volume / Liquid", convertUnit: "l" },
  { code: "ml", name: "Milliliter", symbol: "mL", category: "Volume / Liquid", convertUnit: "ml" },
  { code: "gal", name: "Gallon (US)", symbol: "gal", category: "Volume / Liquid", convertUnit: "gal" },
  { code: "floz", name: "Fluid Ounce", symbol: "fl oz", category: "Volume / Liquid", convertUnit: "fl-oz" },
  { code: "cup", name: "Cup", symbol: "cup", category: "Volume / Liquid", convertUnit: "cup" },

  // Count / Packaging
  { code: "pcs", name: "Pieces / Units", symbol: "pcs", category: "Count / Packaging" },
  { code: "box", name: "Box", symbol: "box", category: "Count / Packaging" },
  { code: "pack", name: "Pack", symbol: "pack", category: "Count / Packaging" },
  { code: "ctn", name: "Carton", symbol: "ctn", category: "Count / Packaging" },
  { code: "dozen", name: "Dozen (12 pcs)", symbol: "dz", category: "Count / Packaging" },
  { code: "set", name: "Set", symbol: "set", category: "Count / Packaging" },
  { code: "pair", name: "Pair", symbol: "pr", category: "Count / Packaging" },
  { code: "pallet", name: "Pallet", symbol: "plt", category: "Count / Packaging" },

  // Length & Area
  { code: "m", name: "Meter", symbol: "m", category: "Length & Area", convertUnit: "m" },
  { code: "cm", name: "Centimeter", symbol: "cm", category: "Length & Area", convertUnit: "cm" },
  { code: "mm", name: "Millimeter", symbol: "mm", category: "Length & Area", convertUnit: "mm" },
  { code: "in", name: "Inch", symbol: "in", category: "Length & Area", convertUnit: "in" },
  { code: "ft", name: "Foot", symbol: "ft", category: "Length & Area", convertUnit: "ft" },
  { code: "sqm", name: "Square Meter", symbol: "m²", category: "Length & Area", convertUnit: "m2" },
  { code: "sqft", name: "Square Foot", symbol: "sq ft", category: "Length & Area", convertUnit: "ft2" },
];

/**
 * Get UOM unit definition by code (e.g. "kg")
 */
export function getUOMDefinition(code: string): UOMOptionItem {
  return (
    UOM_DEFINITIONS.find((u) => u.code.toLowerCase() === code.toLowerCase()) || {
      code,
      name: code.toUpperCase(),
      symbol: code,
      category: "Mass / Weight",
    }
  );
}

/**
 * Convert quantity between two units using convert-units
 */
export function convertUOMValue(
  amount: number | string,
  fromUnitCode: string,
  toUnitCode: string
): number | null {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return null;

  const fromDef = getUOMDefinition(fromUnitCode);
  const toDef = getUOMDefinition(toUnitCode);

  if (!fromDef.convertUnit || !toDef.convertUnit) return null;

  try {
    return convert(num)
      .from(fromDef.convertUnit as Unit)
      .to(toDef.convertUnit as Unit);
  } catch {
    return null;
  }
}

/**
 * Compute live equivalent conversions for a given amount and unit
 */
export function computeLiveConversions(
  amount: number | string,
  unitCode: string
): UnitConversionResult[] {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num) || num <= 0) return [];

  const def = getUOMDefinition(unitCode);
  if (!def.convertUnit) return [];

  try {
    const fromKey = def.convertUnit as Unit;
    const possibilities = convert().from(fromKey).possibilities();

    const targetMap: Record<string, string[]> = {
      kg: ["g", "t", "lb"],
      g: ["kg", "mg", "oz"],
      ton: ["kg", "lb"],
      l: ["ml", "gal", "fl-oz"],
      ml: ["l"],
      m: ["cm", "ft", "in"],
      cm: ["mm", "m", "in"],
    };

    const targets = targetMap[def.code] || possibilities.slice(0, 3);
    const results: UnitConversionResult[] = [];

    for (const target of targets) {
      if (target !== fromKey && possibilities.includes(target as Unit)) {
        const converted = convert(num).from(fromKey).to(target as Unit);
        const formatted =
          converted >= 1000
            ? converted.toLocaleString("en-US", { maximumFractionDigits: 2 })
            : converted >= 0.01
            ? Number(converted.toFixed(3)).toString()
            : converted.toExponential(2);

        results.push({
          label: target === "t" ? "ton" : target,
          value: formatted,
          numericValue: converted,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Filter UOM units by category and search query
 */
export function filterUOMUnits(
  category: string = "All",
  query: string = ""
): UOMOptionItem[] {
  const q = query.toLowerCase().trim();
  return UOM_DEFINITIONS.filter((opt) => {
    const matchesCategory = category === "All" || opt.category === category;
    const matchesQuery =
      !q ||
      opt.name.toLowerCase().includes(q) ||
      opt.code.toLowerCase().includes(q) ||
      opt.symbol.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

/**
 * Get category of a unit code
 */
export function getUOMCategory(unitCode: string): UOMCategory | null {
  const def = getUOMDefinition(unitCode);
  return def ? def.category : null;
}

/**
 * Get all related units in the same category as the given unit code
 * E.g. passing "kg" returns all Mass/Weight units (g, mg, ton, lb, oz)
 */
export function getRelatedUnits(unitCode: string): UOMOptionItem[] {
  const category = getUOMCategory(unitCode);
  if (!category) return [];
  return UOM_DEFINITIONS.filter((u) => u.category === category);
}

/**
 * Get the exact conversion ratio between two units (e.g. 1 kg = 1000 g)
 */
export function getUnitConversionRatio(
  fromUnitCode: string,
  toUnitCode: string
): { ratio: number; formatted: string } | null {
  const fromDef = getUOMDefinition(fromUnitCode);
  const toDef = getUOMDefinition(toUnitCode);

  if (!fromDef.convertUnit || !toDef.convertUnit) return null;

  try {
    const ratio = convert(1)
      .from(fromDef.convertUnit as Unit)
      .to(toDef.convertUnit as Unit);

    const formatted =
      ratio >= 1000
        ? ratio.toLocaleString("en-US", { maximumFractionDigits: 4 })
        : ratio >= 0.001
        ? Number(ratio.toFixed(4)).toString()
        : ratio.toExponential(3);

    return { ratio, formatted };
  } catch {
    return null;
  }
}

/**
 * Get all available categories
 */
export function getUOMCategories(): UOMCategory[] {
  return [
    "Mass / Weight",
    "Volume / Liquid",
    "Count / Packaging",
    "Length & Area",
  ];
}

