import { create } from 'zustand';
import { findNode } from '../utils/treeUtils';  // 导入辅助函数

export const useTreeStore = create((set, get) => ({
  treeData: [],
  setTreeData: (data) => set({ treeData: data }),
  refreshTree: async () => {
    try {
      const response = await fetch('/api/config/tree');
      if (!response.ok) throw new Error('Failed to fetch tree data');
      const { data } = await response.json();
      // data 中的节点已带 config（后端注入）
      set({ treeData: data || [] });
    } catch (error) {
      console.error('Error fetching tree data:', error);
      set({ treeData: [] });
    }
  },
  // 新增：为连接加载配置（在 connectDatabase 时调用）
  loadTreeConfig: async (connId) => {
    const treeConfigStore = window.treeConfigStore || { getState: () => ({ loadConfigForConnection: async () => {} }) };  // 全局 fallback
    await treeConfigStore.getState().loadConfigForConnection(connId);
  },
  updateTreePath: (targetId, updaterFn) => {
    set((state) => {
      const newTree = JSON.parse(JSON.stringify(state.treeData));
      const targetNode = findNode(newTree, targetId);
      if (targetNode) {
        const updated = updaterFn({ ...targetNode });
        Object.assign(targetNode, updated);
      }
      return { treeData: newTree };
    });
  },
  deleteNode: (nodeId) => {
    set((state) => {
      const newTree = JSON.parse(JSON.stringify(state.treeData));
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
      return { treeData: newTree };
    });
  },
}));