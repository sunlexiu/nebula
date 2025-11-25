import toast from 'react-hot-toast';
import { useTreeStore } from '@/stores/useTreeStore';
import { handleNewGroupSubmit } from '@/actions/impl/folderActions';
import { handleNewConnectionSubmit } from '@/actions/impl/connectionActions';

// openNewGroup 接收 openModal 参数
export const openNewGroup = (parentId : null|string, openModal) => {
  if (typeof openModal !== 'function') {
    console.error('openModal must be a function');
    return;
  }
  openModal('newGroup', { parentId });
};

// openNewConnection 接收 openModal 参数
export const openNewConnection = (parentId = null, openModal) => {
  if (typeof openModal !== 'function') {
    console.error('openModal must be a function');
    return;
  }
  openModal('newConnection', { parentId });
};

// openConfirm 接收 openModal 参数
export const openConfirm = (title, message, onConfirm, variant = 'danger', openModal) => {
  if (typeof openModal !== 'function') {
    console.error('openModal must be a function');
    return;
  }
  openModal('confirm', {
    title,
    message,
    onConfirm: async () => {
      try {
        await onConfirm();
      } catch (error) {
        toast.error('操作失败');
        console.error('Confirm action error:', error);
      }
    },
    variant
  });
};

// openRenameFolder 接收 openModal 参数
export const openRenameFolder = (node: any, openModal: Function) => {
  if (typeof openModal !== 'function') {
    console.error('openModal must be a function');
    return;
  }
  openModal('renameFolder', {
    defaultName: node.name,
    nodeId: node.id,  // 新增：传递 node.id 用于 API
    onSubmit: async (newName: string) => {
      if (!newName || newName.trim() === '') {
        throw new Error('文件夹名称不能为空');
      }
      try {
        const { renameFolder } = await import('@/actions/impl/folderActions');
        await renameFolder(node.id, newName);
      } catch (error) {
        toast.error('重命名失败，请重试');
        throw error;
      }
    }
  });
};

// openEditConnection 接收 openModal 参数，使用 config
export const openEditConnection = (connection: any, openModal: Function) => {
  if (typeof openModal !== 'function') return;
  openModal('editConnection', {
    connection,
    onSubmit: async (payload: any) => {
      const { updateConnection } = await import('@/actions/impl/connectionActions');
      await updateConnection(payload);
      useTreeStore.getState().refreshTree(); // 保存后刷新树
    },
  });
};

