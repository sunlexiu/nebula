/* src/components/sidebar/TreeContainer.tsx */
import React, {useMemo} from 'react';
import TreeNode from './TreeNode';
import {patchConnectionNode, moveNode} from '@/utils/treeUtils';
import type {TreeNode as TNode} from '@/types/tree';

interface Props {
    treeData: TNode[];
    expandedKeys: Map<string, boolean>;
    setExpandedKeys: React.Dispatch<React.SetStateAction<Map<string, boolean>>>;
    hoveredNode: string | null;
    setHoveredNode: (id: string | null) => void;
    onMoreMenu: (e: React.MouseEvent, node: TNode) => void;
    activeMoreMenuNode: string | null;
    setActiveMoreMenuNode: (id: string | null) => void;
    dragSourceId: string | null;
    setDragSourceId: (id: string | null) => void;
    dragOverNodeId: string | null;
    setDragOverNodeId: (id: string | null) => void;
    isDragOverRoot: boolean;
    setIsDragOverRoot: (val: boolean) => void;
    openNewGroup: (parentId?: string) => void;
    openNewConnection: (parentId?: string) => void;
    openRenameFolder: () => void;
    openEditConnection: () => void;
}

/* ---------- 空状态 ---------- */
const EmptyState = () => (
    <div className="empty-tree">
        <span>无数据</span>
    </div>
);

/* ---------- 主组件 ---------- */
const TreeContainer: React.FC<Props> = (props) => {
    const {
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
        openNewGroup,
        openNewConnection,
        openRenameFolder,
        openEditConnection,
    } = props;

    /* 1. 仅对根节点打一次补丁（连接节点 primary 动作） */
    const patchedTree = useMemo(() => treeData.map((n) => patchConnectionNode(n)), [treeData]);
    const handleMoveNode = (sourceId: string, targetId: string) => {
        // 根据你的业务逻辑补充缺失的参数
        moveNode(sourceId, targetId, undefined, undefined, undefined);
    };
    /* 2. 递归渲染 - 无循环内 Hook */
    const renderNodes = (nodes: TNode[], level = 0) =>
        nodes.map((node) => {
            const patchedNode = patchConnectionNode(node);
            const isExpanded = expandedKeys.get(node.id) || false;

            return (
                <React.Fragment key={node.id}>
                    <TreeNode
                        node={{...patchedNode, expanded: isExpanded}}
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

                    {isExpanded && node.children && node.children.length > 0 && (
                        <div
                            className="tree-children"
                            onDragOver={(e) => {
                                e.preventDefault();
                                if (dragSourceId && dragSourceId !== node.id && (node.type === 'folder' || node.config?.allowDrop))
                                    setDragOverNodeId(node.id);
                            }}
                            onDragLeave={() => setDragOverNodeId(null)}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (dragSourceId && dragSourceId !== node.id && (node.type === 'folder' || node.config?.allowDrop))
                                    handleMoveNode(dragSourceId, node.id);
                                setDragOverNodeId(null);
                            }}
                        >
                            {renderNodes(node.children, level + 1)}
                        </div>
                    )}
                </React.Fragment>
            );
        });

    /* 3. 根级拖拽感应 */
    const handleRootDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOverRoot(false);
        if (dragSourceId) handleMoveNode(dragSourceId, '');
    };

    const handleRootDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOverRoot(true);
    };

    return (
        <div
            className={`tree-container ${isDragOverRoot ? 'drag-over' : ''}`}
            onDragOver={handleRootDragOver}
            onDragLeave={() => setIsDragOverRoot(false)}
            onDrop={handleRootDrop}
        >
            {patchedTree.length ? renderNodes(patchedTree) : <EmptyState/>}
        </div>
    );
};

export default TreeContainer;