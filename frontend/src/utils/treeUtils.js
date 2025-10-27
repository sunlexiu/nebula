// src/utils/treeUtils.js
import { fetchChildren } from './treeApi';
import { adaptChildren } from './treeAdapter';

/** 计算 nodeKey（后端 YAML 的语义定位符） */
export function buildNodeKey(node) {
  if (!node) return '';
  if (node.type === 'connection') return '';

  if (typeof node.key === 'string' && node.key) return node.key;
  if (typeof node.id === 'string' && node.id.includes('=')) return node.id;

  const ctx = node._ctx || {};
  const db = node.database || ctx.database;
  const sch = node.schema || ctx.schema;

  if (node.type === 'database' && node.name) {
    return `database=${encodeURIComponent(node.name)}`;
  }
  if (node.type === 'schema' && node.name) {
    return `database=${encodeURIComponent(db)}/schema=${encodeURIComponent(node.name)}`;
  }
  return '';
}

/** 只走 /api/tree/children */
export async function loadNodeChildren(node) {
  const connectionId = getConnectionId(node);
  const nodeKey = buildNodeKey(node);
  const list = await fetchChildren(connectionId, nodeKey);
  return adaptChildren(list, connectionId);
}

/** DFS 查找（TreeContainer / 其它处会用到） */
export function findNode(tree, targetId) {
  const list = Array.isArray(tree) ? tree.slice() : [tree];
  while (list.length) {
    const n = list.shift();
    if (!n) continue;
    if (n.id === targetId || n.key === targetId) return n;
    if (Array.isArray(n.children) && n.children.length) list.unshift(...n.children);
  }
  return null;
}

function getConnectionId(node) {
  return node?._ctx?.connectionId || node.connectionId || node.connId || node.id;
}
