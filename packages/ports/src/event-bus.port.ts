import { AnyEvent } from "@lcase/types";

export type PublishOptions = {
  internal?: boolean;
};
export interface EventBusPort {
  publish(
    topic: string,
    event: AnyEvent,
    options?: PublishOptions
  ): Promise<void>;
  subscribe(
    topic: string,
    handler: (e: AnyEvent, t?: string) => Promise<void>
  ): () => unknown;
  close(): Promise<unknown>;
}
