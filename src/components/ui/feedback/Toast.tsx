"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Global listener set for events dispatched from anywhere
type ToastListener = (toast: Omit<ToastItem, "id">) => void;
const globalListeners = new Set<ToastListener>();

export const toast = {
  show: (options: Omit<ToastItem, "id">) => globalListeners.forEach((l) => l(options)),
  success: (title: string, message?: string) =>
    globalListeners.forEach((l) => l({ type: "success", title, message })),
  error: (title: string, message?: string) =>
    globalListeners.forEach((l) => l({ type: "error", title, message })),
  info: (title: string, message?: string) =>
    globalListeners.forEach((l) => l({ type: "info", title, message })),
  warning: (title: string, message?: string) =>
    globalListeners.forEach((l) => l({ type: "warning", title, message })),
};

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: toast.show,
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
    };
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  useEffect(() => {
    const listener: ToastListener = (t) => addToast(t);
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, [addToast]);

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: "success", title, message }),
    [addToast]
  );
  const error = useCallback(
    (title: string, message?: string) => addToast({ type: "error", title, message }),
    [addToast]
  );
  const info = useCallback(
    (title: string, message?: string) => addToast({ type: "info", title, message }),
    [addToast]
  );
  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: "warning", title, message }),
    [addToast]
  );

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
  };

  const borders = {
    success:
      "border-emerald-500/30 dark:border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/80",
    error:
      "border-rose-500/30 dark:border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/80",
    warning:
      "border-amber-500/30 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/80",
    info:
      "border-sky-500/30 dark:border-sky-500/30 bg-sky-50/90 dark:bg-sky-950/80",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all duration-300",
              "bg-white/95 dark:bg-[#0c1322]/95 text-slate-900 dark:text-slate-100",
              "animate-in slide-in-from-top-5 fade-in duration-200",
              borders[t.type]
            )}
          >
            <div className="mt-0.5">{icons[t.type]}</div>
            <div className="flex-1 space-y-0.5 text-left">
              <h5 className="text-xs font-bold leading-tight">{t.title}</h5>
              {t.message && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {t.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
