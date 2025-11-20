import { useEffect, useState } from "react";
import { useController } from "../context/ControllerContext.js";
import { FlowFolder } from "./FlowFolder.js";
import { FlowStatusList } from "./FlowStatusList.js";
import { FlowList } from "@lcase/ports";

export function FlowManager() {
  const controller = useController();
  const [flowList, setFlowList] = useState<FlowList>({
    validFlows: {},
    invalidFlows: {},
  });
  const [flowDir, setFlowDir] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      if (flowDir) {
        const result = await controller.listFlows({ absoluteDirPath: flowDir });
        console.log("result:", result);
        setFlowList(result);
      }
    })();
  }, [flowDir]);

  const handleRefresh = async () => {
    if (flowDir) {
      const result = await controller.listFlows({ absoluteDirPath: flowDir });
      console.log("result:", result);
      setFlowList(result);
    }
  };

  return (
    <>
      <h2>Workflows</h2>
      <FlowFolder
        handleRefresh={handleRefresh}
        flowDir={flowDir}
        setFlowDir={setFlowDir}
      />

      <FlowStatusList list={flowList} />
    </>
  );
}
