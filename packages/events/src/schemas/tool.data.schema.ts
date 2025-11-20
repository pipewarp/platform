import { z } from "zod";
import type {
  ToolDescriptorData,
  ToolStartedData,
  ToolCompletedData,
  ToolFailedData,
} from "@lcase/types";

const ToolDescriptorDataSchema = z
  .object({
    tool: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<ToolDescriptorData>;
export const ToolStartedDataSchema = ToolDescriptorDataSchema.merge(
  z.object({
    log: z.string(),
    status: z.literal("started"),
  })
).strict() satisfies z.ZodType<ToolStartedData>;

export const ToolCompletedDataSchema = ToolDescriptorDataSchema.merge(
  z.object({
    status: z.literal("completed"),
  })
).strict() satisfies z.ZodType<ToolCompletedData>;

export const ToolFailedDataSchema = ToolDescriptorDataSchema.merge(
  z.object({
    status: z.literal("failed"),
    reason: z.string(),
  })
).strict() satisfies z.ZodType<ToolFailedData>;
