import { z } from "zod";
import type {
  WorkerDescriptorData,
  WorkerStartedData,
  WorkerStoppedData,
  WorkerRegistrationRequestedData,
  WorkerRegisteredData,
} from "@lcase/types";

const WorkerDescriptorDataSchema = z
  .object({
    worker: z.object({
      id: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<WorkerDescriptorData>;
export const WorkerStartedDataSchema = WorkerDescriptorDataSchema.merge(
  z.object({
    status: z.literal("started"),
  })
).strict() satisfies z.ZodType<WorkerStartedData>;

export const WorkerStoppedDataSchema = WorkerDescriptorDataSchema.merge(
  z.object({
    status: z.literal("stopped"),
  })
).strict() satisfies z.ZodType<WorkerStoppedData>;

export const WorkerRegistrationRequestedDataSchema =
  WorkerDescriptorDataSchema.merge(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["inprocess", "remote"]),
      capabilities: z.array(
        z.object({
          name: z.string(),
          queueId: z.string(),
          maxJobCount: z.number(),
          tool: z.object({
            id: z.enum(["mcp", "httpjson"]),
            type: z.enum(["inprocess", "remote", "dynamic"]),
          }),
          concurrencty: z
            .object({
              activeJobCount: z.number(),
              maxJobCount: z.number(),
            })
            .optional(),
          metadata: z
            .object({
              version: z.string().optional(),
              description: z.string().optional(),
            })
            .optional(),
        })
      ),
    })
  ).strict() satisfies z.ZodType<WorkerRegistrationRequestedData>;

export const WorkerRegisteredDataSchema = WorkerDescriptorDataSchema.merge(
  z.object({
    workerId: z.string(),
    status: z.string(),
    registeredAt: z.string(),
  })
).strict() satisfies z.ZodType<WorkerRegisteredData>;
