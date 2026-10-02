import { Server as NetServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

export interface ServerToClientEvents {
  "orders:new": (data: { orderId: string; customerName: string; amount: number; itemsCount: number }) => void;
  "orders:status_change": (data: { orderId: string; status: string }) => void;
  "inventory:alert": (data: { sku: string; productName: string; currentStock: number }) => void;
  "notifications:broadcast": (data: { id: string; title: string; message: string; type: "info" | "success" | "warning" | "error"; timestamp: string }) => void;
  "users:count": (count: number) => void;
  "system:ping": (data: { timestamp: number }) => void;
  "departments:changed": (data?: { action: string; id?: string }) => void;
  "roles:changed": (data?: { action: string; id?: string }) => void;
}

export interface ClientToServerEvents {
  "join:room": (room: string) => void;
  "leave:room": (room: string) => void;
  "client:ping": (data: { timestamp: number }, callback?: (res: { pong: boolean }) => void) => void;
  "orders:create_test": (data: { customerName: string; amount: number }) => void;
  "notifications:send_test": (data: { title: string; message: string; type: "info" | "success" | "warning" | "error" }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  role?: string;
}

export type TypedSocketServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Global singleton to allow other server modules (like API routes / actions) to emit events
declare global {
  // eslint-disable-next-line no-var
  var ioInstance: TypedSocketServer | undefined;
}

/**
 * Initialize Socket.io Server instance
 */
export function initSocketServer(httpServer: NetServer): TypedSocketServer {
  if (global.ioInstance) {
    return global.ioInstance;
  }

  const io: TypedSocketServer = new SocketIOServer(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  let connectedUsersCount = 0;

  io.on("connection", (socket: TypedSocket) => {
    connectedUsersCount++;
    console.log(`[Socket.io] Client connected: ${socket.id} (Total: ${connectedUsersCount})`);

    // Broadcast updated active client count
    io.emit("users:count", connectedUsersCount);

    // Auto-join default admin room
    socket.join("admin:general");

    // Client Room Subscriptions
    socket.on("join:room", (room: string) => {
      socket.join(room);
      console.log(`[Socket.io] ${socket.id} joined room: ${room}`);
    });

    socket.on("leave:room", (room: string) => {
      socket.leave(room);
      console.log(`[Socket.io] ${socket.id} left room: ${room}`);
    });

    // Heartbeat ping
    socket.on("client:ping", (data, callback) => {
      if (callback) {
        callback({ pong: true });
      }
      socket.emit("system:ping", { timestamp: Date.now() });
    });

    // Test simulation handlers
    socket.on("orders:create_test", (data) => {
      const orderId = `ORD-${Date.now().toString().slice(-4)}`;
      console.log(`[Socket.io] Broadcasting test order: ${orderId}`);
      io.to("admin:general").emit("orders:new", {
        orderId,
        customerName: data.customerName || "Sneha Patel",
        amount: data.amount || 4999,
        itemsCount: 2,
      });
    });

    socket.on("notifications:send_test", (data) => {
      console.log(`[Socket.io] Broadcasting test notification: ${data.title}`);
      io.to("admin:general").emit("notifications:broadcast", {
        id: `notif-${Date.now()}`,
        title: data.title,
        message: data.message,
        type: data.type || "info",
        timestamp: new Date().toLocaleTimeString(),
      });
    });

    // Disconnection handling
    socket.on("disconnect", (reason) => {
      connectedUsersCount = Math.max(0, connectedUsersCount - 1);
      console.log(`[Socket.io] Client disconnected: ${socket.id} (Reason: ${reason}, Total: ${connectedUsersCount})`);
      io.emit("users:count", connectedUsersCount);
    });
  });

  global.ioInstance = io;
  return io;
}

/**
 * Access the active Socket.io instance from any server-side code
 */
export function getSocketIO(): TypedSocketServer | null {
  return global.ioInstance || null;
}
