import { z } from "zod";
import type { AnyEvent, JobScope } from "@pipewarp/types";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import {
  JobCompletedDataSchema,
  JobFailedDataSchema,
  JobMcpQueuedDataSchema,
  JobStartedDataSchema,
} from "./job.data.schema.js";

export const JobScopeSchema = z
  .object({
    flowid: z.string(),
    runid: z.string(),
    stepid: z.string(),
    jobid: z.string(),
    domain: z.literal("job"),
  })
  .strict() satisfies z.ZodType<JobScope>;

export const JobMcpQueuedSchema = CloudEventContextSchema.merge(JobScopeSchema)
  .merge(
    z.object({
      type: z.literal("job.mcp.queued"),
      entity: z.literal("mcp"),
      action: z.literal("queued"),
      data: JobMcpQueuedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.mcp.queued">>;

export const JobStartedSchema = CloudEventContextSchema.merge(JobScopeSchema)
  .merge(
    z.object({
      type: z.literal("job.started"),
      action: z.literal("started"),
      entity: z.undefined().optional(),
      data: JobStartedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.started">>;

export const JobCompletedSchema = CloudEventContextSchema.merge(JobScopeSchema)
  .merge(
    z.object({
      type: z.literal("job.completed"),
      action: z.literal("completed"),
      entity: z.undefined().optional(),
      data: JobCompletedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.completed">>;

export const JobFailedSchema = CloudEventContextSchema.merge(JobScopeSchema)
  .merge(
    z.object({
      type: z.literal("job.failed"),
      action: z.literal("failed"),
      entity: z.undefined().optional(),
      data: JobFailedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.failed">>;
