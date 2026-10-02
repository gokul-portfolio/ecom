"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { getSocketClient } from "@/lib/socket";
import { useToast } from "@/components/ui/feedback/Toast";

export interface NewOrderEventData {
  orderId: string;
  customerName: string;
  amount: number;
  itemsCount: number;
}

export interface BroadcastNotificationData {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
}

export interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  transport: string;
  onlineUsers: number;
  latency: number | null;
  sendTestOrder: (data?: Partial<NewOrderEventData>) => void;
  sendTestNotification: (data?: Partial<BroadcastNotificationData>) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  transport: "N/A",
  onlineUsers: 0,
  latency: null,
  sendTestOrder: () => {},
  sendTestNotification: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [latency, setLatency] = useState<number | null>(null);

  const toast = useToast();

  useEffect(() => {
    const socketClient = getSocketClient();
    setSocket(socketClient);

    function onConnect() {
      setIsConnected(true);
      setTransport(socketClient.io.engine.transport.name);

      socketClient.io.engine.on("upgrade", (rawTransport: { name: string }) => {
        setTransport(rawTransport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    function onUsersCount(count: number) {
      setOnlineUsers(count);
    }

    function onNewOrder(data: NewOrderEventData) {
      toast.success(
        `⚡ Real-Time Order: ${data.orderId}`,
        `${data.customerName} just placed an order for ₹${data.amount.toLocaleString()} (${data.itemsCount} items).`
      );
    }

    function onBroadcast(data: BroadcastNotificationData) {
      const type = data.type || "info";
      toast[type](`📢 ${data.title}`, data.message);
    }

    // Measure latency with heartbeat
    function onSystemPing(data: { timestamp: number }) {
      const pingMs = Math.max(1, Date.now() - data.timestamp);
      setLatency(pingMs);
    }

    socketClient.on("connect", onConnect);
    socketClient.on("disconnect", onDisconnect);
    socketClient.on("users:count", onUsersCount);
    socketClient.on("orders:new", onNewOrder);
    socketClient.on("notifications:broadcast", onBroadcast);
    socketClient.on("system:ping", onSystemPing);

    // Connect automatically
    socketClient.connect();

    return () => {
      socketClient.off("connect", onConnect);
      socketClient.off("disconnect", onDisconnect);
      socketClient.off("users:count", onUsersCount);
      socketClient.off("orders:new", onNewOrder);
      socketClient.off("notifications:broadcast", onBroadcast);
      socketClient.off("system:ping", onSystemPing);
      socketClient.disconnect();
    };
  }, [toast]);

  // Periodic latency measurement
  useEffect(() => {
    if (!isConnected || !socket) return;
    const interval = setInterval(() => {
      const start = Date.now();
      socket.emit("client:ping", { timestamp: start }, () => {
        setLatency(Date.now() - start);
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [isConnected, socket]);

  const sendTestOrder = useCallback(
    (data?: Partial<NewOrderEventData>) => {
      if (socket) {
        socket.emit("orders:create_test", {
          customerName: data?.customerName || "Rahul Sharma",
          amount: data?.amount || 7499,
        });
      }
    },
    [socket]
  );

  const sendTestNotification = useCallback(
    (data?: Partial<BroadcastNotificationData>) => {
      if (socket) {
        socket.emit("notifications:send_test", {
          title: data?.title || "System Alert",
          message: data?.message || "Real-time WebSocket event received successfully!",
          type: data?.type || "info",
        });
      }
    },
    [socket]
  );

  const joinRoom = useCallback(
    (room: string) => {
      if (socket) socket.emit("join:room", room);
    },
    [socket]
  );

  const leaveRoom = useCallback(
    (room: string) => {
      if (socket) socket.emit("leave:room", room);
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        transport,
        onlineUsers,
        latency,
        sendTestOrder,
        sendTestNotification,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
