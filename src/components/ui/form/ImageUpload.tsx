"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { UploadCloud, Loader2, Trash2, RefreshCw, CheckCircle2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/feedback/Toast";

export interface ImageUploadProps {
  value?: string | null;
  publicId?: string | null;
  onChange?: (url: string | null, publicId?: string | null) => void;
  folder?: string;
  uploadEndpoint?: string;
  placeholderText?: string;
  recommendedText?: string;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  error?: boolean | string;
  size?: "sm" | "md" | "lg";
  shape?: "rounded" | "square" | "circle";
  className?: string;
  onCustomUpload?: (file: File) => Promise<{ url: string; publicId?: string }>;
}

export function ImageUpload({
  value,
  publicId,
  onChange,
  folder = "ecommerce/general",
  uploadEndpoint = "/api/admin/media/upload",
  placeholderText = "Upload Image",
  recommendedText = "PNG, JPG, SVG (Max 5MB)",
  accept = "image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/gif",
  maxSizeMB = 5,
  disabled = false,
  error,
  size = "md",
  shape = "rounded",
  className,
  onCustomUpload,
}: ImageUploadProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Trigger file selection dialog
  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Perform upload to server API
  const handleUploadFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.type.startsWith("image/") && !file.name.endsWith(".ico")) {
        const err = "Please select a valid image file (PNG, JPG, SVG, WebP, ICO).";
        setInternalError(err);
        toast.warning("Invalid File", err);
        return;
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        const err = `File size exceeds the ${maxSizeMB}MB maximum limit.`;
        setInternalError(err);
        toast.warning("File Too Large", err);
        return;
      }

      setInternalError(null);
      setIsUploading(true);

      try {
        if (onCustomUpload) {
          const res = await onCustomUpload(file);
          onChange?.(res.url, res.publicId || null);
          toast.success("Uploaded Successfully", "Image was processed and updated.");
        } else {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folder);

          const response = await fetch(uploadEndpoint, {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || "Failed to upload image to CDN.");
          }

          onChange?.(data.url, data.publicId || null);
          toast.success("Uploaded to CDN", "Image saved and CDN asset registered.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to upload image";
        setInternalError(msg);
        toast.error("Upload Failed", msg);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [folder, maxSizeMB, onChange, onCustomUpload, toast, uploadEndpoint]
  );

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  // Remove existing image
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isUploading) return;
    onChange?.(null, null);
    setInternalError(null);
  };

  const shapeClasses = {
    rounded: "rounded-md",
    square: "rounded-md",
    circle: "rounded-full",
  };

  const sizeHeights = {
    sm: "min-h-[72px] p-2.5",
    md: "min-h-[88px] p-3",
    lg: "min-h-[110px] p-4",
  };

  const hasImage = Boolean(value);

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled || isUploading}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {hasImage ? (
        /* Clean Minimalist Uploaded Asset Card */
        <div
          role="region"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled || isUploading) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            } else if (e.key === "Delete" || e.key === "Backspace") {
              e.preventDefault();
              handleRemove(e as any);
            }
          }}
          className={cn(
            "relative flex items-center justify-between gap-3 border transition-all bg-white dark:bg-slate-900 group rounded-md p-2.5",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500",
            shapeClasses[shape],
            sizeHeights[size],
            error || internalError
              ? "border-rose-400 bg-rose-50/20"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
          )}
        >
          {/* Logo Showcase Display */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={cn(
                "w-12 h-12 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-md overflow-hidden relative shrink-0 flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform"
              )}
            >
              <Image
                src={value!}
                alt="Uploaded media"
                width={48}
                height={48}
                unoptimized
                className="object-contain max-h-full max-w-full drop-shadow-2xs"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {placeholderText.replace(/^Upload\s*/i, "") || "Asset"}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Uploaded & active</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Replace Button */}
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled || isUploading}
              onClick={handleClick}
              className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Replace (or press Enter)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Remove Button */}
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled || isUploading}
              onClick={handleRemove}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Remove (or press Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone / Upload Trigger */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (disabled || isUploading) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center select-none group",
            "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500",
            shapeClasses[shape],
            sizeHeights[size],
            isDragging
              ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 scale-[0.99]"
              : error || internalError
              ? "border-rose-400 bg-rose-50/20 hover:bg-rose-50/30"
              : "border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/10",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Uploading to CDN...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1">
              <UploadCloud className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-200" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {placeholderText}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {recommendedText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error caption */}
      {(error || internalError) && (
        <div className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{typeof error === "string" ? error : internalError}</span>
        </div>
      )}
    </div>
  );
}
