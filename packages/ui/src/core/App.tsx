import { useController } from "../context/ControllerContext.js";
import { Button } from "./Button.js";
export function App() {
  const controller = useController();

  const handleRuntimeClick = () => {
    console.log("hi");
    controller.startRuntime();
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
      <button onClick={() => handleRuntimeClick()}>Start Runtime</button>
      <button onClick={handleStartFlowClick}>Start Flow</button>
      <Button/>
    </div>
  );
}
