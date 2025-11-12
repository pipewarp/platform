import type { RunContext, StepArgs } from "@pipewarp/specs";

export type ResolveStepArgs = typeof resolveStepArgs;
export function split(path: string): string[] {
  return path ? path.split(".") : [];
}

// dig through object to see if we can get a data type from context
export function resolvePath<T = unknown>(
  obj: Record<string, any>,
  parts: string[]
): T | unknown {
  let current: unknown = obj; // any or unknown here?
  for (const p of parts) {
    if (current === null || typeof current !== "object" || !(p in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[p];
  }
  return current;
}

export function resolveStepArgs(
  context: RunContext,
  stepArgs: StepArgs
): Record<string, unknown> {
  if (!stepArgs) return {};

  // one level deep not recursive
  for (const [k, v] of Object.entries(stepArgs)) {
    if (typeof v === "string") {
      // see if its a selector
      const selector = getSelector(v);
      if (selector) {
        const contextValue = getContextValue(context, selector);
        // console.log(`[resolver] arg key ${k} had value ${v}`);
        // console.log(`[resolver] now it has ${contextValue}`);
        stepArgs[k] = contextValue;
      }
    }
  }
  return stepArgs;
}

// see if a string is a selector
export function getSelector(arg: string): string | false {
  const regex = /^\${([a-zA-Z\.]+)}$/; // ${text.like.this}
  const match = arg.match(regex);

  if (!match) return false;
  // console.log(`[resolver] found match ${match[1]} in arg ${arg}`);
  return match[1];
}

export function getContextValue(
  context: RunContext,
  selector: string
): Record<string, unknown> | undefined {
  const [root, stepName, ...keys] = selector.split(".");
  if (keys.length === 0 || root !== "steps" || !stepName) return;
  if (!context.steps[stepName]) return;

  // console.log(`[resolver] got keys ${keys}`);

  // selector steps.transcribe.text.url
  // keys = ["text", "url"]

  // console.log(`[resolver] full context\n`, JSON.stringify(context, null, 2));

  let c: Record<string, unknown> | undefined = context.steps[stepName].result;
  if (!c) return;

  for (const k of keys) {
    if (!c || typeof c !== "object" || !(k in c)) return;
    c = c[k] as Record<string, unknown>;
  }
  return c;
}
