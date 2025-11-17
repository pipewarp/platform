

export function WorkflowItem() { 
  return (
    <li>
      <div>
        <button className="">Run</button>
      </div>
      <div className="workflow-details">
        <p className="workflow-name">
          WorkflowName
        </p>
        <p className="workflow-filename">filename.json</p>
        <p>A longer workflow description that describes what it does.</p>
      </div>
    </li>
  )
}