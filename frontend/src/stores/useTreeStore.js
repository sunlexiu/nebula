import { create } from 'zustand';

export const useTreeStore = create((set, get) => ({
  treeData: [],
  setTreeData: (data) => set({ treeData: data }),
  refreshTree: async () => {
    try {
      const response = await fetch('/api/config/tree');
      if (!response.ok) throw new Error('Failed to fetch tree data');
      const { data } = await response.json();
      set({ treeData: data || [] });
    } catch (error) {
      console.error('Error fetching tree data:', error);
      set({ treeData: [] });
    }
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

// 辅助函数（从 utils 导入）
const findNode = (nodes, id) => {
  if (!Array.isArray(nodes)) return null;
  for (let node of nodes) {
    if (node && node.id === id) return node;
    if (node && node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};