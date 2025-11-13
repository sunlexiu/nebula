import { parse } from 'yaml';

const cache = new Map<string, TreeConfig>();

export async function loadYaml<T>(path: string): Promise<T> {
  const raw = await import(/* @vite-ignore */ path + '?raw');
  return parse(raw.default) as T;
}

export async function getTreeConfig(dbType: string) {
  const key = dbType.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  const cfg = await loadYaml<TreeConfig>(`../config/tree-${key}.yml`);
  cache.set(key, cfg);
  return cfg;
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