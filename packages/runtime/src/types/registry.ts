// export type Location = "embedded";
// type InMemory = "in-memory";
// type Redis = "redis";
// type RedisStream = "redis-stream";
// type Kafka = "kafka";
// type Jsonl = "jsonl";
// type Json = "json";
// type Sqlite = "sqlite";
// type None = "none";
// type FileBlob = "file-blob";

// type Embedded = "embedded";

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

// type PlacementTransportStoreBus<
//   P extends Placement,
//   T extends Transport,
//   S extends Store,
//   B extends EventBusPort
// > = {
//   [K in `${P}:${T}:${S}`]: () => B;
// };

export type PlacementTransportStore<
  P extends Placement,
  T extends Transport,
  S extends Store
> = `${P}:${T}:${S}`;

export type Factory = (args?: unknown) => unknown;
export type Registry = Partial<{
  [P in Placement]: Partial<{
    [T in Transport]: Partial<{
      [S in Store]: Factory;
    }>;
  }>;
}>;
