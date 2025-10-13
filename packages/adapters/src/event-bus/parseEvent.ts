import {
  type EventEnvelope,
  StepQueuedEventSchema,
  FlowQueuedSchema,
} from "@pipewarp/ports";
import { z } from "zod";

const SchemaMap = new Map<string, z.ZodTypeAny>([
  ["flow.queued", FlowQueuedSchema],
  ["step.queued", StepQueuedEventSchema],
]);

export function parseEvent(
  kind: string,
  event: unknown
): EventEnvelope | undefined {
  if (event === undefined) {
    console.error("Unable to parse event; event undefined");
    return;
  }

  if (!SchemaMap.has(kind)) {
    console.error("Unable to parse event; unknown kind:", kind);
    return;
  }

  const schema = SchemaMap.get(kind);
  if (schema === undefined) {
    console.error("Schema is undefined for event kind: ", kind);
    return;
  }

  const result = schema.safeParse(event);
  if (result.error) {
    console.error(`Error parsing event kind: ${kind}; error:`, result.error);
    return;
  }

  return result.data as EventEnvelope;
}
