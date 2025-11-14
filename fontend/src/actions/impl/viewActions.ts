import toast from 'react-hot-toast';
import { useTreeStore } from '../../stores/useTreeStore';
import { findConnectionId } from '../../utils/treeUtils';
import { openConfirm } from '../../components/modals/modalActions';

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

export const viewDefinition = (node: any) => toast(`查看定义: ${node.name}`);
export const editView = (node: any) => toast(`编辑视图: ${node.name}`);
export const generateViewSQL = (node: any) => toast(`生成视图SQL: ${node.name}`);