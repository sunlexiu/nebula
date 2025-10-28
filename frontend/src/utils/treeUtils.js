// src/utils/treeUtils.js
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

// 新增：从 store 导入（全局使用）
const treeConfigStore = window.treeConfigStore || { getState: () => ({ getConfig: () => ({}), getNextLevelConfig: () => ({}), getGroupByConfigs: () => ({}), getExtraLevels: () => [], buildVirtualGroupNode: () => ({}) }) };

// 图标：优先节点 config.icon，后备旧逻辑
export const getNodeIcon = (node) => {
  return node.config?.icon || (() => {
    if (node.type === 'connection') {
      switch (node.dbType) {
        case 'POSTGRESQL': return pgsqlIcon;
        case 'MYSQL': return mysqlIcon;
        case 'ORACLE': return oracleIcon;
        case 'SQLSERVER': return sqlserverIcon;
        default: return dbIcon;
      }
    }
    if (node.type === 'folder') return node.expanded ? folderOpenIcon : folderIcon;
    if (node.type === 'database') return dbIcon;
    if (node.type === 'schema') return schemaIcon;
    if (node.type === 'table') return tableIcon;
    if (node.type === 'view') return viewIcon;
    if (node.type === 'function') return functionIcon;
    return fileGroupIcon;
  })();
};

// 展开图标：不变，但检查 virtual 节点
export const getExpandIcon = (node) => {
  if ((node.children && node.children.length > 0) || node.virtual) {  // 支持虚拟节点
    if (node.type === 'folder' || node.type === 'connection' || node.type === 'database' || node.type === 'schema' || node.type.includes('_group')) {
      return node.expanded ? '▼' : '▶';
    }
  }
  return '';
};

// 通用加载子节点：根据 config.apiEndpoint/sqlQuery 构建（后端处理 sqlQuery）
export const loadNodeChildren = async (node) => {
  if (!node.connected) {
    console.warn('节点未连接，无法加载子节点');
    return { ...node, children: [] };
  }

  const config = node.config;
  if (!config) {
    console.warn('No config in node');
    return { ...node, children: [] };
  }

  // 构建路径：从 node.id 解析 (e.g., "conn123::database::mydb::schema::public" -> "database/mydb/schema/public")
  const pathSegments = node.id.split('::').slice(1);  // 去掉 connId
  const path = pathSegments.join('/');

  // URL：使用通用接口，后端根据 path 和 config.sqlQuery 执行
  const url = `/api/meta/${encodeURIComponent(node.parentId || node.id.split('::')[0])}/${path}/children`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(await response.text());
    let { data: { items } } = await response.json();

    // 处理聚合层：如果有 groupBy，创建虚拟 group 节点，并为其加载 children
    const groupByConfigs = treeConfigStore.getState().getGroupByConfigs(config);
    if (groupByConfigs && Object.keys(groupByConfigs).length > 0) {
      items = [];  // 清空，替换为 group 节点
      for (const groupKey of Object.keys(groupByConfigs)) {  // 改为 for...of 以支持 await
        const groupNode = treeConfigStore.getState().buildVirtualGroupNode(groupKey, node, config);
        if (groupNode) {
          // 递归加载 group 的 children（使用 group sqlQuery）
          const groupChildren = await loadNodeChildrenForGroup(groupNode, node);  // 内部函数
          groupNode.children = groupChildren;
          items.push(groupNode);
        }
      }
    } else {
      // 普通层：注入下一层 config
      const nextConfig = treeConfigStore.getState().getNextLevelConfig(config, node.subType);
      items = items.map((item) => ({
        ...item,
        parentId: node.id,
        connected: node.connected,
        config: nextConfig ? { ...nextConfig, ...item.config } : { type: item.type, icon: nextConfig?.icon }
      }));
    }

    // 注入 extraLevels（仅 connection 层）
    if (node.type === 'connection') {
      const extraConfigs = treeConfigStore.getState().getExtraLevels(config);
      const extraNodes = extraConfigs
        .filter((extra) => extra.position === 'connection')
        .map((extra) => ({
          id: `${node.id}::extra::${extra.type}`,
          parentId: node.id,
          name: extra.label,
          type: extra.type,
          config: extra,
          children: [],  // 懒加载
          connected: node.connected
        }));
      items = [...items, ...extraNodes];
    }

    return { ...node, expanded: true, children: items };
  } catch (error) {
    console.error('加载子节点失败:', error);
    return { ...node, children: [], expanded: false };
  }
};

// 内部：为 group 加载 children（递归调用 loadNodeChildren，但路径调整）
const loadNodeChildrenForGroup = async (groupNode, parentNode) => {
  const groupPath = `${parentNode.id.split('::').slice(1).join('/')}/group/${groupNode.id.split('::').pop()}`;
  const groupUrl = `/api/meta/${encodeURIComponent(parentNode.id.split('::')[0])}/${groupPath}/children`;
  try {
    const response = await fetch(groupUrl);
    if (!response.ok) throw new Error(await response.text());
    const { data: { items } } = await response.json();
    const childConfig = groupNode.config.childConfig;
    return items.map((item) => ({
      ...item,
      parentId: groupNode.id,
      connected: parentNode.connected,
      config: childConfig ? { ...childConfig, ...item.config } : { type: item.type }
    }));
  } catch (error) {
    console.error('加载 group 子节点失败:', error);
    return [];
  }
};

// findNode, findConnectionId, updateTreePath 不变
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