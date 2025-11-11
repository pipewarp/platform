import { AnyEvent } from "@pipewarp/types";

export interface EventSink {
  readonly id: string;

  start(): Promise<void> | void;
  stop(): Promise<void> | void;

  handle(event: AnyEvent): Promise<void> | void;
}
