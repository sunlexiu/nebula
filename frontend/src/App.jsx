import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./components/sidebar/Sidebar.jsx";
import ToolbarTop from "./components/toptoolbar/ToolbarTop.jsx";
import "./css/index.css";

export default function App() {
  // Sidebar 宽度
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const isResizingSidebar = useRef(false);

  // Editor 高度
  const [editorHeight, setEditorHeight] = useState(300); // 增加默认高度
  const isResizingEditor = useRef(false);

  // Tabs
  const [tabs, setTabs] = useState([
    { id: 1, title: "SQL Query 1", query: "", results: [] },
  ]);
  const [activeTabId, setActiveTabId] = useState(1);

  // Tab滚动状态
  const [showTabScroll, setShowTabScroll] = useState(false);
  const [tabScrollLeft, setTabScrollLeft] = useState(0);
  const tabsContainerRef = useRef(null);

  // 拖拽状态
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const [isEditorDragging, setIsEditorDragging] = useState(false);

  // DOM 引用
  const sidebarRef = useRef(null);
  const editorAreaRef = useRef(null);
  const editorDividerRef = useRef(null);

  // 检查tab是否需要滚动
  const checkTabOverflow = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      setShowTabScroll(scrollWidth > clientWidth);
    }
  };

  // 处理tab滚动
  const handleTabScroll = (direction) => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const scrollAmount = 200;
      if (direction === 'left') {
        container.scrollLeft = Math.max(0, container.scrollLeft - scrollAmount);
      } else {
        container.scrollLeft = Math.min(
          container.scrollWidth - container.clientWidth,
          container.scrollLeft + scrollAmount
        );
      }
    }
  };

  // 拖拽鼠标事件
  const handleSidebarMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingSidebar.current = true;
    setIsSidebarDragging(true);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    document.body.classList.add('dragging');
  };

  const handleEditorMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingEditor.current = true;
    setIsEditorDragging(true);

    const initialMouseY = e.clientY;
    const initialEditorHeight = editorHeight;

    const dividerRect = editorDividerRef.current?.getBoundingClientRect();
    const initialOffset = dividerRect ? initialMouseY - dividerRect.top : 0;

    isResizingEditor.current = {
      initialMouseY,
      initialEditorHeight,
      initialOffset
    };

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    document.body.classList.add('dragging');
  };

  const handleMouseMoveOptimized = useRef((e) => {
    if (isResizingSidebar.current) {
      const newWidth = Math.min(Math.max(e.clientX, 180), 500);
      if (sidebarRef.current) {
        sidebarRef.current.style.width = `${newWidth}px`;
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
      }
      setSidebarWidth(newWidth);
    }

    if (isResizingEditor.current) {
      const resizeState = isResizingEditor.current;
      const currentMouseY = e.clientY;
      const newHeight = resizeState.initialEditorHeight + (currentMouseY - resizeState.initialMouseY);

      const minHeight = 150; // 增加最小高度
      const maxHeight = window.innerHeight * 0.8; // 增加最大高度
      const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);

      if (editorAreaRef.current) {
        editorAreaRef.current.style.height = `${clampedHeight}px`;
        document.documentElement.style.setProperty('--editor-height', `${clampedHeight}px`);
      }
      setEditorHeight(clampedHeight);
    }
  }).current;

  const handleMouseUp = () => {
    if (isResizingSidebar.current || isResizingEditor.current) {
      isResizingSidebar.current = false;
      isResizingEditor.current = false;
      setIsSidebarDragging(false);
      setIsEditorDragging(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
      document.body.classList.remove('dragging');
    }
  };

  useEffect(() => {
    let rafId;
    const handleGlobalMouseMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => handleMouseMoveOptimized(e));
    };
    const handleGlobalMouseUp = () => handleMouseUp();

    window.addEventListener("mousemove", handleGlobalMouseMove, { passive: true });
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [handleMouseMoveOptimized]);

  useEffect(() => {
    const timeoutId = setTimeout(checkTabOverflow, 100);
    return () => clearTimeout(timeoutId);
  }, [tabs]);

  useEffect(() => {
    const handleResize = () => checkTabOverflow();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    document.documentElement.style.setProperty('--editor-height', `${editorHeight}px`);
  }, [sidebarWidth, editorHeight]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || { query: "", results: [] };

  const updateQuery = (newQuery) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, query: newQuery } : t))
    );
  };

  const executeQuery = () => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, results: mockExecute(t.query) } : t
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
     <ToolbarTop /> {/* Use the new component */}
      <div
        ref={sidebarRef}
        className={`sidebar ${isSidebarDragging ? 'dragging-parent' : ''}`}
      >
        <Sidebar />
        <div
          className={`resizer sidebar-resizer ${isSidebarDragging ? 'dragging' : ''}`}
          onMouseDown={handleSidebarMouseDown}
        />
      </div>

      {/* Main Panel */}
      <div className="main-panel">
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

        {tabs.length > 0 && (
          <div className="tabs-container">
            {showTabScroll && (
              <button
                className="tab-scroll-btn tab-scroll-left"
                onClick={() => handleTabScroll('left')}
              >
                ‹
              </button>
            )}

            <div className="tabs-header" ref={tabsContainerRef}>
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`tab-item ${tab.id === activeTabId ? "active" : ""}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className="tab-title" title={tab.title}>
                    {tab.title}
                  </span>
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

            {showTabScroll && (
              <button
                className="tab-scroll-btn tab-scroll-right"
                onClick={() => handleTabScroll('right')}
              >
                ›
              </button>
            )}

            {tabs.length > 1 && (
              <div className="tab-counter">
                Tab {tabs.findIndex(t => t.id === activeTabId) + 1} of {tabs.length}
              </div>
            )}
          </div>
        )}

        <div className="editor-and-result">
          <div
            ref={editorAreaRef}
            className={`editor-area ${isEditorDragging ? 'dragging' : ''}`}
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
            ref={editorDividerRef}
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