import { z } from "zod";

// messages have payloads with events
// message types tell what type of message is being sent
// each message type has an event payload

export const StepEventSchema = z.object({
  stepName: z.string().min(1),
  runId: z.string().min(1),
  flowName: z.string().min(1),
  mcpId: z.string().min(1),
  args: z.record(z.string(), z.unknown()).optional(),
});

export type StepEvent = z.infer<typeof StepEventSchema>;

export const EventEnvelopeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  time: z.string().min(1),
  data: StepEventSchema,
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

// could have CommandEnvelop, QueryEnvelope to define different message types
// unsure the schema changes.  One Message type which multiple envelopes?
// each envelope has similar message metadata, otel, observability?
