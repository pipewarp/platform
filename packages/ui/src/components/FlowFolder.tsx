import { useController } from "../context/ControllerContext.js";


export function FlowFolder(props: { handleRefresh: () => Promise<void>, flowDir: string | undefined, setFlowDir: (dir:string|undefined) => void; }) {
  const controller = useController();
  const { handleRefresh, flowDir, setFlowDir } = props;

  const handlePickDir = async () => { 
    if (controller.getFlowDir) { 
      const dir = await controller.getFlowDir();
      if (dir) {
        setFlowDir(dir)
        console.log("i saw", dir);
      }
    }
  };

  let displayPath: string | undefined = "";
  if (flowDir && flowDir.length > 30) {
     displayPath = "..." + flowDir.slice(flowDir.length - 30);
  }
  else {
    displayPath = flowDir
  }

  return (
    <p className="workflow-folder-path">
      <button onClick={async () => { await handleRefresh() }}>refresh</button>
      <button onClick={async () => { await handlePickDir() }}>folder</button>
      {displayPath}
    </p>
  )
}