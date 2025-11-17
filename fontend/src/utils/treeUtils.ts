// src/utils/treeUtils.ts
import { getTreeConfig } from './loadTreeConfig';
import { request } from '@/lib/request';
import type { TreeNode } from '@/types/tree';
import toast from 'react-hot-toast';


/* ===== 现有工具（从原始代码） ===== */
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

export const loadDatabasesForConnection = async (node: any): Promise<any[]> => {
  const connId = node.id;
  const res = await fetch(`/api/meta/${encodeURIComponent(connId)}/children`);
  if (!res.ok) throw new Error('加载数据库列表失败');
  const data = await res.json()?.data || [];
  return data.map((db: string) => ({
    id: `${connId}::${db}`,
    name: db,
    type: 'database',
    connected: true,
    dbType: node.dbType,
    children: [],
    virtual: false,
  }));
};

// 移动节点（通用，支持 folder/connection）
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