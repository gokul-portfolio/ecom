"use client";

import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ClearButtonProps extends Omit<ButtonProps, "onClick"> {
  /**
   * Function to execute when clear is confirmed
   */
  onClear: () => void | Promise<void>;
  /**
   * Ref to the first input field to refocus after clearing (optional)
   */
  firstInputRef?: React.RefObject<HTMLElement | null>;
  /**
   * Whether to require two-step confirmation to prevent accidental clearing
   * Default: true
   */
  requireConfirm?: boolean;
  /**
   * Initial button label
   * Default: "Clear Form"
   */
  label?: string;
  /**
   * Confirmation prompt label
   * Default: "Confirm Clear?"
   */
  confirmLabel?: string;
  /**
   * Optional keyboard shortcut key (e.g. "F4" or "Alt+C")
   */
  shortcutKey?: string;
}

/**
 * Common Reusable ClearButton Component
 * Features:
 * - 2-step accidental clear protection (Prompt -> Confirm with auto-reset timer)
 * - Auto-refocuses first field after reset
 * - Keyboard shortcut support
 * - Clean responsive styling matching design system
 */
export function ClearButton({
  onClear,
  firstInputRef,
  requireConfirm = false,
  label = "Clear Form",
  confirmLabel = "Confirm Clear?",
  shortcutKey = "F4",
  variant = "outline",
  size = "md",
  className,
  disabled = false,
  ...props
}: ClearButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-reset confirmation state after 3.5 seconds
  useEffect(() => {
    if (isConfirming) {
      timerRef.current = setTimeout(() => {
        setIsConfirming(false);
      }, 3500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isConfirming]);

  const executeClear = async () => {
    setIsClearing(true);
    try {
      await onClear();
      setIsConfirming(false);
      if (firstInputRef?.current) {
        firstInputRef.current.focus();
      }
    } finally {
      setIsClearing(false);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (disabled || isClearing) return;

    if (requireConfirm && !isConfirming) {
      setIsConfirming(true);
      return;
    }

    executeClear();
  };

  // Keyboard shortcut listener (e.g. F4)
  useEffect(() => {
    if (!shortcutKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === shortcutKey) {
        e.preventDefault();
        executeClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutKey, onClear]);

  return (
    <Button
      type="button"
      variant={isConfirming ? "destructive" : variant}
      size={size}
      disabled={disabled || isClearing}
      loading={isClearing}
      onClick={handleClick}
      leftIcon={
        isConfirming ? (
          <AlertTriangle className="w-4 h-4 animate-bounce" />
        ) : (
          <RotateCcw className="w-4 h-4" />
        )
      }
      className={cn(
        "transition-all font-semibold cursor-pointer",
        isConfirming
          ? "border-rose-500 bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
          : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
        className
      )}
      {...props}
    >
      {isConfirming ? confirmLabel : label}
    </Button>
  );
}
