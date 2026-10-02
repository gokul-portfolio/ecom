"use client";

import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ArrowLeft,
  RotateCw,
  Download,
  Copy,
} from "lucide-react";
import { Button, ButtonProps } from "./Button";

// AddButton
export function AddButton({
  children = "Add New",
  leftIcon = <Plus className="w-4 h-4" />,
  ...props
}: ButtonProps) {
  return (
    <Button variant="primary" leftIcon={leftIcon} {...props}>
      {children}
    </Button>
  );
}

// EditButton
export function EditButton({
  children = "Edit",
  leftIcon = <Pencil className="w-3.5 h-3.5" />,
  variant = "outline",
  size = "sm",
  ...props
}: ButtonProps) {
  return (
    <Button variant={variant} size={size} leftIcon={leftIcon} {...props}>
      {children}
    </Button>
  );
}

// DeleteButton with optional confirmation prompt
export function DeleteButton({
  children = "Delete",
  leftIcon = <Trash2 className="w-3.5 h-3.5" />,
  variant = "destructive",
  size = "sm",
  onClick,
  ...props
}: ButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      leftIcon={leftIcon}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
}

// CancelButton
export function CancelButton({
  children = "Cancel",
  leftIcon = <X className="w-4 h-4" />,
  variant = "outline",
  ...props
}: ButtonProps) {
  return (
    <Button variant={variant} leftIcon={leftIcon} {...props}>
      {children}
    </Button>
  );
}

// SubmitButton
export function SubmitButton({
  children = "Submit",
  type = "submit",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <Button type={type} variant={variant} {...props}>
      {children}
    </Button>
  );
}

// SaveButton
export function SaveButton({
  children = "Save Changes",
  leftIcon = <Check className="w-4 h-4" />,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <Button variant={variant} leftIcon={leftIcon} {...props}>
      {children}
    </Button>
  );
}

// BackButton
export function BackButton({
  children = "Back",
  leftIcon = <ArrowLeft className="w-4 h-4" />,
  variant = "ghost",
  size = "sm",
  ...props
}: ButtonProps) {
  return (
    <Button variant={variant} size={size} leftIcon={leftIcon} {...props}>
      {children}
    </Button>
  );
}

// RefreshButton
export function RefreshButton({
  children = "Refresh",
  leftIcon = <RotateCw className="w-3.5 h-3.5" />,
  variant = "outline",
  size = "sm",
  ...props
}: ButtonProps) {
  return (
    <Button variant={variant} size={size} leftIcon={leftIcon} {...props}>
      {children}
    </Button>
  );
}

// ExportButton
export function ExportButton({
  children = "Export CSV",
  leftIcon = <Download className="w-3.5 h-3.5" />,
  variant = "outline",
  size = "sm",
  ...props
}: ButtonProps) {
  return (
    <Button variant={variant} size={size} leftIcon={leftIcon} {...props}>
      {children}
    </Button>
  );
}

// CopyButton with feedback timeout
export function CopyButton({
  textToCopy = "",
  children = "Copy",
  size = "sm",
  variant = "outline",
  ...props
}: ButtonProps & { textToCopy?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    if (props.onClick) props.onClick(e);
  };

  return (
    <Button
      variant={variant}
      size={size}
      leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      onClick={handleCopy}
      {...props}
    >
      {copied ? "Copied!" : children}
    </Button>
  );
}

// ButtonGroup
export function ButtonGroup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex rounded-lg shadow-2xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 ${className}`}
      role="group"
    >
      {children}
    </div>
  );
}
