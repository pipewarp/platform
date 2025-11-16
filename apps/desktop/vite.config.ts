import { defineConfig } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";
// Electron 30 ~= Node 20, Chromium ~124
const ELECTRON_NODE = "node20";
const ELECTRON_CHROME = "chrome124";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: "electron/main.ts",
        // customized vite build
        vite: {
          build: {
            sourcemap: true, // main process debug helpful
            target: ELECTRON_NODE,
            outDir: "dist-electron",
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, "electron/preload.ts"),
        vite: {
          build: {
            sourcemap: true,
            target: ELECTRON_NODE,
            outDir: "dist-electron", // keep main & preload side-by-side
            // rollupOptions: { output: {format: "cjs", entryFileNames: "preload.cjs", chunkFileNames: "preload.[name].cjs"} }
          },
        },
        
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer:
        process.env.NODE_ENV === "test"
          ? // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
            undefined
          : {},
    }),
  ],
  resolve: {
    alias: {
      // Example aliases into your workspace packages’ *source* (adjust paths)
      "@pipewarp/ui": path.resolve(__dirname, "../../packages/ui/src"),
      // "@pipewarp/runtime": path.resolve(__dirname, "../../packages/runtime/src"),
      // '@pipewarp/app-logic': path.resolve(__dirname, '../../packages/app-logic/src'),
      "@pipewarp/engine": path.resolve(__dirname, "../../packages/engine/src"),
      "@pipewarp/ports": path.resolve(__dirname, "../../packages/ports/src"),
      "@pipewarp/types": path.resolve(__dirname, "../../packages/types/src"),
    },
    // Avoid two copies of React (common in monorepos)
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: ELECTRON_CHROME, // renderer target (Chromium in your Electron)
    sourcemap: true,
    outDir: "dist", // default; leave as-is if you like
  },
  // Don’t try to prebundle Electron or Node built-ins
  optimizeDeps: {
    exclude: ["electron", "electron-devtools-installer"],
  },
  // define env for libs that read NODE_ENV at build time
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV ?? "development"
    ),
  },
});
