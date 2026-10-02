"use client";

import React, { useState } from "react";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { useToast } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Wifi,
  WifiOff,
  Radio,
  Send,
  BellRing,
  ShoppingCart,
  Users,
  CheckCircle2,
  Clock,
  Server,
  Zap,
} from "lucide-react";

interface RealtimeLog {
  id: string;
  timestamp: string;
  type: "order" | "notification" | "ping" | "system";
  message: string;
  details?: Record<string, unknown>;
}

export function RealtimeSocketPlayground() {
  const {
    isConnected,
    socket,
    transport,
    onlineUsers,
    latency,
    sendTestOrder,
    sendTestNotification,
  } = useSocket();
  const socketId = socket?.id;
  const toast = useToast();

  const [logs, setLogs] = useState<RealtimeLog[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("Storewide Flash Sale");
  const [broadcastType, setBroadcastType] = useState<"info" | "success" | "warning" | "error">("info");

  // Add log entry
  const addLog = (type: RealtimeLog["type"], message: string, details?: Record<string, unknown>) => {
    const newLog: RealtimeLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
  };

  // Listen to new live orders
  useSocketEvent("orders:new", (order) => {
    addLog("order", `New order received: #${order.orderId} from ${order.customerName}`, {
      amount: `$${order.amount.toFixed(2)}`,
      items: order.itemsCount,
    });
  });

  // Listen to broadcast notifications
  useSocketEvent("notifications:broadcast", (payload) => {
    addLog("notification", `Broadcast received: [${payload.title}] ${payload.message}`);
  });

  // Listen to user count changes
  useSocketEvent("users:count", ({ count }) => {
    addLog("system", `Active concurrent user count updated: ${count}`);
  });

  // Trigger simulated order
  const handleSimulateOrder = () => {
    if (!isConnected) {
      toast.warning("Socket Offline", "WebSocket server is not connected. Start socket-server.js or server.js.");
      return;
    }

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const customers = ["Gokul", "Priya", "Rahul", "Ananya", "Karthik", "Sneha"];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const amount = Number((Math.random() * 300 + 49).toFixed(2));
    const itemsCount = Math.floor(Math.random() * 4) + 1;

    sendTestOrder({
      orderId,
      customerName: customer,
      amount,
      itemsCount,
    });

    toast.info("Order Dispatched", `Emitted simulated order #${orderId} over WebSocket.`);
  };

  // Trigger announcement broadcast
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast.warning("Socket Offline", "WebSocket server is not connected.");
      return;
    }

    const title = broadcastTitle.trim() || "System Announcement";
    const msg = broadcastMessage.trim() || "Flash deal active for the next 30 minutes! Use code SAVE20.";

    sendTestNotification({
      title,
      message: msg,
      type: broadcastType,
    });

    toast.success("Broadcast Sent", `Dispatched "${title}" to all connected clients.`);
    setBroadcastMessage("");
  };

  // Trigger ping test
  const handlePing = () => {
    if (!isConnected || !socket) {
      toast.warning("Socket Offline", "Cannot ping an offline socket.");
      return;
    }

    const start = Date.now();
    socket.emit("system:ping");
    socket.once("system:pong", ({ timestamp }) => {
      const tripTime = Date.now() - start;
      addLog("ping", `Pong received in ${tripTime}ms (Server time: ${new Date(timestamp).toLocaleTimeString()})`);
      toast.info("Heartbeat Pong", `Round-trip latency: ${tripTime}ms`);
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Card */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Connection State</span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <WifiOff className="w-3 h-3" />
                Disconnected
              </span>
            )}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {transport ? `(${transport})` : ""}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate font-mono">
            {socketId ? `ID: ${socketId}` : "Waiting for gateway handshake"}
          </p>
        </div>

        {/* Latency Card */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Roundtrip Latency</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {latency !== null ? `${latency}` : "--"}
            </span>
            <span className="text-xs text-slate-400 font-semibold">ms</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            Active bi-directional heartbeat
          </p>
        </div>

        {/* Active Concurrent Users */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active WebSocket Peers</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {onlineUsers}
            </span>
            <span className="text-xs text-slate-400">client{onlineUsers === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Real-time presence synchronizer
          </p>
        </div>

        {/* Server Gateway Architecture */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Engine Gateway</span>
            <Server className="w-4 h-4 text-violet-500" />
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              Socket.io v4.8
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-mono">
            Path: /api/socket/io (Port: 3001/3000)
          </p>
        </div>
      </div>

      {/* Interactive Controls & Real-Time Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Emitters */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Actions Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-500" />
                Live Event Triggers
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                Bidirectional
              </span>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                size="sm"
                onClick={handleSimulateOrder}
                leftIcon={<ShoppingCart className="w-4 h-4" />}
                disabled={!isConnected}
              >
                Dispatch Simulated Live Order
              </Button>

              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={handlePing}
                leftIcon={<Activity className="w-4 h-4" />}
                disabled={!isConnected}
              >
                Send Heartbeat Ping & Measure Latency
              </Button>
            </div>
          </div>

          {/* Broadcast Form Card */}
          <form
            onSubmit={handleSendBroadcast}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-amber-500" />
                Storewide Broadcast Announcer
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Flash Sale Live"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Message Content
              </label>
              <textarea
                rows={2}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type real-time announcement to all online users..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Type:
              </label>
              {(["info", "success", "warning", "error"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBroadcastType(t)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded capitalize border transition-all ${
                    broadcastType === t
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <Button
              type="submit"
              variant="gradient"
              fullWidth
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              disabled={!isConnected}
            >
              Broadcast Notification
            </Button>
          </form>
        </div>

        {/* Right Column: Live Event Stream Feed */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Socket Event Stream
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-500 font-semibold">
                {logs.length} events
              </span>
            </div>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => setLogs([])}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear Stream
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 font-mono text-xs pr-1 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
                <Wifi className="w-8 h-8 opacity-40 animate-pulse text-indigo-500" />
                <p className="text-xs font-sans">Socket connected and listening for live packets...</p>
                <p className="text-[11px] text-slate-500 font-sans">
                  Click &ldquo;Dispatch Simulated Live Order&rdquo; or send a broadcast to watch events stream in real time.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/60 flex flex-col gap-1 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {log.type === "order" && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          ORDERS:NEW
                        </span>
                      )}
                      {log.type === "notification" && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                          BROADCAST
                        </span>
                      )}
                      {log.type === "ping" && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                          PONG
                        </span>
                      )}
                      {log.type === "system" && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-[10px]">
                          SYSTEM
                        </span>
                      )}
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {log.message}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {log.timestamp}
                    </span>
                  </div>
                  {log.details && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-1.5 rounded border border-slate-200/50 dark:border-slate-800/50">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
