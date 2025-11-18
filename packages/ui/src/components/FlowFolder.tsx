

export function FlowFolder(props: { handleRefresh: () => Promise<void> }) {
  const { handleRefresh } = props;

  return (
    <p className="workflow-folder-path"><button onClick={async() => { await handleRefresh()}}>refresh</button><button>folder</button>path/to/a/folder/somewhere</p>
  )
}