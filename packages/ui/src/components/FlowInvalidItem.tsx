import type { InvalidFlowDescriptor } from "@lcase/ports";

export function FlowInvalidItem(props: {
  invalidFlow: { path: string; descriptor: InvalidFlowDescriptor };
}) {
  const { invalidFlow } = props;

  let displayPath = "";
  if (invalidFlow.path.length > 25) {
    displayPath = "..." + invalidFlow.path.slice(invalidFlow.path.length - 25);
  } else {
    displayPath = invalidFlow.path;
  }
  return (
    <li>
      <div className="invalid-workflow-details">
        <p className="invalid-workflow-name">{displayPath}</p>
        <p className="invalid-workflow-error">
          {invalidFlow.descriptor.errorMessage}
        </p>
      </div>
    </li>
  );
}
