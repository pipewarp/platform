import { useState } from "react";
import { useController } from "../context/ControllerContext.js";

export function RuntimeControls() {
  const controller = useController();
  const [runtimeStatus, setRuntimeStatus] = useState<string>("stopped");

  const runtimeButtonText = runtimeStatus === "stopped" ? "Start" : "Stop";
  return (
    <div id="runtime-ctrl">
      <p>Runtime: <span className="bold">{runtimeStatus}</span></p>
      <button id="runtime-btn" className={runtimeStatus === "stopped" ? "runtime-stopped" : "runtime-running"}>{runtimeButtonText}</button>
    </div>
  );

 }