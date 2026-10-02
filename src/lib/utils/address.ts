/**
 * Geographic and Address Utilities powered by `country-state-city`
 */
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";

export interface AddressData {
  street?: string;
  street2?: string;
  country?: string; // ISO code e.g. "IN"
  countryName?: string;
  state?: string; // State code e.g. "TN"
  stateName?: string;
  city?: string;
  pincode?: string;
}

export interface OptionItem {
  label: string;
  value: string;
  flag?: string;
  sublabel?: string;
}

/**
 * Get list of all countries formatted for select inputs
 */
export function getCountryOptions(): OptionItem[] {
  return Country.getAllCountries().map((c) => ({
    label: c.name,
    value: c.isoCode,
    flag: c.flag,
    sublabel: c.isoCode,
  }));
}

export function toCountryCode(codeOrName?: string): string {
  if (!codeOrName) return "";
  const trimmed = codeOrName.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const country = Country.getAllCountries().find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase() || c.isoCode.toLowerCase() === trimmed.toLowerCase()
  );
  return country ? country.isoCode : trimmed;
}

/**
 * Get country details by ISO code or name
 */
export function getCountryDetails(isoCodeOrName: string): ICountry | undefined {
  const code = toCountryCode(isoCodeOrName);
  if (!code) return undefined;
  return Country.getCountryByCode(code);
}

/**
 * Get states of a country formatted for select inputs
 */
export function getStateOptions(countryCodeOrName: string): OptionItem[] {
  const code = toCountryCode(countryCodeOrName);
  if (!code) return [];
  const states = State.getStatesOfCountry(code);
  return states.map((s) => ({
    label: s.name,
    value: s.isoCode,
    sublabel: s.isoCode,
  }));
}

export function toStateCode(stateCodeOrName: string, countryCode: string): string {
  if (!stateCodeOrName) return "";
  const trimmed = stateCodeOrName.trim();
  const cCode = toCountryCode(countryCode);
  if (!cCode) return trimmed;
  const states = State.getStatesOfCountry(cCode);
  const found = states.find(
    (s) =>
      s.isoCode.toLowerCase() === trimmed.toLowerCase() ||
      s.name.toLowerCase() === trimmed.toLowerCase()
  );
  return found ? found.isoCode : trimmed;
}

/**
 * Get state details
 */
export function getStateDetails(stateCodeOrName: string, countryCodeOrName: string): IState | undefined {
  const code = toCountryCode(countryCodeOrName);
  if (!stateCodeOrName || !code) return undefined;
  const sCode = toStateCode(stateCodeOrName, code);
  return State.getStateByCodeAndCountry(sCode, code);
}

/**
 * Get cities of a state formatted for select inputs
 */
export function getCityOptions(countryCodeOrName: string, stateCodeOrName: string): OptionItem[] {
  const code = toCountryCode(countryCodeOrName);
  if (!code || !stateCodeOrName) return [];
  const sCode = toStateCode(stateCodeOrName, code);
  const cities = City.getCitiesOfState(code, sCode);
  return cities.map((c) => ({
    label: c.name,
    value: c.name,
  }));
}

/**
 * Format full multi-part address into a single readable string
 */
export function formatAddress(address: AddressData): string {
  const countryObj = address.country ? getCountryDetails(address.country) : undefined;
  const stateObj =
    address.state && address.country
      ? getStateDetails(address.state, address.country)
      : undefined;

  const parts = [
    address.street,
    address.street2,
    address.city,
    stateObj?.name || address.stateName || address.state,
    address.pincode
      ? address.country === "IN"
        ? `PIN: ${address.pincode}`
        : address.pincode
      : "",
    countryObj?.name || address.countryName || address.country,
  ];

  return parts.filter(Boolean).join(", ");
}

/**
 * Validate postal code format based on country
 */
export function validatePostalCode(pincode: string, countryCode: string = "IN"): boolean {
  if (!pincode || !pincode.trim()) return false;
  const clean = pincode.trim();

  switch (countryCode.toUpperCase()) {
    case "IN":
      // India 6-digit PIN code
      return /^[1-9][0-9]{5}$/.test(clean);
    case "US":
      // US 5-digit ZIP or ZIP+4
      return /^\d{5}(-\d{4})?$/.test(clean);
    case "GB":
      // UK Postcode regex
      return /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(clean);
    case "CA":
      // Canada Postal code (A1A 1A1)
      return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(clean);
    default:
      // General length check
      return clean.length >= 3 && clean.length <= 10;
  }
}
