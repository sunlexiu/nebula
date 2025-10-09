// components/sidebar/Sidebar.jsx
import React, { useState, useMemo } from 'react';
import TreeNode from './TreeNode';
import { findNode } from './actions';
import deegoLogo from '../../public/icons/deego_1.svg';

const Sidebar = ({ treeData, setTreeData, openNewGroup, openNewConnection }) => {
  const [expandedKeys, setExpandedKeys] = useState(new Map());
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(null);
  const [moreMenuPosition, setMoreMenuPosition] = useState({ x: 0, y: 0 });

  // 处理更多菜单
  const handleMoreMenu = (e, node) => {
    e.stopPropagation();
    setMoreMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMoreMenu(node.id);
  };

  // 渲染树节点 - 优化 useMemo 依赖
  const renderTreeNodes = useMemo(() => (nodes, level = 0) => {
    if (!nodes || nodes.length === 0) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
          无数据
        </div>
      );
    }
    return nodes.map((node) => {
      const isExpanded = expandedKeys.get(node.id) || false;
      const renderedNode = (
        <TreeNode
          key={node.id}
          node={{ ...node, expanded: isExpanded }}
          level={level}
          hoveredNode={hoveredNode}
          setHoveredNode={setHoveredNode}
          treeData={treeData}
          setTreeData={setTreeData}
          expandedKeys={expandedKeys}
          setExpandedKeys={setExpandedKeys}
          onMoreMenu={handleMoreMenu}
          moreMenuPosition={moreMenuPosition}
          showMoreMenu={showMoreMenu}
          setShowMoreMenu={setShowMoreMenu}
          openNewGroup={openNewGroup}
          openNewConnection={openNewConnection}
        />
      );

      if (isExpanded && node.children && node.children.length > 0) {
        return (
          <React.Fragment key={node.id}>
            {renderedNode}
            <div style={{
              marginLeft: '2px',
              paddingLeft: '1px',
              borderLeft: '1px solid #e0e7ff',
              marginTop: '1px',
              transition: 'max-height 0.3s ease', // 添加展开动画
              overflow: 'hidden'
            }}>
              {renderTreeNodes(node.children, level + 1)}
            </div>
          </React.Fragment>
        );
      }

      return renderedNode;
    });
  }, [expandedKeys, hoveredNode, treeData, moreMenuPosition, showMoreMenu]); // 精简依赖

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
      </div>
      
      <div className="tree-container">
        {renderTreeNodes(treeData)}
      </div>
    </div>
  );
};

export default Sidebar;