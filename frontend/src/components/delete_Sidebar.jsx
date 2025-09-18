import React, { useState } from 'react';

import fileGroupIcon from '../public/icons/left_tree/file_group_1.svg';
import folderIcon from '../public/icons/left_tree/folder_1.svg';
import folderOpenIcon from '../public/icons/left_tree/folder_open_1.svg';
import dbIcon from '../public/icons/left_tree/db_1.svg';
import schemaIcon from '../public/icons/left_tree/schema_1.svg';
import tableIcon from '../public/icons/left_tree/table_1.svg';
import viewIcon from '../public/icons/left_tree/view_1.svg';
import functionIcon from '../public/icons/left_tree/function_1.svg';

import pgsqlIcon from '../public/icons/db/postgresql_icon_3.svg';
import mysqlIcon from '../public/icons/db/mysql_icon_2.svg';
import oracleIcon from '../public/icons/db/oracle_icon_3.svg';
import sqlserverIcon from '../public/icons/db/sqlserver_icon_1.svg';

const initialTreeData = [
  {
    id: 'f1',
    name: '开发环境',
    type: 'folder',
    expanded: false,
    children: [
      {
        id: 'c1',
        name: '本地Postgres',
        type: 'connection',
        dbType: 'pgsql',
        expanded: false,
        children: []
      }
    ]
  }
];

const getNodeIcon = (node) => {
  if (node.type === 'connection') {
    switch (node.dbType) {
      case 'pgsql': return pgsqlIcon;
      case 'mysql': return mysqlIcon;
      case 'oracle': return oracleIcon;
      case 'sqlserver': return sqlserverIcon;
      default: return dbIcon;
    }
  }
  if (node.type === 'folder') {
    return node.expanded ? folderOpenIcon : folderIcon;
  }
  if (node.type === 'db') return dbIcon;
  if (node.type === 'schema') return schemaIcon;
  if (node.type === 'table') return tableIcon;
  if (node.type === 'view') return viewIcon;
  if (node.type === 'function') return functionIcon;
  return fileGroupIcon;
};

const getExpandIcon = (node) => {
  if (node.children && node.children.length > 0) {
    if (node.type === 'folder' || node.type === 'connection' || node.type === 'schema') {
      return node.expanded ? '▼' : '▶';
    }
  }
  return '';
};

// 获取节点类型对应的主要功能按钮
const getPrimaryAction = (nodeType) => {
  const actions = {
    folder: { icon: '📁', label: '新建', action: () => {} },
    connection: { icon: '⚡', label: '连接', action: () => {} },
    schema: { icon: '🔄', label: '刷新', action: () => {} },
    table: { icon: '📊', label: '预览', action: () => {} },
    view: { icon: '👁️', label: '查看', action: () => {} },
    function: { icon: '⚙️', label: '编辑', action: () => {} }
  };
  return actions[nodeType] || null;
};

// 获取节点类型对应的所有功能菜单
const getAllActions = (nodeType, nodeId) => {
  const actions = {
    folder: [
      { label: '新建文件夹', action: () => addFolder(nodeId), icon: '📁' },
      { label: '新建连接', action: () => addConnection(nodeId), icon: '🔌' },
      { type: 'separator' },
      { label: '刷新', action: () => refreshFolder(nodeId), icon: '🔄' },
      { label: '属性', action: () => showProperties({ id: nodeId, type: 'folder' }), icon: 'ℹ️' }
    ],
    connection: [
      { label: '连接', action: () => connectDatabase(nodeId), icon: '⚡' },
      { label: '断开连接', action: () => disconnectDatabase(nodeId), icon: '🔌' },
      { type: 'separator' },
      { label: '刷新', action: () => refreshConnection(nodeId), icon: '🔄' },
      { label: '连接设置', action: () => showConnectionSettings(nodeId), icon: '⚙️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties({ id: nodeId, type: 'connection' }), icon: 'ℹ️' }
    ],
    schema: [
      { label: '刷新', action: () => refreshSchema(nodeId), icon: '🔄' },
      { label: '新建表', action: () => createNewTable(nodeId), icon: '📊' },
      { label: '导出结构', action: () => exportSchema(nodeId), icon: '📤' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties({ id: nodeId, type: 'schema' }), icon: 'ℹ️' }
    ],
    table: [
      { label: '预览数据', action: () => previewTable(nodeId), icon: '📊' },
      { label: '编辑结构', action: () => editTableStructure(nodeId), icon: '✏️' },
      { label: '生成SQL', action: () => generateTableSQL(nodeId), icon: '💾' },
      { label: '导出数据', action: () => exportTableData(nodeId), icon: '📤' },
      { type: 'separator' },
      { label: '删除表', action: () => deleteTable(nodeId), icon: '🗑️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties({ id: nodeId, type: 'table' }), icon: 'ℹ️' }
    ],
    view: [
      { label: '查看定义', action: () => viewDefinition(nodeId), icon: '👁️' },
      { label: '编辑视图', action: () => editView(nodeId), icon: '✏️' },
      { label: '生成SQL', action: () => generateViewSQL(nodeId), icon: '💾' },
      { type: 'separator' },
      { label: '删除视图', action: () => deleteView(nodeId), icon: '🗑️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties({ id: nodeId, type: 'view' }), icon: 'ℹ️' }
    ],
    function: [
      { label: '编辑函数', action: () => editFunction(nodeId), icon: '✏️' },
      { label: '查看源码', action: () => viewFunctionSource(nodeId), icon: '👁️' },
      { label: '执行测试', action: () => testFunction(nodeId), icon: '🔬' },
      { type: 'separator' },
      { label: '删除函数', action: () => deleteFunction(nodeId), icon: '🗑️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties({ id: nodeId, type: 'function' }), icon: 'ℹ️' }
    ]
  };
  return actions[nodeType] || [
    { label: '属性', action: () => showProperties({ id: nodeId, type: nodeType }), icon: 'ℹ️' }
  ];
};

function Sidebar() {
  const [treeData, setTreeData] = useState(initialTreeData);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(null);
  const [moreMenuPosition, setMoreMenuPosition] = useState({ x: 0, y: 0 });

  // 渲染单个节点
  const renderNode = (node, level = 0) => {
    const iconSrc = getNodeIcon(node);
    const expandIcon = getExpandIcon(node);
    const hasChildren = node.children && node.children.length > 0;
    const isExpandable = hasChildren || node.type === 'connection' || node.type === 'schema';
    const isHovered = hoveredNode === node.id;
    const primaryAction = getPrimaryAction(node.type);
    
    // 根据节点类型设置颜色主题
    const getThemeColors = () => {
      const accent = '#0b69ff';
      switch (node.type) {
        case 'folder':
          return {
            hoverBg: 'linear-gradient(90deg, #f8f9ff 0%, #f0f2ff 100%)',
            textColor: '#5b6d8f',
            iconColor: '#667eea',
            accentColor: accent
          };
        case 'connection':
          return {
            hoverBg: `linear-gradient(90deg, rgba(${accent}, 0.05) 0%, rgba(${accent}, 0.1) 100%)`,
            textColor: '#2e7d32',
            iconColor: '#4caf50',
            accentColor: accent
          };
        case 'schema':
          return {
            hoverBg: 'linear-gradient(90deg, #fff3e0 0%, #ffecb3 100%)',
            textColor: '#e65100',
            iconColor: '#ff9800',
            accentColor: accent
          };
        case 'table':
          return {
            hoverBg: 'linear-gradient(90deg, #f3e5f5 0%, #f1e8fd 100%)',
            textColor: '#6a1b9a',
            iconColor: '#9c27b0',
            accentColor: accent
          };
        default:
          return {
            hoverBg: '#f5f5f5',
            textColor: '#333',
            iconColor: '#666',
            accentColor: accent
          };
      }
    };

    const theme = getThemeColors();
    
    // 处理主要功能按钮点击
    const handlePrimaryAction = (e) => {
      e.stopPropagation();
      if (primaryAction) {
        primaryAction.action(node);
      }
    };

    // 处理更多菜单
    const handleMoreMenu = (e) => {
      e.stopPropagation();
      setMoreMenuPosition({ x: e.clientX, y: e.clientY });
      setShowMoreMenu(node.id);
    };

    // 关闭更多菜单
    const closeMoreMenu = () => {
      setShowMoreMenu(null);
    };

    return (
      <>
        <div
          key={node.id}
          className={`tree-node ${node.type} ${node.expanded ? 'expanded' : ''} ${isHovered ? 'hovered' : ''}`}
          style={{ 
            padding: '6px 8px',
            margin: '1px 0',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '6px',
            cursor: isExpandable ? 'pointer' : 'default',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            background: isHovered 
              ? theme.hoverBg 
              : 'transparent',
            border: isHovered 
              ? `1px solid ${theme.accentColor}20` 
              : '1px solid transparent',
            transform: isHovered ? 'translateX(1px)' : 'translateX(0)',
            boxShadow: isHovered 
              ? `0 1px 4px ${theme.accentColor}10` 
              : 'none',
            paddingLeft: `${12 + level * 12}px`, // 进一步压缩：12 + 12*level
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'var(--font)',
            fontSize: '13px',
            paddingRight: isHovered ? '4px' : '8px'
          }}
          onMouseEnter={() => setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={(e) => {
            e.stopPropagation();
            if (isExpandable) {
              toggleExpand(node.id);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {/* 悬浮时的微妙动画装饰 */}
          {isHovered && (
            <div 
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '2px',
                background: `linear-gradient(to bottom, ${theme.accentColor}, ${theme.accentColor}80)`,
                borderRadius: '0 2px 2px 0'
              }}
            />
          )}
          
          {/* 展开/折叠图标 */}
          <div 
            style={{ 
              width: 12,
              height: 12,
              marginRight: 4, // 进一步压缩间距
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              color: isHovered ? theme.accentColor : '#999'
            }}
          >
            {expandIcon ? (
              <span 
                style={{ 
                  fontSize: 9,
                  fontWeight: 'bold',
                  transition: 'color 0.2s ease'
                }}
              >
                {expandIcon}
              </span>
            ) : (
              <div style={{ width: 10, height: 10 }} />
            )}
          </div>
          
          {/* 节点图标 */}
          <img 
            src={iconSrc} 
            alt={node.type} 
            style={{ 
              width: 14, 
              height: 14,
              marginRight: 4, // 进一步压缩间距
              flexShrink: 0,
              filter: isHovered 
                ? `drop-shadow(0 0 1px ${theme.accentColor}30)` 
                : 'none',
              transition: 'all 0.2s ease',
              transform: isHovered ? 'scale(1.02)' : 'scale(1)'
            }}
          />
          
          {/* 节点名称 */}
          <span 
            className="node-name"
            style={{ 
              flex: 1,
              fontSize: isHovered ? '13.2px' : '13px',
              fontWeight: isHovered ? '500' : '400',
              color: isHovered ? theme.textColor : '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'all 0.2s ease',
              letterSpacing: isHovered ? '0.1px' : '0px',
              marginRight: isHovered ? '8px' : '0'
            }}
          >
            {node.name}
          </span>
          
          {/* 节点类型标签 */}
          {node.type !== 'folder' && (
            <span 
              className="node-type"
              style={{
                fontSize: '10px',
                color: isHovered ? theme.accentColor : '#999',
                background: isHovered 
                  ? `${theme.accentColor}10` 
                  : '#f0f0f0',
                padding: isHovered ? '2px 6px' : '1px 4px',
                borderRadius: '10px',
                border: isHovered ? `1px solid ${theme.accentColor}20` : 'none',
                transition: 'all 0.2s ease',
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                marginLeft: '4px' // 压缩标签左边距
              }}
            >
              {node.type}
            </span>
          )}

          {/* 悬浮时的功能按钮区域 */}
          {isHovered && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                marginLeft: '4px', // 压缩按钮左边距
                paddingLeft: '2px'
              }}
            >
              {/* 主要功能按钮 */}
              {primaryAction && (
                <button
                  onClick={handlePrimaryAction}
                  style={{
                    width: 20,
                    height: 20,
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme.accentColor,
                    fontSize: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {primaryAction.icon}
                </button>
              )}
              
              {/* 更多操作按钮 */}
              <button
                onClick={handleMoreMenu}
                style={{
                  width: 20,
                  height: 20,
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  flexShrink: 0,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                  e.target.style.color = theme.accentColor;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.target.style.color = '#666';
                }}
              >
                ⋯
              </button>
            </div>
          )}

          {/* 悬浮时的子项指示器 */}
          {isHovered && hasChildren && !primaryAction && (
            <div 
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 3,
                height: 3,
                background: theme.accentColor,
                borderRadius: '50%',
                opacity: 0.6
              }}
            />
          )}
        </div>

        {/* 更多操作菜单 */}
        {showMoreMenu === node.id && (
          <MoreActionsMenu
            node={node}
            position={moreMenuPosition}
            onClose={closeMoreMenu}
          />
        )}
      </>
    );
  };

  // 渲染树节点（递归）
  const renderTreeNodes = (nodes, level = 0) => {
    return nodes.map((node) => {
      const renderedNode = renderNode(node, level);
      
      // 如果有子节点且展开，递归渲染子节点
      if (node.expanded && node.children && node.children.length > 0) {
        return (
          <React.Fragment key={node.id}>
            {renderedNode}
            <div 
              style={{ 
                marginLeft: '2px', // 进一步压缩
                paddingLeft: '1px', // 进一步压缩
                borderLeft: '1px solid #e0e7ff',
                marginTop: '1px'
              }}
            >
              {renderTreeNodes(node.children, level + 1)}
            </div>
          </React.Fragment>
        );
      }
      
      return renderedNode;
    });
  };

  // 更多操作菜单组件
  const MoreActionsMenu = ({ node, position, onClose }) => {
    const [hoveredItem, setHoveredItem] = useState(null);
    const actions = getAllActions(node.type, node.id);

    return (
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y + 25,
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 1001,
          minWidth: '180px',
          fontSize: '13px',
          fontFamily: 'var(--font)',
          overflow: 'hidden'
        }}
        onMouseLeave={onClose}
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
                item.action(node);
                onClose();
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

  // 切换展开/折叠
  const toggleExpand = (nodeId) => {
    setTreeData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const node = findNode(copy, nodeId);
      if (node) {
        if (!node.children || node.children.length === 0) {
          loadNodeChildren(node);
        } else {
          node.expanded = !node.expanded;
        }
      }
      return copy;
    });
  };

  // 懒加载节点子项
  const loadNodeChildren = async (node) => {
    try {
      if (node.type === 'connection' && (!node.children || node.children.length === 0)) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const schemas = [
          { 
            id: `${node.id}-s1`, 
            name: 'public', 
            type: 'schema', 
            expanded: false,
            children: []
          }
        ];
        node.children = schemas;
        node.expanded = true;
      }

      if (node.type === 'schema' && (!node.children || node.children.length === 0)) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const tables = [
          { id: `${node.id}-t1`, name: 'users', type: 'table', expanded: false },
          { id: `${node.id}-t2`, name: 'orders', type: 'table', expanded: false },
          { id: `${node.id}-t3`, name: 'products', type: 'table', expanded: false }
        ];
        node.children = tables;
        node.expanded = true;
      }
    } catch (error) {
      console.error('加载节点失败:', error);
    }
  };

  // 右键菜单（保留原有功能）
  const handleContextMenu = (e, node) => {
    e.preventDefault();
    e.stopPropagation();
    // 使用新的更多菜单替代右键菜单
    handleMoreMenu(e);
  };

  // 辅助函数
  const findNode = (nodes, id) => {
    for (let node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 各种操作函数
  const addFolder = (parentId) => {
    const newFolderName = window.prompt('文件夹名称:', '新建文件夹');
    if (!newFolderName) return;
    setTreeData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parent = findNode(copy, parentId);
      if (parent) {
        parent.children.push({
          id: 'f' + Date.now(),
          name: newFolderName,
          type: 'folder',
          expanded: false,
          children: []
        });
      }
      return copy;
    });
  };

  const addConnection = (parentId) => {
    const connectionName = window.prompt('连接名称:', '新建连接');
    if (!connectionName) return;
    setTreeData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parent = findNode(copy, parentId);
      if (parent) {
        parent.children.push({
          id: 'c' + Date.now(),
          name: connectionName,
          type: 'connection',
          dbType: 'pgsql',
          expanded: false,
          children: []
        });
      }
      return copy;
    });
  };

  const connectDatabase = (node) => {
    alert(`正在连接数据库: ${node.name}`);
  };

  const disconnectDatabase = (node) => {
    alert(`断开连接: ${node.name}`);
  };

  const refreshConnection = (node) => {
    node.children = [];
    node.expanded = false;
    setTreeData([...treeData]);
    alert(`刷新连接: ${node.name}`);
  };

  const refreshFolder = (node) => {
    alert(`刷新文件夹: ${node.name}`);
  };

  const refreshSchema = (node) => {
    node.children = [];
    node.expanded = false;
    setTreeData([...treeData]);
    alert(`刷新架构: ${node.name}`);
  };

  const showProperties = (node) => {
    alert(`节点属性:\nID: ${node.id}\n类型: ${node.type}\n名称: ${node.name}`);
  };

  const showConnectionSettings = (node) => {
    alert(`连接设置: ${node.name}`);
  };

  const createNewTable = (node) => {
    alert(`新建表在架构: ${node.name}`);
  };

  const exportSchema = (node) => {
    alert(`导出架构: ${node.name}`);
  };

  const previewTable = (node) => {
    alert(`预览表: ${node.name}`);
  };

  const editTableStructure = (node) => {
    alert(`编辑表结构: ${node.name}`);
  };

  const generateTableSQL = (node) => {
    alert(`生成SQL: ${node.name}`);
  };

  const exportTableData = (node) => {
    alert(`导出数据: ${node.name}`);
  };

  const deleteTable = (node) => {
    if (window.confirm(`确定要删除表 ${node.name} 吗？`)) {
      alert(`删除表: ${node.name}`);
    }
  };

  const viewDefinition = (node) => {
    alert(`查看定义: ${node.name}`);
  };

  const editView = (node) => {
    alert(`编辑视图: ${node.name}`);
  };

  const generateViewSQL = (node) => {
    alert(`生成视图SQL: ${node.name}`);
  };

  const deleteView = (node) => {
    if (window.confirm(`确定要删除视图 ${node.name} 吗？`)) {
      alert(`删除视图: ${node.name}`);
    }
  };

  const editFunction = (node) => {
    alert(`编辑函数: ${node.name}`);
  };

  const viewFunctionSource = (node) => {
    alert(`查看源码: ${node.name}`);
  };

  const testFunction = (node) => {
    alert(`测试函数: ${node.name}`);
  };

  const deleteFunction = (node) => {
    if (window.confirm(`确定要删除函数 ${node.name} 吗？`)) {
      alert(`删除函数: ${node.name}`);
    }
  };

  return (
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
        onClick={() => {
          console.log('打开数据库设置');
        }}
        >
          <img 
            src={pgsqlIcon} 
            alt="PostgreSQL" 
            style={{ 
              width: 18, 
              height: 18,
              filter: 'brightness(0) invert(1)'
            }} 
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              nebula-db-demo
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
              PostgreSQL 15.3
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '10px 14px',
          background: 'linear-gradient(90deg, #e8f5e8 0%, #f0f8f0 100%)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#2e7d32',
          border: '1px solid #c8e6c9',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(90deg, #e3f2e3 0%, #eafaf1 100%)';
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(90deg, #e8f5e8 0%, #f0f8f0 100%)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: 8, height: 8, background: '#4caf50', 
              borderRadius: '50%', boxShadow: '0 0 8px #4caf5020'
            }} />
            <span>已连接</span>
          </span>
          <span style={{ marginLeft: 'auto', color: '#666', fontSize: '11px' }}>
            localhost:5432
          </span>
        </div>
      </div>
      
      <div className="tree-container">
        {renderTreeNodes(treeData)}
      </div>
    </div>
  );
}

export default Sidebar;