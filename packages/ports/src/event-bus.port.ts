import { EventEnvelope } from "@pipewarp/types";

export interface EventBusPort {
  publish(topic: string, event: EventEnvelope): Promise<void>;
  subscribe(
    topic: string,
    handler: (e: EventEnvelope, t?: string) => Promise<void>
  ): () => unknown;
  close(): Promise<unknown>;
}
