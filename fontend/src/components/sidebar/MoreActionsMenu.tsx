import React, { useState } from 'react';
import { useTreeStore } from '../../stores/useTreeStore';
import toast from 'react-hot-toast';

const MoreActionsMenu = ({
  node,
  actions,  // 新增：接收过滤后的 actions
  position,
  onClose,
  setExpandedKeys,
  openNewGroup,
  openNewConnection,
  openConfirm,
  openRenameFolder,
  openEditConnection,
  refreshFolder,
  deleteFolder,
  refreshConnection,
  connectDatabase,
  disconnectDatabase,
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
  deleteConnection,
  deleteDatabase,
  deleteSchema,
  deleteTable,
  deleteView,
  deleteFunction,
  openModal
}: any) => {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const { actionMap } = useTreeStore();
  const menuActions = actions || actionMap[node.type] || [];  // 修改：优先用传入的 actions
  const handleAction = (action: any) => {
    try {
      if (typeof action === 'function') {
        action();
      } else {
        toast.error('无效操作');
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error('操作执行失败');
    }
    onClose();
  };
  const flipStyle = position.flip ? { borderTop: '2px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' } : {};
  return (
    <div
      className="more-actions-menu"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        zIndex: 1000,
        minWidth: '180px',
        maxHeight: '300px',
        overflowY: 'auto',
        fontSize: '13px',
        fontFamily: 'var(--font)',
        ...flipStyle
      }}
    >
      {menuActions.map((item, index) => {
        if (item.type === 'separator') {
          return (
            <div
              key={`sep-${index}`}
              style={{ height: '1px', background: '#e0e0e0', margin: '4px 0' }}
            />
          );
        }
        const isHovered = hoveredItem === index;
        return (
          <div
            key={item.label}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: isHovered ? '#0b69ff' : '#333',
              background: isHovered ? '#f8f9fa' : 'transparent',
              transition: 'all 0.2s ease',
              borderRadius: '6px',
              margin: '2px 4px'
            }}
            onMouseEnter={() => setHoveredItem(index)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => {
                // 动态调用 actionHandlers
                import('../../actions/dbActions').then((mod) => {
                  mod.actionHandlers.dynamicHandler(item.handler, node, {
                    setExpandedKeys,
                    openModal,
                  });
                });
              });
            }}
          >
            <span style={{ fontSize: '14px', width: '16px' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default MoreActionsMenu;