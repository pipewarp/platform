/// <reference types="vite-plugin-electron/electron-env" />
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

type IpcOnArgs = Parameters<typeof import("electron")["ipcRenderer"]["on"]>;
type IpcOn = (...args: IpcOnArgs) => () => void;

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import("electron").IpcRenderer;
  electronAPI?: {
    invoke: (channel: string, payload: unknown) => Promise<unknown>;
    on: IpcOn;
  };
}
