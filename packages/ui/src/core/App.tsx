import { useState } from "react";
import { useController } from "../context/ControllerContext.js";
import { Button } from "./Button.js";
export function App() {
  const [runtimeStatus, setRuntimeStatus] = useState<string>("stopped");
  const controller = useController();


  const handleRuntimeClick = async () => {
    const result = await controller.startRuntime();
    if (result) setRuntimeStatus("started")
  };
  const handleStartFlowClick = async() => {
    await controller.startFlow({
      flow: {
        id: "flow-id",
        name: "flow-name",
        version: "flow-version"
      },
      flowName: "flow-name",
      inputs: {},
      outfile: "output.something.json"
    });
  }
  return (
    <div>
      <h3>Runtime: { runtimeStatus }</h3>
      <button onClick={() => handleRuntimeClick()}>Start Runtime</button>
      <button onClick={handleStartFlowClick}>Start Flow</button>
    </div>
  );
}
