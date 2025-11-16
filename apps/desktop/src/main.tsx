import React from "react";
import ReactDOM from "react-dom/client";
import { App, ControllerProvider  } from "@pipewarp/ui";
import "./index.css";
import { ElectronControllerClient } from "../electron/electron-controller.client.js";

const controller = new ElectronControllerClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ControllerProvider client={controller}>
      <App />
    </ControllerProvider>
  </React.StrictMode>
);

if (!window.ipcRenderer) {
  console.error('[renderer] ipcRenderer missing – did the preload fail?');
} else {
  window.ipcRenderer.on("main-process-message", (_event, message) => {
    console.log(message);
  });
}


// Use contextBridge
// window.ipcRenderer.on("main-process-message", (_event, message) => {
//   console.log(message);
// });
