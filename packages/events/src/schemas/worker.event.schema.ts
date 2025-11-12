import { z } from "zod";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import type { AnyEvent, WorkerScope } from "@pipewarp/types";
import {
  WorkerStartedDataSchema,
  WorkerStoppedDataSchema,
  WorkerRegisteredDataSchema,
  WorkerRegistrationRequestedDataSchema,
} from "./worker.data.schema.js";

export const WorkerContextSchema = z
  .object({
    workerid: z.string(),
    domain: z.literal("worker"),
  })
  .strict() satisfies z.ZodType<WorkerScope>;

export const WorkerStartedSchema = CloudEventContextSchema.merge(
  WorkerContextSchema
)
  .merge(
    z.object({
      type: z.literal("worker.started"),
      entity: z.undefined().optional(),
      action: z.literal("started"),
      data: WorkerStartedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"worker.started">>;

export const WorkerStoppedSchema = CloudEventContextSchema.merge(
  WorkerContextSchema
)
  .merge(
    z.object({
      type: z.literal("worker.stopped"),
      entity: z.undefined().optional(),
      action: z.literal("stopped"),
      data: WorkerStoppedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"worker.stopped">>;

export const WorkerRegisteredSchema = CloudEventContextSchema.merge(
  WorkerContextSchema
)
  .merge(
    z.object({
      type: z.literal("worker.registered"),
      entity: z.undefined().optional(),
      action: z.literal("registered"),
      data: WorkerRegisteredDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"worker.registered">>;

export const WorkerRegistrationRequestedSchema = CloudEventContextSchema.merge(
  WorkerContextSchema
)
  .merge(
    z.object({
      type: z.literal("worker.registration.requested"),
      entity: z.literal("registration"),
      action: z.literal("requested"),
      data: WorkerRegistrationRequestedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"worker.registration.requested">>;
