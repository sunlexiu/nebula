import React, { useState, memo } from 'react';
import { useModal } from '../modals/ModalProvider';
import { useTreeStore } from '../../stores/useTreeStore';
import { actionHandlers } from '../../actions/dbActions';
import { getExpandIcon, getNodeIcon, loadNodeChildren } from '../../utils/treeUtils';
import { getThemeColors, nodeBaseStyles, expandIconStyles, nodeIconStyles, nodeNameStyles, typeLabelStyles, actionButtonStyles, indicatorBarStyles, childIndicatorStyles, actionContainerStyles, dragOverStyles, dragSourceStyles } from './styles';

const TreeNode = memo(({
  node,
  level = 0,
  hoveredNode,
  setHoveredNode,
  expandedKeys,
  setExpandedKeys,
  onMoreMenu,
  activeMoreMenuNode,
  setActiveMoreMenuNode,
  dragSourceId,
  setDragSourceId,
  dragOverNodeId,
  setDragOverNodeId,
  moveNode,
  openNewGroup,
  openNewConnection,
  openRenameFolder,
  openEditConnection,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { openModal } = useModal();
  const isHovered = hoveredNode === node.id;
  const isActive = activeMoreMenuNode === node.id;
  const isDragging = dragSourceId === node.id;
  const isDragOver = dragOverNodeId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isExpandable = hasChildren || node.virtual || node.config?.nextLevel;
  const isDraggable = node.type === 'folder' || node.type === 'connection';
  const isDropTarget = node.type === 'folder' || node.config?.allowDrop;
  const { actionMap } = useTreeStore();
  const primaryAction = actionMap[node.type]?.[0] || null;
  const theme = getThemeColors(node.type);
  const { updateTreePath } = useTreeStore();
  const isExpanded = node.expanded;
  const isConnected = node.connected;
  if (isConnected) theme.accentColor = '#10b981';

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

  const handleDragStart = (e: React.DragEvent) => {
    if (isDraggable) {
      setDragSourceId(node.id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', node.id);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (isDropTarget && dragSourceId && dragSourceId !== node.id) setDragOverNodeId(node.id);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (isDropTarget && dragOverNodeId === node.id) setDragOverNodeId(null);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDropTarget && dragSourceId && dragSourceId !== node.id) {
      moveNode(dragSourceId, node.id);
    }
    setDragOverNodeId(null);
  };

    const handleClick = async () => {
      if (isExpandable) {
        setIsLoading(true);
        try {
          const updated = await loadNodeChildren(node);
          updateTreePath(node.id, () => updated);
        } finally {
          setIsLoading(false);
        }
      }
    };

  const handlePrimaryAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryAction && !activeMoreMenuNode) {
      await actionHandlers.dynamicHandler(primaryAction.handler, node, {
        setExpandedKeys,
        openModal,
      });
    }
  };

  const handleMoreMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeMoreMenuNode) {
      setActiveMoreMenuNode(node.id);
      onMoreMenu(e, node);
    }
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleMoreMenu(e);
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
          <span style={{ fontSize: 9, fontWeight: 'bold' }}>{getExpandIcon(node)}</span>
        ) : (
          <div style={{ width: 10, height: 10 }} />
        )}
      </div>

      <img
        src={getNodeIcon(node)}
        alt={node.type + (isConnected ? ' (connected)' : '')}
        style={nodeIconStyles(isHovered || isActive || isDragOver, theme)}
      />

      <span style={{ ...nodeNameStyles(isHovered || isActive || isDragOver), color: (isHovered || isActive || isDragOver) ? theme.textColor : '#333' }}>
        {node.name}
      </span>

      {(isHovered || isActive || isDragOver) && (
        <span style={typeLabelStyles(isHovered || isActive || isDragOver, theme)}>
          {node.type} {isConnected && '(已连接)'} {node.virtual && '(虚拟)'}
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
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!activeMoreMenuNode) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {primaryAction.icon}
            </button>
          )}

          <button
            onClick={handleMoreMenu}
            style={{ ...actionButtonStyles(theme), color: '#666', fontSize: '14px' }}
            disabled={!!activeMoreMenuNode && activeMoreMenuNode !== node.id}
            onMouseEnter={(e) => {
              if (!activeMoreMenuNode || activeMoreMenuNode === node.id) {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.color = theme.accentColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!activeMoreMenuNode || activeMoreMenuNode === node.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.color = '#666';
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