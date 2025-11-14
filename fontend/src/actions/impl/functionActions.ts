import toast from 'react-hot-toast';
import { useTreeStore } from '../../stores/useTreeStore';
import { findConnectionId } from '../../utils/treeUtils';
import { openConfirm } from '../../components/modals/modalActions';

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

export const editFunction = (node: any) => toast(`编辑函数: ${node.name}`);
export const viewFunctionSource = (node: any) => toast(`查看源码: ${node.name}`);
export const testFunction = (node: any) => toast(`测试函数: ${node.name}`);