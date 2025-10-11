import React, { useState, memo } from 'react';
import {
  getExpandIcon,
  getNodeIcon,
  loadNodeChildren
} from './utils';
import {
  getPrimaryAction,
  connectDatabase,
  previewTable,
  updateTreePath
} from './actions';
import {
  getThemeColors,
  nodeBaseStyles,
  nodeHoverStyles,
  expandIconStyles,
  nodeIconStyles,
  nodeNameStyles,
  typeLabelStyles,
  actionButtonStyles,
  indicatorBarStyles,
  childIndicatorStyles,
  actionContainerStyles
} from './styles';

const TreeNode = memo(({
  openNewGroup,
  openNewConnection,
  node,
  level = 0,
  hoveredNode,
  setHoveredNode,
  treeData,
  setTreeData,
  expandedKeys,
  setExpandedKeys,
  onMoreMenu
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const isHovered = hoveredNode === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isExpandable = hasChildren || node.type === 'connection' || node.type === 'schema' || node.type === 'database';
  const primaryAction = getPrimaryAction(node.type);
  const theme = getThemeColors(node.type);
  const isExpanded = node.expanded;
  const isConnected = node.connected;
  if (isConnected) theme.accentColor = '#10b981';

  const handleClick = async (e) => {
    e.stopPropagation();
    if (isExpandable) {
      if (!hasChildren) {
        setIsLoading(true);
        try {
          const updatedNode = await loadNodeChildren(node, setTreeData, setExpandedKeys);
          if (updatedNode) {
            setTreeData((prev) => updateTreePath(prev, node.id, (current) => ({
              ...current,
              ...updatedNode
            })));
          }
          setExpandedKeys((prev) => new Map(prev).set(node.id, true));
        } catch (error) {
          console.error('加载失败:', error);
          alert('加载出错，请重试');
        } finally {
          setIsLoading(false);
        }
      } else {
        setExpandedKeys((prev) => new Map(prev).set(node.id, !prev.get(node.id)));
      }
    }
  };

  const handlePrimaryAction = (e) => {
    e.stopPropagation();
    if (primaryAction) {
      switch (node.type) {
        case 'connection':
          connectDatabase(node, setTreeData);
          break;
        case 'table':
          previewTable(node);
          break;
        case 'folder':
          openNewConnection(node.id);
          break;
        default:
          console.log(`执行主要操作: ${primaryAction.label} for ${node.name}`);
      }
    }
  };

  const handleMoreMenu = (e) => {
    e.stopPropagation();
    onMoreMenu(e, node);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleMoreMenu(e);
  };

  return (
    <div
      className={`tree-node ${node.type} ${isExpanded ? 'expanded' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{
        ...nodeBaseStyles,
        paddingLeft: `${12 + level * 12}px`,
        cursor: isExpandable ? 'pointer' : (isLoading ? 'wait' : 'default'),
        background: isHovered ? theme.hoverBg : 'transparent',
        border: isHovered ? `1px solid ${theme.accentColor}20` : (isConnected ? `1px solid ${theme.accentColor}10` : '1px solid transparent'),
        transform: isHovered ? 'translateX(1px)' : 'translateX(0)',
        boxShadow: isHovered ? `0 1px 4px ${theme.accentColor}10` : 'none',
        paddingRight: isHovered ? '4px' : '8px'
      }}
      onMouseEnter={() => setHoveredNode(node.id)}
      onMouseLeave={() => setHoveredNode(null)}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(e); }}
      tabIndex={0}
    >
      {/* 左侧指示条 */}
      {isHovered && <div style={indicatorBarStyles(theme)} />}

      {/* 展开图标 */}
      <div style={expandIconStyles(isHovered, theme)}>
        {isLoading ? (
          <span style={{ fontSize: 9 }}>⟳</span>
        ) : getExpandIcon(node) ? (
          <span style={{ fontSize: 9, fontWeight: 'bold' }}>
            {getExpandIcon(node)}
          </span>
        ) : (
          <div style={{ width: 10, height: 10 }} />
        )}
      </div>

      {/* 节点图标 */}
      <img
        src={getNodeIcon(node)}
        alt={node.type + (isConnected ? ' (connected)' : '')}
        style={nodeIconStyles(isHovered, theme)}
      />

      {/* 节点名称 */}
      <span style={{...nodeNameStyles(isHovered), color: isHovered ? theme.textColor : '#333' }}>
        {node.name}
      </span>

      {/* 类型标签 */}
      {isHovered && (
        <span style={typeLabelStyles(isHovered, theme)}>
          {node.type} {isConnected && '(已连接)'}
        </span>
      )}

      {/* 功能按钮区域 */}
      {isHovered && !isLoading && (
        <div style={actionContainerStyles}>
          {primaryAction && (
            <button
              onClick={handlePrimaryAction}
              style={actionButtonStyles(theme)}
              onMouseEnter={(e) => {
                e.target.style.background = 'white';
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              {primaryAction.icon}
            </button>
          )}

          <button
            onClick={handleMoreMenu}
            style={{
              ...actionButtonStyles(theme),
              color: '#666',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'white';
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
              e.target.style.color = theme.accentColor;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.8)';
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.target.style.color = '#666';
            }}
          >
            ⋯
          </button>
        </div>
      )}

      {/* 子项指示器 */}
      {isHovered && hasChildren && !primaryAction && !isLoading && (
        <div style={childIndicatorStyles(theme)} />
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export default TreeNode;