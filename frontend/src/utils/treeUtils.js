// 工具函数和配置（从原 sidebar/utils.js 迁移 + 扩展）

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

// 获取节点图标 - 加 connected 变体（这里模拟，实际可换 SVG）
export const getNodeIcon = (node) => {
  if (node.type === 'connection' && node.connected) {
    // 模拟 connected 图标：实际用不同文件
    return pgsqlIcon; // 或 pgsqlIconConnected
  }
  if (node.type === 'connection') {
    switch (node.dbType) {
      case 'POSTGRESQL': return pgsqlIcon;
      case 'MYSQL': return mysqlIcon;
      case 'ORACLE': return oracleIcon;
      case 'SQLSERVER': return sqlserverIcon;
      default: return dbIcon;
    }
  }
  if (node.type === 'folder') {
    return node.expanded ? folderOpenIcon : folderIcon;
  }
  if (node.type === 'database') return dbIcon;
  if (node.type === 'schema') return schemaIcon;
  if (node.type === 'table') return tableIcon;
  if (node.type === 'view') return viewIcon;
  if (node.type === 'function') return functionIcon;
  return fileGroupIcon;
};

// 获取展开图标
export const getExpandIcon = (node) => {
  if (node.children && node.children.length > 0) {
    if (node.type === 'folder' || node.type === 'connection' || node.type === 'database' || node.type === 'schema') {
      return node.expanded ? '▼' : '▶';
    }
  }
  return '';
};

// 懒加载节点子项
export const loadNodeChildren = async (node, setExpandedKeys) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        if (!node.connected && (node.type === 'connection' || node.type === 'database' || node.type === 'schema')) {
          alert('请先连接数据库'); // 或用 toast
          return resolve({ ...node });
        }

        let updatedNode = { ...node, expanded: true };

        // 根据类型调用刷新（模拟，实际集成后端 API）
        // 示例：refreshConnection 等函数从 actions 导入
        resolve(updatedNode);
      } catch (error) {
        console.error('加载节点失败:', error);
        reject(error);
      }
    }, 300);
  });
};

// 其他工具函数（原有）
export const findNode = (nodes, id) => {
  if (!Array.isArray(nodes)) return null;
  for (let node of nodes) {
    if (node && node.id === id) return node;
    if (node && node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const findConnectionId = (nodeId, treeData) => {
  const findAncestor = (nodes, targetId) => {
    for (let node of nodes) {
      if (node.id === targetId && node.type === 'connection') return node.id;
      if (node.children) {
        const found = findAncestor(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };
  return findAncestor(treeData, nodeId) || null;
};

export const updateTreePath = (treeData, targetId, updaterFn) => {
  const newTree = JSON.parse(JSON.stringify(treeData));
  const targetNode = findNode(newTree, targetId);
  if (targetNode) Object.assign(targetNode, updaterFn({ ...targetNode }));
  return newTree;
};