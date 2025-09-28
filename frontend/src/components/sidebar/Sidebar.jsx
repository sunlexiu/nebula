import React, { useState } from 'react';
import TreeNode from './TreeNode';
import { initialTreeData } from './utils';
import { findNode } from './actions';
import deegoLogo from '../../public/icons/deego.svg'; 

const Sidebar = () => {
  const [treeData, setTreeData] = useState(initialTreeData);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(null);
  const [moreMenuPosition, setMoreMenuPosition] = useState({ x: 0, y: 0 });

  // 处理更多菜单
  const handleMoreMenu = (e, node) => {
    e.stopPropagation();
    setMoreMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMoreMenu(node.id);
  };

  // 渲染树节点
  const renderTreeNodes = (nodes, level = 0) => {
    return nodes.map((node) => {
      const renderedNode = (
        <TreeNode
          key={node.id}
          node={node}
          level={level}
          hoveredNode={hoveredNode}
          setHoveredNode={setHoveredNode}
          treeData={treeData}
          setTreeData={setTreeData}
          onMoreMenu={handleMoreMenu}
          moreMenuPosition={moreMenuPosition}
          showMoreMenu={showMoreMenu}
          setShowMoreMenu={setShowMoreMenu}
        />
      );

      if (node.expanded && node.children && node.children.length > 0) {
        return (
          <React.Fragment key={node.id}>
            {renderedNode}
            <div style={{ 
              marginLeft: '2px',
              paddingLeft: '1px',
              borderLeft: '1px solid #e0e7ff',
              marginTop: '1px'
            }}>
              {renderTreeNodes(node.children, level + 1)}
            </div>
          </React.Fragment>
        );
      }

      return renderedNode;
    });
  };

  return (
    <div className="sidebar-tree" style={{ 
      padding: '12px 0',
      height: '100%',
      overflow: 'auto',
      background: 'var(--sidebar-bg)',
      position: 'relative'
    }}>
      {/* 头部信息区域 */}
      <div style={{ padding: '0 16px', marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '10px',
          boxShadow: '0 4px 14px rgba(102, 126, 234, 0.2)',
          marginBottom: '16px',
          color: 'white',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(102, 126, 234, 0.2)';
        }}
        onClick={() => console.log('打开数据库设置')}
        >
          <img 
            src={deegoLogo} 
            alt="Deego" 
            style={{ 
              width: 25, 
              height: 25,
              filter: 'brightness(0) invert(1)'
            }} 
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              Deego
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
              Your Data Buddy
            </div>
          </div>
        </div>
        
        {/* <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '10px 14px',
          background: 'linear-gradient(90deg, #e8f5e8 0%, #f0f8f0 100%)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#2e7d32',
          border: '1px solid #c8e6c9',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(90deg, #e3f2e3 0%, #eafaf1 100%)';
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(90deg, #e8f5e8 0%, #f0f8f0 100%)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: 8, height: 8, background: '#4caf50', 
              borderRadius: '50%', boxShadow: '0 0 8px #4caf5020'
            }} />
            <span>已连接</span>
          </span>
          <span style={{ marginLeft: 'auto', color: '#666', fontSize: '11px' }}>
            localhost:5432
          </span>
        </div> */}
      </div>
      
      <div className="tree-container">
        {renderTreeNodes(treeData)}
      </div>
    </div>
  );
};

export default Sidebar;