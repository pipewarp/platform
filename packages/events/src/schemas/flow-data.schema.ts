import { z } from "zod";
import type {
  FlowCompletedData,
  FlowQueuedData,
  FlowStartedData,
} from "@pipewarp/types";

export const FlowQueuedDataSchema = z
  .object({
    flowName: z.string(),
    inputs: z.record(z.string(), z.unknown()),
    outfile: z.string(),
    test: z.boolean().optional(),
    definition: z.record(z.string(), z.unknown()),
    flow: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<FlowQueuedData>;

export const FlowStartedDataSchema = z
  .object({
    flow: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<FlowStartedData>;

export const FlowCompletedDataSchema = z
  .object({
    flow: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<FlowCompletedData>;
