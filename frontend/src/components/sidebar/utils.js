// utils.js
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

// 初始树数据
export const initialTreeData = [
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

// 获取节点图标
export const getNodeIcon = (node) => {
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

// 懒加载节点子项 - 修改为返回Promise
export const loadNodeChildren = async (node) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        let updatedNode = { ...node }; // 创建副本

        if (node.type === 'connection' && (!node.children || node.children.length === 0)) {
          const databases = [
            {
              id: `${node.id}-database1`,
              name: 'postgres',
              type: 'database',
              expanded: false,
              children: []
            }
          ];
          updatedNode.children = databases;
          updatedNode.expanded = true;
        }

        if (node.type === 'database' && (!node.children || node.children.length === 0)) {
          const schemas = [
            {
              id: `${node.id}-s1`,
              name: 'public',
              type: 'schema',
              expanded: false,
              children: []
            }
          ];
          updatedNode.children = schemas;
          updatedNode.expanded = true;
        }

        if (node.type === 'schema' && (!node.children || node.children.length === 0)) {
          const tables = [
            { id: `${node.id}-t1`, name: 'users', type: 'table', expanded: false },
            { id: `${node.id}-t2`, name: 'orders', type: 'table', expanded: false },
            { id: `${node.id}-t3`, name: 'products', type: 'table', expanded: false }
          ];
          updatedNode.children = tables;
          updatedNode.expanded = true;
        }
        resolve(updatedNode);
      } catch (error) {
        console.error('加载节点失败:', error);
        resolve(null);
      }
    }, 300);
  });
};