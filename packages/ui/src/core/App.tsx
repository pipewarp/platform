import { useState } from "react";
import { useController } from "../context/ControllerContext.js";
import { Header } from "../layout/Header.js";
import { FlowManager } from "../components/FlowManager.js";
import { ObsPanel } from "../components/observability/ObsPanel.js";

export function App() {
  const [runtimeStatus, setRuntimeStatus] = useState<string>("stopped");
  const controller = useController();

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
            <ObsPanel />
            <p>
              This is a panel that will hold observability information like
              connect/disconnect, live streaming events, etc.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
