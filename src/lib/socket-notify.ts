import { getSocketIO } from "@/server/socket";

export type SocketBroadcastEvent =
  | "departments:changed"
  | "roles:changed"
  | "shifts:changed"
  | "staff:changed"
  | "categories:changed"
  | "brands:changed"
  | "manufacturers:changed"
  | "attributes:changed"
  | "products:changed"
  | "inventory:changed"
  | "warehouses:changed"
  | "stock:changed";

/**
 * Safely notifies all connected clients of a data mutation across both unified and microservice setups
 */
export function broadcastSocketEvent(
  event: SocketBroadcastEvent | string,
  payload?: any
) {
  try {
    const io = getSocketIO();
    if (io) {
      (io as any).emit(event, payload);
    }
  } catch (err) {
    console.warn(`[Socket Broadcast] Unable to broadcast ${event}:`, err);
  }
}
