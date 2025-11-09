// import type { StepHandler } from "./step-handler.js";
// import type { ResolveStepArgs } from "../resolve.js";
// import type { AnyEvent } from "@pipewarp/types";
// import type { RunContext, ActionStep, Flow } from "@pipewarp/specs";
// import { StepEmitter } from "@pipewarp/events";
// import { PipeResolver } from "../pipe-resolver.js";

// export class ActionStepHandler implements StepHandler {
//   constructor(
//     private readonly resolveArgs: ResolveStepArgs,
//     private readonly pipeResolver: PipeResolver
//   ) {}

//   async queue(
//     flow: Flow,
//     context: RunContext,
//     stepName: string,
//     emitter: StepEmitter
//   ): Promise<void> {
//     const step: ActionStep = flow.steps[stepName] as ActionStep;

//     const args = step.args ? this.resolveArgs(context, step.args) : undefined;

//     const pipes = this.pipeResolver.resolve(flow, context, stepName);
//     try {
//       await emitter.emit("step.action.queued", {
//         tool: step.tool,
//         op: step.op,
//         args,
//         pipe: pipes,
//       });
//       context.steps[stepName].status = "queued";
//     } catch (err) {
//       console.error(
//         `[action-step-handler] emitting step ${stepName} in flow ${flow.name}`
//       );
//       console.error(err);
//     }
//   }

//   onWorkerDone(
//     flow: Flow,
//     context: RunContext,
//     event: AnyEvent
//   ): Promise<void> {
//     throw new Error("Method not implemented.");
//   }
// }
