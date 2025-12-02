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
 * 在 Databases 聚合节点或某个 Database 节点上，打开“新建数据库”弹窗
 */
export const createNewDatabase = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') {
    toast.error('模态打开失败');
    return;
  }

  // 对于聚合节点（type=databases），需要往上找连接；database 节点同理
  const connectionId = findConnectionId(node.id);
  const dbType = node.dbType || node.extra?.dbType;

  openModal('newDatabase', {
    connectionId,
    dbType,
    // 默认值可以传给 Modal
    defaultValues: {
      name: '',
      owner: '',          // 留空表示当前登录用户
      encoding: dbType === 'postgresql' ? 'UTF8' : '',
      template: dbType === 'postgresql' ? 'template1' : '',
      collation: '',
      ctype: '',
      tablespace: '',
      allowConnections: true,
      connectionLimit: -1,
      comment: '',
    },
    /**
     * 真正提交时的处理逻辑
     */
    onSubmit: async (formValues: any) => {
      try {
        const payload = {
          connectionId,
          dbType,
          ...formValues,
        };

        const res = await fetch('/api/db/create-database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          let msg = '创建数据库失败';
          try {
            const err = await res.json();
            msg = err?.message || msg;
          } catch {
            // ignore
          }
          throw new Error(msg);
        }

        toast.success(`数据库 "${formValues.name}" 已创建`);

        // 刷新当前连接节点或 Databases 节点
        const { refreshTree } = useTreeStore.getState();
        await refreshTree();
      } catch (e: any) {
        console.error('createNewDatabase error:', e);
        toast.error(e?.message || '创建数据库失败');
        throw e; // 让 Modal 能感知失败，不自动关闭
      }
    },
  });
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