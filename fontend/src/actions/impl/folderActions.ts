import toast from 'react-hot-toast';
import { useTreeStore } from '../../stores/useTreeStore';
import { openNewGroup as openNewGroupModal, openRenameFolder as openRenameFolderModal, openConfirm } from '../../components/modals/modalActions';
import { deleteNode } from '../../utils/treeUtils';
import { handleNewConnectionSubmit } from './connectionActions';

// 文件夹新建提交处理器
export const handleNewGroupSubmit = async (groupName: string, parentId: string | null) => {
  try {
    const response = await fetch('/api/config/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, type: 'folder', parentId }),
    });
    if (!response.ok) throw new Error('Failed to create group');
    await response.json();
    useTreeStore.getState().refreshTree();  // 统一刷新树
    toast.success('新建分组成功');
  } catch (err) {
    console.error('Error creating group:', err);
    toast.error('创建分组失败');
    throw err;
  }
};

// 文件夹重命名
export const renameFolder = async (nodeId: string, newName: string) => {  // 移除 openModal 参数，因为模态不需它
  if (!newName.trim()) throw new Error('文件夹名称不能为空');
  try {
    const response = await fetch(`/api/config/folders/${nodeId}`, {
      method: 'PUT',  // 明确使用 PUT 更新
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() })
    });
    if (!response.ok) throw new Error('Failed to rename folder');
    // 更新树状态
    const { updateTreePath } = useTreeStore.getState();
    updateTreePath(nodeId, (current: any) => ({ ...current, name: newName.trim() }));
    toast.success(`文件夹已重命名为 "${newName}"`);
  } catch (error) {
    console.error('Rename folder error:', error);
    toast.error('重命名失败，请重试');
    throw error;
  }
};

// 刷新文件夹
export const refreshFolder = async (node: any, setExpandedKeys?: Function) => {
  try {
    const response = await fetch(`/api/config/folders/${node.id}/refresh`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to refresh folder');
    const updatedChildren = await response.json();
    const { updateTreePath } = useTreeStore.getState();
    updateTreePath(node.id, (curr: any) => ({
      ...curr,
      children: updatedChildren.children || [],
      expanded: true
    }));
    toast.success(`刷新文件夹: ${node.name}`);
    setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
    // 可选：刷新整个树以确保一致性
    // useTreeStore.getState().refreshTree();
  } catch (error) {
    console.error('Refresh folder error:', error);
    toast.error('刷新失败，请重试');
  }
};

// 文件夹新建（打开模态） - 更新：模态提交调用 handleNewGroupSubmit
export const openNewGroup = (parentId: string | null, openModal: Function) => {
  if (typeof openModal !== 'function') return toast.error('模态打开失败');
  openNewGroupModal(parentId, openModal, handleNewGroupSubmit);  // 传递 submit 处理器给模态
};

// 文件夹重命名（打开模态） - 更新：模态提交调用 renameFolder
export const openRenameFolder = (node: any, openModal: Function) => {
  if (typeof openModal !== 'function') return toast.error('模态打开失败');
  openRenameFolderModal(node, openModal, renameFolder);  // 传递给模态
};

// 删除文件夹 - 更新：使用导入的 deleteNode
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
        useTreeStore.getState().deleteNode(node.id);  // 现在是 store 方法；或用导入的 deleteNode(treeData, node.id)
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

export const openNewConnection = (parentId: string | null, openModal: Function) => {
  if (typeof openModal !== 'function') return toast.error('模态打开失败');
  openModal('newConnection', {
    parentId,  // 传递给模态，作为默认 parentId
    onSubmit: handleNewConnectionSubmit,
    onClose: () => openModal(null),
  });
};

export const folderHandlers = {
  openNewGroup: async (node: any, openModal?: Function) => {
    openNewGroup(node.id, openModal);
  },
  openRenameFolder: async (node: any, openModal?: Function) => {
    openRenameFolder(node, openModal);
  },
  refreshFolder: async (node: any, openModal?: Function, setExpandedKeys?: Function) => {
    refreshFolder(node, setExpandedKeys);
  },
  deleteFolder: async (node: any, openModal?: Function, setExpandedKeys?: Function) => {
    deleteFolder(node, openModal);
  },
  openNewConnection: async (node: any, openModal?: Function) => {
    openNewConnection(node.id, openModal);
  },
};