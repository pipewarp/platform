import { useRef, useState, useCallback } from "react";
import type { AnyEvent } from "@lcase/types";

export type EventWebSocketHandles = {
  isConnected: boolean;
  message: MessageEvent | null;
  send: (data: AnyEvent) => void;
  close: () => void;
  connect: () => void;
};

export type SendData = {
  connect: boolean;
};

const delayIncrementMs = 20;
let currentDelayMs = 0;
let totalEventsInFlight = 0;
export function useEventWebSocket(url: string): EventWebSocketHandles {
  const socketRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<MessageEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<MessageEvent | null>(null);

  const connect = useCallback(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.addEventListener("message", (event) => {
      console.log(`listener:`, event);
      totalEventsInFlight++;
      currentDelayMs = delayIncrementMs * totalEventsInFlight;
      setTimeout(() => {
        totalEventsInFlight--;
        setMessage(event);
        console.log(`ms:${currentDelayMs} total: ${totalEventsInFlight}`);
      }, currentDelayMs);
    });

    socket.addEventListener("open", () => {
      setIsConnected(true);
    });
  }, [url]);

  const close = useCallback(() => {
    if (socketRef.current !== null) socketRef.current.close();
    if (bufferRef.current.length) bufferRef.current = [];
    setMessage(null);
    setIsConnected(false);
  }, []);

  const send = useCallback(
    (data: unknown) => {
      if (socketRef.current?.readyState === WebSocket.OPEN && isConnected) {
        socketRef.current.send(JSON.stringify(data));
      }
    },
    [isConnected]
  );

  return { isConnected, message, send, close, connect };
}
