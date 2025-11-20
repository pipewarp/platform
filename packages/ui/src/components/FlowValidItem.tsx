import type { ValidFlowDescriptor } from "@lcase/ports";
import { useController } from "../context/ControllerContext.js";
import { useContext } from "react";
import { AppContext } from "../context/AppContext.js";

export function FlowValidItem(props: {
  validFlow: { flowId: string; descriptor: ValidFlowDescriptor };
}) {
  const { validFlow } = props;
  const ctx = useContext(AppContext);
  if (!ctx) {
    console.error("[flow-valid-item] must provide app context");
    return;
  }
  const controller = useController();

  const handleRun = async () => {
    await controller.startFlow({
      absoluteFilePath: validFlow.descriptor.absolutePath,
    });
  };

  return (
    <li>
      <div>
        <button
          className=""
          onClick={async () => {
            await handleRun();
          }}
          disabled={ctx.isRuntimeRunning ? false : true}
        >
          Run
        </button>
      </div>
      <div className="workflow-details">
        <p className="workflow-name">{validFlow.descriptor.name}</p>
        <p className="workflow-filename">
          {validFlow.descriptor.filename} - {validFlow.descriptor.version}
        </p>
        <p className="workflow-description">
          {validFlow.descriptor.description}
        </p>
      </div>
    </li>
  );
}
