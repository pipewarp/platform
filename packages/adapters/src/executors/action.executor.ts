import { Ports } from "@pipewarp/ports";
import { Step, WarpStepSchema } from "@pipewarp/specs";
import type { StepExecutor, StepResult } from "@pipewarp/ports";

export const actionExecutor: StepExecutor =
  async (args: {}): Promise<StepResult> => {
    // const { ports, step } = args;

    // const result = WarpStepSchema.safeParse(step);
    // if (!result.success) {
    //   console.error("[warp executor] invalid warp step:", result.error);
    //   return {
    //     ok: false,
    //     result: {},
    //     error: { message: "Invalid warp step" },
    //   };
    // }

    // const warpStep = result.data;

    // const out = await ports.invoker.invoke(
    //   warpStep.world,
    //   warpStep.level,
    //   warpStep.args
    // );

    return { ok: true, result: {} };
  };
