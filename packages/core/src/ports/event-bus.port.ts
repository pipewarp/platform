import type { EventEnvelope } from "../types/event-bus.types.js";

export interface EventBusPort {
  publish(topic: string, event: EventEnvelope): Promise<void>;
  subscribe(topic: string, handler: () => Promise<void>): () => unknown;
  close(): Promise<unknown>;
}
