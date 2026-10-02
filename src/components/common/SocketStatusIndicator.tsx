"use client";

import React, { useState, useEffect } from "react";
import { Radio, Wifi, Users, Zap } from "lucide-react";
import { useSocket } from "@/components/providers/SocketProvider";
import { cn } from "@/lib/utils";

export interface SocketStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function SocketStatusIndicator({
  showDetails = false,
  className,
}: SocketStatusIndicatorProps) {
  const { isConnected, transport, onlineUsers, latency, sendTestOrder, sendTestNotification } =
    useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("relative inline-block", className)}>
        <div
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 select-none opacity-80"
          title="WebSocket: Initializing"
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400" />
          </span>
          <span className="hidden sm:inline">Offline</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        suppressHydrationWarning
        title={`WebSocket: ${isConnected ? `Connected via ${transport}` : "Disconnected"}`}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer select-none",
          isConnected
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
        )}
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              isConnected ? "bg-emerald-500" : "bg-slate-400"
            )}
          />
        </span>

        <span className="hidden sm:inline">
          {isConnected ? (showDetails ? `Live (${transport})` : "Live") : "Offline"}
        </span>

        {isConnected && latency !== null && (
          <span className="hidden md:inline font-mono opacity-80">{latency}ms</span>
        )}
      </button>

      {/* Real-time Status & Testing Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className={cn("w-4 h-4", isConnected ? "text-emerald-500" : "text-slate-400")} />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Socket.io Gateway
              </span>
            </div>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                isConnected
                  ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <div className="py-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Transport:</span>
              <span className="font-mono font-semibold uppercase text-slate-900 dark:text-slate-100">
                {transport}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Heartbeat Ping:</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">
                {latency ? `${latency} ms` : "Measuring..."}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Online Peers:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                {onlineUsers}
              </span>
            </div>
          </div>

          {/* Test Action Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Live Test Triggers
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  sendTestOrder({ customerName: "Ananya Iyer", amount: 6499 });
                }}
                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Emit Order
              </button>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  sendTestNotification({
                    title: "Flash Sale Alert",
                    message: "Festival promo code applied to 12 carts in real time!",
                    type: "info",
                  });
                }}
                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Wifi className="w-3.5 h-3.5" />
                Emit Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
