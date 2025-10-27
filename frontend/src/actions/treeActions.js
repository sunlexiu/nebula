// src/actions/treeActions.js
// 统一的“树动作层” —— 只保留新世界逻辑，不做任何旧接口兼容。
// 后端接口约定：
// - 树加载：   POST /api/tree/children           { connectionId, nodeKey }
// - 分组保存： POST /api/config/folder           { id?, name, parentId? }
// - 分组删除： DELETE /api/config/folder/{id}
// - 连接保存： POST /api/config/connection       { id?, name, dbType, host, port, database, username, password, parentId? }
// - 连接删除： DELETE /api/config/connection/{id}
// - 连接测试： POST /api/connection/test         { dbType, host, port, database, username, password }
// - 节点移动： POST /api/config/move             { sourceId, targetParentId }

import { buildNodeKey } from '../utils/treeUtils';
import { useTreeStore } from '../stores/useTreeStore';

// --------------------------- 基础 HTTP 封装 ---------------------------
async function api(method, url, body) {
  const init = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body != null) init.body = JSON.stringify(body);

  const resp = await fetch(url, init);
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${txt}`);
  }
  const json = await resp.json();
  if (json.code !== 0) {
    throw new Error(json.message || 'Request failed');
  }
  return json.data;
}

const post   = (url, body)   => api('POST', url, body);
const del    = (url)         => api('DELETE', url);
const patch  = (url, body)   => api('PATCH', url, body);

// --------------------------- 拖拽移动 ---------------------------
/**
 * 把树节点移动到目标父节点下（用于拖拽）
 * @param {string} sourceId
 * @param {string|null} targetParentId
 */
export async function moveNode(sourceId, targetParentId = null) {
  await post('/api/config/move', { sourceId, targetParentId });
  return true;
}

// --------------------------- 分组（Folder/Group） ---------------------------
/**
 * 新建分组（供 NewGroupModal.jsx 调用）
 * @param {{name:string, parentId?:string|null}} values
 * @param {{reload?:Function, notify?:Function}} deps
 */
export async function handleNewGroupSubmit(values, deps = {}) {
  const payload = {
    name: String(values.name || '').trim(),
    parentId: values.parentId ?? null
  };
  if (!payload.name) throw new Error('分组名称不能为空');
  await post('/api/config/folder', payload);
  deps.reload && deps.reload(); // 让调用方决定怎么刷新树（通常刷新当前父节点）
  deps.notify && deps.notify('success', '分组已创建');
}

/**
 * 重命名分组（供 RenameModal.jsx 或右键菜单）
 * @param {{id:string, name:string}} values
 */
export async function renameGroup(values, deps = {}) {
  const payload = { id: values.id, name: String(values.name || '').trim() };
  if (!payload.id) throw new Error('缺少分组ID');
  if (!payload.name) throw new Error('分组名称不能为空');
  await post('/api/config/folder', payload);
  deps.reload && deps.reload();
  deps.notify && deps.notify('success', '分组已重命名');
}

/**
 * 删除分组
 * @param {string} id
 */
export async function deleteGroup(id, deps = {}) {
  if (!id) throw new Error('缺少分组ID');
  await del(`/api/config/folder/${encodeURIComponent(id)}`);
  deps.reload && deps.reload();
  deps.notify && deps.notify('success', '分组已删除');
}

// --------------------------- 连接（Connection） ---------------------------
/**
 * 新建/保存连接（供 ConnectionModal.jsx）
 * @param {{id?:string,name:string,dbType:string,host:string,port:number,database?:string,username:string,password?:string,parentId?:string|null}} values
 */
export async function handleNewConnectionSubmit(values, deps = {}) {
  const payload = {
    id: values.id || undefined,
    name: String(values.name || '').trim(),
    dbType: values.dbType,
    host: String(values.host || '').trim(),
    port: Number(values.port),
    database: values.database || '',
    username: values.username || '',
    password: values.password || '',
    parentId: values.parentId ?? null
  };
  if (!payload.name) throw new Error('连接名称不能为空');
  if (!payload.dbType) throw new Error('数据库类型不能为空');
  if (!payload.host) throw new Error('主机不能为空');
  if (!payload.port) throw new Error('端口不能为空');

  await post('/api/config/connection', payload);
  deps.reload && deps.reload();
  deps.notify && deps.notify('success', payload.id ? '连接已保存' : '连接已创建');
}

/**
 * 删除连接
 * @param {string} id
 */
export async function deleteConnection(id, deps = {}) {
  if (!id) throw new Error('缺少连接ID');
  await del(`/api/config/connection/${encodeURIComponent(id)}`);
  deps.reload && deps.reload();
  deps.notify && deps.notify('success', '连接已删除');
}

/**
 * 测试连接（表单按钮）
 * @param {{dbType:string,host:string,port:number,database?:string,username:string,password?:string}} values
 */
export async function testConnection(values, deps = {}) {
  const payload = {
    dbType: values.dbType,
    host: String(values.host || '').trim(),
    port: Number(values.port),
    database: values.database || '',
    username: values.username || '',
    password: values.password || ''
  };
  await post('/api/connection/test', payload);
  deps.notify && deps.notify('success', '连接可用');
  return true;
}

// --------------------------- 节点通用动作（YAML actions） ---------------------------
/**
 * 刷新节点（交给调用方控制刷新逻辑）
 */
export function refreshNode(node, deps = {}) {
  if (deps.reload) deps.reload(node);
  else window.dispatchEvent(new CustomEvent('TREE_NODE_REFRESH', { detail: { node } }));
}

/**
 * 打开 SQL 标签页（依赖注入或事件兜底）
 */
function openSql(title, sql, deps = {}) {
  if (deps.openSqlTab) deps.openSqlTab(title, sql);
  else window.dispatchEvent(new CustomEvent('OPEN_SQL_TAB', { detail: { title, sql } }));
  deps.notify && deps.notify('success', 'SQL 已写入编辑器');
}

/**
 * 统一处理后端 YAML 下发的节点动作
 * 支持 kind: runSql | openSql | fetchDDL | refresh | copy | custom(透传)
 */
export async function handleNodeAction(node, action, deps = {}) {
  const kind = action?.kind || 'custom';
  const ctx  = node?._ctx || {};
  const key  = node?.key || buildNodeKey(node);

  // 极简模板渲染：{database} {schema} {name} {type} {key}
  const render = (tpl = '') => {
    const dict = { ...ctx, name: node?.name, type: node?.type, key };
    return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (dict[k] != null ? String(dict[k]) : `{${k}}`));
  };

  try {
    switch (kind) {
      case 'runSql':
      case 'openSql': {
        const sql = render(action.payloadTemplate || action.sql || '');
        const title = action.label || `SQL on ${node?.name || ''}`;
        openSql(title, sql, deps);
        break;
      }
      case 'fetchDDL': {
        const sql = render(action.payloadTemplate || action.sql || '');
        const title = action.label || `DDL of ${node?.name || ''}`;
        openSql(title, sql, deps);
        break;
      }
      case 'refresh': {
        refreshNode(node, deps);
        break;
      }
      case 'copy': {
        const text = render(action.payloadTemplate || action.text || node?.name || '');
        await navigator.clipboard?.writeText(text);
        deps.notify && deps.notify('success', '已复制到剪贴板');
        break;
      }
      default: {
        // 透传，供上层统一监听
        window.dispatchEvent(new CustomEvent('TREE_NODE_ACTION', { detail: { node, action } }));
        deps.notify && deps.notify('info', `Unhandled action: ${kind}`);
      }
    }
  } catch (e) {
    console.error(e);
    deps.notify && deps.notify('error', e.message || '节点操作失败');
  }
}

// --------------------------- 右键菜单/快捷操作的通用辅助 ---------------------------
/**
 * 重命名节点：根据 type 路由到不同接口（目前 folder/connection）
 */
export async function handleRenameSubmit(values, deps = {}) {
  const { id, name, type } = values || {};
  if (!id) throw new Error('缺少ID');
  const newName = String(name || '').trim();
  if (!newName) throw new Error('名称不能为空');

  if (type === 'connection') {
    await post('/api/config/connection', { id, name: newName });
  } else {
    await post('/api/config/folder', { id, name: newName });
  }
  deps.reload && deps.reload();
  deps.notify && deps.notify('success', '已重命名');
}

/**
 * 删除节点：根据 type 路由到不同接口（目前 folder/connection）
 */
export async function handleDeleteSubmit(values, deps = {}) {
  const { id, type } = values || {};
  if (!id) throw new Error('缺少ID');

  if (type === 'connection') {
    await deleteConnection(id, deps);
  } else {
    await deleteGroup(id, deps);
  }
}

/**
 * 删除分组（带确认）
 * @param {object} node - 分组节点
 * @param {Function} openModal - 可选：UI 确认框触发器
 */
export async function deleteFolder(node, openModal) {
  const id = node?.id;
  if (!id) throw new Error('缺少分组ID');
  const doDelete = async () => {
    await del(`/api/config/folder/${encodeURIComponent(id)}`);
    try {
      const { deleteNode } = { deleteNode: useTreeStore }; // 动态引入，避免循环依赖
      deleteNode.getState().deleteNode(id);
    } catch (e) {
      // 回退：全量刷新
      try {
        
        await useTreeStore.getState().refreshTree();
      } catch (e2) {}
    }
  };
  if (typeof openModal === 'function') {
    openModal('confirm', {
      title: '删除分组',
      message: `确定删除分组 "${node?.name || id}" 吗？此操作不可恢复`,
      onConfirm: async () => { await doDelete(); },
      variant: 'danger'
    });
    return;
  }
  if (typeof window !== 'undefined') {
    if (!window.confirm(`确定删除分组 "${node?.name || id}" 吗？此操作不可恢复`)) return;
  }
  await doDelete();
}


/**
 * 刷新分组：重新加载并替换其子节点
 * @param {object} node - 分组节点
 */
export async function refreshFolder(node) {
  if (!node?.id) return;
  try {
    
    const { loadNodeChildren } = require('../utils/treeUtils');
    const { updateTreePath } = useTreeStore.getState();
    // 标记加载中
    updateTreePath(node.id, (n) => ({ ...n, __loading: true }));
    const children = await loadNodeChildren(node);
    updateTreePath(node.id, (n) => ({ ...n, children, __expanded: true, __loading: false }));
  } catch (err) {
    try {
      
      const { updateTreePath } = useTreeStore.getState();
      updateTreePath(node.id, (n) => ({ ...n, __loading: false }));
    } catch (e) {}
    throw err;
  }
}
