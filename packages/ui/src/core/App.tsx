import { useState } from "react";
import { useController } from "../context/ControllerContext.js";
import { Header } from "../layout/Header.js";
import {  WorkflowList } from "../components/WorkflowList.js";
import { WorkflowFolder } from "../components/WorkflowFolder.js";
export function App() {
  const [runtimeStatus, setRuntimeStatus] = useState<string>("stopped");
  const controller = useController();



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
      <Header />
      <main>
        <h2>Workflows</h2>
        <WorkflowFolder/>
        <WorkflowList/>
      </main>
    </>
  );
}
