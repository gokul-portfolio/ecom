"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, File, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  value?: File[];
  onChange?: (files: File[]) => void;
  disabled?: boolean;
  error?: boolean | string;
  className?: string;
}

export function FileUpload({
  accept = "image/*,application/pdf",
  maxSizeMB = 5,
  multiple = false,
  value = [],
  onChange,
  disabled,
  error,
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return;
    const newFiles = Array.from(fileList).filter(
      (file) => file.size <= maxSizeMB * 1024 * 1024
    );
    if (multiple) {
      onChange?.([...value, ...newFiles]);
    } else {
      onChange?.(newFiles.slice(0, 1));
    }
  };

  const removeFile = (index: number) => {
    if (disabled) return;
    onChange?.(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2",
          "bg-slate-50/50 dark:bg-slate-900/50",
          isDragOver
            ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
          error && "border-rose-500 bg-rose-50/10",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            Click to upload
          </span>{" "}
          <span className="text-slate-500 dark:text-slate-400">or drag and drop</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Max file size: {maxSizeMB}MB
        </p>
      </div>

      {value.length > 0 && (
        <div className="space-y-1.5">
          {value.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <File className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
