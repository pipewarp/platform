import { useState } from "react";
import { useController } from "../context/ControllerContext.js";
import { Button } from "./Button.js";
import { Dashboard } from "../layout/Dashboard.js";
import { Header } from "../layout/Header.js";
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
    <>
      <Header/>
    </>
  );
}
