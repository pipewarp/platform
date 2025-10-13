import { LevelInvokerPort } from "./level-invoker.port.js";

// general package shape of ports for dependency injection
// unsure what this should be named long term
export interface Ports {
  invoker: LevelInvokerPort;
}
