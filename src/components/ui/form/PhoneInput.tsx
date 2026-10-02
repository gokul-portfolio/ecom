"use client";

import React, { useState, useRef, useEffect, forwardRef, useMemo } from "react";
import { ChevronDown, Search, Check, CheckCircle2, Phone } from "lucide-react";
import {
  cn,
  getAllCountriesPhoneInfo,
  getPopularCountriesPhoneInfo,
  getCountryPhoneInfo,
  formatPhoneAsYouType,
  validatePhoneNumber,
  parsePhoneData,
  searchCountriesPhone,
  CountryPhoneInfo,
} from "@/lib/utils";

export interface PhoneValue {
  countryCode: string; // ISO 2-letter e.g. "IN", "US"
  dialCode: string; // e.g. "+91", "+1"
  number: string; // formatted or raw entered number
  e164?: string; // full E.164 formatted: "+919876543210"
  isValid?: boolean; // whether number is valid for selected country
}

export interface PhoneInputProps {
  value?: PhoneValue | string;
  onChange?: (val: PhoneValue) => void;
  defaultCountry?: string; // ISO code like "IN", "US"
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  error?: boolean | string;
  showValidation?: boolean;
  maxDigits?: number; // Maximum allowed digits (defaults to 10)
  className?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      defaultCountry = "IN",
      placeholder,
      size = "md",
      disabled = false,
      error,
      showValidation = true,
      maxDigits = 10,
      className,
    },
    ref
  ) => {
    // Countries list from phone utils
    const countries = useMemo(() => getAllCountriesPhoneInfo(), []);
    const popularCountries = useMemo(() => getPopularCountriesPhoneInfo(), []);

    // Internal state
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>(() => {
      if (typeof value === "object" && value?.countryCode) return value.countryCode;
      return defaultCountry;
    });

    const [rawNumber, setRawNumber] = useState<string>(() => {
      if (typeof value === "object" && value?.number) return value.number;
      if (typeof value === "string") return value;
      return "";
    });

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Active country details via phone utils
    const activeCountry = useMemo(() => {
      return getCountryPhoneInfo(selectedCountryCode);
    }, [selectedCountryCode]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Parsed phone result via libphonenumber utility
    const phoneResult = useMemo(() => {
      return parsePhoneData(rawNumber, activeCountry.isoCode);
    }, [rawNumber, activeCountry.isoCode]);

    // Sync with external controlled value
    useEffect(() => {
      if (typeof value === "object" && value !== null) {
        if (value.countryCode && value.countryCode !== selectedCountryCode) {
          setSelectedCountryCode(value.countryCode);
        }
        if (value.number !== undefined && value.number !== rawNumber) {
          setRawNumber(value.number);
        }
      } else if (typeof value === "string" && value !== rawNumber) {
        setRawNumber(value);
      }
    }, [value]);

    // Handle number input strictly limited to maxDigits numbers (default 10)
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      // Allow only digits, space, hyphen, and parentheses
      const cleanChars = inputVal.replace(/[^\d\s()-]/g, "");
      const digitsOnly = cleanChars.replace(/\D/g, "");

      let finalValue = cleanChars;
      if (digitsOnly.length > maxDigits) {
        // Enforce maximum maxDigits (default 10 digits)
        let count = 0;
        finalValue = "";
        for (const char of cleanChars) {
          if (/\d/.test(char)) {
            if (count < maxDigits) {
              finalValue += char;
              count++;
            }
          } else {
            if (count < maxDigits) {
              finalValue += char;
            }
          }
        }
      }

      setRawNumber(finalValue);

      const parsed = parsePhoneData(finalValue, activeCountry.isoCode);
      onChange?.({
        countryCode: activeCountry.isoCode,
        dialCode: activeCountry.dialCode,
        number: finalValue,
        e164: parsed.e164,
        isValid: parsed.isValid,
      });
    };

    // Handle country selection
    const handleSelectCountry = (country: CountryPhoneInfo) => {
      setSelectedCountryCode(country.isoCode);
      setIsOpen(false);
      setSearchQuery("");

      const parsed = parsePhoneData(rawNumber, country.isoCode);
      onChange?.({
        countryCode: country.isoCode,
        dialCode: country.dialCode,
        number: rawNumber,
        e164: parsed.e164,
        isValid: parsed.isValid,
      });
    };

    // Filter countries based on search query via utility
    const filteredCountries = useMemo(() => {
      return searchCountriesPhone(searchQuery, countries);
    }, [countries, searchQuery]);

    const sizeClasses = {
      sm: "h-8 text-xs",
      md: "h-10 text-sm",
      lg: "h-12 text-base",
    };

    return (
      <div ref={dropdownRef} className={cn("relative w-full text-left", className)}>
        {/* Main Phone Input Container */}
        <div
          className={cn(
            "flex items-center w-full rounded-md border transition-all overflow-hidden bg-white dark:bg-slate-900 shadow-sm",
            error
              ? "border-rose-500 ring-2 ring-rose-500/20"
              : phoneResult.isValid && showValidation && rawNumber
              ? "border-emerald-500/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
              : "border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20",
            disabled && "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
          )}
        >
          {/* Country Selector Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              "flex items-center gap-1.5 px-3 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold transition-colors select-none shrink-0 group cursor-pointer",
              sizeClasses[size]
            )}
            title={`Selected: ${activeCountry.name} (${activeCountry.dialCode})`}
          >
            <span className="text-base leading-none select-none">{activeCountry.flag}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
              {activeCountry.dialCode}
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200",
                isOpen && "rotate-180 text-indigo-600 dark:text-indigo-400"
              )}
            />
          </button>

          {/* Number Input Field */}
          <div className="relative flex-1 flex items-center min-w-0">
            <input
              ref={ref}
              type="tel"
              value={phoneResult.nationalNumber || rawNumber}
              disabled={disabled}
              onChange={handleNumberChange}
              maxLength={maxDigits + 4}
              placeholder={placeholder || (activeCountry.isoCode === "IN" ? "98765 43210" : "555-0123")}
              className={cn(
                "w-full px-3 font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-transparent focus:outline-none font-mono tracking-wide",
                sizeClasses[size]
              )}
            />
          </div>

          {/* Validation Indicator: Show tick icon only when valid */}
          {showValidation && rawNumber && phoneResult.isValid && (
            <div className="pr-3 flex items-center shrink-0" title="Valid phone number">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Country Searchable Dropdown */}
        {isOpen && (
          <div className="absolute z-50 left-0 mt-2 w-80 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xl shadow-slate-900/10 dark:shadow-black/50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col">
            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search country or code (e.g. India, +91, US)..."
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Countries List */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
              {/* Popular countries header if not searching */}
              {!searchQuery && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Popular Countries
                  </div>
                  {popularCountries.map((c) => {
                    const isSelected = c.isoCode === activeCountry.isoCode;
                    return (
                      <button
                        key={`pop-${c.isoCode}`}
                        type="button"
                        onClick={() => handleSelectCountry(c)}
                        className={cn(
                          "w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors text-left",
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                            {c.dialCode}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                  <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    All Countries
                  </div>
                </div>
              )}

              {/* All filtered countries */}
              {filteredCountries.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching countries found
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.isoCode === activeCountry.isoCode;
                  return (
                    <button
                      key={c.isoCode}
                      type="button"
                      onClick={() => handleSelectCountry(c)}
                      className={cn(
                        "w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors text-left",
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{c.flag}</span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                          {c.dialCode}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Powered by libphonenumber-js</span>
              <span className="font-mono text-[10px] text-indigo-500 font-semibold">
                {countries.length} countries
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
