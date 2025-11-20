import { useRef } from "react";
import { Button } from "../components/Button";
import { EventBar } from "../components/EventBar";
import { useEventWebSocket } from "../hooks/useEventWebSocket";
import type { AnyEvent } from "@lcase/types";

export type PageProps = {
  title: string;
};
const url = new URL("ws://localhost:3006");

const messageIds = new Set<string>();
export function Page({ title }: PageProps) {
  const eventsRef = useRef<AnyEvent[]>([]);
  const { isConnected, message, close, connect } = useEventWebSocket(url.href);

  const handleConnectButton = () => {
    if (isConnected) {
      close();
      messageIds.clear();
      eventsRef.current = [];
    } else {
      connect();
      messageIds.clear();
      eventsRef.current = [];
    }
  };

  if (message !== null) {
    const event = JSON.parse(message!.data) as AnyEvent;

    if (!messageIds.has(event.id)) {
      eventsRef.current = [...eventsRef.current, event];
      messageIds.add(event.id);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-left bg-grey-100">
      <header>
        <h1>{title}</h1>
        <h2 className="text-lg">
          WebSocket: {isConnected ? "Connected" : "Disconnected"}
          <Button onClick={handleConnectButton}>
            {isConnected ? "Disconnect" : "Connect"}
          </Button>
        </h2>
        <h5>Events: {eventsRef.current.length}</h5>
        <div className="flex flex-col items-center mt-5">
          {eventsRef.current.map((e: AnyEvent, i) => (
            <EventBar key={e.traceparent + e.time + i} event={e} />
          ))}
        </div>
      </header>
    </div>
  );
}
