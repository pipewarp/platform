import type { ValidFlowDescriptor } from "@pipewarp/ports";
import { useController } from "../context/ControllerContext.js";


export function FlowValidItem(props: { validFlow: { flowId: string, descriptor: ValidFlowDescriptor } }) { 
  const { validFlow } = props;
  const controller = useController();

  const handleRun = async () => {
    await controller.startFlow({ absoluteFilePath: validFlow.descriptor.absolutePath });
  };

  return (
    <li>
      <div>
        <button className="" onClick={async () => { await handleRun()}}>Run</button>
      </div>
      <div className="workflow-details">
        <p className="workflow-name">
          {validFlow.descriptor.name}
        </p>
        <p className="workflow-filename">{validFlow.descriptor.filename} - {validFlow.descriptor.version}</p>
        <p className="workflow-description">{validFlow.descriptor.description}</p>
      </div>
    </li>
  )
}