import toast from 'react-hot-toast';
import { useTreeStore } from '@/stores/useTreeStore.ts';

// 刷新（用模板）
export const refreshDatabase = async (node: any, setExpandedKeys?: Function) => {
  if (!node.connected) return;
  const { updateTreePath } = useTreeStore.getState();
  const { loadNodeChildren } = await import('../../utils/treeUtils');
  const updated = await loadNodeChildren(node);
  updateTreePath(node.id, () => ({ ...updated, expanded: true }));
  toast.success(`刷新数据库: ${node.name}`);
  setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
};


export const deleteDatabase = async (node: any, openModal?: Function) => {

}

export const exportDatabase = async (node: any, openModal?: Function) => {

}