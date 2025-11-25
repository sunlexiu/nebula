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
  cache.set(key, config);
  return config;
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
    nextLevel?: string;
    parent?: string;
    children?: Record<string, string>;
    actions?: { primary?: any; menu?: any[] };
  }>;
}