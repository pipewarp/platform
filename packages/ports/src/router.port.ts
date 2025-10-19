import { EventEnvelope } from "./events/events.js";

export interface RouterPort {
  route(event: EventEnvelope): Promise<void>;
}
