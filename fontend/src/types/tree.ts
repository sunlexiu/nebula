export type NodeType =
  | 'folder' | 'connection' | 'database' | 'schema'
  | 'table' | 'view' | 'function' | 'role' | 'publication';

export interface BaseNode {
  id: string;
  name: string;
  config?: NodeConfig;
  children?: TreeNode[];
}

export type TreeNode =
  | (BaseNode & { type: 'folder'; allowDrop?: boolean })
  | (BaseNode & { type: 'connection'; connected?: boolean })
  | (BaseNode & { type: Exclude<NodeType, 'folder' | 'connection'> });

export type ActionId =
  | 'connectAndExpand' | 'refresh' | 'newConnection' | 'newFolder'
  | 'deleteDatabase' | 'deleteSchema' | 'deleteTable' | 'deleteView' | 'deleteFunction'
  | 'renameFolder' | 'editConnection' | 'runSql' | 'stop';

export interface NodeAction {
  id: ActionId | string;
  label: string;
  confirm?: { title: string; message: string; variant?: 'danger' | 'default' };
}

export interface NodeConfig {
  actions?: {
    primary?: { handler: ActionId | string };
    menu?: Array<{ handler: ActionId | string; label?: string }>;
  };
  nextLevel?: string;
  allowDrop?: boolean;
}