import { EventEnvelope } from "@pipewarp/types";

export interface RouterPort {
  route(event: EventEnvelope): Promise<void>;
}
