"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "@/components/providers/SocketProvider";

export { useSocket };

/**
 * Hook to subscribe to any Socket.io event with automatic cleanup on unmount
 * Prevents memory leaks and duplicate event listeners.
 */
export function useSocketEvent<T = unknown>(
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (...args: any[]) => void
) {
  const { socket, isConnected } = useSocket();
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventListener = (...args: any[]) => {
      savedHandler.current(...args);
    };

    socket.on(eventName, eventListener);

    return () => {
      socket.off(eventName, eventListener);
    };
  }, [socket, isConnected, eventName]);
}
