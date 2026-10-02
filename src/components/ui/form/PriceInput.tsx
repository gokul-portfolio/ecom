"use client";

import React, { forwardRef } from "react";
import { TextInput, TextInputProps } from "./TextInput";

export interface PriceInputProps extends Omit<TextInputProps, "type" | "leftIcon"> {
  currency?: string;
  decimals?: number;
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ currency = "$", placeholder = "0.00", ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        type="number"
        step="0.01"
        placeholder={placeholder}
        leftIcon={<span className="font-semibold text-xs">{currency}</span>}
        {...props}
      />
    );
  }
);

PriceInput.displayName = "PriceInput";
