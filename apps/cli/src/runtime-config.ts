import type { RuntimeConfig } from "@pipewarp/runtime";


export const runtimeConfig = {
  bus: {
    id: "",
    placement: "embedded",
    transport: "event-emitter",
    store: "none"
  },
  queue: {
    id: "",
    placement: "embedded",
    transport: "deferred-promise",
    store: "none"
  },
  router: {
    id: ""
  },
  engine: {
    id: ""
  },
  worker: {
    id: "",
    capabilities: [{
      name: "mcp",
      queueId: "mcp",
      maxJobCount: 2,
      tool: {
        id: "mcp",
        type: "inprocess",
      },
    }]
  },
  stream: {
    id: ""
  },
  observability: {
    id: "",
    sinks: ["console-log-sink"],
  },
} satisfies RuntimeConfig;