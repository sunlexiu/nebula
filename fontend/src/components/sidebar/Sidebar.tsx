// src/components/sidebar/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TreeContainer from './TreeContainer';
import MoreActionsMenu from './MoreActionsMenu';
import { useTreeStore } from '../../stores/useTreeStore';
import { useModal } from '../modals/ModalProvider';
import {
  openNewGroup,
  openNewConnection,
  openConfirm,
  openRenameFolder,
  openEditConnection
} from '../modals/modalActions';
import { refreshFolder, deleteFolder } from '../../actions/treeActions';
import {
  connectDatabase,
  disconnectDatabase,
  refreshConnection,
  deleteConnection,
  refreshDatabase,
  refreshSchema,
  createNewSchema,
  exportDatabase,
  createNewTable,
  exportSchema,
  previewTable,
  editTableStructure,
  generateTableSQL,
  exportTableData,
  viewDefinition,
  editView,
  generateViewSQL,
  editFunction,
  viewFunctionSource,
  testFunction,
  showProperties,
  deleteDatabase,
  deleteSchema,
  deleteTable,
  deleteView,
  deleteFunction
} from '../../actions/dbActions';
import { useDragDrop } from './hooks/useDragDrop';
import { findNode } from '../../utils/treeUtils';

const deegoLogo = '/icons/deego_1.svg';

const Sidebar = ({ treeData }) => {
  const [expandedKeys, setExpandedKeys] = useState(new Map());
  const [showMoreMenu, setShowMoreMenu] = useState(null);
  const [moreMenuPosition, setMoreMenuPosition] = useState({ x: 0, y: 0, flip: false });
  const [activeMoreMenuNode, setActiveMoreMenuNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const { openModal } = useModal();
  const { dragSourceId, setDragSourceId, dragOverNodeId, setDragOverNodeId, isDragOverRoot, setIsDragOverRoot } =
    useDragDrop();
  const updateTreePath = useTreeStore((state) => state.updateTreePath);

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (event) => {
      if (!event.target.closest('.more-actions-menu') && !event.target.closest('.tree-node')) {
        setShowMoreMenu(null);
        setMoreMenuPosition({ x: 0, y: 0, flip: false });
        setActiveMoreMenuNode(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMoreMenu]);

  useEffect(() => {
    if (!showMoreMenu) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowMoreMenu(null);
        setActiveMoreMenuNode(null);
        setMoreMenuPosition({ x: 0, y: 0, flip: false });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showMoreMenu]);

  useEffect(() => {
    if (!showMoreMenu) return;
    const close = () => {
      setShowMoreMenu(null);
      setActiveMoreMenuNode(null);
      setMoreMenuPosition({ x: 0, y: 0, flip: false });
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [showMoreMenu]);

  const handleMoreMenu = (e, node) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
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
    setActiveMoreMenuNode(node.id);
  };

  const openRenameFolderModal = (node) => openRenameFolder(node, openModal);
  const openEditConnectionModal = (connection) => openEditConnection(connection, openModal);

  const renderMoreMenuPortal = () => {
    if (!showMoreMenu || !treeData) return null;
    const node = findNode(treeData, showMoreMenu);
    if (!node) return null;
    return createPortal(
      <MoreActionsMenu
        node={node}
        position={moreMenuPosition}
        onClose={() => {
          setShowMoreMenu(null);
          setActiveMoreMenuNode(null);
        }}
        setExpandedKeys={setExpandedKeys}
        openNewGroup={(parentId) => openNewGroup(parentId, openModal)}
        openNewConnection={(parentId) => openNewConnection(parentId, openModal)}
        openConfirm={(title, message, onConfirm, variant) => openConfirm(title, message, onConfirm, variant, openModal)}
        openRenameFolder={openRenameFolderModal}
        openEditConnection={openEditConnectionModal}
        refreshFolder={(node) => refreshFolder(node)}
        deleteFolder={(node) => deleteFolder(node, openModal)}
        refreshConnection={(node, setExpandedKeys) => refreshConnection(node, setExpandedKeys)}
        connectDatabase={(node) => connectDatabase(node)} // 已集成配置加载
        disconnectDatabase={(node) => disconnectDatabase(node)}
        refreshDatabase={(node, setExpandedKeys) => refreshDatabase(node, setExpandedKeys)}
        refreshSchema={(node, setExpandedKeys) => refreshSchema(node, setExpandedKeys)}
        createNewSchema={(node) => createNewSchema(node)}
        exportDatabase={(node) => exportDatabase(node)}
        createNewTable={(node) => createNewTable(node)}
        exportSchema={(node) => exportSchema(node)}
        previewTable={(node) => previewTable(node)}
        editTableStructure={(node) => editTableStructure(node)}
        generateTableSQL={(node) => generateTableSQL(node)}
        exportTableData={(node) => exportTableData(node)}
        viewDefinition={(node) => viewDefinition(node)}
        editView={(node) => editView(node)}
        generateViewSQL={(node) => generateViewSQL(node)}
        editFunction={(node) => editFunction(node)}
        viewFunctionSource={(node) => viewFunctionSource(node)}
        testFunction={(node) => testFunction(node)}
        showProperties={(node) => showProperties(node)}
        deleteConnection={(node) => deleteConnection(node, openModal)}
        deleteDatabase={(node) => deleteDatabase(node, openModal)}
        deleteSchema={(node) => deleteSchema(node, openModal)}
        deleteTable={(node) => deleteTable(node, openModal)}
        deleteView={(node) => deleteView(node, openModal)}
        deleteFunction={(node) => deleteFunction(node, openModal)}
      />,
      document.body
    );
  };

  return (
    <>
      {/* 让左侧树具备独立滚动：父容器列布局占满高度，树列表区域 overflow-y:auto */}
      <div
        className="sidebar-tree"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        {/* 顶部卡片不参与滚动，保持固定 */}
        <div style={{ padding: '0 16px', marginBottom: '20px' }}>
          <div
            style={{
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
            <img src={deegoLogo} alt="Deego" style={{ width: 25, height: 25, filter: 'brightness(0) invert(1)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Deego</div>
              <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>Your Data Buddy</div>
            </div>
          </div>
        </div>

        {/* 树列表滚动容器 */}
        <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          <TreeContainer
            treeData={treeData}
            expandedKeys={expandedKeys}
            setExpandedKeys={setExpandedKeys}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            onMoreMenu={handleMoreMenu}
            activeMoreMenuNode={activeMoreMenuNode}
            setActiveMoreMenuNode={setActiveMoreMenuNode}
            dragSourceId={dragSourceId}
            setDragSourceId={setDragSourceId}
            dragOverNodeId={dragOverNodeId}
            setDragOverNodeId={setDragOverNodeId}
            isDragOverRoot={isDragOverRoot}
            setIsDragOverRoot={setIsDragOverRoot}
            openNewGroup={(parentId) => openNewGroup(parentId, openModal)}
            openNewConnection={(parentId) => openNewConnection(parentId, openModal)}
            openRenameFolder={(node) => openRenameFolder(node, openModal)}
            openEditConnection={(connection) => openEditConnection(connection, openModal)}
            openModal={openModal}
          />
        </div>
      </div>

      {renderMoreMenuPortal()}
    </>
  );
};

export default Sidebar;

