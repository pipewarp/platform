import { Ports } from "../ports/ports.js";
import { Step, WarpStepSchema } from "../types/flow.types.js";
import type { StepExecutor, StepResult } from "../types/step-executor.type.js";

export const warpExecutor: StepExecutor = async (args: {
  step: Step;
  ports: Ports;
}): Promise<StepResult> => {
  const { ports, step } = args;

  const result = WarpStepSchema.safeParse(step);
  if (!result.success) {
    console.error("[warp executor] invalid warp step:", result.error);
    return {
      ok: false,
      result: {},
      error: { message: "Invalid warp step" },
    };
  }

  const warpStep = result.data;

  const out = await ports.invoker.invoke(
    warpStep.world,
    warpStep.level,
    warpStep.args
  );

  return { ok: true, result: { out } };
};
