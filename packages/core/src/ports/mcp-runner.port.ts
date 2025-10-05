import { EventEnvelope } from "../types/event-bus.types";

export interface McpRunnerPort {
  start(): Promise<void>;
  stop(): Promise<void>;
}
