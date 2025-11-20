import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { bootstrap } from "./bootstrap.js";

// import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runtimeConfig } from "./runtime-config.js";
import { ElectronSink } from "./electron.sink.js";

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
export const { controller } = bootstrap(runtimeConfig);

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  /**
   * need to return this sink for future control (start/stop) functionality)
   */
  const electronSink = new ElectronSink("electron-sink", win);

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    electronSink.start();
    controller.attachSink(electronSink);
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

ipcMain.handle("controller:startRuntime", async (): Promise<string> => {
  return await controller.startRuntime();
});
ipcMain.handle("controller:startFlow", async (_event, args) => {
  await controller.startFlow(args);
});
ipcMain.handle("controller:stopRuntime", async () => {
  return await controller.stopRuntime();
});
ipcMain.handle(
  "controller:listFlows",
  async (_event, args: { absoluteDirPath?: string }) => {
    // dialog.showOpenDialog({properties: ["openDirectory"]})
    return await controller.listFlows(args);
  }
);
ipcMain.handle("controller:pickFlowDir", async () => {
  const path = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  console.log(path);
  return path.filePaths;
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
