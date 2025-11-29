import { parse } from 'yaml';

const cache = new Map<string, TreeConfig>();

export async function getTreeConfig(dbType: string) {
  if (!dbType) {
      return null;
  }

  const key = dbType.toLowerCase();
  const supportedDbTypes = ['mysql', 'postgresql', 'oracle', 'sqlserver', 'mongodb'];
  // 添加 dbType 合法性检查
  if (!dbType || !supportedDbTypes.includes(dbType.toLowerCase())) {
    return null;
  }

  if (cache.has(key)) return cache.get(key)!;
  const res = await fetch(`/src/config/tree-${key}.yml`);
  if (!res.ok) throw new Error(`Failed to load tree config: ${key}`);
  const text = await res.text();
  const config = parse(text);
  config.tree.forEach((item: any) => {
    if (!item.parent) {
      return ;
    }

    const parent = config.tree.find((n: any) => n.key === item.parent);
    if (parent) {
      parent.hasChildren = true;
    }
  });
  cache.set(key, config);
  return config;
}

export async function loadNodeConfig(dbType: string, nodeType: string) {
  const config = await getTreeConfig(dbType);
  if (!config) return null;
  return config.tree.find((item: { type: string; }) => item.type === nodeType);
}

export async function loadChildren(parentId: string, dbType: string): Promise<any[]> {
  const config = await getTreeConfig(dbType);
  if (!config) return [];
  return  config.tree.filter((item: { parent: string; }) => item.parent == parentId);
}

/* ---------- 类型 ---------- */
export interface TreeConfig {
  tree: Array<{
    key: string;
    label: string;
    type: string;
    virtual?: boolean;
    position?: number;
    icon?: string;
    nextLevel: string;
    hasChildren?: boolean;
    parent?: string;
    children?: Record<string, string>;
    actions?: { primary?: any; menu?: any[] };
  }>;
}