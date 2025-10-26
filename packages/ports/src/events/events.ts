import { z } from "zod";

export const EventEnvelopeBaseSchema = z.object({
  id: z.string().min(1),
  correlationId: z.string().min(1),
  time: z.string().min(1),
  runId: z.string().min(1).optional(),
});

export const ActionQueuedSchema = z.object({
  stepType: z.literal("action"),
  stepName: z.string(),
  tool: z.string().min(1),
  op: z.string().min(1),
  profile: z.string().min(1).optional(),
  args: z.record(z.string(), z.unknown()).optional(),
  pipe: z.object({
    to: z
      .object({
        id: z.string(),
        payload: z.string(),
      })
      .optional(),
    from: z
      .object({
        id: z.string(),
        buffer: z.number().optional(),
      })
      .optional(),
  }),
});

export const WaitQueuedSchema = z.object({
  stepType: z.literal("wait"),
  stepName: z.string().min(1),
  duration: z.number(),
});
export const StepQueuedDataSchema = z.discriminatedUnion("stepType", [
  ActionQueuedSchema,
  WaitQueuedSchema,
]);

export const StepQueuedEventSchema = EventEnvelopeBaseSchema.extend({
  kind: z.literal("step.queued"),
  runId: z.string().min(1),
  data: StepQueuedDataSchema,
});
export const FlowQueuedSchema = EventEnvelopeBaseSchema.extend({
  kind: z.literal("flow.queued"),
  data: z.object({
    flowName: z.string().min(1),
    inputs: z.record(z.string(), z.unknown()),
    test: z.boolean().default(false),
    outfile: z.string(),
  }),
});

export const StepCompletedSchema = EventEnvelopeBaseSchema.extend({
  kind: z.literal("step.completed"),
  runId: z.string().min(1),
  data: z.object({
    stepName: z.string(),
    ok: z.boolean(),
    result: z.unknown().optional(),
    error: z.string().optional(),
  }),
});

export const EventEnvelopeSchema = z.discriminatedUnion("kind", [
  StepQueuedEventSchema,
  StepCompletedSchema,
  FlowQueuedSchema,
]);

export type ActionQueuedData = z.infer<typeof ActionQueuedSchema>;
export type StepQueuedEvent = z.infer<typeof StepQueuedEventSchema>;
export type StepCompletedEvent = z.infer<typeof StepCompletedSchema>;
export type FlowQueuedEvent = z.infer<typeof FlowQueuedSchema>;
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
