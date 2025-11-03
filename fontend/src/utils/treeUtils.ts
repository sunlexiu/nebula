/* src/utils/treeUtils.js  –– 所有节点展开统一走 /meta/{connId}/{path}/children */
import pgsqlIcon     from '../public/icons/db/postgresql_icon_3.svg';
import mysqlIcon     from '../public/icons/db/mysql_icon_2.svg';
import oracleIcon    from '../public/icons/db/oracle_icon_3.svg';
import sqlserverIcon from '../public/icons/db/sqlserver_icon_1.svg';

import fileGroupIcon  from '../public/icons/left_tree/file_group_1.svg';
import folderIcon     from '../public/icons/left_tree/folder_1.svg';
import folderOpenIcon from '../public/icons/left_tree/folder_open_1.svg';

import dbIcon    from '../public/icons/left_tree/db_1.svg';
import dbsIcon   from '../public/icons/left_tree/dbs.svg';
import rolesIcon from '../public/icons/left_tree/roles_1.svg';
import schemaIcon   from '../public/icons/left_tree/schema.svg';
import schemasIcon   from '../public/icons/left_tree/schemas.svg';
import tableIcon    from '../public/icons/left_tree/table_1.svg';
import viewIcon     from '../public/icons/left_tree/view_1.svg';
import functionIcon from '../public/icons/left_tree/function_1.svg';

import { useTreeStore } from '../stores/useTreeStore';

/* -------------- 图标：优先节点 config.icon，后备旧逻辑 -------------- */
export const getNodeIcon = (node) => {
  if (node?.config?.icon) return node.config.icon;   // YAML 配置优先

  if (node?.type === 'connection') {
    switch (node.dbType) {
      case 'POSTGRESQL': return pgsqlIcon;
      case 'MYSQL':      return mysqlIcon;
      case 'ORACLE':     return oracleIcon;
      case 'SQLSERVER':  return sqlserverIcon;
      default:           return dbIcon;
    }
  }

  // 默认图标映射：当 YAML 未提供 config.icon 时使用
  // 注：聚合节点保持原 type（databases / roles），这里给出兜底
  const map = {
    folder:   node?.expanded ? folderOpenIcon : folderIcon,

    // 顶层虚拟聚合
    databases: dbsIcon,        // Databases 聚合
    roles:     rolesIcon,      // Roles 聚合

    // 实体节点
    database: dbIcon,
    schema:   schemaIcon,
    schemas:   schemasIcon,
    table:    tableIcon,
    view:     viewIcon,
    function: functionIcon,
  };

  return map[node?.type] || fileGroupIcon;
};

export const getExpandIcon = (node) => {
  const has = (node?.children?.length > 0) || node?.virtual || node?.config?.children || node?.config?.nextLevel;
  if (!has) return '';
  return node?.expanded ? '▼' : '▶';
};

/* -------------- 子节点加载（唯一入口） -------------- */
export async function loadNodeChildren(node) {
  // 连接尚未建立时（除连接本身），不加载
  if (node?.type !== 'connection' && !node?.connected) {
    console.warn('[loadNodeChildren] 节点未连接', node);
    return { ...node, children: [] };
  }

  const connId = findConnectionId(node?.id);
  if (!connId) {
    console.warn('[loadNodeChildren] 找不到所属连接', node);
    return { ...node, children: [] };
  }

  const path = buildPath(node);                      // 例如：databases_aggregate 或 dbs_real/postgres
  const url  = `/api/meta/${encodeURIComponent(connId)}/${path}/children`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());

    // 兼容两种返回结构：
    // 1) { data: [] }
    // 2) { data: { items: [] } }（历史形态）
    const json = await res.json();
    const rawData = json?.data;
    const items = Array.isArray(rawData)
      ? rawData
      : (Array.isArray(rawData?.items) ? rawData.items : []);

    // 注入下一层 config（若后端已带回则直接用）
    const children = items.map((item) => ({
      ...item,
      parentId: node.id,
      // 后端偶尔会给 connected=false，这里保持与父节点一致，避免被“未连接”逻辑短路
      connected: node.connected ?? true,
      config: item.config || { type: item.type, icon: item.icon },
    }));

    return { ...node, expanded: true, children };
  } catch (e) {
    console.error('[loadNodeChildren] 失败', e);
    return { ...node, expanded: false, children: [] };
  }
}

/* -------------- 首层（连接下的顶级聚合）加载 -------------- */
export async function loadDatabasesForConnection(connectionNode) {
  const connId = connectionNode.id;                 // 连接节点 id 即 connId
  const url = `/api/meta/${encodeURIComponent(connId)}/children`;   // path 为空
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());

  const json = await res.json();
  const items = Array.isArray(json?.data)
    ? json.data
    : (Array.isArray(json?.data?.items) ? json.data.items : []);

  // 注入下一层 config（database 层/聚合层）
  return items.map((it) => ({
    ...it,
    parentId: connId,
    connected: true,
    config: it.config || { type: it.type, icon: it.icon },
  }));
}

/* -------------- 拼 path -------------- */
function buildPath(node) {
  // node.id = connId::database::db1  或  connId::databases_aggregate
  const segs = String(node?.id ?? '').split('::');
  segs.shift();          // 去掉 connId
  // 允许没有 entityId 的聚合节点（只有一个段）：如 databases_aggregate
  return segs.map(encodeURIComponent).join('/');
}

/* -------------- 找 connectionId -------------- */
export function findConnectionId(nodeId, _treeData) {  // 保持签名，但忽略第二参数
  if (!nodeId) return '';
  // 直接取复合 ID 的第一段
  const [connId] = String(nodeId).split('::');
  return connId || '';
}

/* -------------- 打补丁：连接节点强制主动作 -------------- */
export function patchConnectionNode(node) {
  if (node?.type === 'connection') {
    node.config = node.config || {};
    node.config.actions = node.config.actions || {};
    node.config.actions.primary = {
      label: '连接',
      icon: '⚡',
      handler: 'connectAndExpand',
    };
  }
  return node;
}

/* -------------- 其余工具函数（未改动） -------------- */
export const findNode = (nodes, id) => {
  if (!Array.isArray(nodes)) return null;
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const f = findNode(n.children, id);
      if (f) return f;
    }
  }
  return null;
};

export const updateTreePath = (treeData, targetId, updaterFn) => {
  const newTree = JSON.parse(JSON.stringify(treeData));
  const targetNode = findNode(newTree, targetId);
  if (targetNode) Object.assign(targetNode, updaterFn({ ...targetNode }));
  return newTree;
};

export function isExpandable(node) {
  if (!node) return false;
  const hasLoaded = Array.isArray(node.children) && node.children.length > 0;
  const declared = !!(node.config?.children) || !!(node.config?.nextLevel);
  // 虚拟聚合（databases/roles 等）首次点击也要触发加载
  return hasLoaded || declared || !!node.virtual;
}

// =========================================