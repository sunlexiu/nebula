import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/sidebar/Sidebar.jsx';
import ToolbarTop from './components/toptoolbar/ToolbarTop.jsx';
import SqlEditor from './components/SqlEditor.jsx';
import { format } from 'sql-formatter';
import './css/index.css';

import FormatIcon from './public/icons/toptoolbar/format_1.svg';
import RunIcon from './public/icons/toptoolbar/run_1.svg';
import StopIcon from './public/icons/toptoolbar/stop_1.svg';

export default function App() {
  // Sidebar 宽度
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const isResizingSidebar = useRef(false);

  // Editor 高度
  const [editorHeight, setEditorHeight] = useState(300);
  const isResizingEditor = useRef(false);

  // Tabs
  const [tabs, setTabs] = useState([
    { id: 1, title: 'Query 1', query: '', results: [] },
  ]);
  const [activeTabId, setActiveTabId] = useState(1);

  // Tab 滚动状态
  const [showTabScroll, setShowTabScroll] = useState(false);
  const tabsContainerRef = useRef(null);

  // 拖拽状态
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const [isEditorDragging, setIsEditorDragging] = useState(false);

  // DOM 引用
  const sidebarRef = useRef(null);
  const editorAreaRef = useRef(null);
  const editorDividerRef = useRef(null);

  // 检查 Tab 是否需要滚动
  const checkTabOverflow = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      setShowTabScroll(scrollWidth > clientWidth);
    }
  };

  // 处理 Tab 滚动
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

  // 拖拽鼠标事件 - 侧边栏
  const handleSidebarMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingSidebar.current = true;
    setIsSidebarDragging(true);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('dragging');
  };

  // 拖拽鼠标事件 - 编辑器高度
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
      initialOffset,
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('dragging');
  };

  // 鼠标移动处理（优化性能）
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

      const minHeight = 150;
      const maxHeight = window.innerHeight * 0.8;
      const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);

      if (editorAreaRef.current) {
        editorAreaRef.current.style.height = `${clampedHeight}px`;
        document.documentElement.style.setProperty('--editor-height', `${clampedHeight}px`);
      }
      setEditorHeight(clampedHeight);
    }
  }).current;

  // 鼠标松开处理
  const handleMouseUp = () => {
    if (isResizingSidebar.current || isResizingEditor.current) {
      isResizingSidebar.current = false;
      isResizingEditor.current = false;
      setIsSidebarDragging(false);
      setIsEditorDragging(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.classList.remove('dragging');
    }
  };

  // 全局鼠标事件监听
  useEffect(() => {
    let rafId;
    const handleGlobalMouseMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => handleMouseMoveOptimized(e));
    };
    const handleGlobalMouseUp = () => handleMouseUp();

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [handleMouseMoveOptimized]);

  // 检查 Tab 溢出
  useEffect(() => {
    const timeoutId = setTimeout(checkTabOverflow, 100);
    return () => clearTimeout(timeoutId);
  }, [tabs]);

  // 窗口大小变化时检查 Tab 溢出
  useEffect(() => {
    const handleResize = () => checkTabOverflow();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 更新 CSS 变量
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    document.documentElement.style.setProperty('--editor-height', `${editorHeight}px`);
  }, [sidebarWidth, editorHeight]);

  // 获取当前激活的 Tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || { query: '', results: [] };

  // 更新查询
  const updateQuery = (newQuery) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, query: newQuery } : t))
    );
  };

  // 执行查询
  const executeQuery = () => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, results: mockExecute(t.query) } : t
      )
    );
  };

  // 模拟查询执行
  const mockExecute = (query) => {
    if (!query.trim()) return [];
    return [
      { id: 1, name: 'Alice', age: 20, email: 'alice@example.com' },
      { id: 2, name: 'Bob', age: 25, email: 'bob@example.com' },
      { id: 3, name: 'Charlie', age: 30, email: 'charlie@example.com' },
    ];
  };

  // 添加新 Tab
  const addTab = () => {
    const newId = Date.now();
    setTabs((prev) => [
      ...prev,
      { id: newId, title: `Query ${prev.length + 1}`, query: '', results: [] },
    ]);
    setActiveTabId(newId);
  };

  // 关闭 Tab
  const closeTab = (id) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTabId === id && tabs.length > 1) {
      const remaining = tabs.filter((t) => t.id !== id);
      setActiveTabId(remaining[0].id);
    } else if (tabs.length === 1) {
      setActiveTabId(null);
    }
  };

  // 格式化 SQL 查询
  const formatQuery = () => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              query: format(t.query, {
                language: 'sql',
                tabWidth: 2,
                linesBetweenQueries: 2,
              }),
            }
          : t
      )
    );
  };

  return (
    <div className="app-container">
      <ToolbarTop addTab={addTab} setActiveTabId={setActiveTabId} />
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

      {/* 主面板 */}
      <div className="main-panel">
        <div className="toolbar">
          <div className="toolbar-left">
             <button
                className="btn btn-icon"
                title="美化sql"
                onClick={formatQuery}
              >
                <img src={FormatIcon} alt="美化sql" className="icon" />
              </button>
              
              <button
                className="btn btn-icon"
                title="运行"
                onClick={executeQuery}
              >
                <img src={RunIcon} alt="运行" className="icon" />
              </button>

              <button
                className="btn btn-icon"
                title="停止"
                onClick={executeQuery}
              >
                <img src={StopIcon} alt="停止" className="icon" />
              </button>
          </div>
          <div className="toolbar-right">
            {/* <button className="btn btn-execute" onClick={executeQuery}>
              Run
            </button> */}
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
                  className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
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
                Tab {tabs.findIndex((t) => t.id === activeTabId) + 1} of {tabs.length}
              </div>
            )}
          </div>
        )}

        <div className="editor-and-result">
          <div
            ref={editorAreaRef}
            className={`editor-area ${isEditorDragging ? 'dragging' : ''}`}
          >
            <SqlEditor query={activeTab.query} setQuery={updateQuery} />
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