// import { z } from "zod";
// import type {
//   StepActionQueuedData,
//   StepActionCompletedData,
//   StepMcpQueuedData,
// } from "@lcase/types";
// export const StepActionQueuedDataSchema = z
//   .object({
//     tool: z.string().min(1),
//     op: z.string().min(1),
//     profile: z.string().min(1).optional(),
//     args: z.record(z.string(), z.unknown()).optional(),
//     pipe: z.object({
//       to: z
//         .object({
//           id: z.string(),
//           payload: z.string(),
//         })
//         .optional(),
//       from: z
//         .object({
//           id: z.string(),
//           buffer: z.number().optional(),
//         })
//         .optional(),
//     }),
//   })
//   .strict() satisfies z.ZodType<StepActionQueuedData>;

// export const StepActionCompletedDataSchema = z
//   .object({
//     ok: z.boolean(),
//     message: z.string(),
//     result: z.unknown().optional(),
//     error: z.string().optional(),
//   })
//   .strict() satisfies z.ZodType<StepActionCompletedData>;

// export const StepMcpQueuedDataSchema = z
//   .object({
//     url: z.string(),
//     transport: z.enum(["sse", "stdio", "streamable-http", "http"]),
//     feature: z.object({
//       primitive: z.enum([
//         "resource",
//         "prompt",
//         "tool",
//         "sampling",
//         "roots",
//         "elicitation",
//       ]),
//       name: z.string(),
//     }),
//     args: z.record(z.string(), z.unknown()).optional(),
//     pipe: z.object({
//       to: z
//         .object({
//           id: z.string(),
//           payload: z.string(),
//         })
//         .optional(),
//       from: z
//         .object({
//           id: z.string(),
//           buffer: z.number().optional(),
//         })
//         .optional(),
//     }),
//   })
//   .strict() satisfies z.ZodType<StepMcpQueuedData>;
