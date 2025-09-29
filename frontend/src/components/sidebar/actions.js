// 所有操作函数的统一管理

// 获取主要操作
export const getPrimaryAction = (nodeType) => {
  const actions = {
    folder: { icon: '📁', label: '新建' },
    connection: { icon: '⚡', label: '连接' },
    // old: 🔄
    database: { icon: '🔄', label: '刷新' },
    schema: { icon: '🔄', label: '刷新' },
    table: { icon: '📊', label: '预览' },
    view: { icon: '👁️', label: '查看' },
    function: { icon: '⚙️', label: '编辑' }
  };
  return actions[nodeType] || null;
};

// 获取所有操作菜单
export const getAllActions = (nodeType, node) => {
  // 注意：这里传入完整的node对象，而不是nodeId
  const actions = {
    folder: [
      { label: '新建文件夹', action: () => addFolder(node), icon: '📁' },
      { label: '新建连接', action: () => addConnection(node), icon: '🔌' },
      { type: 'separator' },
      { label: '刷新', action: () => refreshFolder(node), icon: '🔄' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    connection: [
      { label: '连接', action: () => connectDatabase(node), icon: '⚡' },
      { label: '断开连接', action: () => disconnectDatabase(node), icon: '🔌' },
      { type: 'separator' },
      { label: '刷新', action: () => refreshConnection(node), icon: '🔄' },
      { label: '连接设置', action: () => showConnectionSettings(node), icon: '⚙️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    database: [
      { label: '刷新', action: () => refreshDatabase(nodeId), icon: '🔄' },
      { label: '新建Schema', action: () => createNewSchema(nodeId), icon: '📁' },
      { label: '导出结构', action: () => exportDatabase(nodeId), icon: '📤' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties({ id: nodeId, type: 'db' }), icon: 'ℹ️' }
    ],
    schema: [
      { label: '刷新', action: () => refreshSchema(node), icon: '🔄' },
      { label: '新建表', action: () => createNewTable(node), icon: '📊' },
      { label: '导出结构', action: () => exportSchema(node), icon: '📤' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    table: [
      { label: '预览数据', action: () => previewTable(node), icon: '📊' },
      { label: '编辑结构', action: () => editTableStructure(node), icon: '✏️' },
      { label: '生成SQL', action: () => generateTableSQL(node), icon: '💾' },
      { label: '导出数据', action: () => exportTableData(node), icon: '📤' },
      { type: 'separator' },
      { label: '删除表', action: () => deleteTable(node), icon: '🗑️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    view: [
      { label: '查看定义', action: () => viewDefinition(node), icon: '👁️' },
      { label: '编辑视图', action: () => editView(node), icon: '✏️' },
      { label: '生成SQL', action: () => generateViewSQL(node), icon: '💾' },
      { type: 'separator' },
      { label: '删除视图', action: () => deleteView(node), icon: '🗑️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    function: [
      { label: '编辑函数', action: () => editFunction(node), icon: '✏️' },
      { label: '查看源码', action: () => viewFunctionSource(node), icon: '👁️' },
      { label: '执行测试', action: () => testFunction(node), icon: '🔬' },
      { type: 'separator' },
      { label: '删除函数', action: () => deleteFunction(node), icon: '🗑️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ]
  };
  return actions[nodeType] || [
    { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
  ];
};

// 树数据操作
export const addFolder = (treeData, setTreeData, parentNode) => {
  const newFolderName = window.prompt('文件夹名称:', '新建文件夹');
  if (!newFolderName) return;

  setTreeData((prev) => {
    const copy = JSON.parse(JSON.stringify(prev));
    const parent = findNode(copy, parentNode.id);
    if (parent) {
      parent.children.push({
        id: 'f' + Date.now(),
        name: newFolderName,
        type: 'folder',
        expanded: false,
        children: []
      });
    }
    return copy;
  });
};

export const addConnection = (treeData, setTreeData, parentNode) => {
  const connectionName = window.prompt('连接名称:', '新建连接');
  if (!connectionName) return;

  setTreeData((prev) => {
    const copy = JSON.parse(JSON.stringify(prev));
    const parent = findNode(copy, parentNode.id);
    if (parent) {
      parent.children.push({
        id: 'c' + Date.now(),
        name: connectionName,
        type: 'connection',
        dbType: 'pgsql',
        expanded: false,
        children: []
      });
    }
    return copy;
  });
};

export const toggleExpand = (treeData, setTreeData, nodeId, loadChildren = true) => {
  setTreeData((prev) => {
    const copy = JSON.parse(JSON.stringify(prev));
    const node = findNode(copy, nodeId);
    if (node) {
      if (loadChildren && (!node.children || node.children.length === 0)) {
        // 这里只是标记为需要加载，实际加载在TreeNode中处理
        node.expanded = true;
      } else {
        node.expanded = !node.expanded;
      }
    }
    return copy;
  });
};

export const refreshConnection = (node) => {
  alert(`刷新连接: ${node.name}`);
};

export const refreshSchema = (node) => {
  alert(`刷新架构: ${node.name}`);
};

// 数据库操作
export const connectDatabase = (node) => {
  alert(`正在连接数据库: ${node.name}`);
};

export const disconnectDatabase = (node) => {
  alert(`断开连接: ${node.name}`);
};

export const showConnectionSettings = (node) => {
  alert(`连接设置: ${node.name}`);
};

// 架构操作
export const createNewTable = (node) => {
  alert(`新建表在架构: ${node.name}`);
};

export const exportSchema = (node) => {
  alert(`导出架构: ${node.name}`);
};

// 表操作
export const previewTable = (node) => {
  alert(`预览表: ${node.name}`);
};

export const editTableStructure = (node) => {
  alert(`编辑表结构: ${node.name}`);
};

export const generateTableSQL = (node) => {
  alert(`生成SQL: ${node.name}`);
};

export const exportTableData = (node) => {
  alert(`导出数据: ${node.name}`);
};

export const deleteTable = (node) => {
  if (window.confirm(`确定要删除表 ${node.name} 吗？`)) {
    alert(`删除表: ${node.name}`);
  }
};

// 视图操作
export const viewDefinition = (node) => {
  alert(`查看定义: ${node.name}`);
};

export const editView = (node) => {
  alert(`编辑视图: ${node.name}`);
};

export const generateViewSQL = (node) => {
  alert(`生成视图SQL: ${node.name}`);
};

export const deleteView = (node) => {
  if (window.confirm(`确定要删除视图 ${node.name} 吗？`)) {
    alert(`删除视图: ${node.name}`);
  }
};

// 函数操作
export const editFunction = (node) => {
  alert(`编辑函数: ${node.name}`);
};

export const viewFunctionSource = (node) => {
  alert(`查看源码: ${node.name}`);
};

export const testFunction = (node) => {
  alert(`测试函数: ${node.name}`);
};

export const deleteFunction = (node) => {
  if (window.confirm(`确定要删除函数 ${node.name} 吗？`)) {
    alert(`删除函数: ${node.name}`);
  }
};

// 通用操作
export const showProperties = (node) => {
  alert(`节点属性:\nID: ${node.id}\n类型: ${node.type}\n名称: ${node.name}`);
};

export const refreshFolder = (node) => {
  alert(`刷新文件夹: ${node.name}`);
};

// 工具函数
export const findNode = (nodes, id) => {
  for (let node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};