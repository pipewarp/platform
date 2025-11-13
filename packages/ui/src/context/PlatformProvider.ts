// import { createContext } from "react";
// import type { PlatformAdapter } from "./PlatformAdapter.js";
// import { useContext } from "react";

// const ctx = createContext<PlatformAdapter | null>(null);

// export const PlatformProvider = ctx.Provider;
// export const usePlatform = () => {
//   const v = useContext(ctx);
//   if (!v) throw new Error("unable to create context");
//   return;
// };

// const platform = usePlatform();
// async function handleRun() {
//   const result = await platform.runFlow({
//     /* demo */
//   });
//   console.log(result);
// }
