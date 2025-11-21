import { PipeStepFields } from "../events/shared/pipe.js";

export type StepHttpJson = {
  type: "httpjson";
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pipe?: PipeStepFields;
};
