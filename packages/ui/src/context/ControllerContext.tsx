import { createContext, useContext } from "react";
import type { ControllerPort } from "@pipewarp/ports";

const ControllerContext = createContext<ControllerPort | null>(null);

export function ControllerProvider(props: {
  controller: ControllerPort;
  children: React.ReactNode;
}) { 

  return (
    <ControllerContext.Provider value={props.controller}>
      { props.children }
    </ControllerContext.Provider>
  );
}

export function useController(): ControllerPort {
  const ctx = useContext(ControllerContext);
  if (!ctx) { 
    throw new Error("useController must be used within a ControllerProvider");
  }
  return ctx;
}