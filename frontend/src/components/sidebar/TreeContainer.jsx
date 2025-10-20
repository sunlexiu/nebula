import React, { useMemo } from 'react';
import TreeNode from './TreeNode';
import { findNode } from '../../utils/treeUtils';
import { moveNode } from '../../actions/treeActions';
import { useTreeStore } from '../../stores/useTreeStore';

const TreeContainer = ({
  treeData, expandedKeys, setExpandedKeys, hoveredNode, setHoveredNode,
  onMoreMenu, activeMoreMenuNode, setActiveMoreMenuNode,
  dragSourceId, setDragSourceId, dragOverNodeId, setDragOverNodeId,
  isDragOverRoot, setIsDragOverRoot,
  openNewGroup, openNewConnection, openRenameFolder, openEditConnection,
  openModal // 修复：接收 openModal 参数
}) => {
  const { updateTreePath } = useTreeStore();

  const handleMoveNode = (sourceId, targetId) => {
    const sourceNode = findNode(treeData, sourceId);
    if (sourceNode && (sourceNode.type === 'folder' || sourceNode.type === 'connection')) {
      moveNode(sourceId, targetId, updateTreePath, openModal, sourceNode.type); // 修复：传入 openModal
    }
  };

  const renderTreeNodes = useMemo(() => (nodes, level = 0) => {
    if (!nodes || nodes.length === 0) {
      return <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>无数据</div>;
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
          expandedKeys={expandedKeys}
          setExpandedKeys={setExpandedKeys}
          onMoreMenu={onMoreMenu}
          activeMoreMenuNode={activeMoreMenuNode}
          setActiveMoreMenuNode={setActiveMoreMenuNode}
          dragSourceId={dragSourceId}
          setDragSourceId={setDragSourceId}
          dragOverNodeId={dragOverNodeId}
          setDragOverNodeId={setDragOverNodeId}
          moveNode={handleMoveNode}
          openNewGroup={openNewGroup}
          openNewConnection={openNewConnection}
          openRenameFolder={openRenameFolder}
          openEditConnection={openEditConnection}
        />
      );

      if (isExpanded && node.children && node.children.length > 0) {
        return (
          <React.Fragment key={node.id}>
            {renderedNode}
            <div
              style={{ marginLeft: '2px', paddingLeft: '1px', borderLeft: '1px solid #e0e7ff', marginTop: '1px' }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragSourceId && dragSourceId !== node.id && node.type === 'folder') setDragOverNodeId(node.id);
              }}
              onDragLeave={() => setDragOverNodeId(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragSourceId && dragSourceId !== node.id && node.type === 'folder') handleMoveNode(dragSourceId, node.id);
                setDragOverNodeId(null);
              }}
            >
              {renderTreeNodes(node.children, level + 1)}
            </div>
          </React.Fragment>
        );
      }
      return renderedNode;
    });
  }, [treeData, expandedKeys, hoveredNode, activeMoreMenuNode, dragSourceId, dragOverNodeId, handleMoveNode, openNewGroup, openNewConnection, openRenameFolder, openEditConnection]);

  const handleRootDrop = (e) => {
    e.preventDefault();
    setIsDragOverRoot(false);
    if (dragSourceId) handleMoveNode(dragSourceId, null);
  };

  const handleRootDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverRoot(true);
  };

  const rootContainerStyle = {
    minHeight: '20px', padding: '0 16px', transition: 'all 0.2s ease',
    border: isDragOverRoot ? '2px dashed #0b69ff' : 'none',
    background: isDragOverRoot ? '#f8f9fa' : 'transparent',
    borderRadius: '4px', margin: '0 4px'
  };

  return (
    <div
      className="tree-container"
      style={rootContainerStyle}
      onDragOver={handleRootDragOver}
      onDragLeave={() => setIsDragOverRoot(false)}
      onDrop={handleRootDrop}
    >
      {renderTreeNodes(treeData)}
    </div>
  );
};

export default TreeContainer;