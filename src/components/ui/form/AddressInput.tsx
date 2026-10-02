"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  MapPin,
  Globe,
  Building2,
  Navigation,
  Hash,
  ChevronDown,
  Search,
  Check,
  Copy,
  CheckCheck,
  X,
} from "lucide-react";
import {
  cn,
  getCountryOptions,
  getCountryDetails,
  getStateOptions,
  getStateDetails,
  getCityOptions,
  formatAddress,
  validatePostalCode,
  toCountryCode,
  toStateCode,
  AddressData,
  OptionItem,
} from "@/lib/utils";

export interface AddressValue {
  street: string;
  street2?: string;
  country: string; // ISO code e.g. "IN", "US"
  countryName: string;
  state: string; // State code e.g. "TN", "CA"
  stateName: string;
  city: string;
  pincode: string;
}

export interface AddressInputProps {
  value?: Partial<AddressValue>;
  onChange?: (val: AddressValue) => void;
  defaultCountry?: string; // Default ISO code, e.g. "IN"
  defaultState?: string; // Default State code, e.g. "TN"
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

// Reusable Searchable Combobox for large lists (Country, State, City)
interface SearchableSelectProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  placeholder: string;
  options: OptionItem[];
  onChange: (val: string, label: string) => void;
  disabled?: boolean;
  emptyText?: string;
}

function SearchableSelect({
  label,
  icon: Icon,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
  emptyText = "No results found",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value || opt.label === value),
    [options, value]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options.slice(0, 100);
    const q = query.toLowerCase().trim();
    return options
      .filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
          opt.value.toLowerCase().includes(q)
      )
      .slice(0, 100);
  }, [options, query]);

  // Display value: when open/focused show query, otherwise show selected option label
  const displayValue = isOpen ? query : selectedOption ? selectedOption.label : "";

  const handleSelect = (opt: OptionItem) => {
    onChange(opt.value, opt.label);
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
        setQuery("");
        setHighlightedIndex(0);
        e.preventDefault();
        return;
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (query.trim()) {
        onChange(query.trim(), query.trim());
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      setIsOpen(false);
      setQuery("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      onBlur={(e) => {
        if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
          setQuery("");
        }
      }}
      className="relative w-full text-left"
    >
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>

      {/* Main Field as Directly Typeable Combobox */}
      <div
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          "relative w-full h-10 px-3 rounded-md border flex items-center gap-2 text-xs font-medium transition-all cursor-pointer",
          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
        )}
      >
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        {selectedOption?.flag && !isOpen && (
          <span className="text-sm shrink-0">{selectedOption.flag}</span>
        )}

        {/* Real inline typing input field */}
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={(e) => {
            // Do NOT open on focus; only select text
            if (!disabled) {
              e.target.select();
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none cursor-pointer"
        />

        {/* Clear & Dropdown Chevron */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {(value || (isOpen && query)) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                if (isOpen) {
                  setIsOpen(false);
                } else {
                  inputRef.current?.focus();
                  setIsOpen(true);
                  setQuery(selectedOption ? selectedOption.label : "");
                }
              }
            }}
            className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200",
                isOpen && "rotate-180 text-indigo-500"
              )}
            />
          </button>
        </div>
      </div>

      {/* Options Popup (NO separate search bar!) */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <p>{emptyText}</p>
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(query.trim(), query.trim());
                      setIsOpen(false);
                    }}
                    className="block mx-auto mt-2 text-indigo-500 hover:underline font-semibold text-[11px] cursor-pointer"
                  >
                    Use &quot;{query.trim()}&quot;
                  </button>
                )}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value || opt.label === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={`${opt.value}-${opt.label}`}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "w-full px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors text-left cursor-pointer",
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                        : isHighlighted
                        ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.flag && <span className="text-sm shrink-0">{opt.flag}</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-400">({opt.sublabel})</span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AddressInput({
  value,
  onChange,
  defaultCountry = "IN",
  defaultState = "TN",
  disabled = false,
  showPreview = true,
  className,
}: AddressInputProps) {
  // All countries from address utils
  const countryOptions = useMemo(() => getCountryOptions(), []);

  // Internal state
  const [street, setStreet] = useState(value?.street || "");
  const [street2, setStreet2] = useState(value?.street2 || "");
  const [selectedCountry, setSelectedCountry] = useState<string>(
    value?.country || defaultCountry
  );
  const [selectedState, setSelectedState] = useState<string>(
    value?.state || defaultState
  );
  const [selectedCity, setSelectedCity] = useState<string>(value?.city || "");
  const [pincode, setPincode] = useState(value?.pincode || "");
  const [copied, setCopied] = useState(false);

  // Sync internal state if external value changes
  useEffect(() => {
    if (value?.country) {
      const code = toCountryCode(value.country);
      if (code && code !== selectedCountry) {
        setSelectedCountry(code);
      }
    }
  }, [value?.country]);

  useEffect(() => {
    if (value?.state) {
      const code = toStateCode(value.state, selectedCountry);
      if (code && code !== selectedState) {
        setSelectedState(code);
      }
    }
  }, [value?.state, selectedCountry]);

  useEffect(() => {
    if (value?.city !== undefined && value.city !== selectedCity) {
      setSelectedCity(value.city);
    }
  }, [value?.city]);

  useEffect(() => {
    if (value?.street !== undefined && value.street !== street) {
      setStreet(value.street);
    }
  }, [value?.street]);

  useEffect(() => {
    if (value?.street2 !== undefined && value.street2 !== street2) {
      setStreet2(value.street2);
    }
  }, [value?.street2]);

  useEffect(() => {
    if (value?.pincode !== undefined && value.pincode !== pincode) {
      setPincode(value.pincode);
    }
  }, [value?.pincode]);

  // Cascading States & Cities from address utils
  const stateOptions = useMemo(() => {
    return getStateOptions(selectedCountry);
  }, [selectedCountry]);

  const cityOptions = useMemo(() => {
    return getCityOptions(selectedCountry, selectedState);
  }, [selectedCountry, selectedState]);

  // Formatted address using address utility
  const formattedAddress = useMemo(() => {
    return formatAddress({
      street,
      street2,
      country: selectedCountry,
      state: selectedState,
      city: selectedCity,
      pincode,
    });
  }, [street, street2, selectedCountry, selectedState, selectedCity, pincode]);

  // Notify parent on change
  const notifyChange = (updates: Partial<AddressValue>) => {
    const updatedCountry = updates.country !== undefined ? updates.country : selectedCountry;
    const updatedState = updates.state !== undefined ? updates.state : selectedState;
    const updatedCity = updates.city !== undefined ? updates.city : selectedCity;
    const updatedPincode = updates.pincode !== undefined ? updates.pincode : pincode;
    const updatedStreet = updates.street !== undefined ? updates.street : street;
    const updatedStreet2 = updates.street2 !== undefined ? updates.street2 : street2;

    const countryObj = getCountryDetails(updatedCountry);
    const stateObj = getStateDetails(updatedState, updatedCountry);

    onChange?.({
      street: updatedStreet,
      street2: updatedStreet2,
      country: updatedCountry,
      countryName: countryObj?.name || updatedCountry,
      state: updatedState,
      stateName: stateObj?.name || updatedState,
      city: updatedCity,
      pincode: updatedPincode,
    });
  };

  const handleCountrySelect = (isoCode: string, name: string) => {
    setSelectedCountry(isoCode);
    setSelectedState("");
    setSelectedCity("");
    notifyChange({
      country: isoCode,
      countryName: name,
      state: "",
      stateName: "",
      city: "",
    });
  };

  const handleStateSelect = (stateCode: string, stateName: string) => {
    setSelectedState(stateCode);
    setSelectedCity("");
    notifyChange({
      state: stateCode,
      stateName: stateName,
      city: "",
    });
  };

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    notifyChange({ city: cityName });
  };

  const handleCopy = () => {
    if (!formattedAddress) return;
    navigator.clipboard.writeText(formattedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-3.5 text-left w-full", className)}>
      {/* Street Address Line 1 */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Street Address
        </label>
        <div className="relative flex items-center">
          <MapPin className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={street}
            disabled={disabled}
            onChange={(e) => {
              setStreet(e.target.value);
              notifyChange({ street: e.target.value });
            }}
            placeholder="Flat / House no., Building, Apartment, Street"
            className="w-full h-10 pl-9 pr-3 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Street Address Line 2 (Optional) */}
      <div>
        <input
          type="text"
          value={street2}
          disabled={disabled}
          onChange={(e) => {
            setStreet2(e.target.value);
            notifyChange({ street2: e.target.value });
          }}
          placeholder="Landmark, Area, Colony, Floor (Optional)"
          className="w-full h-10 px-3.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      {/* Country & State Cascading Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Country Selector from Package */}
        <SearchableSelect
          label="Country / Region"
          icon={Globe}
          value={selectedCountry}
          placeholder="Select country"
          options={countryOptions}
          onChange={handleCountrySelect}
          disabled={disabled}
        />

        {/* State Selector Cascading from Country */}
        {stateOptions.length > 0 ? (
          <SearchableSelect
            label="State / Province"
            icon={Building2}
            value={selectedState}
            placeholder="Select state"
            options={stateOptions}
            onChange={handleStateSelect}
            disabled={disabled || stateOptions.length === 0}
            emptyText="No states found"
          />
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              State / Province
            </label>
            <div className="relative flex items-center">
              <Building2 className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={selectedState}
                disabled={disabled}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  notifyChange({ state: e.target.value, stateName: e.target.value });
                }}
                placeholder="Enter state / region"
                className="w-full h-10 pl-9 pr-3 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* City & Pincode / Zip Code Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* City Selector Cascading from State */}
        {cityOptions.length > 0 ? (
          <SearchableSelect
            label="City"
            icon={Navigation}
            value={selectedCity}
            placeholder="Select city"
            options={cityOptions}
            onChange={(val) => handleCitySelect(val)}
            disabled={disabled || cityOptions.length === 0}
            emptyText="No cities found"
          />
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              City
            </label>
            <div className="relative flex items-center">
              <Navigation className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={selectedCity}
                disabled={disabled}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  notifyChange({ city: e.target.value });
                }}
                placeholder="Enter city name"
                className="w-full h-10 pl-9 pr-3 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        )}

        {/* Pincode / Postal Code */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            PIN / Postal Code
          </label>
          <div className="relative flex items-center">
            <Hash className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={pincode}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                setPincode(val);
                notifyChange({ pincode: val });
              }}
              placeholder={selectedCountry === "IN" ? "e.g. 600001 (6 digits)" : "e.g. 90210"}
              className="w-full h-10 pl-9 pr-3 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Formatted Address Live Preview Card */}
      {showPreview && formattedAddress && (
        <div className="mt-2 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Formatted Address Preview
              </span>
              <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {formattedAddress}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
            title="Copy address"
          >
            {copied ? (
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
