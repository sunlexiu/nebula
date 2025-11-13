export interface ActionItem {
  label?: string;
  handler?: string;
  icon?: string;
  type?: 'separator';
  variant?: 'danger' | 'default';
  primary?: boolean;
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