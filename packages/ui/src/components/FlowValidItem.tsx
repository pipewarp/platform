import type { ValidFlowDescriptor } from "@pipewarp/ports";


export function FlowValidItem(props: {validFlow: {flowId: string, descriptor: ValidFlowDescriptor}}) { 
  const { validFlow } = props;

  return (
    <li>
      <div>
        <button className="">Run</button>
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