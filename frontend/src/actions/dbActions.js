import toast from 'react-hot-toast';
import { useTreeStore } from '../stores/useTreeStore';

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

// 修复：getAllActions 接收所有 props，确保回调能访问函数
export const getAllActions = (nodeType, node, setExpandedKeys, openNewGroup, openNewConnection, openConfirm, openRenameFolder, openEditConnection, refreshFolder, deleteFolder, refreshConnection, connectDatabase, disconnectDatabase, refreshDatabase, refreshSchema, createNewSchema, exportDatabase, createNewTable, exportSchema, previewTable, editTableStructure, generateTableSQL, exportTableData, viewDefinition, editView, generateViewSQL, editFunction, viewFunctionSource, testFunction, showProperties, deleteConnection, deleteDatabase, deleteSchema, deleteTable, deleteView, deleteFunction) => {
  const actions = {
    folder: [
      { label: '新建文件夹', action: () => openNewGroup(node.id), icon: '📁' },
      { label: '新建连接', action: () => openNewConnection(node.id), icon: '🔌' },
      { type: 'separator' },
      { label: '刷新', action: () => refreshFolder(node), icon: '🔄' },
      { type: 'separator' },
      { label: '删除文件夹', action: () => deleteFolder(node), icon: '🗑️' },
      { label: '重命名', action: () => openRenameFolder(node), icon: '✏️' }
    ],
    connection: [
      { label: '连接', action: () => connectDatabase(node), icon: '⚡' },
      { label: '断开连接', action: () => disconnectDatabase(node), icon: '🔌' },
      { type: 'separator' },
      { label: '刷新', action: () => refreshConnection(node, setExpandedKeys), icon: '🔄' },
      { label: '连接设置', action: () => openEditConnection(node), icon: '⚙️' },
      { type: 'separator' },
      { label: '删除连接', action: () => deleteConnection(node), icon: '🗑️' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    database: [
      { label: '刷新', action: () => refreshDatabase(node, setExpandedKeys), icon: '🔄' },
      { label: '新建Schema', action: () => createNewSchema(node), icon: '📁' },
      { label: '导出结构', action: () => exportDatabase(node), icon: '📤' },
      { type: 'separator' },
      { label: '删除数据库', action: () => deleteDatabase(node), icon: '🗑️' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    schema: [
      { label: '刷新', action: () => refreshSchema(node, setExpandedKeys), icon: '🔄' },
      { label: '新建表', action: () => createNewTable(node), icon: '📊' },
      { label: '导出结构', action: () => exportSchema(node), icon: '📤' },
      { type: 'separator' },
      { label: '删除Schema', action: () => deleteSchema(node), icon: '🗑️' },
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

// 更新连接（自动展示：加载中 → 成功/失败）
export const updateConnection = async (payload) => {
  const { updateTreePath } = useTreeStore.getState();
  return toast.promise(
      (async () => {
        const response = await fetch(`/api/config/connections/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update connection');

        // 本地状态更新
        updateTreePath(payload.id, (current) => ({
          ...current,
          name: payload.name,
          dbType: payload.dbType,
          host: payload.host,
          port: payload.port,
          database: payload.database,
          username: payload.username,
        }));

        return true; // 成功分支
      })(),
      {
        loading: '保存连接中...',
        success: `连接 "${payload.name}" 已更新`,
        error: '更新失败，请重试',
      }
  );
};

// 连接数据库（返回 Promise，便于后续自动展开）
export const connectDatabase = (node) => {
  const { updateTreePath } = useTreeStore.getState();
  if (node.connected) {
    toast(`已连接: ${node.name}`);
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      updateTreePath(node.id, (current) => ({
        ...current,
        connected: true,
        status: 'connected'
      }));
      toast.success(`已连接: ${node.name}`);
      resolve(true);
    }, 300);
  });
};


// 断开连接
export const disconnectDatabase = (node) => {
  const { updateTreePath } = useTreeStore.getState();
  if (!node.connected) {
    toast(`未连接: ${node.name}`);
    return;
  }
  updateTreePath(node.id, (current) => ({
    ...current,
    connected: false,
    status: 'disconnected',
    children: []
  }));
  toast.success(`断开连接: ${node.name}`);
};

// 刷新连接
export const refreshConnection = (node, setExpandedKeys) => {
  if (!node.connected) {
    toast.error('请先连接');
    return;
  }
  setTimeout(() => {
    // 模拟刷新，实际调用 API
    toast.success(`刷新成功: ${node.name}`);
    setExpandedKeys((prev) => new Map(prev).set(node.id, true));
  }, 300);
};

// 刷新数据库
export const refreshDatabase = (node, setExpandedKeys) => {
  if (!node.connected) return;
  setTimeout(() => {
    // 模拟刷新
    toast.success(`刷新数据库: ${node.name}`);
    setExpandedKeys((prev) => new Map(prev).set(node.id, true));
  }, 300);
};

// 刷新 Schema
export const refreshSchema = (node, setExpandedKeys) => {
  if (!node.connected) return;
  setTimeout(() => {
    // 模拟刷新
    toast.success(`刷新 Schema: ${node.name}`);
    setExpandedKeys((prev) => new Map(prev).set(node.id, true));
  }, 300);
};

// 删除连接
export const deleteConnection = async (node, openModal) => {
  if (typeof openModal !== 'function') {
    toast.error('模态打开失败');
    return;
  }
  const localOpenConfirm = (title, message, onConfirm, variant = 'danger') => {
    openModal('confirm', {
      title,
      message,
      onConfirm,
      variant
    });
  };

  localOpenConfirm(
    `删除连接`,
    `确定要删除连接 "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const response = await fetch(`/api/config/connections/${node.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete connection');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`连接 "${node.name}" 已删除`);
      } catch (error) {
        toast.error('删除失败，请重试');
      }
    },
    'danger'
  );
};

// 删除数据库
export const deleteDatabase = async (node, openModal) => {
  if (typeof openModal !== 'function') {
    toast.error('模态打开失败');
    return;
  }
  const localOpenConfirm = (title, message, onConfirm, variant = 'danger') => {
    openModal('confirm', {
      title,
      message,
      onConfirm,
      variant
    });
  };

  localOpenConfirm(
    `删除数据库`,
    `确定要删除数据库 "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
        const response = await fetch('/api/db/delete-database', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName: node.name })
        });
        if (!response.ok) throw new Error('Failed to delete database');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`数据库 "${node.name}" 已删除`);
      } catch (error) {
        toast.error('删除失败，请重试');
      }
    },
    'danger'
  );
};

// 删除 Schema
export const deleteSchema = async (node, openModal) => {
  if (typeof openModal !== 'function') {
    toast.error('模态打开失败');
    return;
  }
  const localOpenConfirm = (title, message, onConfirm, variant = 'danger') => {
    openModal('confirm', {
      title,
      message,
      onConfirm,
      variant
    });
  };

  localOpenConfirm(
    `删除Schema`,
    `确定要删除Schema "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
        const dbName = node.dbName || 'default';
        const response = await fetch('/api/db/delete-schema', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName, schemaName: node.name })
        });
        if (!response.ok) throw new Error('Failed to delete schema');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`Schema "${node.name}" 已删除`);
      } catch (error) {
        toast.error('删除失败，请重试');
      }
    },
    'danger'
  );
};

// 通用删除 DB 对象
const deleteDbObject = async (node, objectType, openModal) => {
  if (typeof openModal !== 'function') {
    toast.error('模态打开失败');
    return;
  }
  const label = objectType === 'table' ? '表' : objectType === 'view' ? '视图' : '函数';
  const localOpenConfirm = (title, message, onConfirm, variant = 'danger') => {
    openModal('confirm', {
      title,
      message,
      onConfirm,
      variant
    });
  };

  localOpenConfirm(
    `删除${label}`,
    `确定要删除${label} "${node.name}" 吗？此操作不可恢复。`,
    async () => {
      try {
        const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
        const dbName = node.dbName || 'default';
        const schemaName = node.schemaName || 'public';
        const response = await fetch('/api/db/delete-object', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId, dbName, schemaName, objectName: node.name, objectType })
        });
        if (!response.ok) throw new Error(`Failed to delete ${objectType}`);
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`${label} "${node.name}" 已删除`);
      } catch (error) {
        toast.error('删除失败，请重试');
      }
    },
    'danger'
  );
};

export const deleteTable = (node, openModal) => deleteDbObject(node, 'table', openModal);
export const deleteView = (node, openModal) => deleteDbObject(node, 'view', openModal);
export const deleteFunction = (node, openModal) => deleteDbObject(node, 'function', openModal);

// 其他操作（模拟，添加 toast）
export const createNewSchema = (node) => toast(`新建Schema在数据库: ${node.name}`);
export const exportDatabase = (node) => toast(`导出数据库: ${node.name}`);
export const createNewTable = (node) => toast(`新建表在架构: ${node.name}`);
export const exportSchema = (node) => toast(`导出架构: ${node.name}`);
export const previewTable = (node) => toast(`预览表: ${node.name}`);
export const editTableStructure = (node) => toast(`编辑表结构: ${node.name}`);
export const generateTableSQL = (node) => toast(`生成SQL: ${node.name}`);
export const exportTableData = (node) => toast(`导出数据: ${node.name}`);
export const viewDefinition = (node) => toast(`查看定义: ${node.name}`);
export const editView = (node) => toast(`编辑视图: ${node.name}`);
export const generateViewSQL = (node) => toast(`生成视图SQL: ${node.name}`);
export const editFunction = (node) => toast(`编辑函数: ${node.name}`);
export const viewFunctionSource = (node) => toast(`查看源码: ${node.name}`);
export const testFunction = (node) => toast(`测试函数: ${node.name}`);
export const showProperties = (node) => toast(`节点属性:\nID: ${node.id}\n类型: ${node.type}\n名称: ${node.name}\n连接状态: ${node.connected ? '已连接' : '未连接'}`);
export const refreshFolder = (node) => toast(`刷新文件夹: ${node.name}`);