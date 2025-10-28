import { create } from 'zustand';

export const useTreeConfigStore = create((set, get) => ({
  configs: {},  // { dbType: configJson }
  getConfig: (dbType) => get().configs[dbType],
  setConfig: (dbType, config) => set((state) => ({
    configs: { ...state.configs, [dbType]: config }
  })),
  // 加载配置（在连接创建/测试时调用）
  loadConfigForConnection: async (connId) => {
    try {
      const response = await fetch(`/api/config/connections/${connId}/config`);
      if (!response.ok) throw new Error('Failed to load tree config');
      const config = await response.json();
      set((state) => ({
        configs: { ...state.configs, [config.dbType]: config }
      }));
      return config;
    } catch (error) {
      console.error('Error loading tree config:', error);
      return null;
    }
  },
  // 通用：根据节点 config 获取下一层配置
  getNextLevelConfig: (currentConfig, subType) => {
    if (!currentConfig.nextLevel) return null;
    const next = currentConfig.nextLevel;
    if (subType && next.subTypes) {  // YAML 中 nextLevel 可有 subTypes
      return next.subTypes[subType] || next;
    }
    return next;
  },
  // 获取聚合分组配置
  getGroupByConfigs: (config) => config.groupBy || {},
  // 获取 extraLevels（并行层）
  getExtraLevels: (config) => config.extraLevels || [],
  // 构建虚拟聚合节点
  buildVirtualGroupNode: (groupKey, parentNode, treeConfig) => {
    const groupConfigs = get().getGroupByConfigs(treeConfig);
    const groupConfig = groupConfigs[groupKey];
    if (!groupConfig) return null;
    return {
      id: `${parentNode.id}::group::${groupKey}`,
      parentId: parentNode.id,
      name: groupConfig.label,
      type: groupConfig.type,  // e.g., "table_group"
      config: {
        ...groupConfig,
        actions: groupConfig.actions || parentNode.config.actions,
        icon: groupConfig.icon
      },
      virtual: true,  // 标记虚拟节点
      children: [],  // 懒加载
      connected: parentNode.connected
    };
  }
}));