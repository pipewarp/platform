import React from "react";
import ReactDOM from "react-dom/client";
import { App, ControllerProvider  } from "@pipewarp/ui";
import "./index.css";
import { ElectronController } from "../electron/electron-controller.client.js";

const electronController = new ElectronController();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ControllerProvider controller={electronController}>
      <App />
    </ControllerProvider>
  </React.StrictMode>
);

window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});
