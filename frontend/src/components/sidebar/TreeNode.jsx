// TreeNode.jsx
import React, { useState, memo } from 'react';
import MoreActionsMenu from './MoreActionsMenu';
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
  actionContainerStyles,
  dragOverStyles,
  dragSourceStyles
} from './styles';

const TreeNode = memo(({
  openNewGroup,
  openNewConnection,
  openConfirm,
  openRenameFolder,
  node,
  level = 0,
  hoveredNode,
  setHoveredNode,
  treeData,
  setTreeData,
  expandedKeys,
  setExpandedKeys,
  onMoreMenu,
  activeMoreMenuNode,
  setActiveMoreMenuNode,
  // 新增：拖拽 props
  dragSourceId,
  setDragSourceId,
  dragOverNodeId,
  setDragOverNodeId,
  moveNode
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const isHovered = hoveredNode === node.id;
  const isActive = activeMoreMenuNode === node.id;
  const isDragging = dragSourceId === node.id;
  const isDragOver = dragOverNodeId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isExpandable = hasChildren || node.type === 'connection' || node.type === 'schema' || node.type === 'database';
  const isDraggable = node.type === 'folder' || node.type === 'connection'; // 只允许文件夹和连接拖拽
  const isDropTarget = node.type === 'folder'; // 只允许 drop 到文件夹
  const primaryAction = getPrimaryAction(node.type);
  const theme = getThemeColors(node.type);
  const isExpanded = node.expanded;
  const isConnected = node.connected;
  if (isConnected) theme.accentColor = '#10b981';

  // 新增：拖拽事件
  const handleDragStart = (e) => {
    if (isDraggable) {
      setDragSourceId(node.id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', node.id);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (isDropTarget && dragSourceId && dragSourceId !== node.id) {
      setDragOverNodeId(node.id);
    }
  };

  const handleDragLeave = (e) => {
    e.stopPropagation();
    if (isDropTarget && dragOverNodeId === node.id) {
      setDragOverNodeId(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDropTarget && dragSourceId && dragSourceId !== node.id) {
      moveNode(dragSourceId, node.id);
    }
    setDragOverNodeId(null);
  };

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
    if (primaryAction && !activeMoreMenuNode) {
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
    if (!activeMoreMenuNode) {
      setActiveMoreMenuNode(node.id);
      onMoreMenu(e, node);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleMoreMenu(e);
  };

  // 组合样式：优先拖拽 > 悬浮 > 基础
  const combinedStyles = {
    ...nodeBaseStyles,
    ...(isDragging && dragSourceStyles),
    ...(isDragOver && dragOverStyles(theme)),
    paddingLeft: `${12 + level * 12}px`,
    cursor: isDraggable ? 'grab' : (isExpandable ? 'pointer' : (isLoading ? 'wait' : 'default')),
    background: (isDragging ? 'transparent' : ((isHovered || isActive) ? theme.hoverBg : 'transparent')),
    border: (isDragOver ? `2px dashed ${theme.accentColor}` : ((isHovered || isActive) ? `1px solid ${theme.accentColor}20` : (isConnected ? `1px solid ${theme.accentColor}10` : '1px solid transparent'))),
    transform: (isDragging ? 'rotate(5deg)' : ((isHovered || isActive) ? 'translateX(1px)' : 'translateX(0)')),
    boxShadow: (isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : ((isHovered || isActive) ? `0 1px 4px ${theme.accentColor}10` : 'none')),
    opacity: isDragging ? 0.5 : 1,
    paddingRight: (isHovered || isActive) ? '4px' : '8px'
  };

  return (
    <div
      className={`tree-node ${node.type} ${isExpanded ? 'expanded' : ''} ${isHovered || isActive ? 'hovered' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      style={combinedStyles}
      draggable={isDraggable}
      onMouseEnter={() => !isDragging && setHoveredNode(node.id)}
      onMouseLeave={() => !isDragging && setHoveredNode(null)}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(e); }}
      tabIndex={0}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {(isHovered || isActive || isDragOver) && <div style={indicatorBarStyles(theme)} />}

      <div style={expandIconStyles(isHovered || isActive || isDragOver, theme)}>
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

      <img
        src={getNodeIcon(node)}
        alt={node.type + (isConnected ? ' (connected)' : '')}
        style={nodeIconStyles(isHovered || isActive || isDragOver, theme)}
      />

      <span style={{...nodeNameStyles(isHovered || isActive || isDragOver), color: (isHovered || isActive || isDragOver) ? theme.textColor : '#333' }}>
        {node.name}
      </span>

      {(isHovered || isActive || isDragOver) && (
        <span style={typeLabelStyles(isHovered || isActive || isDragOver, theme)}>
          {node.type} {isConnected && '(已连接)'}
        </span>
      )}

      {(isHovered || isActive) && !isLoading && !isDragging && (
        <div style={actionContainerStyles}>
          {primaryAction && (
            <button
              onClick={handlePrimaryAction}
              style={actionButtonStyles(theme)}
              disabled={!!activeMoreMenuNode}
              onMouseEnter={(e) => {
                if (!activeMoreMenuNode) {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!activeMoreMenuNode) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }
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
            disabled={!!activeMoreMenuNode && activeMoreMenuNode !== node.id}
            onMouseEnter={(e) => {
              if (!activeMoreMenuNode || activeMoreMenuNode === node.id) {
                e.target.style.background = 'white';
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                e.target.style.color = theme.accentColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!activeMoreMenuNode || activeMoreMenuNode === node.id) {
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.target.style.color = '#666';
              }
            }}
          >
            ⋯
          </button>
        </div>
      )}

      {(isHovered || isActive || isDragOver) && hasChildren && !primaryAction && !isLoading && (
        <div style={childIndicatorStyles(theme)} />
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export default TreeNode;