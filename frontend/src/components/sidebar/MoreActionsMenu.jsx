// components/sidebar/MoreActionsMenu.jsx
import React, { useState } from 'react';
import { getAllActions } from './actions';

const MoreActionsMenu = ({ node, position, onClose, treeData, setTreeData, setExpandedKeys, openNewGroup, openNewConnection, openConfirm, openRenameFolder, openEditConnection }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const actions = getAllActions(node.type, node, treeData, setTreeData, setExpandedKeys, openNewGroup, openNewConnection, openConfirm, openRenameFolder, openEditConnection);

  const handleAction = (action) => {
    action();
    onClose();
  };

  const flipStyle = position.flip ? {
    borderTop: '2px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0'
  } : {};

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
      {actions.map((item, index) => {
        if (item.type === 'separator') {
          return (
            <div
              key={`sep-${index}`}
              style={{
                height: '1px',
                background: '#e0e0e0',
                margin: '4px 0'
              }}
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
              handleAction(item.action);
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