import toast from 'react-hot-toast';
import { findNode } from '../utils/treeUtils';
import { useTreeStore } from '../stores/useTreeStore';

// handleNewGroupSubmit 和 handleNewConnectionSubmit 保持原样
export const handleNewGroupSubmit = async (groupName, parentId) => {
  try {
    const response = await fetch('/api/config/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, type: 'folder', parentId }),
    });
    if (!response.ok) throw new Error('Failed to create group');
    await response.json();
    useTreeStore.getState().refreshTree();
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
    useTreeStore.getState().refreshTree();
    toast.success('新建连接成功');
  } catch (err) {
    console.error('Error creating connection:', err);
    toast.error('创建连接失败');
    throw err;
  }
};

// 修复：moveNode 接收 openModal 参数，直接内部调用 openConfirm
export const moveNode = async (sourceId, targetParentId, updateTreePathFn, openModal, nodeType) => {
  if (typeof openModal !== 'function') {
    console.error('openModal must be a function');
    return;
  }

  // 内部构建 openConfirm，使用传入的 openModal
  const localOpenConfirm = (title, message, onConfirm, variant = 'danger') => {
    openModal('confirm', {
      title,
      message,
      onConfirm: async () => {
        try {
          await onConfirm();
        } catch (error) {
          toast.error('操作失败');
          console.error('Move confirm error:', error);
        }
      },
      variant
    });
  };

  localOpenConfirm(
    `移动${nodeType === 'folder' ? '文件夹' : '连接'}`,
    `确定要将此${nodeType === 'folder' ? '文件夹' : '连接'}移动到目标位置吗？`,
    async () => {
      try {
        const response = await fetch('/api/config/move-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId, targetParentId: targetParentId || null, type: nodeType })
        });
        if (!response.ok) throw new Error(`Failed to move ${nodeType}`);

        // 更新树数据：移除源节点，添加到目标
        const treeData = useTreeStore.getState().treeData;
        const newTree = JSON.parse(JSON.stringify(treeData));
        const removeNodeFromTree = (nodes, id) => {
          if (!Array.isArray(nodes)) return null;
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i] && nodes[i].id === id) {
              return nodes.splice(i, 1)[0];
            }
            if (nodes[i] && nodes[i].children) {
              const removed = removeNodeFromTree(nodes[i].children, id);
              if (removed !== null) {
                return removed;
              }
            }
          }
          return null;
        };
        const removedNode = removeNodeFromTree(newTree, sourceId);
        if (!removedNode) return;

        removedNode.parentId = targetParentId || null;
        if (!targetParentId) {
          newTree.push(removedNode);
        } else {
          const targetNode = findNode(newTree, targetParentId);
          if (targetNode && targetNode.children) {
            targetNode.children.push(removedNode);
          }
        }
        useTreeStore.getState().setTreeData(newTree);
        toast.success(`${nodeType} 已移动到新位置`);
      } catch (error) {
        console.error(`Move ${nodeType} error:`, error);
        toast.error('移动失败，请重试');
      }
    },
    'warning'
  );
};

// 切换展开
export const toggleExpand = (setExpandedKeys, nodeId, loadChildren = true) => {
  setExpandedKeys((prev) => {
    const newMap = new Map(prev);
    newMap.set(nodeId, !newMap.get(nodeId));
    return newMap;
  });
};

// 删除节点（通用）
export const deleteNode = (treeData, nodeId) => {
  const newTree = JSON.parse(JSON.stringify(treeData));
  function deleteRecursive(nodes) {
    if (!Array.isArray(nodes)) return false;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] && nodes[i].id === nodeId) {
        nodes.splice(i, 1);
        return true;
      }
      if (nodes[i] && nodes[i].children && deleteRecursive(nodes[i].children)) {
        return true;
      }
    }
    return false;
  }
  deleteRecursive(newTree);
  return newTree;
};

// 删除文件夹
export const deleteFolder = async (node, openModal) => {
  if (typeof openModal !== 'function') {
    console.error('openModal must be a function');
    return;
  }
  const localOpenConfirm = (title, message, onConfirm, variant = 'danger') => {
    openModal('confirm', {
      title,
      message,
      onConfirm,
      variant
    });
  };

  localOpenConfirm(
    `删除文件夹`,
    `确定要删除文件夹 "${node.name}" 及其所有子项吗？此操作不可恢复。`,
    async () => {
      try {
        const response = await fetch(`/api/config/folders/${node.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete folder');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`文件夹 "${node.name}" 已删除`);
      } catch (error) {
        toast.error('删除失败，请重试');
      }
    },
    'danger'
  );
};

// 重命名文件夹
export const renameFolder = (node, openModal) => {
  if (typeof openModal !== 'function') {
    console.error('openModal must be a function');
    return;
  }
  openModal('renameFolder', {
    id: node.id,
    name: node.name,
    onSubmit: async (newName) => {
      if (!newName || newName.trim() === '') {
        throw new Error('文件夹名称不能为空');
      }
      try {
        const response = await fetch(`/api/config/folders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim(), id: node.id, type: 'folder' })
        });
        if (!response.ok) throw new Error('Failed to rename folder');
        useTreeStore.getState().updateTreePath(node.id, (current) => ({
          ...current,
          name: newName.trim()
        }));
        toast.success(`文件夹已重命名为 "${newName}"`);
      } catch (error) {
        console.error('Rename folder error:', error);
        throw error;
      }
    }
  });
};

// 刷新文件夹
export const refreshFolder = (node) => {
  toast(`刷新文件夹: ${node.name}`);
  // 实际调用 API 刷新子项
};