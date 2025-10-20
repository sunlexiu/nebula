import React, { useRef, useEffect, useState } from 'react';
import Sidebar from '../sidebar/Sidebar';
import ToolbarTop from '../toptoolbar/ToolbarTop';
import EditorPanel from '../editor/EditorPanel';
import { useResize } from '../../hooks/useResize';
import { useTreeStore } from '../../stores/useTreeStore';
import { useTabsStore } from '../../stores/useTabsStore';
import FormatIcon from '../../public/icons/toptoolbar/format_1.svg';
import RunIcon from '../../public/icons/toptoolbar/run_1.svg';
import StopIcon from '../../public/icons/toptoolbar/stop_1.svg';
import { openNewGroup, openNewConnection } from '../modals/modalActions'; // 从模态 actions 导入

const AppLayout = () => {
  const sidebarRef = useRef(null); // 确保 ref 存在
  const { sidebarWidth, editorHeight, handleSidebarMouseDown, handleEditorMouseDown } = useResize(undefined, undefined, sidebarRef); // 传入 sidebarRef
  const { treeData, refreshTree } = useTreeStore();
  const { tabs, activeTabId, updateQuery, executeQuery, formatQuery, addTab, closeTab, checkTabOverflow, handleTabScroll } = useTabsStore();
  const tabsContainerRef = useRef(null);
  const [showTabScroll, setShowTabScroll] = React.useState(false);
  const activeTab = tabs.find((t) => t.id === activeTabId) || { query: '', results: [] };

  useEffect(() => {
    refreshTree(); // 初始化树数据
  }, [refreshTree]);

  useEffect(() => {
    const timeoutId = setTimeout(() => setShowTabScroll(checkTabOverflow(tabsContainerRef)), 100);
    return () => clearTimeout(timeoutId);
  }, [tabs, checkTabOverflow]);

  useEffect(() => {
    const handleResize = () => setShowTabScroll(checkTabOverflow(tabsContainerRef));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkTabOverflow]);

  const handleFormat = () => formatQuery();
  const handleRun = () => executeQuery(activeTab.query).then((results) => {
    useTabsStore.setState((state) => ({
      tabs: state.tabs.map((t) => (t.id === activeTabId ? { ...t, results } : t)),
    }));
  });

  return (
    <div className="app-container" style={{ gridTemplateColumns: `${sidebarWidth}px 1fr` }}>
      <ToolbarTop addTab={addTab} refreshTree={refreshTree} openNewGroup={() => openNewGroup(null)} openNewConnection={() => openNewConnection(null)} />
      <div ref={sidebarRef} className="sidebar" style={{ width: sidebarWidth }}>
        <Sidebar treeData={treeData} />
        <div className="resizer sidebar-resizer" onMouseDown={(e) => handleSidebarMouseDown(e)} />
      </div>
      <div className="main-panel">
        <div className="toolbar">
          <div className="toolbar-left">
            <button className="btn btn-icon" title="美化sql" onClick={handleFormat}>
              <img src={FormatIcon} alt="美化sql" className="icon" />
            </button>
            <button className="btn btn-icon" title="运行" onClick={handleRun}>
              <img src={RunIcon} alt="运行" className="icon" />
            </button>
            <button className="btn btn-icon" title="停止" onClick={handleRun}>
              <img src={StopIcon} alt="停止" className="icon" />
            </button>
          </div>
        </div>
        {tabs.length > 0 && (
          <div className="tabs-container">
            {showTabScroll && (
              <button className="tab-scroll-btn tab-scroll-left" onClick={() => handleTabScroll('left', tabsContainerRef)}>
                ‹
              </button>
            )}
            <div className="tabs-header" ref={tabsContainerRef}>
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
                  onClick={() => useTabsStore.getState().setActiveTabId(tab.id)}
                >
                  <span className="tab-title" title={tab.title}>{tab.title}</span>
                  {tabs.length > 1 && (
                    <button className="tab-close" onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {showTabScroll && (
              <button className="tab-scroll-btn tab-scroll-right" onClick={() => handleTabScroll('right', tabsContainerRef)}>
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
        <EditorPanel
          query={activeTab.query}
          results={activeTab.results}
          updateQuery={updateQuery}
          executeQuery={handleRun}
          editorHeight={editorHeight}
          handleEditorMouseDown={handleEditorMouseDown}
        />
      </div>
    </div>
  );
};

export default AppLayout;