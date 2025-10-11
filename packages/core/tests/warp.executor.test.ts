import { describe, expect, it } from "vitest";
import { warpExecutor } from "../src/executors";
import type { RunContext } from "../src/types/engine.types";
import { WarpStep } from "../src/types/flow.types";
import { Ports } from "../src/ports/ports";

describe("warpExecutor test", () => {
  it("invokes a world + level and gets a result", async () => {
    const ctx: RunContext = {
      flowName: "test-flow",
      exports: {},
      globals: {},
      inputs: {},
      runId: "test-id",
      status: "running",
      steps: {},
    };

    const step: WarpStep = {
      type: "warp",
      world: "test-world",
      level: "test-level",
    };

    const ports: Ports = {
      invoker: {
        invoke: async () => ({ ok: true, data: "test-data" }),
      },
    };
    const args = { ctx, ports, step };
    const result = await warpExecutor(args);

    expect(result.ok).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.error).toBeUndefined();
  });
});
