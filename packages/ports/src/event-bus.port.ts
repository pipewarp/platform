import { z } from "zod";
import { StepActionQueuedSchema } from "./events/step.events.js";

export const EventEnvelopeBaseSchema = z.object({
  id: z.string().min(1),
  correlationId: z.string().min(1),
  time: z.string().min(1),
});

export const EventEnvelopeKindSchema = z.discriminatedUnion("kind", [
  StepActionQueuedSchema,
]);

export const EventEnvelopeSchema = z.intersection(
  EventEnvelopeBaseSchema,
  EventEnvelopeKindSchema
);
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

export interface EventBusPort {
  publish(topic: string, event: EventEnvelope): Promise<void>;
  subscribe(topic: string, handler: () => Promise<void>): () => unknown;
  close(): Promise<unknown>;
}
