import { createContext, useContext } from "react";
import type { ControllerClient } from "@pipewarp/ports";


const ControllerContext = createContext<ControllerClient | null>(null);


export function ControllerProvider(props: {
  client: ControllerClient;
  children: React.ReactNode;
}) { 

  return (
    <ControllerContext.Provider value= { props.client } >
      { props.children }
    </ControllerContext.Provider>
    
  );
}

export function useController(): ControllerClient {
  const ctx = useContext(ControllerContext);
  if (!ctx) { 
    throw new Error("useController must be used within a ControllerProvider");
  }
  return ctx;
}