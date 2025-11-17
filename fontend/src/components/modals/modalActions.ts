import toast from 'react-hot-toast';
import { useTreeStore } from '@/stores/useTreeStore';
import { handleNewGroupSubmit } from '@/actions/impl/folderActions';
import { handleNewConnectionSubmit } from '@/actions/impl/connectionActions';

// openNewGroup 接收 openModal 参数
export const openNewGroup = (parentId = null, openModal) => {
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

// handleNewGroupSubmit 和 handleNewConnectionSubmit 保持原样（纯 API）
export const handleNewGroupSubmit = async (groupName, parentId) => {
  try {
    const response = await fetch('/api/config/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, type: 'folder', parentId }),
    });
    if (!response.ok) throw new Error('Failed to create group');
    await response.json();
    toast.success('新建分组成功');
  } catch (err) {
    console.error('Error creating group:', err);
    toast.error('创建分组失败');
    throw err;
  }
};

export const handleNewConnectionSubmit = async (connectionData, parentId) => {
  try {
    const response = await fetch('/api/config/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...connectionData, type: 'connection', parentId }),
    });
    if (!response.ok) throw new Error('Failed to create connection');
    await response.json();
    toast.success('新建连接成功');
  } catch (err) {
    console.error('Error creating connection:', err);
    toast.error('创建连接失败');
    throw err;
  }
};

