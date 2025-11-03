import toast from 'react-hot-toast';
import { updateConnection } from '../../actions/dbActions';
import { useTreeStore } from '../../stores/useTreeStore';
import { actionHandlers } from '../../actions/dbActions';  // 新增导入动态 handler

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
export const openRenameFolder = (node, openModal) => {
  if (typeof openModal !== 'function') {
    console.error('openModal must be a function');
    return;
  }
  openModal('renameFolder', {
    defaultName: node.name,
    onSubmit: async (newName) => {
      if (!newName || newName.trim() === '') {
        throw new Error('文件夹名称不能为空');
      }
      try {
        const response = await fetch(`/api/config/folders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim(), id: node.id , type: 'folder'})
        });
        if (!response.ok) throw new Error('Failed to rename folder');
        toast.success(`文件夹已重命名为 "${newName}"`);
      } catch (error) {
        toast.error('重命名失败，请重试');
        throw error; // 让模态框处理错误
      }
    }
  });
};

// openEditConnection 接收 openModal 参数，使用 config
export const openEditConnection = (connection, openModal) => {
  if (typeof openModal !== 'function') {
    console.error('openModal must be a function');
    return;
  }
  openModal('editConnection', {
    connection,
    onSubmit: async (payload) => {
      const { updateTreePath } = useTreeStore.getState();
      await updateConnection(payload);
      // 新增：更新后重新加载 config
      await useTreeStore.getState().loadTreeConfig(payload.id);
    }
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

// =========================================