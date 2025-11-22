import type { RuntimeConfig } from "@lcase/runtime";

export const config = {
  bus: {
    id: "",
    placement: "embedded",
    transport: "event-emitter",
    store: "none",
  },
  queue: {
    id: "",
    placement: "embedded",
    transport: "deferred-promise",
    store: "none",
  },
  router: {
    id: "",
  },
  engine: {
    id: "",
  },
  worker: {
    id: "default-worker",
    capabilities: [
      {
        name: "mcp",
        queueId: "mcp",
        maxJobCount: 2,
        tool: {
          id: "mcp",
          type: "inprocess",
        },
      },
      {
        name: "httpjson",
        queueId: "httpjson",
        maxJobCount: 2,
        tool: {
          id: "httpjson",
          type: "inprocess",
        },
      },
    ],
  },
  stream: {
    id: "",
  },
  observability: {
    id: "",
    sinks: ["console-log-sink"],
  },
} satisfies RuntimeConfig;
