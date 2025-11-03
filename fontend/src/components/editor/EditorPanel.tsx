import React from 'react';
import SqlEditor from './SqlEditor';
import { useTabsStore } from '../../stores/useTabsStore';

const EditorPanel = ({ query, results, updateQuery, executeQuery, editorHeight, handleEditorMouseDown }) => {
  const { activeTabId } = useTabsStore();

  return (
    <div className="editor-and-result" style={{ height: `calc(100vh - 132px)` }}> {/* 调整高度以适应工具栏 */}
      <div className="editor-area" style={{ height: editorHeight }}>
        <SqlEditor query={query} setQuery={updateQuery} />
      </div>
      <div className="resizer editor-divider" onMouseDown={handleEditorMouseDown} />
      <div className="result-area">
        <div className="result-header">
          <div className="left-controls">
            <button className="icon-btn refresh-btn" onClick={executeQuery}>⟳</button>
            <span className="limit-text">Limit 1000</span>
          </div>
          <div className="right-controls">
            {results.length > 0 && <span className="row-count">{results.length} rows</span>}
          </div>
        </div>
        <div className="result-content">
          {results.length > 0 ? (
            <div className="result-table">
              <table>
                <thead>
                  <tr>
                    {results[0] && Object.keys(results[0]).map((key) => <th key={key}>{key}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value, i) => <td key={i}>{value}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Execute a query above to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;

// =========================================