import { EventEnvelope } from "../types/event-bus.types.js";

export interface McpRunnerPort {
  start(): Promise<void>;
  stop(): Promise<void>;
}
