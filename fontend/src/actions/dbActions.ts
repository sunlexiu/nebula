import toast from 'react-hot-toast';
import { useTreeStore } from '../stores/useTreeStore';
import { findConnectionId } from '../utils/treeUtils';
import { openConfirm } from '../components/modals/modalActions';
import { getTreeConfig } from '@/utils/loadTreeConfig';
/********************************************************************
 * 通用数据库动作实现 + 动作分发器（最终精简版）
 * - 所有具体函数独立到专用模块。
 * - 只剩：模板工厂、分发器、工具、re-export。
 *******************************************************************/
// 类型定义
type StandardActionHandler = (node: any, openModal?: Function, setExpandedKeys?: Function) => Promise<void> | void;
type DynamicActionHandler = (node: any, handler?: string, options?: Options) => Promise<void> | void;
type ActionHandler = StandardActionHandler | DynamicActionHandler;
type Options = { setExpandedKeys?: Function; openModal?: Function };

/* ========================= 通用模板工厂 ========================= */
const createDeleteHandler = (objectType: string, title: string, successMsgTemplate: (name: string) => string): ActionHandler =>
  async (node: any, openModal?: Function) => {
    if (typeof openModal !== 'function') return;
    openConfirm(
      title,
      `确定要删除${objectType} "${node.name}" 吗？此操作不可恢复。`,
      async () => {
        try {
          const connectionId = findConnectionId(node.id);
          const dbName = node.dbName || 'default';
          const schemaName = node.schemaName || 'public';
          const res = await fetch('/api/db/delete-object', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, dbName, schemaName, objectName: node.name, objectType }),
          });
          if (!res.ok) throw new Error(`Failed to delete ${objectType}`);
          useTreeStore.getState().deleteNode(node.id);
          toast.success(successMsgTemplate(node.name));
        } catch (e: any) {
          console.error('Delete object error:', e);
          toast.error('删除失败，请重试');
        }
      },
      'danger',
      openModal
    );
  };
// 刷新模板：适用于 database/schema 等
const createRefreshHandler = (successMsg: (name: string) => string): ActionHandler =>
  async (node: any, setExpandedKeys?: Function) => {
    if (!node.connected) return;
    const { updateTreePath } = useTreeStore.getState();
    const { loadNodeChildren } = await import('../utils/treeUtils');
    const updated = await loadNodeChildren(node);
    updateTreePath(node.id, () => ({ ...updated, expanded: true }));
    toast.success(successMsg(node.name));
    setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
  };
// 占位工厂：通用 toast 反馈（未来扩展）
const createPlaceholderHandler = (msg: (name: string) => string) => (node: any) => toast(msg(node.name));
// 通用属性查看（所有节点共享）
export const showProperties = (node: any) => {
  toast(
    `节点属性:\nID: ${node.id}\n类型: ${node.type}\n名称: ${node.name}\n连接状态: ${node.connected ? '已连接' : '未连接'}`,
    { duration: 4000 }
  );
};
/* ========================= 动作分发器 ========================= */
export const dynamicHandler: DynamicActionHandler = async (handler: string, node:any, options: any = {}) => {
    if (!handler) return;
    const { setExpandedKeys, openModal } = options;
    // 新增：folder 类型统一路由（整合原 actionHandlers 中的 folder 委托）
    if (node.type === 'folder') {
        try {
            const { folderHandlers } = await import('./impl/folderActions');
            if (typeof folderHandlers[handler] === 'function') {
                return folderHandlers[handler](node, openModal, setExpandedKeys);
            }
        } catch (e) {
            console.error('Failed to load folderHandlers:', e);
        }
        toast.error(`未实现的操作: ${handler}`);
        return;
    }
    if (!node.dbType) {
        // 非 folder、非 DB：兜底通用
        const handlerFunc = actionHandlers[handler];
        if (handlerFunc && typeof handlerFunc === 'function') {
            return (handlerFunc as StandardActionHandler)(node, openModal, setExpandedKeys);
        }
        toast.error(`未实现的操作: ${handler}`);
        return;
    }
    // 原有 DB 节点路由...
    let moduleActions: any;
    switch (node.type) {
        case 'connection':
            moduleActions = await import('./impl/connectionActions');
            break;
        case 'database':
            moduleActions = await import('./impl/databaseActions');
        break;
      case 'schema':
        moduleActions = await import('./impl/schemaActions');
        break;
//       case 'table':
//         moduleActions = await import('./tableActions');
//         break;
//       case 'view':
//         moduleActions = await import('./viewActions');
//         break;
//       case 'function':
//         moduleActions = await import('./functionActions');
//         break;
        default:
            moduleActions = null;
    }
    if (moduleActions && typeof moduleActions[handler] === 'function') {
        return moduleActions[handler](node, openModal, setExpandedKeys);
    }
};

export const actionHandlers: Record<string, StandardActionHandler> = {
  defaultAction: (node: any, _openModal?: Function, setExpandedKeys?: Function) => {
    if (node.type === 'connection') {
      actionHandlers.connectAndExpand(node, undefined, setExpandedKeys);
      return;
    }
    toast(`未知默认动作: ${node.name}`);
  },
  // 通用（引用模板） - 只剩这些通用部分
  showProperties,
};
/* ========================= 工具 + 重新导出 ========================= */
export const getAllActions= async (nodeType: string, node?: any) => {
  nodeType = nodeType?.toLowerCase();
  const cfg = await getTreeConfig(node.dbType);
  let actions = cfg?.tree?.find((item) => item.type === nodeType)?.actions?.menu;
  if (!actions) {
      actions = useTreeStore.getState().actionMap?.[nodeType] || [];
  }

  // 优先从 actionMap 读取
  if (actions) {
    actions = actions.filter((action) => {
      if (action.condition) {
        return action.condition(node);
      }
      return true;
    });
  }
  return actions;
};
// 重新导出：统一入口
export { refreshFolder, deleteFolder, openNewGroup, openRenameFolder } from './impl/folderActions';
export { updateConnection, connectDatabase, disconnectDatabase, refreshConnection, deleteConnection } from './impl/connectionActions';
export * from './impl/databaseActions';
export * from './impl/schemaActions';
export * from './impl/tableActions';
export * from './impl/viewActions';
export * from './impl/functionActions';