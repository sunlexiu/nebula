import toast from 'react-hot-toast';
import { findNode } from '../utils/treeUtils';
import { useTreeStore } from '../stores/useTreeStore';
import { useTreeConfigStore } from '../stores/useTreeConfigStore';  // 新增
import { openConfirm} from '../components/modals/modalActions';


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

export const handleNewConnectionSubmit = async (connectionData: any, parentId: string | null) => {
  try {
    const response = await fetch('/api/config/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...connectionData, type: 'connection', parentId }),
    });
    if (!response.ok) throw new Error('Failed to create connection');
    await response.json();
    useTreeStore.getState().refreshTree();  // 统一刷新树
    toast.success('新建连接成功');
  } catch (err) {
    console.error('Error creating connection:', err);
    toast.error('创建连接失败');
    throw err;
  }
};

// 修复：moveNode 接收 openModal 参数，直接内部调用 openConfirm，使用 config.type
export const moveNode = async (sourceId, targetParentId, updateTreePathFn, openModal, nodeType) => {
  // nodeType 从 config.type fallback
  const sourceNode = findNode(useTreeStore.getState().treeData, sourceId);
  const actualType = sourceNode?.config?.type || nodeType || 'unknown';
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
    `移动${actualType === 'folder' ? '文件夹' : '连接'}`,
    `确定要将此${actualType === 'folder' ? '文件夹' : '连接'}移动到目标位置吗？`,
    async () => {
      try {
        const response = await fetch('/api/config/move-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId, targetParentId: targetParentId || null, type: actualType })
        });
        if (!response.ok) throw new Error(`Failed to move ${actualType}`);

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
        toast.success(`${actualType} 已移动到新位置`);
      } catch (error) {
        console.error(`Move ${actualType} error:`, error);
        toast.error('移动失败，请重试');
      }
    },
    'warning'
  );
};

// 切换展开：不变
export const toggleExpand = (setExpandedKeys, nodeId, loadChildren = true) => {
  setExpandedKeys((prev) => {
    const newMap = new Map(prev);
    newMap.set(nodeId, !newMap.get(nodeId));
    return newMap;
  });
};

// 删除节点（通用）：不变
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


// 重命名文件夹
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
    const updatedChildren = await response.json(); // 假设返回 { children: [...] }
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

