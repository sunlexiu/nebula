/* src/components/sidebar/TreeContainer.jsx  –– 完整版：仅增加 patchConnectionNode 调用 */
import React, { useMemo } from 'react';
import TreeNode from './TreeNode';
import { moveNode } from '../../actions/treeActions';
import { patchConnectionNode } from '../../utils/treeUtils';

const TreeContainer = ({
  treeData,
  expandedKeys,
  setExpandedKeys,
  hoveredNode,
  setHoveredNode,
  onMoreMenu,
  activeMoreMenuNode,
  setActiveMoreMenuNode,
  dragSourceId,
  setDragSourceId,
  dragOverNodeId,
  setDragOverNodeId,
  isDragOverRoot,
  setIsDragOverRoot,
  moveNode,
  openNewGroup,
  openNewConnection,
  openRenameFolder,
  openEditConnection,
}) => {
  /* ---------- 1. 给连接节点打补丁（强制 primary.handler=connectAndExpand） ---------- */
  const patchedTree = useMemo(() => treeData.map((n) => patchConnectionNode(n)), [treeData]);

  /* ---------- 2. 递归渲染 ---------- */
  const renderNodes = (nodes, level = 0) =>
    nodes.map((node) => {
      const isExpanded = expandedKeys.get(node.id) || false;
      return (
        <React.Fragment key={node.id}>
          <TreeNode
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
            moveNode={moveNode}
            openNewGroup={openNewGroup}
            openNewConnection={openNewConnection}
            openRenameFolder={openRenameFolder}
            openEditConnection={openEditConnection}
          />
          {isExpanded && node.children && node.children.length > 0 && (
            <div
              style={{
                marginLeft: '2px',
                paddingLeft: '1px',
                borderLeft: '1px solid #e0e7ff',
                marginTop: '1px',
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragSourceId && dragSourceId !== node.id && (node.type === 'folder' || node.config?.allowDrop))
                  setDragOverNodeId(node.id);
              }}
              onDragLeave={() => setDragOverNodeId(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragSourceId && dragSourceId !== node.id && (node.type === 'folder' || node.config?.allowDrop))
                  moveNode(dragSourceId, node.id);
                setDragOverNodeId(null);
              }}
            >
              {renderNodes(node.children, level + 1)}
            </div>
          )}
        </React.Fragment>
      );
    });

  /* ---------- 3. 根容器拖拽 ---------- */
  const handleRootDrop = (e) => {
    e.preventDefault();
    setIsDragOverRoot(false);
    if (dragSourceId) moveNode(dragSourceId, null);
  };

  const handleRootDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverRoot(true);
  };

  const rootContainerStyle = {
    minHeight: '20px',
    padding: '0 16px',
    transition: 'all 0.2s ease',
    border: isDragOverRoot ? '2px dashed #0b69ff' : 'none',
    background: isDragOverRoot ? '#f8f9fa' : 'transparent',
    borderRadius: '4px',
    margin: '0 4px',
  };

  return (
    <div
      className="tree-container"
      style={rootContainerStyle}
      onDragOver={handleRootDragOver}
      onDragLeave={() => setIsDragOverRoot(false)}
      onDrop={handleRootDrop}
    >
      {patchedTree.length ? renderNodes(patchedTree) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
          无数据
        </div>
      )}
    </div>
  );
};

export default TreeContainer;