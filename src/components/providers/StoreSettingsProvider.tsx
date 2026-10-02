"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface StoreSettingsData {
  id?: string;
  companyName: string;
  legalName?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  logoPublicId?: string | null;
  faviconUrl?: string | null;
  supportEmail: string;
  supportPhone?: string | null;
  salesEmail?: string | null;
  taxNumber?: string | null;
  panNumber?: string | null;
  defaultCurrency: string;
  currencySymbol: string;
  timezone: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
  isOnboarded: boolean;
  onboardedAt?: string | null;
}

interface StoreSettingsContextType {
  settings: StoreSettingsData | null;
  isLoading: boolean;
  refetchSettings: () => Promise<void>;
  updateSettingsState: (data: Partial<StoreSettingsData>) => void;
}

const DEFAULT_SETTINGS: StoreSettingsData = {
  companyName: "Noble E-Commerce",
  tagline: "Curated Luxury Marketplace",
  supportEmail: "support@noble.com",
  defaultCurrency: "INR",
  currencySymbol: "₹",
  country: "India",
  timezone: "Asia/Kolkata",
  isOnboarded: false,
};

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: null,
  isLoading: true,
  refetchSettings: async () => {},
  updateSettingsState: () => {},
});

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/store/settings", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSettings(json.data);
          return;
        }
      }
    } catch (err) {
      console.error("[StoreSettingsProvider] Error fetching settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettingsState = (data: Partial<StoreSettingsData>) => {
    setSettings((prev) => (prev ? { ...prev, ...data } : { ...DEFAULT_SETTINGS, ...data }));
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        isLoading,
        refetchSettings: fetchSettings,
        updateSettingsState,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error("useStoreSettings must be used within a StoreSettingsProvider");
  }
  return context;
}
