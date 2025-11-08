import { z } from "zod";
import type {
  StepStartedData,
  StepCompletedData,
  StepFailedData,
} from "@pipewarp/types";

const RunDescriptorSchema = z.object({
  step: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  }),
});
export const StepStartedDataSchema = RunDescriptorSchema.merge(
  z.object({
    status: z.literal("started"),
  })
).strict() satisfies z.ZodType<StepStartedData>;

export const StepCompletedDataSchema = RunDescriptorSchema.merge(
  z.object({
    status: z.literal("completed"),
  })
).strict() satisfies z.ZodType<StepCompletedData>;

export const StepFailedDataSchema = RunDescriptorSchema.merge(
  z.object({
    status: z.literal("failed"),
    reason: z.string(),
  })
).strict() satisfies z.ZodType<StepFailedData>;
