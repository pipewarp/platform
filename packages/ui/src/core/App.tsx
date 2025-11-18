import { useState } from "react";
import { useController } from "../context/ControllerContext.js";
import { Header } from "../layout/Header.js";
import { FlowManager } from "../components/FlowManager.js";

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
        <div id="divided-main">
          <div id="left-panel">
            <FlowManager />
          </div>
          <div id="right-panel">
            <h2>Observability</h2>
            <p>This is a panel that will hold observability information like connect/disconnect, live streaming events, etc.</p>
          </div>
        </div>
      </main>
    </>
  );
}
