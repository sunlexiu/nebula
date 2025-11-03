// src/utils/isExpandable.js
// 单点的“可展开”判断，供 TreeNode/Sidebar 复用

export function isExpandable(node) {
  if (!node) return false;
  const hasLoaded = Array.isArray(node.children) && node.children.length > 0;
  const declared = !!(node.config?.children) || !!(node.config?.nextLevel);
  // 虚拟聚合（databases/roles 等）首次点击也要触发加载
  return hasLoaded || declared || !!node.virtual;
}

// =========================================