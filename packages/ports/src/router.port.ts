import { AnyEvent } from "@pipewarp/types";

export interface RouterPort {
  route(event: AnyEvent): Promise<void>;
}
