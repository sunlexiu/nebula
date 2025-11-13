import { getTreeConfig } from './loadTreeConfig';
import { request } from '@/lib/request';
import type { TreeNode } from '@/types/tree';

/* 展开节点：虚拟节点按 YAML 拼装，真实节点走后端 */
export async function loadNodeChildren(node: TreeNode): Promise<TreeNode> {
  if (node.type === 'folder') {
    return node;
  }

  const [connId, ...rest] = node.id.split('::');
  const path = rest.join('/');

  /* 第一次展开 connection → 加载 YAML 顶层 */
  if (node.type === 'connection') {
    const cfg = await getTreeConfig(node.dbType!);
    const topNodes = cfg.tree.filter((n) => !n.parent);
    const children = topNodes.map((n) => yamlNodeToTreeNode(n, node.id));
    return { ...node, expanded: true, children };
  }

  /* 虚拟节点：按 YAML children / nextLevel 继续虚拟 */
  if (node.virtual) {
    const cfg = await getTreeConfig(node.dbType!);
    const me = cfg.tree.find((n) => n.key === path);
    if (!me) return { ...node, children: [] };

    /* 有 children 映射 */
    if (me.children) {
      const kids = Object.entries(me.children).map(([alias, key]) => {
        const def = cfg.tree.find((n) => n.key === key)!;
        const tn = yamlNodeToTreeNode(def, node.id);
        /* 用别名当展示名 */
        return { ...tn, name: alias.replace(/_/g, ' ') };
      });
      return { ...node, expanded: true, children: kids };
    }

    /* 有 nextLevel */
    if (me.nextLevel) {
      const next = cfg.tree.find((n) => n.key === me.nextLevel)!;
      const kids = await fetchRealNodes(node, next);
      return { ...node, expanded: true, children: kids };
    }
  }

  /* 真实节点：走后端 */
  const kids = await fetchRealNodes(node);
  return { ...node, expanded: true, children: kids };
}

/* 把 YAML 节点转成 TreeNode（虚拟） */
function yamlNodeToTreeNode(yaml: any, parentId: string): TreeNode {
  return {
    id: `${parentId}::${yaml.key}`,
    name: yaml.label || yaml.key,
    type: yaml.type,
    icon: yaml.icon,
    virtual: yaml.virtual ?? false,
    connected: true,
    dbType: parentId.split('::')[0], // 从 parent 继承
    children: [],
    config: { type: yaml.type, actions: yaml.actions },
  };
}

/* 真实节点：调后端 /meta/{connId}/{path}/children */
async function fetchRealNodes(parent: TreeNode, yamlNext?: any): Promise<TreeNode[]> {
  const [connId, ...rest] = parent.id.split('::');
  const path = rest.join('/');
  const url = `/api/meta/${encodeURIComponent(connId)}/${path}/children`;
  const { data } = await request<TreeNode[]>(url);
  return (data ?? []).map((n) => ({ ...n, dbType: parent.dbType }));
}

/* ===== 以下全是 dbActions.ts / treeActions.ts 要用的 ===== */

export function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findConnectionId(nodeId: string): string {
  return nodeId.split('::')[0] || '';
}

export function updateTreePath(
  treeData: TreeNode[],
  targetId: string,
  updater: (n: TreeNode) => TreeNode
): TreeNode[] {
  return treeData.map((n) => {
    if (n.id === targetId) return updater(n);
    if (n.children?.length)
      return { ...n, children: updateTreePath(n.children, targetId, updater) };
    return n;
  });
}

export function isExpandable(node: TreeNode): boolean {
  const hasLoaded = Array.isArray(node.children) && node.children.length > 0;
  const declared = !!(node.config?.children) || !!(node.config?.nextLevel);
  return hasLoaded || declared || !!node.virtual;
}

/* ===== TreeNode.tsx 专用 ===== */
export const getExpandIcon = (node: TreeNode): string => {
  const has = (node.children?.length > 0) || node.virtual || node.config?.children || node.config?.nextLevel;
  return has ? (node.expanded ? '▼' : '▶') : '';
};

export const getNodeIcon = (node: TreeNode): string => {
  if (node.icon) return node.icon;

  if (node.type === 'folder') {
    return '/icons/left_tree/folder_1.svg';
  }

  if (node.type === 'connection') {
    const type = (node.dbType || '').toLowerCase();
    if (type.includes('postgres')) return '/icons/db/postgresql_icon_1.svg';
    if (type.includes('mysql')) return '/icons/db/mysql_icon_1.svg';
    if (type.includes('oracle')) return '/icons/db/oracle_icon_1.svg';
    if (type.includes('sqlserver') || type.includes('mssql')) return '/icons/db/sqlserver_icon_1.svg';
  }

  return '/icons/left_tree/file_group.svg';
};

export const patchConnectionNode = (node: TreeNode): TreeNode => {
  if (node.type === 'connection') {
    node.config = node.config ?? {};
    node.config.actions = node.config.actions ?? {};
    node.config.actions.primary = {
      label: '连接',
      icon: '⚡',
      handler: 'connectAndExpand',
    };
  }
  return node;
};