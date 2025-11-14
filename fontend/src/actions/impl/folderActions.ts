import toast from 'react-hot-toast';
import { useTreeStore } from '../../stores/useTreeStore';
import { openNewGroup as openNewGroupModal, openRenameFolder, openConfirm } from '../../components/modals/modalActions';
import { refreshFolder, deleteFolder, renameFolder } from './treeActions';

// 文件夹新建（打开模态）
export const openNewGroup = (parentId: string | null, openModal: Function) => {
  if (typeof openModal !== 'function') return toast.error('模态打开失败');
  openNewGroupModal(parentId, openModal);
};

// 文件夹重命名（打开模态）
export const openRenameFolder = (node: any, openModal: Function) => {
  if (typeof openModal !== 'function') return toast.error('模态打开失败');
  openRenameFolder(node, openModal); // 模态内部调用 renameFolder API
};

// 刷新文件夹
export const refreshFolder = async (node: any, setExpandedKeys?: Function) => {
  // ... 原实现 ...
};

// 删除文件夹
export const deleteFolder = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') {
    console.error('openModal must be a function');
    return;
  }
  openConfirm(
    `删除文件夹`,
    `确定要删除文件夹 "${node.name}" 及其所有子项吗？此操作不可恢复。`,
    async () => {
      try {
        const response = await fetch(`/api/config/folders/${node.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete folder');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`文件夹 "${node.name}" 已删除`);
        // 删除后刷新父级树
        useTreeStore.getState().refreshTree();
      } catch (error) {
        console.error('Delete folder error:', error);
        toast.error('删除失败，请重试');
      }
    },
    'danger',
    openModal
  );
};