import { useRef } from "react";
import { useController } from "../../context/ControllerContext.js";
import { useObsEvent } from "../../hooks/obsEvent.js";
import { AnyEvent } from "@pipewarp/types";

const eventIds = new Set<string>();
export function ObsPanel(props: {}) {
  const controller = useController();
  const eventsRef = useRef<AnyEvent[]>([]);
  const event = useObsEvent("observability:event");

  if (event && !eventIds.has(event.id)) {
    console.log(event.id);
    eventIds.add(event.id);
    eventsRef.current = [...eventsRef.current, event];
  }

  return (
    <div>
      <p>eventIds size: {eventIds.size}</p>
      <p>EventsRef Length: {eventsRef.current.length}</p>
      {eventsRef.current.map((e: AnyEvent, i) => (
        <p key={e.traceparent + e.time + i}>{e.type}</p>
      ))}
    </div>
  );
}
