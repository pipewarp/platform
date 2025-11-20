import { AnyEvent } from "@lcase/types";

export interface RouterPort {
  route(event: AnyEvent): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}
