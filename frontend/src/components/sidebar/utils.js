// components/sidebar/utils.js
// 工具函数和配置

import fileGroupIcon from '../../public/icons/left_tree/file_group_1.svg';
import folderIcon from '../../public/icons/left_tree/folder_1.svg';
import folderOpenIcon from '../../public/icons/left_tree/folder_open_1.svg';
import dbIcon from '../../public/icons/left_tree/db_1.svg';
import schemaIcon from '../../public/icons/left_tree/schema_1.svg';
import tableIcon from '../../public/icons/left_tree/table_1.svg';
import viewIcon from '../../public/icons/left_tree/view_1.svg';
import functionIcon from '../../public/icons/left_tree/function_1.svg';

import pgsqlIcon from '../../public/icons/db/postgresql_icon_3.svg';
import mysqlIcon from '../../public/icons/db/mysql_icon_2.svg';
import oracleIcon from '../../public/icons/db/oracle_icon_3.svg';
import sqlserverIcon from '../../public/icons/db/sqlserver_icon_1.svg';

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
    if (node.type === 'folder' || node.type === 'connection' || node.type === 'database' || node.type === 'schema' ) {
      return node.expanded ? '▼' : '▶';
    }
  }
  return '';
};

// 懒加载节点子项
export const loadNodeChildren = async (node, setTreeData, setExpandedKeys) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        if (!node.connected && (node.type === 'connection' || node.type === 'database' || node.type === 'schema')) {
          alert('请先连接数据库');
          return resolve({ ...node });
        }

        let updatedNode = { ...node, expanded: true };

        // 根据类型调用刷新（已传入 setTreeData/setExpandedKeys）
        // refresh 函数已在 actions 中处理更新
        resolve(updatedNode);
      } catch (error) {
        console.error('加载节点失败:', error);
        reject(error);
      }
    }, 300);
  });
};