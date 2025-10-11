import { EventEnvelope } from "./event-bus.port.js";

export interface McpRunnerPort {
  start(): Promise<void>;
  stop(): Promise<void>;
}
