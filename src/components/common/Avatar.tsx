import React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg";
  isOnline?: boolean;
  className?: string;
}

export function Avatar({ name, src, size = "md", isOnline, className }: AvatarProps) {
  const sizeStyles = {
    xs: "w-7 h-7 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  };

  const getInitials = (str: string) => {
    return str
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("relative inline-block select-none", className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn("rounded-full object-cover ring-2 ring-slate-700/50 shadow-xs", sizeStyles[size])}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold bg-gradient-to-tr from-slate-900 to-slate-800 text-amber-400 ring-2 ring-slate-700/60 shadow-xs",
            sizeStyles[size]
          )}
        >
          {getInitials(name)}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-slate-900",
            isOnline ? "bg-emerald-500" : "bg-slate-300",
            size === "xs" ? "w-1.5 h-1.5" : size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5"
          )}
        />
      )}
    </div>
  );
}
