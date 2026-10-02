/**
 * International Phone Number Utilities powered by `libphonenumber-js` & `country-state-city`
 */
import {
  AsYouType,
  isValidPhoneNumber,
  parsePhoneNumber,
  CountryCode,
  PhoneNumber,
} from "libphonenumber-js";
import { Country, ICountry } from "country-state-city";

export interface CountryPhoneInfo {
  name: string;
  isoCode: string; // "IN", "US", etc.
  flag: string; // "🇮🇳", "🇺🇸", etc.
  dialCode: string; // "+91", "+1", etc.
}

export interface ParsedPhoneResult {
  countryCode: string; // "IN"
  dialCode: string; // "+91"
  nationalNumber: string; // "98765 43210"
  rawNumber: string; // "9876543210"
  e164: string; // "+919876543210"
  isValid: boolean;
  type?: string; // "MOBILE", "FIXED_LINE", etc.
}

export const POPULAR_PHONE_COUNTRY_CODES = [
  "IN",
  "US",
  "GB",
  "AE",
  "CA",
  "AU",
  "SG",
  "DE",
  "FR",
  "SA",
];

/**
 * Get all countries with phone dial codes & flags
 */
export function getAllCountriesPhoneInfo(): CountryPhoneInfo[] {
  return Country.getAllCountries().map((c) => ({
    name: c.name,
    isoCode: c.isoCode,
    flag: c.flag,
    dialCode: c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`,
  }));
}

/**
 * Get popular countries list
 */
export function getPopularCountriesPhoneInfo(): CountryPhoneInfo[] {
  const all = getAllCountriesPhoneInfo();
  return all.filter((c) => POPULAR_PHONE_COUNTRY_CODES.includes(c.isoCode));
}

/**
 * Find country phone info by ISO code (e.g. "IN")
 */
export function getCountryPhoneInfo(isoCode: string = "IN"): CountryPhoneInfo {
  const all = getAllCountriesPhoneInfo();
  return (
    all.find((c) => c.isoCode.toUpperCase() === isoCode.toUpperCase()) ||
    all.find((c) => c.isoCode === "IN") || {
      name: "India",
      isoCode: "IN",
      flag: "🇮🇳",
      dialCode: "+91",
    }
  );
}

/**
 * Format phone number as user types using AsYouType
 */
export function formatPhoneAsYouType(number: string, countryCode: string = "IN"): string {
  if (!number) return "";
  try {
    const code = (countryCode.toUpperCase() as CountryCode) || "IN";
    const formatter = new AsYouType(code);
    return formatter.input(number);
  } catch {
    return number;
  }
}

/**
 * Validate phone number using libphonenumber-js
 */
export function validatePhoneNumber(number: string, countryCode: string = "IN"): boolean {
  if (!number || !number.trim()) return false;
  try {
    const country = getCountryPhoneInfo(countryCode);
    const sanitized = number.replace(/[^\d+]/g, "");
    const fullNumber = sanitized.startsWith("+") ? sanitized : `${country.dialCode}${sanitized}`;
    return isValidPhoneNumber(fullNumber, countryCode.toUpperCase() as CountryCode);
  } catch {
    return false;
  }
}

/**
 * Parse full phone number into structured result
 */
export function parsePhoneData(number: string, countryCode: string = "IN"): ParsedPhoneResult {
  const country = getCountryPhoneInfo(countryCode);
  const cleanDigits = number.replace(/\D/g, "");
  const fullNumber = number.startsWith("+") ? number : `${country.dialCode}${cleanDigits}`;
  const code = (countryCode.toUpperCase() as CountryCode) || "IN";

  let isValid = false;
  let e164 = fullNumber;
  let nationalNumber = formatPhoneAsYouType(cleanDigits, countryCode);
  let type: string | undefined = undefined;

  try {
    isValid = isValidPhoneNumber(fullNumber, code);
    const parsed: PhoneNumber | undefined = parsePhoneNumber(fullNumber, code);
    if (parsed) {
      e164 = parsed.format("E.164");
      nationalNumber = parsed.formatNational();
      type = parsed.getType();
      isValid = parsed.isValid();
    }
  } catch {
    // fallback
  }

  return {
    countryCode: country.isoCode,
    dialCode: country.dialCode,
    nationalNumber,
    rawNumber: cleanDigits,
    e164,
    isValid,
    type,
  };
}

/**
 * Filter countries by search query
 */
export function searchCountriesPhone(query: string, countries: CountryPhoneInfo[]): CountryPhoneInfo[] {
  if (!query.trim()) return countries;
  const q = query.toLowerCase().trim();
  return countries.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.isoCode.toLowerCase().includes(q)
  );
}
