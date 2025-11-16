import { useState } from "react";
import { useController } from "../context/ControllerContext.js";
import { RuntimeStatus } from "@pipewarp/ports";

export function RuntimeControls() {
  const controller = useController();
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>("stopped");

  const handleRuntimeClick = async () => {
    if (runtimeStatus === "stopped") {
      const result = await controller.startRuntime();
      if (result) setRuntimeStatus(result)
    }
    else if (runtimeStatus === "running") {
      const result = await controller.stopRuntime();
      if (result) setRuntimeStatus(result)
    }
  };
  
  const runtimeButtonText = runtimeStatus === "stopped" ? "Start" : "Stop";
  const runtimeButtonClass = runtimeStatus === "stopped" ? "runtime-stopped" : "runtime-running";

  return (
    <div id="runtime-ctrl">
      <p>Runtime: <span className="bold">{runtimeStatus}</span></p>
      <button id="runtime-btn" className={runtimeButtonClass} onClick={handleRuntimeClick}>{runtimeButtonText}</button>
    </div>
  );
 }