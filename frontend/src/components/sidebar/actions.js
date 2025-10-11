// components/sidebar/actions.js
// 所有操作函数的统一管理

// 获取主要操作
export const getPrimaryAction = (nodeType) => {
  const actions = {
    folder: { icon: '🔌', label: '新建连接' },
    connection: { icon: '⚡', label: '连接' },
    database: { icon: '🔄', label: '刷新' },
    schema: { icon: '🔄', label: '刷新' },
    table: { icon: '📊', label: '预览' },
    view: { icon: '👁️', label: '查看' },
    function: { icon: '⚙️', label: '编辑' }
  };
  return actions[nodeType] || null;
};

// 获取所有操作菜单
export const getAllActions = (nodeType, node, treeData, setTreeData, setExpandedKeys, openNewGroup, openNewConnection, openConfirm, openRenameFolder) => {
  const actions = {
    folder: [
      { label: '新建文件夹', action: () => openNewGroup(node.id), icon: '📁' },
      { label: '新建连接', action: () => openNewConnection(node.id), icon: '🔌' },
      { type: 'separator' },
      { label: '刷新', action: () => refreshFolder(node), icon: '🔄' },
      { type: 'separator' },
      { label: '删除文件夹', action: () => deleteFolder(node, setTreeData, openConfirm), icon: '🗑️' },
      { label: '重命名', action: () => renameFolder(node, setTreeData, openRenameFolder), icon: '✏️' }
    ],
    connection: [
      { label: '连接', action: () => connectDatabase(node, setTreeData), icon: '⚡' },
      { label: '断开连接', action: () => disconnectDatabase(node, setTreeData), icon: '🔌' },
      { type: 'separator' },
      { label: '刷新', action: () => refreshConnection(node, setTreeData, setExpandedKeys), icon: '🔄' },
      { label: '连接设置', action: () => showConnectionSettings(node), icon: '⚙️' },
      { type: 'separator' },
      { label: '删除连接', action: () => deleteConnection(node, setTreeData, openConfirm), icon: '🗑️' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    database: [
      { label: '刷新', action: () => refreshDatabase(node, setTreeData, setExpandedKeys), icon: '🔄' },
      { label: '新建Schema', action: () => createNewSchema(node), icon: '📁' },
      { label: '导出结构', action: () => exportDatabase(node), icon: '📤' },
      { type: 'separator' },
      { label: '删除数据库', action: () => deleteDatabase(node, setTreeData, openConfirm), icon: '🗑️' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    schema: [
      { label: '刷新', action: () => refreshSchema(node, setTreeData, setExpandedKeys), icon: '🔄' },
      { label: '新建表', action: () => createNewTable(node), icon: '📊' },
      { label: '导出结构', action: () => exportSchema(node), icon: '📤' },
      { type: 'separator' },
      { label: '删除Schema', action: () => deleteSchema(node, setTreeData, openConfirm), icon: '🗑️' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    table: [
      { label: '预览数据', action: () => previewTable(node), icon: '📊' },
      { label: '编辑结构', action: () => editTableStructure(node), icon: '✏️' },
      { label: '生成SQL', action: () => generateTableSQL(node), icon: '💾' },
      { label: '导出数据', action: () => exportTableData(node), icon: '📤' },
      { type: 'separator' },
      { label: '删除表', action: () => deleteTable(node, setTreeData, openConfirm), icon: '🗑️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    view: [
      { label: '查看定义', action: () => viewDefinition(node), icon: '👁️' },
      { label: '编辑视图', action: () => editView(node), icon: '✏️' },
      { label: '生成SQL', action: () => generateViewSQL(node), icon: '💾' },
      { type: 'separator' },
      { label: '删除视图', action: () => deleteView(node, setTreeData, openConfirm), icon: '🗑️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    function: [
      { label: '编辑函数', action: () => editFunction(node), icon: '✏️' },
      { label: '查看源码', action: () => viewFunctionSource(node), icon: '👁️' },
      { label: '执行测试', action: () => testFunction(node), icon: '🔬' },
      { type: 'separator' },
      { label: '删除函数', action: () => deleteFunction(node, setTreeData, openConfirm), icon: '🗑️' },
      { type: 'separator' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ]
  };
  return actions[nodeType] || [
    { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
  ];
};

// 不可变更新树特定路径
export const updateTreePath = (treeData, targetId, updaterFn) => {
  const newTree = JSON.parse(JSON.stringify(treeData));
  const targetNode = findNode(newTree, targetId);
  if (targetNode) {
    const updated = updaterFn({ ...targetNode });
    Object.assign(targetNode, updated);
  }
  return newTree;
};

// 树数据操作
export const toggleExpand = (setExpandedKeys, nodeId, loadChildren = true) => {
  setExpandedKeys((prev) => {
    const newMap = new Map(prev);
    newMap.set(nodeId, !newMap.get(nodeId));
    return newMap;
  });
};

// 新增：递归删除节点及其子树，返回新树数据（局部增量更新）
export const deleteNode = (treeData, nodeId) => {
  const newTree = JSON.parse(JSON.stringify(treeData));
  function deleteRecursive(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === nodeId) {
        nodes.splice(i, 1);
        return true;
      }
      if (nodes[i].children && deleteRecursive(nodes[i].children)) {
        return true;
      }
    }
    return false;
  }
  deleteRecursive(newTree);
  return newTree;
};

// 新增：删除文件夹（API: /api/config/folders/{id} DELETE）
export const deleteFolder = async (node, setTreeData, openConfirm) => {
  openConfirm(
    `删除文件夹`,
    `确定要删除文件夹 "${node.name}" 及其所有子项吗？此操作不可恢复。`,
    async () => {
      try {
        const response = await fetch(`/api/config/folders/${node.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete folder');
        setTreeData((prev) => deleteNode(prev, node.id));
        console.log(`文件夹 "${node.name}" 已删除`);
      } catch (error) {
        console.error('Delete folder error:', error);
        alert('删除失败，请重试');
      }
    },
    'danger'
  );
};

// 新增：重命名文件夹
export const renameFolder = (node, setTreeData, openRenameFolderModal) => {
  openRenameFolderModal({
    id: node.id,
    name: node.name,
    onSubmit: async (newName) => {
      if (!newName || newName.trim() === '') {
        throw new Error('文件夹名称不能为空');
      }
      try {
        const response = await fetch(`/api/config/folders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim(), id: node.id , type: 'folder'})
        });
        if (!response.ok) throw new Error('Failed to rename folder');
        setTreeData((prev) => updateTreePath(prev, node.id, (current) => ({
          ...current,
          name: newName.trim()
        })));
        console.log(`文件夹已重命名为 "${newName}"`);
      } catch (error) {
        console.error('Rename folder error:', error);
        throw error; // 让模态框处理错误
      }
    }
  });
};

// 新增：删除连接（API: /api/config/connections/{id} DELETE）
export const deleteConnection = async (node, setTreeData, openConfirm) => {
  openConfirm(
    `删除连接`,
    `确定要删除连接 "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const response = await fetch(`/api/config/connections/${node.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete connection');
        setTreeData((prev) => deleteNode(prev, node.id));
        console.log(`连接 "${node.name}" 已删除`);
      } catch (error) {
        console.error('Delete connection error:', error);
        alert('删除失败，请重试');
      }
    },
    'danger'
  );
};

// 新增：删除数据库（API: /api/db/delete-database, params: { connectionId, dbName }）
export const deleteDatabase = async (node, setTreeData, openConfirm) => {
  openConfirm(
    `删除数据库`,
    `确定要删除数据库 "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = node.parentId || findConnectionId(node.id);
        const response = await fetch('/api/db/delete-database', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName: node.name })
        });
        if (!response.ok) throw new Error('Failed to delete database');
        setTreeData((prev) => deleteNode(prev, node.id));
        console.log(`数据库 "${node.name}" 已删除`);
      } catch (error) {
        console.error('Delete database error:', error);
        alert('删除失败，请重试');
      }
    },
    'danger'
  );
};

// 新增：删除Schema（API: /api/db/delete-schema, params: { connectionId, dbName, schemaName }）
export const deleteSchema = async (node, setTreeData, openConfirm) => {
  openConfirm(
    `删除Schema`,
    `确定要删除Schema "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id);
        const dbName = node.dbName || 'default';
        const response = await fetch('/api/db/delete-schema', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName, schemaName: node.name })
        });
        if (!response.ok) throw new Error('Failed to delete schema');
        setTreeData((prev) => deleteNode(prev, node.id));
        console.log(`Schema "${node.name}" 已删除`);
      } catch (error) {
        console.error('Delete schema error:', error);
        alert('删除失败，请重试');
      }
    },
    'danger'
  );
};

// 新增：删除表/视图/函数（统一 API: /api/db/delete-object, params: { connectionId, dbName, schemaName, objectName, objectType }）
export const deleteTable = async (node, setTreeData, openConfirm) => {
  await deleteDbObject(node, setTreeData, 'table', openConfirm);
};

export const deleteView = async (node, setTreeData, openConfirm) => {
  await deleteDbObject(node, setTreeData, 'view', openConfirm);
};

export const deleteFunction = async (node, setTreeData, openConfirm) => {
  await deleteDbObject(node, setTreeData, 'function', openConfirm);
};

const deleteDbObject = async (node, setTreeData, objectType, openConfirm) => {
  const label = objectType === 'table' ? '表' : objectType === 'view' ? '视图' : '函数';
  openConfirm(
    `删除${label}`,
    `确定要删除${label} "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id);
        const dbName = node.dbName || 'default';
        const schemaName = node.schemaName || 'public';
        const response = await fetch('/api/db/delete-object', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName, schemaName, objectName: node.name, objectType })
        });
        if (!response.ok) throw new Error(`Failed to delete ${objectType}`);
        setTreeData((prev) => deleteNode(prev, node.id));
        console.log(`${label} "${node.name}" 已删除`);
      } catch (error) {
        console.error(`Delete ${objectType} error:`, error);
        alert('删除失败，请重试');
      }
    },
    'danger'
  );
};

// 辅助：查找连接 ID（递归从树中找 connection 祖先）
const findConnectionId = (nodeId, treeData) => {
  return 'example-connection-id';
};

// 刷新函数（原有）
export const refreshConnection = (node, setTreeData, setExpandedKeys) => {
  if (!node.connected) {
    alert('请先连接');
    return;
  }
  setTimeout(() => {
    const databases = [
      {
        id: `${node.id}-db1`,
        name: 'postgres',
        type: 'database',
        expanded: false,
        connected: node.connected,
        children: []
      }
    ];
    setTreeData((prev) => updateTreePath(prev, node.id, (current) => ({
      ...current,
      children: databases,
      expanded: true
    })));
    setExpandedKeys((prev) => new Map(prev).set(node.id, true));
    alert(`刷新成功: ${node.name}`);
  }, 300);
};

export const refreshDatabase = (node, setTreeData, setExpandedKeys) => {
  if (!node.connected) return;
  setTimeout(() => {
    const schemas = [
      {
        id: `${node.id}-s1`,
        name: 'public',
        type: 'schema',
        expanded: false,
        connected: node.connected,
        children: []
      }
    ];
    setTreeData((prev) => updateTreePath(prev, node.id, (current) => ({
      ...current,
      children: schemas,
      expanded: true
    })));
    setExpandedKeys((prev) => new Map(prev).set(node.id, true));
  }, 300);
};

export const refreshSchema = (node, setTreeData, setExpandedKeys) => {
  if (!node.connected) return;
  setTimeout(() => {
    const items = [
      { id: `${node.id}-t1`, name: 'users', type: 'table', expanded: false },
      { id: `${node.id}-t2`, name: 'orders', type: 'table', expanded: false },
      { id: `${node.id}-v1`, name: 'user_view', type: 'view', expanded: false },
      { id: `${node.id}-f1`, name: 'calc_total', type: 'function', expanded: false }
    ];
    setTreeData((prev) => updateTreePath(prev, node.id, (current) => ({
      ...current,
      children: items,
      expanded: true
    })));
    setExpandedKeys((prev) => new Map(prev).set(node.id, true));
  }, 300);
};

// 数据库操作
export const connectDatabase = (node, setTreeData) => {
  if (node.connected) {
    alert(`已连接: ${node.name}`);
    return;
  }
  setTimeout(() => {
    setTreeData((prev) => updateTreePath(prev, node.id, (current) => ({
      ...current,
      connected: true,
      status: 'connected'
    })));
    alert(`连接成功: ${node.name}`);
  }, 500);
};

export const disconnectDatabase = (node, setTreeData) => {
  if (!node.connected) {
    alert(`未连接: ${node.name}`);
    return;
  }
  setTreeData((prev) => updateTreePath(prev, node.id, (current) => ({
    ...current,
    connected: false,
    status: 'disconnected',
    children: []
  })));
  alert(`断开连接: ${node.name}`);
};

export const showConnectionSettings = (node) => {
  alert(`连接设置: ${node.name}`);
};

// 架构操作
export const createNewSchema = (node) => {
  alert(`新建Schema在数据库: ${node.name}`);
};

export const exportDatabase = (node) => {
  alert(`导出数据库: ${node.name}`);
};

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

// 通用操作
export const showProperties = (node) => {
  alert(`节点属性:\nID: ${node.id}\n类型: ${node.type}\n名称: ${node.name}\n连接状态: ${node.connected ? '已连接' : '未连接'}`);
};

export const refreshFolder = (node) => {
  alert(`刷新文件夹: ${node.name}`);
};

// 工具函数
export const findNode = (nodes, id) => {
  if (!Array.isArray(nodes)) return null;
  for (let node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};