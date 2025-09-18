import React from 'react'

export default function SqlEditor({ query, setQuery }) {
  return (
    <div className="sql-editor">
      <textarea value={query} onChange={(e) => setQuery(e.target.value)} />
    </div>
  )
}
