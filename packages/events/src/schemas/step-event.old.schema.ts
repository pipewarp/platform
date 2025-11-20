// import { z } from "zod";
// import type { AnyEvent, StepScope } from "@lcase/types";
// import { CloudEventContextSchema } from "./cloud-context.schema.js";
// import {
//   StepActionQueuedDataSchema,
//   StepActionCompletedDataSchema,
//   StepMcpQueuedDataSchema,
// } from "./step-data.old.schema.js";

// export const StepContextSchema = z
//   .object({
//     flowid: z.string(),
//     runid: z.string(),
//     stepid: z.string(),
//     domain: z.literal("step"),
//   })
//   .strict() satisfies z.ZodType<StepScope>;

// export const StepActionQueuedSchema = CloudEventContextSchema.merge(
//   StepContextSchema
// )
//   .merge(
//     z.object({
//       type: z.literal("step.action.queued"),
//       entity: z.literal("action"),
//       action: z.literal("queued"),
//       data: StepActionQueuedDataSchema,
//     })
//   )
//   .strict() satisfies z.ZodType<AnyEvent<"step.action.queued">>;

// export const StepActionCompletedSchema = CloudEventContextSchema.merge(
//   StepContextSchema
// )
//   .merge(
//     z.object({
//       // stepType: z.literal("action"),
//       type: z.literal("step.action.completed"),
//       entity: z.literal("action"),
//       action: z.literal("completed"),
//       data: StepActionCompletedDataSchema,
//     })
//   )
//   .strict() satisfies z.ZodType<AnyEvent<"step.action.completed">>;

// export const StepMcpQueuedSchema = CloudEventContextSchema.merge(
//   StepContextSchema
// )
//   .merge(
//     z.object({
//       stepType: z.literal("mcp"),
//       type: z.literal("step.mcp.queued"),
//       entity: z.literal("mcp"),
//       action: z.literal("queued"),
//       data: StepMcpQueuedDataSchema,
//     })
//   )
//   .strict() satisfies z.ZodType<AnyEvent<"step.mcp.queued">>;
