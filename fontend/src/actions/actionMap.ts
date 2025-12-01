import { ActionMap } from '../types/tree';

export const baseActionMap: ActionMap = {
  folder: [
    { label: '新建连接', handler: 'openNewConnection', icon: '🔗' },
    { type: 'separator' },
    { label: '删除分组', handler: 'deleteFolder', icon: '🗑️', variant: 'danger' },
    { label: '重命名', handler: 'openRenameFolder', icon: '✏️' }
  ],
  connection: [
    {
      label: '连接',
      handler: 'connectAndExpand',
      icon: '⚡',
      primary: true,
      condition: (node: any) => !node.connected
    },
    {
      label: '断开连接',
      handler: 'disconnectDatabase',
      icon: '🔌',
      condition: (node: any) => node.connected
    },
    { type: 'separator' },
    { label: '刷新', handler: 'refreshConnection', icon: '🔄' },
    { type: 'separator' },
    { label: '连接设置', handler: 'openEditConnection', icon: '⚙️' },
    { label: '删除连接', handler: 'deleteConnection', icon: '🗑️', variant: 'danger' },
  ],
  database: [
    { label: '刷新', handler: 'refreshDatabase', icon: '🔄' },
    { label: '新建Schema', handler: 'createNewSchema', icon: '📁' },
    { label: '导出结构', handler: 'exportDatabase', icon: '📤' },
    { type: 'separator' },
    { label: '删除数据库', handler: 'deleteDatabase', icon: '🗑️', variant: 'danger' },
    { label: '属性', handler: 'showProperties', icon: 'ℹ️' },
  ],
  schema: [
    { label: '刷新', handler: 'refreshSchema', icon: '🔄' },
    { label: '新建表', handler: 'createNewTable', icon: '📊' },
    { label: '导出结构', handler: 'exportSchema', icon: '📤' },
    { type: 'separator' },
    { label: '删除Schema', handler: 'deleteSchema', icon: '🗑️', variant: 'danger' },
    { label: '属性', handler: 'showProperties', icon: 'ℹ️' },
  ],
  table: [
    { label: '预览数据', handler: 'previewTable', icon: '📊' },
    { label: '编辑结构', handler: 'editTableStructure', icon: '✏️' },
    { label: '生成SQL', handler: 'generateTableSQL', icon: '💾' },
    { label: '导出数据', handler: 'exportTableData', icon: '📤' },
    { type: 'separator' },
    { label: '删除表', handler: 'deleteTable', icon: '🗑️', variant: 'danger' },
    { label: '属性', handler: 'showProperties', icon: 'ℹ️' },
  ],
  view: [
    { label: '查看定义', handler: 'viewDefinition', icon: '👁️' },
    { label: '编辑视图', handler: 'editView', icon: '✏️' },
    { label: '生成SQL', handler: 'generateViewSQL', icon: '💾' },
    { type: 'separator' },
    { label: '删除视图', handler: 'deleteView', icon: '🗑️', variant: 'danger' },
    { label: '属性', handler: 'showProperties', icon: 'ℹ️' },
  ],
  function: [
    { label: '编辑函数', handler: 'editFunction', icon: '✏️' },
    { label: '查看源码', handler: 'viewFunctionSource', icon: '👁️' },
    { label: '执行测试', handler: 'testFunction', icon: '🔬' },
    { type: 'separator' },
    { label: '删除函数', handler: 'deleteFunction', icon: '🗑️', variant: 'danger' },
    { label: '属性', handler: 'showProperties', icon: 'ℹ️' },
  ],
};