import { AnyEvent, EventData } from "@pipewarp/types";
import type { JobDescription } from "../types.js";

// parses a job envelope and returns structured data

/**
 * Builds a JobDescription object from an event envelope deterministically.
 *
 * Eventually becomes added to a workers full JobContext and is used to wire up
 * the things a tool needs to run.
 * @param event AnyEvent
 * @returns
 */
export function interpretJob(event: AnyEvent): JobDescription {
  const ctx: JobDescription = {
    id: String(crypto.randomUUID()),
    isConsumer: false,
    isProducer: false,
    capability: "mcp",
    data: event.data,
  };
  switch (event.type) {
    case "job.mcp.queued":
      const e = event as AnyEvent<"job.mcp.queued">;

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

    default:
      throw new Error(
        `[worker-interpret-job] unknown event type ${event.type}`
      );
  }
}
