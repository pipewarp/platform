import { z } from "zod";
import type {
  JobCompletedData,
  JobDescriptor,
  JobFailedData,
  JobHttpJsonData,
  JobMcpQueuedData,
  JobQueuedData,
  JobStartedData,
  PipeData,
} from "@lcase/types";

const JobDescriptorDataSchema = z
  .object({
    job: z.object({
      id: z.string(),
      capability: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<JobDescriptor>;

const PipeDataSchema = z
  .object({
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
  })
  .strict() satisfies z.ZodType<PipeData>;

export const JobMcpQueuedDataSchema = JobDescriptorDataSchema.merge(
  z.object({
    url: z.string(),
    transport: z.enum(["sse", "stdio", "streamable-http", "http"]),
    feature: z.object({
      primitive: z.enum([
        "resource",
        "prompt",
        "tool",
        "sampling",
        "roots",
        "elicitation",
      ]),
      name: z.string(),
    }),
    args: z.record(z.string(), z.unknown()).optional(),
    pipe: PipeDataSchema,
  })
).strict() satisfies z.ZodType<JobMcpQueuedData>;

export const JobHttpJsonRequestedData = JobDescriptorDataSchema.merge(
  z.object({
    type: z.literal("httpjson"),
    url: z.string(),
    method: z
      .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
      .optional(),

    headers: z.record(z.string(), z.unknown()).optional(),
    body: z.record(z.string(), z.unknown()).optional(),
    pipe: PipeDataSchema,
  })
).strict() satisfies z.ZodType<JobHttpJsonData>;

export const JobQueuedDataSchema = JobDescriptorDataSchema.merge(
  z.object({
    status: z.literal("queued"),
  })
).strict() satisfies z.ZodType<JobQueuedData>;

export const JobStartedDataSchema = JobDescriptorDataSchema.merge(
  z.object({
    status: z.literal("started"),
  })
).strict() satisfies z.ZodType<JobStartedData>;

export const JobCompletedDataSchema = JobDescriptorDataSchema.merge(
  z.object({
    status: z.literal("completed"),
    result: z.unknown(),
  })
).strict() satisfies z.ZodType<JobCompletedData>;

export const JobFailedDataSchema = JobDescriptorDataSchema.merge(
  z.object({
    status: z.literal("failed"),
    result: z.unknown(),
    reason: z.string(),
  })
).strict() satisfies z.ZodType<JobFailedData>;
