import { getSocketIO } from "@/server/socket";

/**
 * Safely notifies all connected clients of a data mutation across both unified and microservice setups
 */
export function broadcastSocketEvent(event: "departments:changed" | "roles:changed", payload?: { action: string; id?: string }) {
  try {
    const io = getSocketIO();
    if (io) {
      io.emit(event, payload);
    }
  } catch (err) {
    console.warn(`[Socket Broadcast] Unable to broadcast ${event}:`, err);
  }
}
