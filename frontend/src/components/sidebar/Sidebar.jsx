// Sidebar.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TreeNode from './TreeNode';
import { findNode, moveNode } from './actions';
import deegoLogo from '../../public/icons/deego_1.svg';
import MoreActionsMenu from './MoreActionsMenu';
import RenameFolderModal from './RenameFolderModal';

const Sidebar = ({ treeData, setTreeData, openNewGroup, openNewConnection, openConfirm }) => {
  const [expandedKeys, setExpandedKeys] = useState(new Map());
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(null);
  const [moreMenuPosition, setMoreMenuPosition] = useState({ x: 0, y: 0, flip: false });
  const [activeMoreMenuNode, setActiveMoreMenuNode] = useState(null);
  const [renameFolderModal, setRenameFolderModal] = useState({ isOpen: false, node: null, onSubmit: null });
  // 新增：拖拽状态
  const [dragSourceId, setDragSourceId] = useState(null);
  const [dragOverNodeId, setDragOverNodeId] = useState(null);

  // 外部点击检测和 Escape 键关闭
  useEffect(() => {
    if (!showMoreMenu && !renameFolderModal.isOpen) return;

    const handleClickOutside = (event) => {
      if (!event.target.closest('.more-actions-menu') && !event.target.closest('.tree-node') && !event.target.closest('.modal-content')) {
        setShowMoreMenu(null);
        setMoreMenuPosition({ x: 0, y: 0, flip: false });
        setActiveMoreMenuNode(null);
        setRenameFolderModal({ isOpen: false, node: null, onSubmit: null });
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowMoreMenu(null);
        setMoreMenuPosition({ x: 0, y: 0, flip: false });
        setActiveMoreMenuNode(null);
        setRenameFolderModal({ isOpen: false, node: null, onSubmit: null });
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMoreMenu, renameFolderModal.isOpen]);

  // 新增：拖拽结束清理
  useEffect(() => {
    const handleDragEnd = () => {
      setDragSourceId(null);
      setDragOverNodeId(null);
    };
    document.addEventListener('dragend', handleDragEnd);
    return () => document.removeEventListener('dragend', handleDragEnd);
  }, []);

  // 新增：处理根路径 drop
  const handleRootDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragSourceId) {
      const sourceNode = findNode(treeData, dragSourceId);
      if (sourceNode && (sourceNode.type === 'folder' || sourceNode.type === 'connection')) {
        moveNode(dragSourceId, null, setTreeData, openConfirm, sourceNode.type);
      }
    }
  };

  // 处理更多菜单
  const handleMoreMenu = (e, node) => {
    e.stopPropagation();
    const treeItem = e.currentTarget;
    const rect = treeItem.getBoundingClientRect();
    const baseY = rect.bottom;
    const estimatedMenuHeight = 200;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - baseY;
    const minTop = 20;
    const bottomMargin = 20;

    let flip = false;
    let adjustedY = baseY + 10;

    if (spaceBelow >= estimatedMenuHeight) {
      adjustedY = baseY + 10;
    } else {
      flip = true;
      adjustedY = rect.top - estimatedMenuHeight;
      if (adjustedY < minTop) {
        adjustedY = minTop;
      }
    }

    if (adjustedY + estimatedMenuHeight > viewportHeight - bottomMargin) {
      adjustedY = viewportHeight - estimatedMenuHeight - bottomMargin;
      flip = adjustedY < rect.top;
    }

    setMoreMenuPosition({ x: e.clientX + 5, y: adjustedY, flip });
    setShowMoreMenu(node.id);
  };

  // 打开重命名模态框
  const openRenameFolderModal = (options) => {
    setRenameFolderModal({
      isOpen: true,
      node: { id: options.id, name: options.name },
      onSubmit: options.onSubmit
    });
  };

  // 新增：修正的 moveNode wrapper，自动获取 source type
  const handleMoveNode = (sourceId, targetId) => {
    const sourceNode = findNode(treeData, sourceId);
    if (sourceNode && (sourceNode.type === 'folder' || sourceNode.type === 'connection')) {
      moveNode(sourceId, targetId, setTreeData, openConfirm, sourceNode.type);
    }
  };

  // 渲染树节点
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
          openNewGroup={openNewGroup}
          openNewConnection={openNewConnection}
          openConfirm={openConfirm}
          openRenameFolder={openRenameFolderModal}
          activeMoreMenuNode={activeMoreMenuNode}
          setActiveMoreMenuNode={setActiveMoreMenuNode}
          // 新增：拖拽 props
          dragSourceId={dragSourceId}
          setDragSourceId={setDragSourceId}
          dragOverNodeId={dragOverNodeId}
          setDragOverNodeId={setDragOverNodeId}
          moveNode={handleMoveNode}
        />
      );

      if (isExpanded && node.children && node.children.length > 0) {
        return (
          <React.Fragment key={node.id}>
            {renderedNode}
            <div
              style={{
                marginLeft: '2px',
                paddingLeft: '1px',
                borderLeft: '1px solid #e0e7ff',
                marginTop: '1px',
                transition: 'max-height 0.3s ease',
                overflow: 'hidden'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragSourceId && dragSourceId !== node.id && node.type === 'folder') {
                  setDragOverNodeId(node.id);
                }
              }}
              onDragLeave={(e) => {
                if (dragOverNodeId === node.id) {
                  setDragOverNodeId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragSourceId && dragSourceId !== node.id && node.type === 'folder') {
                  handleMoveNode(dragSourceId, node.id);
                }
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
  }, [expandedKeys, hoveredNode, treeData, openNewGroup, openNewConnection, openConfirm, activeMoreMenuNode, dragSourceId, dragOverNodeId, handleMoveNode]);

  // Portal 渲染菜单
  const renderMoreMenuPortal = () => {
    if (!showMoreMenu || !treeData) return null;
    const node = findNode(treeData, showMoreMenu);
    if (!node) return null;

    return createPortal(
      <>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.1)',
            zIndex: 999
          }}
          onClick={() => {
            setShowMoreMenu(null);
            setMoreMenuPosition({ x: 0, y: 0, flip: false });
            setActiveMoreMenuNode(null);
          }}
        />
        <MoreActionsMenu
          node={node}
          position={moreMenuPosition}
          onClose={() => {
            setShowMoreMenu(null);
            setMoreMenuPosition({ x: 0, y: 0, flip: false });
            setActiveMoreMenuNode(null);
          }}
          treeData={treeData}
          setTreeData={setTreeData}
          setExpandedKeys={setExpandedKeys}
          openNewGroup={openNewGroup}
          openNewConnection={openNewConnection}
          openConfirm={openConfirm}
          openRenameFolder={openRenameFolderModal}
        />
      </>,
      document.body
    );
  };

  return (
    <>
      <div className="sidebar-tree" style={{
        padding: '12px 0',
        height: '100%',
        overflow: 'auto',
        background: 'var(--sidebar-bg)',
        position: 'relative'
      }}>
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

        {/* 新增：根路径拖拽容器 */}
        <div
          className="tree-container"
          style={{ minHeight: '20px', padding: '0 16px' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleRootDrop}
        >
          {renderTreeNodes(treeData)}
        </div>
      </div>

      {/* Portal 菜单渲染 */}
      {renderMoreMenuPortal()}

      {/* 重命名文件夹模态框 */}
      {renameFolderModal.isOpen && (
        <RenameFolderModal
          isOpen={renameFolderModal.isOpen}
          onClose={() => setRenameFolderModal({ isOpen: false, node: null, onSubmit: null })}
          onSubmit={renameFolderModal.onSubmit}
          parentId={renameFolderModal.node?.id}
          defaultName={renameFolderModal.node?.name}
        />
      )}
    </>
  );
};

export default Sidebar;