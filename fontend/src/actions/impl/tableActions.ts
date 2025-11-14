import toast from 'react-hot-toast';
import { useTreeStore } from '../../stores/useTreeStore';
import { findConnectionId } from '../../utils/treeUtils';
import { openConfirm } from '../../components/modals/modalActions';

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

export const previewTable = (node: any) => toast(`预览表: ${node.name}`);
export const editTableStructure = (node: any) => toast(`编辑表结构: ${node.name}`);
export const generateTableSQL = (node: any) => toast(`生成SQL: ${node.name}`);
export const exportTableData = (node: any) => toast(`导出数据: ${node.name}`);
export const createNewTable = (node: any) => toast(`新建表在架构: ${node.name}`);