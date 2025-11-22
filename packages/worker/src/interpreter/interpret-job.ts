import { AllJobEvents, AnyEvent, JobEventType } from "@lcase/types";
import type { JobDescriptor } from "../types.js";

// parses a job envelope and returns structured data

/**
 * Builds a JobDescription object from an event envelope deterministically.
 *
 * Eventually becomes added to a workers full JobContext and is used to wire up
 * the things a tool needs to run.
 * @param event AnyEvent
 * @returns
 */
export function interpretJob<T extends JobEventType>(
  event: AllJobEvents
): JobDescriptor<T> {
  const ctx: JobDescriptor<T> = {
    id: String(crypto.randomUUID()),
    isConsumer: false,
    isProducer: false,
    capability: "mcp",
    data: event.data,
  };
  switch (event.type) {
    case "job.mcp.queued":
      let e = event as AnyEvent<"job.mcp.queued">;

      ctx.capability = e.entity!;
      if (e.data.pipe.to) {
        ctx.isProducer = true;
        ctx.streamId = e.data.pipe.to.id;
      } else if (e.data.pipe.from) {
        ctx.isConsumer = true;
        ctx.streamId = e.data.pipe.from.id;
      }
      ctx.key = e.data.url;
      return ctx;

    case "job.httpjson.requested":
      const jhr = event as AnyEvent<"job.httpjson.requested">;

      ctx.capability = jhr.entity!;
      if (jhr.data.pipe.to) {
        ctx.isProducer = true;
        ctx.streamId = jhr.data.pipe.to.id;
      } else if (jhr.data.pipe.from) {
        ctx.isConsumer = true;
        ctx.streamId = jhr.data.pipe.from.id;
      }
      ctx.key = jhr.data.url;
      ctx.id = jhr.data.job.id;
      return ctx;

    default:
      throw new Error(
        `[worker-interpret-job] unknown event type ${event.type}`
      );
  }
}
