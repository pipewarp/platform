import { useEffect, useState } from "react";
import type { AnyEvent } from "@lcase/types";
import { EventDetails } from "./EventDetails";

export type EventBarProps = {
  event: AnyEvent;
};

export type EventDomainColors = {
  [k in string]: string;
};
const eventTypeColors: EventDomainColors = {
  flow: "bg-cyan-800 ring-cyan-400 text-cyan-200 ",
  engine: "bg-sky-800 ring-sky-400",
  run: "bg-blue-800 ring-blue-400",
  step: "bg-indigo-800 ring-indigo-400",
  worker: "bg-violet-800 ring-violet-400",
  job: "bg-purple-800 ring-purple-400 text-purple-200 ",
  tool: "bg-fuchsia-800 ring-fuchsia-400",
  system: "bg-stone-700 ring-stone-400",
};

function getClasses(eventType: string) {
  const domain = eventType.split(".")[0];
  return eventTypeColors[domain];
}

export function EventBar({ event }: EventBarProps) {
  const [visible, setVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClick = () => {
    if (isExpanded) setIsExpanded(false);
    else setIsExpanded(true);
  };
  return (
    <>
      <div
        onClick={handleClick}
        className={
          `${visible ? " opacity-100 " : " opacity-0 "}
             w-lg
        font-sans pl-2
        text-center
        cursor-pointer

        text-lg
        rounded-md
        mb-0.5
        border-green-700 text-gray-300
        
        shadow-inner  ring-inset
        transition-opacity ease-in-out delay-100 duration-100
        ` +
          getClasses(event.type) +
          `  transition hover:shadow-lg/30 hover:ring-2
        `
        }
      >
        {event.type}
      </div>
      {isExpanded && <EventDetails event={event} />}
      {event.type === "system.logged" && isExpanded === false ? (
        <div className="font-mono text-xs bg-gray-700 pl-2 pr-2">
          {event.data.log}
        </div>
      ) : (
        ""
      )}
    </>
  );
}
