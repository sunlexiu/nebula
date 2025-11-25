import { create } from 'zustand';
import { request } from '@/lib/request';
import type { TreeNode } from '@/types/tree';
import { baseActionMap } from '@/actions/actionMap';

interface State {
  treeData: TreeNode[];               // 只存 folder / connection 实例
  refreshTree: () => Promise<void>;
  setTreeData: (data: TreeNode[]) => void;
  updateTreePath: (id: string, updater: (old: TreeNode) => TreeNode) => void;
  deleteNode: (id: string) => void;
  actionMap: Record<string, any>;
}

export const useTreeStore = create<State>((set) => ({
  treeData: [],
  actionMap: baseActionMap,

  // 专门用于 folder 展开 / 收起
  toggleFolderExpand: (nodeId: string) =>
    set((state) => ({
      treeData: updateTreeNode(state.treeData, nodeId, (node) =>
        node.type === 'folder'
          ? { ...node, expanded: !node.expanded }
          : node
      ),
    })),

  // 加载孩子（用于 connection / meta）
  loadNodeChildren: async (nodeId: string) => {
    const state = get();
    const node = findNodeById(state.treeData, nodeId);
    if (!node) return;

    const updated = await loadNodeChildren(node);
    set({
      treeData: updateTreeNode(state.treeData, nodeId, () => updated),
    });
  },

  /* ① 首页：只拿 folder + connection 实例 */
  refreshTree: async () => {
    const res = await request<ApiResponse<TreeNode[]>>('/api/config/tree');
    set({ treeData: res.data?.data ?? [] });
  },

  setTreeData: (data) => set({ treeData: data }),

  updateTreePath: (id, updater) =>
    set((s) => ({ treeData: updateNode(s.treeData, id, updater) })),

  deleteNode: (id) =>
    set((s) => ({ treeData: removeNode(s.treeData, id) })),
}));

/* ---------- 工具 ---------- */
function updateNode(nodes: TreeNode[], id: string, updater: (n: TreeNode) => TreeNode): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === id) return updater(n);
    if (n.children?.length) return { ...n, children: updateNode(n.children, id, updater) };
    return n;
  });
}

function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
  const next: TreeNode[] = [];
  for (const n of nodes) {
    if (n.id === id) continue;
    next.push(n.children?.length ? { ...n, children: removeNode(n.children, id) } : n);
  }
  return next;
}