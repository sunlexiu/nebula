import toast from 'react-hot-toast';
import { useTreeStore } from '../stores/useTreeStore';

export const updateConnection = async (payload: any) => {
  const { updateTreePath } = useTreeStore.getState();
  return toast.promise(
    (async () => {
      const res = await fetch(`/api/config/connections/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update connection');
      updateTreePath(payload.id, (curr: any) => ({
        ...curr,
        name: payload.name,
        dbType: payload.dbType,
        host: payload.host,
        port: payload.port,
        database: payload.database,
        username: payload.username,
      }));
      return true;
    })(),
    { loading: '保存连接中...', success: `连接 "${payload.name}" 已更新`, error: '更新失败，请重试' }
  );
};

export const connectDatabase = async (node: any) => {
  const { updateTreePath } = useTreeStore.getState();
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
    updateTreePath(node.id, (curr: any) => ({ ...curr, connected: true, status: 'connected' }));
    toast.success(`已连接: ${node.name}`);
    return true;
  })();
};

export const disconnectDatabase = (node: any) => {
  const { updateTreePath } = useTreeStore.getState();
  if (!node.connected) {
    toast(`未连接: ${node.name}`);
    return;
  }
  updateTreePath(node.id, (curr: any) => ({
    ...curr,
    connected: false,
    status: 'disconnected',
    children: [],
    config: {},
  }));
  toast.success(`断开连接: ${node.name}`);
};

export const refreshConnection = (node: any, setExpandedKeys?: Function) => {
  if (!node.connected) {
    toast.error('请先连接');
    return;
  }
  setTimeout(() => {
    toast.success(`刷新成功: ${node.name}`);
    setExpandedKeys?.((prev: Map<string, boolean>) => new Map(prev).set(node.id, true));
  }, 300);
};

export const deleteConnection = async (node: any, openModal?: Function) => {
  if (typeof openModal !== 'function') {
    toast.error('模态打开失败');
    return;
  }
  openModal('confirm', {
    title: `删除连接`,
    message: `确定要删除连接 "${node.name}" 吗？此操作不可恢复。`,
    variant: 'danger',
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/config/connections/${node.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete connection');
        useTreeStore.getState().deleteNode(node.id);
        toast.success(`连接 "${node.name}" 已删除`);
      } catch (e: any) {
        toast.error('删除失败，请重试');
      }
    },
  });
};