// brand helper type to make some branded types
type Brand<T, B extends string> = T & { __brand: B };

// types to distinguish these values, instead of string types
export type FlowId = Brand<string, "FlowId">;
export type RunId = Brand<string, "RunId">;
export type StepId = Brand<string, "StepId">;
export type TaskId = Brand<string, "TaskId">;
