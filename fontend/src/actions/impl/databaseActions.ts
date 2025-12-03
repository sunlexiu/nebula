// src/actions/impl/databaseActions.ts
import toast from 'react-hot-toast';
import { useTreeStore } from '@/stores/useTreeStore';
import { findConnectionId } from '@/utils/treeUtils';
import { openConfirm } from '@/components/modals/modalActions';

// 刷新（用模板）
export const refreshDatabase = async (node: any, setExpandedKeys?: Function) => {
  if (!node.connected) return;
  const { updateTreePath } = useTreeStore.getState();
  const { loadNodeChildren } = await import('../../utils/treeUtils');
  const updated = await loadNodeChildren(node);
  updateTreePath(node.id, () => ({ ...updated, expanded: true }));
  toast.success(`刷新数据库: ${node.name}`);
  setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
};

/**
 * 打开"新建数据库"弹窗
 */
export const createNewDatabase = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') {
    toast.error('模态打开失败');
    return;
  }

  const connectionId = findConnectionId(node.id);
  const dbType = node.dbType || node.extra?.dbType;

  // 使用新的通用数据库Modal
  const { openDatabaseModal } = await import('@/components/modals/modalActions');
  openDatabaseModal({
    mode: 'create',
    connectionId,
    dbType,
    defaultValues: {
      name: '',
      owner: '',
      encoding: dbType === 'postgresql' ? 'UTF8' : '',
      template: dbType === 'postgresql' ? 'template1' : '',
      collation: '',
      ctype: '',
      tablespace: '',
      allowConnections: true,
      connectionLimit: -1,
      comment: '',
    },
    permissions: {
      // 新建模式下所有字段都可编辑
      name: true,
      owner: true,
      encoding: true,
      template: true,
      collation: true,
      ctype: true,
      tablespace: true,
      allowConnections: true,
      connectionLimit: true,
      comment: true,
      isTemplate: true,
      localeProvider: true,
      icuLocale: true,
      icuRules: true,
      extensions: true,
      rolePrivileges: true,
    },
  }, openModal);
};

/**
 * 打开"修改数据库"弹窗
 */
export const editDatabase = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') {
    toast.error('模态打开失败');
    return;
  }

  const connectionId = findConnectionId(node.id);
  const dbType = node.dbType || node.extra?.dbType;

  // 使用新的通用数据库Modal
  const { openDatabaseModal } = await import('@/components/modals/modalActions');
  openDatabaseModal({
    mode: 'edit',
    connectionId,
    dbType,
    databaseId: node.name, // 假设数据库名称作为ID
    defaultValues: {
      name: node.name,
      owner: node.owner || '',
      encoding: node.encoding || '',
      template: node.template || '',
      collation: node.collation || '',
      ctype: node.ctype || '',
      tablespace: node.tablespace || '',
      allowConnections: node.allowConnections ?? true,
      connectionLimit: node.connectionLimit ?? -1,
      comment: node.comment || '',
      isTemplate: node.isTemplate || false,
    },
    permissions: {
      // 编辑模式下，数据库名称不可修改，其他字段可编辑
      name: false, // 数据库名称不可修改
      owner: true,
      encoding: true,
      template: false, // 模板库通常不建议修改
      collation: true,
      ctype: true,
      tablespace: true,
      allowConnections: true,
      connectionLimit: true,
      comment: true,
      isTemplate: false, // 模板库状态不建议修改
      localeProvider: true,
      icuLocale: true,
      icuRules: true,
      extensions: true,
      rolePrivileges: true,
    },
  }, openModal);
};

export const deleteDatabase = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') return;
  const connectionId = findConnectionId(node.id);
  openConfirm(
      '删除数据库',
      `确定要删除数据库 "${node.name}" 吗？此操作不可恢复。`,
      async () => {
        const res = await fetch('/api/db/delete-database', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName: node.name }),
        });
        if (!res.ok) throw new Error('删除数据库失败');
        await useTreeStore.getState().refreshTree();
        toast.success(`数据库 "${node.name}" 已删除`);
      },
      'danger',
      openModal
  );
};

export const exportDatabase = async (node: any) => {
  toast(`导出数据库结构: ${node.name}（后续可以接导出向导）`);
};
