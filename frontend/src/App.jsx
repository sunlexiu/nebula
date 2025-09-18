import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./components/sidebar/Sidebar.jsx";
import "./css/index.css";

export default function App() {
  // Sidebar 宽度
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const isResizingSidebar = useRef(false);

  // Editor 高度
  const [editorHeight, setEditorHeight] = useState(200);
  const isResizingEditor = useRef(false);

  // Tabs
  const [tabs, setTabs] = useState([
    { id: 1, title: "SQL Query 1", query: "", results: [] },
  ]);
  const [activeTabId, setActiveTabId] = useState(1);

  // 拖拽状态
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const [isEditorDragging, setIsEditorDragging] = useState(false);

  // 拖拽鼠标事件
  const handleSidebarMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingSidebar.current = true;
    setIsSidebarDragging(true);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  const handleEditorMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingEditor.current = true;
    setIsEditorDragging(true);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e) => {
    if (isResizingSidebar.current) {
      const newWidth = Math.min(Math.max(e.clientX, 180), 500);
      setSidebarWidth(newWidth);
    }
    if (isResizingEditor.current) {
      const newHeight = Math.min(
        Math.max(e.clientY - 56, 120),
        window.innerHeight * 0.7 - 56
      );
      setEditorHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    if (isResizingSidebar.current || isResizingEditor.current) {
      isResizingSidebar.current = false;
      isResizingEditor.current = false;
      setIsSidebarDragging(false);
      setIsEditorDragging(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    window.addEventListener("mousemove", handleGlobalMouseMove, { passive: true });
    window.addEventListener("mouseup", handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) || { query: "", results: [] };

  const updateQuery = (newQuery) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, query: newQuery } : t
      )
    );
  };

  const executeQuery = () => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, results: mockExecute(t.query) }
          : t
      )
    );
  };

  const mockExecute = (query) => {
    if (!query.trim()) return [];
    return [
      { id: 1, name: "Alice", age: 20, email: "alice@example.com" },
      { id: 2, name: "Bob", age: 25, email: "bob@example.com" },
      { id: 3, name: "Charlie", age: 30, email: "charlie@example.com" },
    ];
  };

  const addTab = () => {
    const newId = Date.now();
    setTabs((prev) => [
      ...prev,
      { id: newId, title: `SQL Query ${prev.length + 1}`, query: "", results: [] },
    ]);
    setActiveTabId(newId);
  };

  const closeTab = (id) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTabId === id && tabs.length > 1) {
      const remaining = tabs.filter((t) => t.id !== id);
      setActiveTabId(remaining[0].id);
    } else if (tabs.length === 1) {
      setActiveTabId(null);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
        <Sidebar />
        <div
          className={`resizer sidebar-resizer ${isSidebarDragging ? 'dragging' : ''}`}
          onMouseDown={handleSidebarMouseDown}
        />
      </div>

      {/* Main Panel */}
      <div className="main-panel">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-left">
            <button className="btn btn-primary" onClick={addTab}>
              New Query
            </button>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-execute" onClick={executeQuery}>
              Run
            </button>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="tabs-container">
            <div className="tabs-header">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`tab-item ${tab.id === activeTabId ? "active" : ""}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className="tab-title">{tab.title}</span>
                  {tabs.length > 1 && (
                    <button
                      className="tab-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SQL Editor + Result */}
        <div className="editor-and-result">
          <div 
            className="editor-area" 
            style={{ height: `${editorHeight}px` }}
          >
            <div className="sql-editor">
              <textarea
                value={activeTab.query}
                onChange={(e) => updateQuery(e.target.value)}
                placeholder="Write your SQL here..."
                rows="5"
              />
            </div>
          </div>

          <div 
            className={`resizer editor-divider ${isEditorDragging ? 'dragging' : ''}`}
            onMouseDown={handleEditorMouseDown}
          />

          <div className="result-area">
            <div className="result-header">
              <div className="left-controls">
                <button className="icon-btn refresh-btn" onClick={executeQuery}>
                  ⟳
                </button>
                <span className="limit-text">Limit 1000</span>
              </div>
              <div className="right-controls">
                {activeTab.results.length > 0 && (
                  <span className="row-count">
                    {activeTab.results.length} rows
                  </span>
                )}
              </div>
            </div>
            
            <div className="result-content">
              {activeTab.results.length > 0 ? (
                <div className="result-table">
                  <table>
                    <thead>
                      <tr>
                        {activeTab.results[0] &&
                          Object.keys(activeTab.results[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeTab.results.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, i) => (
                            <td key={i}>{value}</td>
                          ))}
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
      </div>
    </div>
  );
}