import toast from 'react-hot-toast';
import { useTreeStore } from '@/stores/useTreeStore.ts';
import { findConnectionId } from '@/utils/treeUtils.ts';
import { openConfirm } from '@/components/modals/modalActions.ts';

export const deleteSchema = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') return;
  openConfirm(
    `删除Schema`,
    `确定要删除Schema "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id);
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

export const createNewSchema = (node: any) => toast(`新建Schema在数据库: ${node.name}`);
export const exportSchema = (node: any) => toast(`导出架构: ${node.name}`);
export const refreshSchema = async (node: any, setExpandedKeys?: Function) => {
  // ... 刷新逻辑（从 dbActions 模板复制） ...
};