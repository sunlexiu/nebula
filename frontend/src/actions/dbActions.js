import toast from 'react-hot-toast';
import { useTreeStore } from '../stores/useTreeStore';
import { useTreeConfigStore } from '../stores/useTreeConfigStore';  // 新增
import { findConnectionId, loadNodeChildren } from '../utils/treeUtils';  // 新增导入

const treeConfigStore = window.treeConfigStore || { getState: () => ({ getConfig: () => ({}), getNextLevelConfig: () => ({}) }) };

// 映射 handler 到函数（现有 + 新增模拟）——**修复：添加 export**
export const actionHandlers = {
  // 现有
  refreshDatabase: (node, setExpandedKeys) => {
    if (!node.connected) return;
    loadNodeChildren(node).then((updated) => {
      useTreeStore.getState().updateTreePath(node.id, () => updated);
      toast.success(`刷新数据库: ${node.name}`);
      setExpandedKeys((prev) => new Map(prev).set(node.id, true));
    });
  },
  createNewSchema: (node) => toast(`新建Schema在数据库: ${node.name}`),
  exportDatabase: (node) => toast(`导出数据库: ${node.name}`),
  refreshSchema: (node, setExpandedKeys) => {
    if (!node.connected) return;
    loadNodeChildren(node).then((updated) => {
      useTreeStore.getState().updateTreePath(node.id, () => updated);
      toast.success(`刷新 Schema: ${node.name}`);
      setExpandedKeys((prev) => new Map(prev).set(node.id, true));
    });
  },
  createNewTable: (node) => toast(`新建表在架构: ${node.name}`),
  createNewView: (node) => toast(`新建视图在架构: ${node.name}`),
  createNewFunction: (node) => toast(`新建函数在架构: ${node.name}`),
  exportSchema: (node) => toast(`导出架构: ${node.name}`),
  previewTable: (node) => toast(`预览表: ${node.name}`),
  editTableStructure: (node) => toast(`编辑表结构: ${node.name}`),
  generateTableSQL: (node) => toast(`生成SQL: ${node.name}`),
  exportTableData: (node) => toast(`导出数据: ${node.name}`),
  viewDefinition: (node) => toast(`查看定义: ${node.name}`),
  editView: (node) => toast(`编辑视图: ${node.name}`),
  generateViewSQL: (node) => toast(`生成视图SQL: ${node.name}`),
  editFunction: (node) => toast(`编辑函数: ${node.name}`),
  viewFunctionSource: (node) => toast(`查看源码: ${node.name}`),
  testFunction: (node) => toast(`测试函数: ${node.name}`),
  showProperties: (node) => toast(`节点属性:\nID: ${node.id}\n类型: ${node.type}\n名称: ${node.name}\n连接状态: ${node.connected ? '已连接' : '未连接'}`),
  deleteDatabase: async (node, openModal) => {
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
  },
  deleteSchema: async (node, openModal) => {
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
  },
  deleteTable: async (node, openModal) => {
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
      `删除表`,
      `确定要删除表 "${node.name}" 吗？此操作不可恢复。`,
      async () => {
        try {
          const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
          const dbName = node.dbName || 'default';
          const schemaName = node.schemaName || 'public';
          const response = await fetch('/api/db/delete-object', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, dbName, schemaName, objectName: node.name, objectType: 'table' })
          });
          if (!response.ok) throw new Error(`Failed to delete table`);
          useTreeStore.getState().deleteNode(node.id);
          toast.success(`表 "${node.name}" 已删除`);
        } catch (error) {
          toast.error('删除失败，请重试');
        }
      },
      'danger'
    );
  },
  deleteView: async (node, openModal) => {
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
      `删除视图`,
      `确定要删除视图 "${node.name}" 吗？此操作不可恢复。`,
      async () => {
        try {
          const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
          const dbName = node.dbName || 'default';
          const schemaName = node.schemaName || 'public';
          const response = await fetch('/api/db/delete-object', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, dbName, schemaName, objectName: node.name, objectType: 'view' })
          });
          if (!response.ok) throw new Error(`Failed to delete view`);
          useTreeStore.getState().deleteNode(node.id);
          toast.success(`视图 "${node.name}" 已删除`);
        } catch (error) {
          toast.error('删除失败，请重试');
        }
      },
      'danger'
    );
  },
  deleteFunction: async (node, openModal) => {
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
      `删除函数`,
      `确定要删除函数 "${node.name}" 吗？此操作不可恢复。`,
      async () => {
        try {
          const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
          const dbName = node.dbName || 'default';
          const schemaName = node.schemaName || 'public';
          const response = await fetch('/api/db/delete-object', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, dbName, schemaName, objectName: node.name, objectType: 'function' })
          });
          if (!response.ok) throw new Error(`Failed to delete function`);
          useTreeStore.getState().deleteNode(node.id);
          toast.success(`函数 "${node.name}" 已删除`);
        } catch (error) {
          toast.error('删除失败，请重试');
        }
      },
      'danger'
    );
  },
  // 新增 PostgreSQL 特定
  refreshMaterializedView: (node) => toast(`刷新物化视图: ${node.name}`),
  viewPublication: (node) => toast(`查看 Publication: ${node.name}`),
  createPublication: (node) => toast(`新建 Publication 在连接: ${node.name}`),
  deletePublication: async (node, openModal) => {
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
      `删除 Publication`,
      `确定要删除 Publication "${node.name}" 吗？此操作不可恢复。`,
      async () => {
        try {
          const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
          const response = await fetch('/api/db/delete-publication', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, pubName: node.name })
          });
          if (!response.ok) throw new Error('Failed to delete publication');
          useTreeStore.getState().deleteNode(node.id);
          toast.success(`Publication "${node.name}" 已删除`);
        } catch (error) {
          toast.error('删除失败，请重试');
        }
      },
      'danger'
    );
  },
  showRoleProperties: (node) => toast(`角色属性: ${node.name}`),
  createRole: (node) => toast(`新建角色: ${node.name}`),
  deleteRole: async (node, openModal) => {
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
      `删除角色`,
      `确定要删除角色 "${node.name}" 吗？此操作不可恢复。`,
      async () => {
        try {
          const connectionId = findConnectionId(node.id, useTreeStore.getState().treeData);
          const response = await fetch('/api/db/delete-role', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, roleName: node.name })
          });
          if (!response.ok) throw new Error('Failed to delete role');
          useTreeStore.getState().deleteNode(node.id);
          toast.success(`角色 "${node.name}" 已删除`);
        } catch (error) {
          toast.error('删除失败，请重试');
        }
      },
      'danger'
    );
  },
  // 通用动态调用（**修复：openModal 可选，如果未提供，使用 API fallback**）
  dynamicHandler: async (handler, node, options = {}) => {
    const { setExpandedKeys, openModal } = options;
    if (actionHandlers[handler]) {
      return actionHandlers[handler](node, openModal, setExpandedKeys);
    } else {
      // 后端 API fallback
      try {
        const response = await fetch(`/api/db/${handler}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeId: node.id }),
        });
        if (!response.ok) throw new Error('Action failed');
        toast.success(`${handler} 执行成功`);
      } catch (error) {
        toast.error(`${handler} 执行失败: ${error.message}`);
      }
    }
  }
};

// getPrimaryAction：从 config.actions.primary 获取
export const getPrimaryAction = (node) => {
  const primary = node.config?.actions?.primary;
  if (primary) {
    return { icon: primary.icon, label: primary.label, handler: primary.handler };
  }
  // Fallback 旧逻辑
  const actions = {
    folder: { icon: '🔌', label: '新建连接' },
    connection: { icon: '⚡', label: '连接' },
    database: { icon: '🔄', label: '刷新' },
    schema: { icon: '🔄', label: '刷新' },
    table: { icon: '📊', label: '预览' },
    view: { icon: '👁️', label: '查看' },
    function: { icon: '⚙️', label: '编辑' },
    // 新增 group 类型
    table_group: { icon: '📊', label: '展开 Tables' },
    view_group: { icon: '👁️', label: '展开 Views' },
    function_group: { icon: '⚙️', label: '展开 Functions' },
    mview_group: { icon: '📊', label: '展开 Materialized Views' },
    publications: { icon: '👁️', label: '查看' },
    roles: { icon: 'ℹ️', label: '属性' }
  };
  return actions[node.type] || null;
};

// getAllActions：动态从 config.actions.menu 生成，支持 fallback
export const getAllActions = (
  nodeType,
  node,
  setExpandedKeys,
  openNewGroup,
  openNewConnection,
  openConfirm,
  openRenameFolder,
  openEditConnection,
  refreshFolder,
  deleteFolder,
  refreshConnection,
  connectDatabase,
  disconnectDatabase,
  refreshDatabase,
  refreshSchema,
  createNewSchema,
  exportDatabase,
  createNewTable,
  exportSchema,
  previewTable,
  editTableStructure,
  generateTableSQL,
  exportTableData,
  viewDefinition,
  editView,
  generateViewSQL,
  editFunction,
  viewFunctionSource,
  testFunction,
  showProperties,
  deleteConnection,
  deleteDatabase,
  deleteSchema,
  deleteTable,
  deleteView,
  deleteFunction
) => {
  const configActions = node.config?.actions?.menu || [];
  const mappedActions = configActions.map((act) => ({
    label: act.label,
    icon: act.icon,
    type: act.type || null,  // separator
    variant: act.variant || null,
    action: () => actionHandlers.dynamicHandler(act.handler, node, { setExpandedKeys, openModal: openConfirm })
  }));

  // Fallback 旧 actions[nodeType]，避免重复
  const oldActionsMap = {
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
    ],
    // 新增 group fallback (简单，继承 primary)
    table_group: [
      { label: '刷新', action: () => refreshSchema(node, setExpandedKeys), icon: '🔄' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    view_group: [
      { label: '刷新', action: () => refreshSchema(node, setExpandedKeys), icon: '🔄' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    function_group: [
      { label: '刷新', action: () => refreshSchema(node, setExpandedKeys), icon: '🔄' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    mview_group: [
      { label: '刷新', action: () => refreshSchema(node, setExpandedKeys), icon: '🔄' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    publications: [
      { label: '新建 Publication', action: () => actionHandlers.createPublication(node), icon: '➕' },
      { type: 'separator' },
      { label: '删除', action: () => actionHandlers.deletePublication(node, openConfirm), icon: '🗑️' },
      { label: '属性', action: () => showProperties(node), icon: 'ℹ️' }
    ],
    roles: [
      { label: '新建角色', action: () => actionHandlers.createRole(node), icon: '➕' },
      { type: 'separator' },
      { label: '删除角色', action: () => actionHandlers.deleteRole(node, openConfirm), icon: '🗑️' },
      { label: '属性', action: () => actionHandlers.showRoleProperties(node), icon: 'ℹ️' }
    ]
  };
  const fallback = oldActionsMap[nodeType] || [{ label: '属性', action: () => showProperties(node), icon: 'ℹ️' }];

  // 合并，避免重复 label
  const seenLabels = new Set(mappedActions.map(a => a.label));
  const uniqueFallback = fallback.filter(a => !seenLabels.has(a.label));

  return [...mappedActions, ...uniqueFallback];
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
  const { updateTreePath, loadTreeConfig } = useTreeStore.getState();
  if (node.connected) {
    toast(`已连接: ${node.name}`);
    return Promise.resolve(false);
  }
  return (async () => {
    const r = await fetch(`/api/config/connections/${encodeURIComponent(node.id)}/test`, { method: 'GET' });
    if (!r.ok) {
      const msg = await r.text();
      toast.error(msg || '连接失败');
      return false;
    }
    updateTreePath(node.id, (cur) => ({ ...cur, connected: true, status: 'connected' }));
    await loadTreeConfig(node.id);  // 新增：加载 YAML 配置
    toast.success(`已连接: ${node.name}`);
    return true;
  })();
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
    children: [],
    config: {}  // 清空配置
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
  actionHandlers.refreshDatabase(node, setExpandedKeys);
};

// 刷新 Schema
export const refreshSchema = (node, setExpandedKeys) => {
  actionHandlers.refreshSchema(node, setExpandedKeys);
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
  actionHandlers.deleteDatabase(node, openModal);
};

// 删除 Schema
export const deleteSchema = async (node, openModal) => {
  actionHandlers.deleteSchema(node, openModal);
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
export const createNewSchema = (node) => actionHandlers.createNewSchema(node);
export const exportDatabase = (node) => actionHandlers.exportDatabase(node);
export const createNewTable = (node) => actionHandlers.createNewTable(node);
export const exportSchema = (node) => actionHandlers.exportSchema(node);
export const previewTable = (node) => actionHandlers.previewTable(node);
export const editTableStructure = (node) => actionHandlers.editTableStructure(node);
export const generateTableSQL = (node) => actionHandlers.generateTableSQL(node);
export const exportTableData = (node) => actionHandlers.exportTableData(node);
export const viewDefinition = (node) => actionHandlers.viewDefinition(node);
export const editView = (node) => actionHandlers.editView(node);
export const generateViewSQL = (node) => actionHandlers.generateViewSQL(node);
export const editFunction = (node) => actionHandlers.editFunction(node);
export const viewFunctionSource = (node) => actionHandlers.viewFunctionSource(node);
export const testFunction = (node) => actionHandlers.testFunction(node);
export const showProperties = (node) => actionHandlers.showProperties(node);
export const refreshFolder = (node) => toast(`刷新文件夹: ${node.name}`);