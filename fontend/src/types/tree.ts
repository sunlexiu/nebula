export interface ActionItem {
  label?: string;
  handler?: string;
  icon?: string;
  type?: 'separator';
  variant?: 'danger' | 'default';
  primary?: boolean;
  condition?: (node: any) => boolean;
}

/** 左侧树每个节点的完整类型 */
export interface TreeNode {
    id: string;
    /** 父节点 ID（根节点为 null） */
    parentId?: string | null;
    /** 显示名称 */
    name: string;
    /** 节点类型：folder | connection | database | schema | table | view | function … */
    type: string;
    dbType?: string;
    connected?: boolean;
    expanded?: boolean;
    path?: string;
    virtual?: boolean;
    icon?: string;
    children?: TreeNode[];

    /** 原始 YAML 配置片段（虚拟节点使用） */
    config?: {
        type?: string;
        actions?: {
            primary?: ActionItem;
            menu?: ActionItem[];
        };
        nextLevel?: string;
        hasChildren?: boolean;
        children?: Record<string, string>;
        [key: string]: any;
    };
}

export type ActionMap = Record<string, ActionItem[]>;

export interface TreeNodeConfig {
  key: string;
  label: string;
  type: string;
  virtual?: boolean;
  position?: number;
  icon?: string;
  nextLevel?: string;
  parent?: string;
  children?: Record<string, string>;
  actions?: {
    primary?: ActionItem;
    menu?: ActionItem[];
  };
}

export interface TreeConfig {
  tree: TreeNodeConfig[];
}