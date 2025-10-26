import { z } from "zod";
import type {
  ActionQueuedEventData,
  EventEnvelope,
  EventEnvelopeBase,
  FlowQueuedEvent,
  StepCompletedEvent,
  StepEvent,
  StepQueuedEvent,
  StepQueuedEventData,
  WaitQueuedEventData,
} from "@pipewarp/types";

export const EventEnvelopeBaseSchema = z
  .object({
    id: z.string().min(1),
    correlationId: z.string().min(1),
    time: z.string().min(1),
    type: z.string().min(1),
    runId: z.string().min(1).optional(),
  })
  .strict() satisfies z.ZodType<EventEnvelopeBase>;

export const ActionQueuedEventDataSchema = z
  .object({
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
  })
  .strict() satisfies z.ZodType<ActionQueuedEventData>;

export const WaitQueuedEventDataSchema = z
  .object({
    stepType: z.literal("wait"),
    stepName: z.string().min(1),
    duration: z.number(),
  })
  .strict() satisfies z.ZodType<WaitQueuedEventData>;

export const StepQueuedDataSchema = z.discriminatedUnion("stepType", [
  ActionQueuedEventDataSchema,
  WaitQueuedEventDataSchema,
]) satisfies z.ZodType<StepQueuedEventData>;

export const StepQueuedEventSchema = EventEnvelopeBaseSchema.extend({
  kind: z.literal("step.queued"),
  runId: z.string().min(1),
  data: StepQueuedDataSchema,
}).strict() satisfies z.ZodType<StepQueuedEvent>;

export const FlowQueuedEventSchema = EventEnvelopeBaseSchema.extend({
  kind: z.literal("flow.queued"),
  data: z.object({
    flowName: z.string().min(1),
    inputs: z.record(z.string(), z.unknown()),
    test: z.boolean().optional(),
    outfile: z.string(),
  }),
}).strict() satisfies z.ZodType<FlowQueuedEvent>;

export const StepCompletedEventSchema = EventEnvelopeBaseSchema.extend({
  kind: z.literal("step.completed"),
  runId: z.string().min(1),
  data: z.object({
    stepName: z.string(),
    ok: z.boolean(),
    result: z.unknown().optional(),
    error: z.string().optional(),
  }),
}).strict() satisfies z.ZodType<StepCompletedEvent>;

export const StepEventSchema = z.discriminatedUnion("kind", [
  StepCompletedEventSchema,
  StepQueuedEventSchema,
]) satisfies z.ZodType<StepEvent>;

export const EventEnvelopeSchema = z.discriminatedUnion("kind", [
  ...StepEventSchema.options,
  FlowQueuedEventSchema,
]) satisfies z.ZodType<EventEnvelope>;
