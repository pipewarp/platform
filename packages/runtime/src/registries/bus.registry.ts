import type { Registry } from "../types/registry.js";
import { InMemoryEventBus } from "@lcase/adapters/event-bus";

export const busRegistry = {
  embedded: {
    "event-emitter": {
      none: () => new InMemoryEventBus(),
      jsonl: () => new InMemoryEventBus(),
    },
    redis: {
      none: () => new InMemoryEventBus(),
    },
  },
} as const satisfies Registry;

export type BusRegistry = typeof busRegistry;
export type BusPlacement = keyof BusRegistry;
export type BusTransport = keyof BusRegistry[BusPlacement];
export type BusStore = keyof BusRegistry[BusPlacement][BusTransport];
