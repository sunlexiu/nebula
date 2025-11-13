/********************************************************************
 * 通用数据库动作实现 + 动作分发器
 * 后端仅保留 /api/db/{handler} 作为兜底
 *******************************************************************/
import toast from 'react-hot-toast';
import { useTreeStore } from '../stores/useTreeStore';
import { useModal } from '../components/modals/ModalProvider';
import { openConfirm } from '../components/modals/modalActions';
import { findConnectionId } from '../utils/treeUtils';

/* ========================= 通用动作实现 ========================= */
export const refreshDatabase = async (node: any, setExpandedKeys?: Function) => {
  if (!node.connected) return;
  const { updateTreePath } = useTreeStore.getState();
  const { loadNodeChildren } = await import('../utils/treeUtils');
  const updated = await loadNodeChildren(node);
  updateTreePath(node.id, () => ({ ...updated, expanded: true }));
  toast.success(`刷新数据库: ${node.name}`);
  setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
};

export const createNewSchema = (node: any) => toast(`新建Schema在数据库: ${node.name}`);
export const exportDatabase = (node: any) => toast(`导出数据库: ${node.name}`);

export const deleteDatabase = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') return toast.error('模态打开失败');
  openConfirm(
    `删除数据库`,
    `确定要删除数据库 "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
        const res = await fetch('/api/db/delete-database', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName: node.name }),
        });
        if (!res.ok) throw new Error('Failed to delete database');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`数据库 "${node.name}" 已删除`);
      } catch (e: any) {
        toast.error('删除失败，请重试');
      }
    },
    'danger',
    openModal
  );
};

export const refreshSchema = async (node: any, setExpandedKeys?: Function) => {
  if (!node.connected) return;
  const { updateTreePath } = useTreeStore.getState();
  const { loadNodeChildren } = await import('../utils/treeUtils');
  const updated = await loadNodeChildren(node);
  updateTreePath(node.id, () => ({ ...updated, expanded: true }));
  toast.success(`刷新 Schema: ${node.name}`);
  setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
};

export const createNewTable = (node: any) => toast(`新建表在架构: ${node.name}`);
export const exportSchema = (node: any) => toast(`导出架构: ${node.name}`);

export const previewTable = (node: any) => toast(`预览表: ${node.name}`);
export const editTableStructure = (node: any) => toast(`编辑表结构: ${node.name}`);
export const generateTableSQL = (node: any) => toast(`生成SQL: ${node.name}`);
export const exportTableData = (node: any) => toast(`导出数据: ${node.name}`);

export const viewDefinition = (node: any) => toast(`查看定义: ${node.name}`);
export const editView = (node: any) => toast(`编辑视图: ${node.name}`);
export const generateViewSQL = (node: any) => toast(`生成视图SQL: ${node.name}`);

export const editFunction = (node: any) => toast(`编辑函数: ${node.name}`);
export const viewFunctionSource = (node: any) => toast(`查看源码: ${node.name}`);
export const testFunction = (node: any) => toast(`测试函数: ${node.name}`);

export const showProperties = (node: any) => {
  toast(
    `节点属性:\nID: ${node.id}\n类型: ${node.type}\n名称: ${node.name}\n连接状态: ${node.connected ? '已连接' : '未连接'}`,
    { duration: 4000 }
  );
};

export const deleteSchema = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') return;
  openConfirm(
    `删除Schema`,
    `确定要删除Schema "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
        const dbName = node.dbName || 'default';
        const res = await fetch('/api/db/delete-schema', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName, schemaName: node.name }),
        });
        if (!res.ok) throw new Error('Failed to delete schema');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`Schema "${node.name}" 已删除`);
      } catch (e: any) {
        toast.error('删除失败，请重试');
      }
    },
    'danger',
    openModal
  );
};

export const deleteTable = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') return;
  openConfirm(
    `删除表`,
    `确定要删除表 "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
        const dbName = node.dbName || 'default';
        const schemaName = node.schemaName || 'public';
        const res = await fetch('/api/db/delete-object', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName, schemaName, objectName: node.name, objectType: 'table' }),
        });
        if (!res.ok) throw new Error('Failed to delete table');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`表 "${node.name}" 已删除`);
      } catch (e: any) {
        toast.error('删除失败，请重试');
      }
    },
    'danger',
    openModal
  );
};

export const deleteView = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') return;
  openConfirm(
    `删除视图`,
    `确定要删除视图 "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
        const dbName = node.dbName || 'default';
        const schemaName = node.schemaName || 'public';
        const res = await fetch('/api/db/delete-object', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName, schemaName, objectName: node.name, objectType: 'view' }),
        });
        if (!res.ok) throw new Error('Failed to delete view');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`视图 "${node.name}" 已删除`);
      } catch (e: any) {
        toast.error('删除失败，请重试');
      }
    },
    'danger',
    openModal
  );
};

export const deleteFunction = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') return;
  openConfirm(
    `删除函数`,
    `确定要删除函数 "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
        const dbName = node.dbName || 'default';
        const schemaName = node.schemaName || 'public';
        const res = await fetch('/api/db/delete-object', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName, schemaName, objectName: node.name, objectType: 'function' }),
        });
        if (!res.ok) throw new Error('Failed to delete function');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`函数 "${node.name}" 已删除`);
      } catch (e: any) {
        toast.error('删除失败，请重试');
      }
    },
    'danger',
    openModal
  );
};

/* ------- 分发器 ------- */
export const actionHandlers = {
  connectAndExpand: async (node: any, openModal?: Function, setExpandedKeys?: Function) => {
    if (node.connected) {
      setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
      return;
    }
    const { connectDatabase } = await import('./connectionActions');
    const ok = await connectDatabase(node);
    if (ok) {
      const { loadDatabasesForConnection } = await import('../utils/treeUtils');
      const dbKids = await loadDatabasesForConnection({ id: node.id, connected: true });
      useTreeStore.getState().updateTreePath(node.id, (curr) => ({
        ...curr,
        expanded: true,
        children: dbKids,
        connected: true,
        status: 'connected',
      }));
      setExpandedKeys?.((prev) => new Map(prev).set(node.id, true));
    }
  },

  defaultAction: (node: any, setExpandedKeys?: Function) => {
    if (node.type === 'connection') {
      actionHandlers.connectAndExpand(node, undefined, setExpandedKeys);
      return;
    }
    toast(`未知默认动作: ${node.name}`);
  },

  refreshDatabase,
  createNewSchema,
  exportDatabase,
  deleteDatabase,
  refreshSchema,
  createNewTable,
  exportSchema,
  previewTable,
  editTableStructure,
  generateTableSQL,
  exportTableData,
  viewDefinition,
  editView,
  generateViewSQL,
  editFunction,
  viewFunctionSource,
  testFunction,
  showProperties,
  deleteSchema,
  deleteTable,
  deleteView,
  deleteFunction,

  /* PG 特有 */
  refreshMaterializedView: (node: any) => toast(`刷新物化视图: ${node.name}`),
  viewPublication: (node: any) => toast(`查看 Publication: ${node.name}`),
  createPublication: (node: any) => toast(`新建 Publication 在连接: ${node.name}`),
  deletePublication: async (node: any, openModal?: Function) => {
    if (typeof openModal !== 'function') return;
    openConfirm(
      `删除 Publication`,
      `确定要删除 Publication "${node.name}" 吗？此操作不可恢复。`,
      async () => {
        try {
          const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
          const res = await fetch('/api/db/delete-publication', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, pubName: node.name }),
          });
          if (!res.ok) throw new Error('Failed to delete publication');
          useTreeStore.getState().deleteNode(node.id);
          toast.success(`Publication "${node.name}" 已删除`);
        } catch (e: any) {
          toast.error('删除失败，请重试');
        }
      },
      'danger',
      openModal
    );
  },
  showRoleProperties: (node: any) => toast(`角色属性: ${node.name}`),
  createRole: (node: any) => toast(`新建角色: ${node.name}`),
  deleteRole: async (node: any, openModal?: Function) => {
    if (typeof openModal !== 'function') return;
    openConfirm(
      `删除角色`,
      `确定要删除角色 "${node.name}" 吗？此操作不可恢复。`,
      async () => {
        try {
          const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
          const res = await fetch('/api/db/delete-role', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, roleName: node.name }),
          });
          if (!res.ok) throw new Error('Failed to delete role');
          useTreeStore.getState().deleteNode(node.id);
          toast.success(`角色 "${node.name}" 已删除`);
        } catch (e: any) {
          toast.error('删除失败，请重试');
        }
      },
      'danger',
      openModal
    );
  },

  dynamicHandler: async (handler: string, node: any, options: { setExpandedKeys?: Function; openModal?: Function } = {}) => {
    const { setExpandedKeys, openModal } = options;
    const dbType = useTreeStore.getState().dbType.toLowerCase();
    try {
      const dbActions = await import(`./${dbType}Actions`);
      if (typeof dbActions[handler] === 'function') {
        return dbActions[handler](node, openModal, setExpandedKeys);
      }
    } catch {
      /* 无库级文件 */
    }
    if (actionHandlers[handler]) {
      return actionHandlers[handler](node, openModal, setExpandedKeys);
    }
    try {
      const res = await fetch(`/api/db/${handler}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: node.id }),
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success(`${handler} 执行成功`);
    } catch (e: any) {
      toast.error(`${handler} 执行失败: ${e.message}`);
    }
  },
};

/* ===================== 对外工具函数 ===================== */
export const getAllActions = (nodeType: string) => {
  const { actionMap } = useTreeStore.getState();
  return actionMap[nodeType] || [];
};

/* ===================== 重新导出被 import 的符号 ===================== */
export { updateConnection, connectDatabase, disconnectDatabase, refreshConnection, deleteConnection } from './connectionActions';