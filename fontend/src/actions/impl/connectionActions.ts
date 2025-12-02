import toast from 'react-hot-toast';
import { useTreeStore } from '@/stores/useTreeStore';
import { loadNodeChildren } from '@/utils/treeUtils';
import { openConfirm, openEditConnection as openRenameFolderModal } from '@/components/modals/modalActions';

export const handleNewConnectionSubmit = async (connectionData: any, parentId: string | null) => {
  try {
    const response = await fetch('/api/config/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...connectionData, type: 'connection', parentId }),
    });
    if (!response.ok) throw new Error('Failed to create connection');
    await response.json();
    useTreeStore.getState().refreshTree();
    toast.success('连接已创建');
  } catch (e) {
    console.error('Create connection error:', e);
    toast.error('创建连接失败');
  }
};

export const updateConnection = async (connectionData: any) => {
  try {
    const response = await fetch(`/api/config/connections/${connectionData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionData),
    });
    if (!response.ok) throw new Error('Failed to update connection');
    await response.json();
    useTreeStore.getState().refreshTree();
    toast.success('连接已更新');
  } catch (e) {
    console.error('Update connection error:', e);
    toast.error('更新连接失败');
  }
};

// 连接展开（内置）
export const connectAndExpand = async (node: any, _openModal?: Function, setExpandedKeys?: Function) => {
    if (node.connected) {
        setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
        return;
    }
    const ok = await connectDatabase(node);
    if (ok) {
        // 连接成功后，不在这里加载 children，交给 loadNodeChildren/后端逻辑
        // 这里只负责把节点标记为展开，以便前端去触发下一步加载
        setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
    }
};

export const connectDatabase = async (node: any) => {
  const { updateTreePath } = useTreeStore.getState();
  if (node.connected) {
    toast(`已连接: ${node.name}`);
    return true;
  }

  return toast.promise(
    (async () => {
      const r = await fetch(`/api/config/connections/${encodeURIComponent(node.id)}/test`, { method: 'GET' });
      if (!r.ok) {
        try {
          const errJson = await r.json();
          throw new Error(errJson?.message || '连接失败');
        } catch (error) {
          if (error instanceof SyntaxError) {
            console.warn('Failed to parse error JSON:', error);
            throw new Error('连接失败');
          }
          throw error;
        }
      }
      // 连接成功 → 使用通用 loadNodeChildren，按 YAML/virtual 规则生成下一层
      const updated = await loadNodeChildren({ ...node, connected: true });
      updateTreePath(node.id, () => ({
        ...updated,
        connected: true,
        status: 'connected',
        expanded: true,
      }));
      toast.success(`已连接: ${node.name}`);
      return true;
    })(),
    {
      loading: '连接中...',
      error: (e) => e.message || '连接失败',
    }
  );
};

export const disconnectDatabase = async (node: any) => {
  const { updateTreePath } = useTreeStore.getState();

  if (!node.connected) {
    toast(`未连接: ${node.name}`);
    return;
  }

  return toast.promise(
      (async () => {
        const res = await fetch(
            `/api/config/connections/${encodeURIComponent(node.id)}/disconnect`,
            { method: 'POST' }
        );

        if (!res.ok) {
          // 尝试从后端读取错误信息
          try {
            const errJson = await res.json();
            throw new Error(errJson?.message || '断开连接失败');
          } catch (error) {
            if (error instanceof SyntaxError) {
              console.warn('Failed to parse error JSON:', error);
              throw new Error('断开连接失败');
            }
            throw error;
          }
        }

        // 后端已关闭连接池，这里同步更新前端树节点状态
        updateTreePath(node.id, (curr: any) => ({
          ...curr,
          connected: false,
          status: 'disconnected',
          children: [],
          expanded: false,
        }));

        return `已断开: ${node.name}`;
      })(),
      {
        loading: '断开中...',
        success: (msg) => msg,
        error: (e) => e.message || '断开连接失败',
      }
  );
};

export const refreshConnection = async (node: any, setExpandedKeys?: Function) => {
  if (!node.connected) {
    toast.error('请先连接');
    return;
  }
  toast.loading('刷新中...');
  try {
    const updated = await loadNodeChildren(node);
    const { updateTreePath } = useTreeStore.getState();
    updateTreePath(node.id, () => ({
      ...updated,
      expanded: true,
    }));
    toast.success(`刷新成功: ${node.name}`);
    setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
  } catch (e) {
    console.error('refreshConnection error:', e);
    toast.error('刷新失败');
  }
};

export const deleteConnection = async (node: any, openModal?: Function) => {
  openConfirm(
    '删除连接',
    `确定删除连接 "${node.name}" 吗？`,
    async () => {
      try {
        const res = await fetch(`/api/config/connections/${node.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete connection');
        useTreeStore.getState().refreshTree();
        toast.success('连接已删除');
      } catch (e) {
        console.error('Delete connection error:', e);
        toast.error('删除失败');
      }
    },
    'danger',
    openModal
  );
};

export const openEditConnection = async (connection: any, openModal: Function) => {
  openRenameFolderModal(connection, openModal);
};
