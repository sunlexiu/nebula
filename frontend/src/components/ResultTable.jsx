// \frontend\src\components\ResultTable.jsx
import React from 'react'

export default function ResultTable({ data }) {
  if (!data || data.length === 0) {
    return <div className="result-table">No results</div>
  }
  const cols = Object.keys(data[0])
  return (
    <div className="result-table">
      <table>
        <thead>
          <tr>
            {cols.map(c => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {cols.map(col => <td key={col + i}>{String(row[col] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}