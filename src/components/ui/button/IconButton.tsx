"use client";

import React, { forwardRef, useState } from "react";
import {
  Eye,
  Trash2,
  Pencil,
  Copy,
  Check,
  RotateCw,
  Download,
  Plus,
  X,
  MoreHorizontal,
  MoreVertical,
  Settings,
  Share2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type IconButtonSize = "2xs" | "xs" | "sm" | "md" | "lg" | "xl";

export type IconButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "subtle"
  | "destructive"
  | "danger"
  | "success"
  | "warning"
  | "info";

export type IconButtonShape = "rounded" | "circle" | "square";

export type IconButtonPreset =
  | "view"
  | "delete"
  | "edit"
  | "copy"
  | "refresh"
  | "download"
  | "add"
  | "close"
  | "more"
  | "settings"
  | "share"
  | "link";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  icon?: React.ReactNode;
  preset?: IconButtonPreset;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  shape?: IconButtonShape;
  loading?: boolean;
  tooltip?: string;
  active?: boolean;
  copyText?: string; // If preset="copy", automatically copies this text on click
}

const PRESET_CONFIG: Record<
  IconButtonPreset,
  {
    icon: React.ComponentType<{ className?: string }>;
    defaultVariant: IconButtonVariant;
    defaultTooltip: string;
  }
> = {
  view: { icon: Eye, defaultVariant: "subtle", defaultTooltip: "View Details" },
  delete: { icon: Trash2, defaultVariant: "destructive", defaultTooltip: "Delete Record" },
  edit: { icon: Pencil, defaultVariant: "outline", defaultTooltip: "Edit Record" },
  copy: { icon: Copy, defaultVariant: "ghost", defaultTooltip: "Copy to Clipboard" },
  refresh: { icon: RotateCw, defaultVariant: "ghost", defaultTooltip: "Refresh Data" },
  download: { icon: Download, defaultVariant: "outline", defaultTooltip: "Download File" },
  add: { icon: Plus, defaultVariant: "primary", defaultTooltip: "Add Item" },
  close: { icon: X, defaultVariant: "ghost", defaultTooltip: "Close" },
  more: { icon: MoreHorizontal, defaultVariant: "ghost", defaultTooltip: "More Actions" },
  settings: { icon: Settings, defaultVariant: "ghost", defaultTooltip: "Settings" },
  share: { icon: Share2, defaultVariant: "outline", defaultTooltip: "Share" },
  link: { icon: ExternalLink, defaultVariant: "ghost", defaultTooltip: "Open Link" },
};

const SIZE_CLASSES: Record<IconButtonSize, { button: string; icon: string }> = {
  "2xs": { button: "w-6 h-6", icon: "w-3 h-3" },
  xs: { button: "w-7 h-7", icon: "w-3.5 h-3.5" },
  sm: { button: "w-8 h-8", icon: "w-4 h-4" },
  md: { button: "w-10 h-10", icon: "w-5 h-5" },
  lg: { button: "w-12 h-12", icon: "w-6 h-6" },
  xl: { button: "w-14 h-14", icon: "w-7 h-7" },
};

const SHAPE_CLASSES: Record<IconButtonShape, Record<IconButtonSize, string>> = {
  circle: {
    "2xs": "rounded-full",
    xs: "rounded-full",
    sm: "rounded-full",
    md: "rounded-full",
    lg: "rounded-full",
    xl: "rounded-full",
  },
  square: {
    "2xs": "rounded",
    xs: "rounded-md",
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
  },
  rounded: {
    "2xs": "rounded-md",
    xs: "rounded-lg",
    sm: "rounded-xl",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
  },
};

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  primary:
    "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs focus-visible:ring-indigo-500",
  secondary:
    "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 focus-visible:ring-slate-400",
  outline:
    "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:ring-indigo-500",
  ghost:
    "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:ring-slate-400",
  subtle:
    "bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 focus-visible:ring-indigo-500",
  destructive:
    "bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50 hover:border-rose-300 focus-visible:ring-rose-500",
  danger:
    "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus-visible:ring-rose-500",
  success:
    "bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 focus-visible:ring-emerald-500",
  warning:
    "bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50 focus-visible:ring-amber-500",
  info:
    "bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/50 focus-visible:ring-sky-500",
};

/**
 * Common, highly customizable IconButton component
 * Supports sizes (2xs to xl), colors/variants, shapes (circle, square, rounded), presets, and loading states
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      preset,
      size = "md",
      variant,
      shape = "rounded",
      loading = false,
      disabled = false,
      tooltip,
      active = false,
      copyText,
      className,
      onClick,
      title,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = useState(false);

    // Preset lookup
    const presetConfig = preset ? PRESET_CONFIG[preset] : null;
    const finalVariant = variant || (presetConfig ? presetConfig.defaultVariant : "ghost");
    const finalTooltip = tooltip || title || (presetConfig ? presetConfig.defaultTooltip : undefined);

    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
    const shapeClass = SHAPE_CLASSES[shape][size] || SHAPE_CLASSES.rounded.md;
    const variantClass = VARIANT_CLASSES[finalVariant] || VARIANT_CLASSES.ghost;

    // Handle copy preset click
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      if (preset === "copy" && copyText) {
        navigator.clipboard.writeText(copyText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }

      onClick?.(e);
    };

    // Render appropriate icon
    const renderIcon = () => {
      if (loading) {
        return <Loader2 className={cn("animate-spin shrink-0", sizeClass.icon)} />;
      }

      if (preset === "copy" && copied) {
        return <Check className={cn("text-emerald-500 shrink-0", sizeClass.icon)} />;
      }

      if (icon) {
        if (React.isValidElement(icon)) {
          return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: cn(
              sizeClass.icon,
              "shrink-0",
              (icon.props as { className?: string })?.className
            ),
          });
        }
        return icon;
      }

      if (presetConfig) {
        const PresetIconComponent = presetConfig.icon;
        return <PresetIconComponent className={cn("shrink-0", sizeClass.icon)} />;
      }

      return null;
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        title={finalTooltip}
        aria-label={finalTooltip}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 shrink-0 cursor-pointer",
          sizeClass.button,
          shapeClass,
          variantClass,
          active && "ring-2 ring-indigo-500 shadow-xs",
          (disabled || loading) && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
        {...props}
      >
        {renderIcon()}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

/* =========================================================================
 * Convenience Wrappers for common icon actions (View, Delete, Edit, Copy, etc.)
 * ========================================================================= */

// View Icon Button
export const ViewIconButton = forwardRef<
  HTMLButtonElement,
  Omit<IconButtonProps, "preset">
>((props, ref) => <IconButton ref={ref} preset="view" {...props} />);
ViewIconButton.displayName = "ViewIconButton";

// Delete Icon Button
export const DeleteIconButton = forwardRef<
  HTMLButtonElement,
  Omit<IconButtonProps, "preset">
>((props, ref) => <IconButton ref={ref} preset="delete" {...props} />);
DeleteIconButton.displayName = "DeleteIconButton";

// Edit Icon Button
export const EditIconButton = forwardRef<
  HTMLButtonElement,
  Omit<IconButtonProps, "preset">
>((props, ref) => <IconButton ref={ref} preset="edit" {...props} />);
EditIconButton.displayName = "EditIconButton";

// Copy Icon Button
export const CopyIconButton = forwardRef<
  HTMLButtonElement,
  Omit<IconButtonProps, "preset">
>((props, ref) => <IconButton ref={ref} preset="copy" {...props} />);
CopyIconButton.displayName = "CopyIconButton";

// Refresh Icon Button
export const RefreshIconButton = forwardRef<
  HTMLButtonElement,
  Omit<IconButtonProps, "preset">
>((props, ref) => <IconButton ref={ref} preset="refresh" {...props} />);
RefreshIconButton.displayName = "RefreshIconButton";

// Close Icon Button
export const CloseIconButton = forwardRef<
  HTMLButtonElement,
  Omit<IconButtonProps, "preset">
>((props, ref) => <IconButton ref={ref} preset="close" {...props} />);
CloseIconButton.displayName = "CloseIconButton";
