

export type Placement = "embedded" | "remote";
export type Transport =
  | "local"
  | "deferred-promise"
  | "async-iterable"
  | "event-emitter"
  | "redis"
  | "kafka"
  | "http";
export type Store = "none" | "jsonl" | "sqlite";



export type Factory = (args?: unknown) => unknown;
export type Registry = Partial<{
  [P in Placement]: Partial<{
    [T in Transport]: Partial<{
      [S in Store]: Factory;
    }>;
  }>;
}>;
