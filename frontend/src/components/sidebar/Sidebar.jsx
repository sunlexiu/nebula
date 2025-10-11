import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TreeNode from './TreeNode';
import { findNode } from './actions';
import deegoLogo from '../../public/icons/deego_1.svg';
import MoreActionsMenu from './MoreActionsMenu';

const Sidebar = ({ treeData, setTreeData, openNewGroup, openNewConnection, openConfirm }) => {
  const [expandedKeys, setExpandedKeys] = useState(new Map());
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(null);
  const [moreMenuPosition, setMoreMenuPosition] = useState({ x: 0, y: 0, flip: false });

  // 外部点击检测和 Escape 键关闭
  useEffect(() => {
    if (!showMoreMenu) return;

    const handleClickOutside = (event) => {
      if (!event.target.closest('.more-actions-menu')) {
        setShowMoreMenu(null);
        setMoreMenuPosition({ x: 0, y: 0, flip: false });
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowMoreMenu(null);
        setMoreMenuPosition({ x: 0, y: 0, flip: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMoreMenu]);

  // 处理更多菜单 - 优先下方展示，如果空间不足再上方
  const handleMoreMenu = (e, node) => {
    e.stopPropagation();
    const treeItem = e.currentTarget;  // 树项 div
    const rect = treeItem.getBoundingClientRect();
    const baseY = rect.bottom;  // 基准：项底部
    const estimatedMenuHeight = 200;  // 预计菜单高度
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - baseY;
    const minTop = 20;  // 顶部最小边距
    const bottomMargin = 20;  // 底部最小边距

    let flip = false;  // 默认不翻转（向下）
    let adjustedY = baseY + 10;  // 默认向下 + 小间隙

    if (spaceBelow >= estimatedMenuHeight) {
      // 下方空间够，向下展示
      adjustedY = baseY + 10;
    } else {
      // 下方不足，翻转向上
      flip = true;
      adjustedY = rect.top - estimatedMenuHeight;  // 项顶部 - 菜单高
      // 确保不超出顶部
      if (adjustedY < minTop) {
        adjustedY = minTop;
      }
    }

    // 最终检查不超出视口底部（安全网）
    if (adjustedY + estimatedMenuHeight > viewportHeight - bottomMargin) {
      adjustedY = viewportHeight - estimatedMenuHeight - bottomMargin;
      flip = adjustedY < rect.top;  // 如果调整后在上方，标记翻转
    }

    setMoreMenuPosition({ x: e.clientX + 5, y: adjustedY, flip });
    setShowMoreMenu(node.id);
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
        />
      );

      if (isExpanded && node.children && node.children.length > 0) {
        return (
          <React.Fragment key={node.id}>
            {renderedNode}
            <div style={{
              marginLeft: '2px',
              paddingLeft: '1px',
              borderLeft: '1px solid #e0e7ff',
              marginTop: '1px',
              transition: 'max-height 0.3s ease',
              overflow: 'hidden'
            }}>
              {renderTreeNodes(node.children, level + 1)}
            </div>
          </React.Fragment>
        );
      }

      return renderedNode;
    });
  }, [expandedKeys, hoveredNode, treeData, openNewGroup, openNewConnection, openConfirm]);

  // Portal 渲染菜单
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
          setMoreMenuPosition({ x: 0, y: 0, flip: false });
        }}
        treeData={treeData}
        setTreeData={setTreeData}
        setExpandedKeys={setExpandedKeys}
        openNewGroup={openNewGroup}
        openNewConnection={openNewConnection}
        openConfirm={openConfirm}
      />,
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
        {/* 头部信息区域 */}
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

        <div className="tree-container">
          {renderTreeNodes(treeData)}
        </div>
      </div>

      {/* Portal 菜单渲染 */}
      {renderMoreMenuPortal()}
    </>
  );
};

export default Sidebar;