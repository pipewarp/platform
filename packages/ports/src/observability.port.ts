import { AnyEvent } from "@pipewarp/types";

export interface EventSink {
  readonly id: string;

  start(): Promise<void>;
  stop(): Promise<void>;
  handle(event: AnyEvent): Promise<void> | void;
}

