import React from "react";
import ReactDOM from "react-dom/client";
// import App from "./App.tsx";
import { AppTwo } from "@pipewarp/ui";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppTwo />
  </React.StrictMode>
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});
