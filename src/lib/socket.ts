import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export interface SocketConfig {
  url?: string;
  path?: string;
}

/**
 * Get or create singleton Socket.io client instance
 */
export function getSocketClient(config: SocketConfig = {}): Socket {
  if (socketInstance) {
    return socketInstance;
  }

  // Priority:
  // 1. Explicit env variable NEXT_PUBLIC_SOCKET_URL
  // 2. Window location origin (if running unified custom server on port 3000)
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const isBrowser = typeof window !== "undefined";
  const defaultUrl = isBrowser
    ? (window.location.hostname === "localhost" && window.location.port === "3000"
        ? "http://localhost:3001"
        : window.location.origin)
    : "http://localhost:3001";
  const targetUrl = envUrl || defaultUrl;

  socketInstance = io(targetUrl, {
    path: config.path || "/api/socket/io",
    autoConnect: false, // Provider explicitly connects on mount
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ["websocket", "polling"],
  });

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
