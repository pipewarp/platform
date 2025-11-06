import { StepOtelAttributesMap } from "@pipewarp/types";

export const stepOtelAttributes = {
  "step.action.completed": {
    domain: "step" as const,
    entity: "action" as const,
    action: "completed" as const,
  },
  "step.action.queued": {
    domain: "step" as const,
    entity: "action" as const,
    action: "queued" as const,
  },
  "step.mcp.queued": {
    action: "queued" as const,
    domain: "step" as const,
    entity: "mcp" as const,
  },
} satisfies StepOtelAttributesMap;
