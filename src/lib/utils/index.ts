/**
 * Centralized Application Utilities Index
 */
export * from "./dateTime";
export * from "./phone";
export * from "./address";
export * from "./uom";
export * from "./formNavigation";

// Re-export core styling and number/currency formatters
export function cn(...inputs: (string | number | undefined | null | boolean)[]): string {
  return inputs.filter(Boolean).map(String).join(" ");
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  const isINR = currency === "INR" || currency === "₹";
  const currCode = isINR ? "INR" : currency === "$" ? "USD" : currency;
  try {
    return new Intl.NumberFormat(isINR ? "en-IN" : "en-US", {
      style: "currency",
      currency: currCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency}${amount.toFixed(2)}`;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}
