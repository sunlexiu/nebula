// src/utils/treeUtils.ts
import {getTreeConfig, loadChildren} from './loadTreeConfig';
import {request} from '@/lib/request';
import type {TreeNode} from '@/types/tree';
import toast from 'react-hot-toast';
import {useTreeStore} from "@/stores/useTreeStore.ts";
import * as assert from "node:assert";


/* ===== 现有工具（从原始代码） ===== */

/* 展开节点：虚拟节点按 YAML 拼装，真实节点走后端 */
export async function loadNodeChildren(node: TreeNode): Promise<TreeNode> {
    // 文件夹不参与 DB 元数据加载
    if (node.type === 'folder') {
        return node;
    }

    if (!node.dbType) {
        return { ...node, expanded: true, children: [] };
    }

    node.dbType = node.dbType.toLowerCase();
    /* 第一次展开 connection → 加载 YAML 顶层 */
    if (node.type === 'connection') {
        const cfg = await getTreeConfig(node.dbType);
        if (!cfg) return { ...node, expanded: true };

        const topNodes = cfg.tree.filter((n) => !n.parent);
        const children = topNodes.map((n) => yamlNodeToTreeNode(n, node));
        return { ...node, expanded: true, children };
    }

    const cfg = await getTreeConfig(node.dbType);
    if (!cfg) {
        // 没有配置，直接认为没有子节点
        return { ...node, expanded: true, children: [] };
    }

    const me = cfg.tree.find((n) => n.type === node.type);
    if (!me) return { ...node, expanded: true, children: [] };

    const children = await loadChildren(me.key, node.dbType);
    if (!children) return { ...node, expanded: true, children: [] };
    // 拉取真实节点信息
    if (children.length === 1 && !children[0].virtual) {
        const kids = await fetchRealNodes(node, children[0]);
        return { ...node, expanded: true, children: kids };
    }

    const result = children.map((n) => yamlNodeToTreeNode(n, node));
    // 子级为虚拟节点
    return { ...node, expanded: true, children: result };
}

/* 把 YAML 节点转成 TreeNode（虚拟） */
function yamlNodeToTreeNode(yaml: any, parent: TreeNode): TreeNode {
    const suffix = parent.path ? `${yaml.name}` : `::${yaml.name}`;
    return {
        id: `${parent.id}::${yaml.key}`,
        parentId: parent.id,
        path: parent.path ?? '',
        name: yaml.label || yaml.key,
        type: yaml.type,
        icon: yaml.icon,
        virtual: yaml.virtual ?? false,
        connected: true,
        dbType: parent.dbType,
        children: [],
        config: {
            type: yaml.type,
            actions: yaml.actions,
            nextLevel: yaml.nextLevel,
            children: yaml.children
        },
    };
}

async function fetchRealNodes(parent: TreeNode, yamlNext: any): Promise<TreeNode[]> {
    const [connId] = parent.id.split('::');
    const path = parent.path ? `${parent.path}` : '';
    const url = `/api/meta/${encodeURIComponent(connId)}/children/${yamlNext.type}${path}`;
    const response = await request<TreeNode[]>(url);
    const data = response.ok ? response.data?.data : [];
    return (data ?? []).map((n: any) => ({
        ...n,
        parentId: parent.id,
        path: `${parent.path}/${n.name}`,
        dbType: parent.dbType,
        icon: yamlNext.icon || n.icon,
        virtual: yamlNext.virtual ?? false,
        config: {
            type: yamlNext.type,
            actions: yamlNext.actions,
            hasChildren: yamlNext.hasChildren,
            children: yamlNext.children,
        },
    }));
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
            return {...n, children: updateTreePath(n.children, targetId, updater)};
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
    const has = !!node.children?.length || node.virtual || node.config?.children || node.config?.hasChildren;
    if (!has) {
        return '';
    }
    return node.expanded ? '▼' : '▶';
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
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({sourceId, targetParentId: targetParentId || null, type: actualType})
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
    const newTree = structuredClone(treeData);

    function deleteRecursive(nodes) {
        if (!Array.isArray(nodes)) return false;
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i] && nodes[i].id === nodeId) {
                nodes.splice(i, 1);
                return true;
            }
            if (nodes[i]?.children && deleteRecursive(nodes[i].children)) {
                return true;
            }
        }
        return false;
    }

    deleteRecursive(newTree);
    return newTree;
};