import { useState } from "react";
import { useController } from "../context/ControllerContext.js"
import { FlowFolder } from "./FlowFolder.js"
import { FlowStatusList } from "./FlowStatusList.js"
import { FlowList } from "@pipewarp/ports";


export function FlowManager() { 
  const controller = useController();
  const [flowList, setFlowList] = useState<FlowList>({validFlows: {}, invalidFlows: {}});

  const handleRefreshFlows = async () => { 
    console.log("called handleRefreshFlows()")
    const dir = "/Users/andrew/dev/pipewarp/platform/apps/desktop/flows";
    const result = await controller.listFlows({ absoluteDirPath: dir });
    console.log("result:", result);
    setFlowList(result);
  }

  return (
    <>
      <h2>Workflows</h2>
      <FlowFolder handleRefresh={handleRefreshFlows} />
      
      <FlowStatusList list={flowList}/>
    </>
  )
}