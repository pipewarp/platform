import { AnyEvent } from "@pipewarp/types";

export interface EventBusPort {
  publish(topic: string, event: AnyEvent): Promise<void>;
  subscribe(
    topic: string,
    handler: (e: AnyEvent, t?: string) => Promise<void>
  ): () => unknown;
  close(): Promise<unknown>;
}
