import React from 'react'

export default function Toolbar({ onExecute }) {
  return (
    <div className="toolbar">
      <button className="btn" title="New Connection">➕ New Connection</button>
      <div style={{flex:1}} />
      <button className="btn execute" onClick={onExecute}>▶ Execute</button>
    </div>
  )
}
