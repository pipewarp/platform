import { InMemoryQueue } from "@lcase/adapters/queue";
import type { Registry } from "../types/registry.js";

export const queueRegistry = {
  embedded: {
    "deferred-promise": {
      none: () => new InMemoryQueue(),
      jsonl: () => new InMemoryQueue(),
    },
    redis: {
      none: () => new InMemoryQueue(),
    },
  },
} as const satisfies Registry;

export type QueueRegistry = typeof queueRegistry;
export type QueuePlacement = keyof QueueRegistry;
export type QueueTransport = keyof QueueRegistry[QueuePlacement];
export type QueueStore = keyof QueueRegistry[QueuePlacement][QueueTransport];
