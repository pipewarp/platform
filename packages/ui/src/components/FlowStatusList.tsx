import { FlowList } from "@lcase/ports";
import { FlowValidItem } from "./FlowValidItem.js";
import { FlowInvalidItem } from "./FlowInvalidItem.js";

export function FlowStatusList(props: { list: FlowList }) {
  const { validFlows } = props.list;
  const { invalidFlows } = props.list;
  console.log(validFlows);
  return (
    <div id="workflow-list-container">
      <ul id="workflow-list">
        {Object.entries(validFlows).map(([flowId, flowEntry], index) => {
          return (
            <FlowValidItem
              key={index}
              validFlow={{ flowId, descriptor: flowEntry }}
            />
          );
        })}
        {Object.entries(invalidFlows).map(([path, flowEntry], index) => {
          return (
            <FlowInvalidItem
              key={index}
              invalidFlow={{ path, descriptor: flowEntry }}
            />
          );
        })}
      </ul>
    </div>
  );
}
