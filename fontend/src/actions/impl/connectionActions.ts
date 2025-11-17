import toast from 'react-hot-toast';
import { useTreeStore } from '@/stores/useTreeStore';
import { loadDatabasesForConnection } from '@/utils/treeUtils';
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
    useTreeStore.getState().refreshTree();  // 统一刷新树
    toast.success('新建连接成功');
  } catch (err) {
    console.error('Error creating connection:', err);
    toast.error('创建连接失败');
    throw err;
  }
};

export const openNewConnection = (parentId: string | null, openModal: Function) => {
  if (typeof openModal !== 'function') return toast.error('模态打开失败');
  openNewConnectionModal(parentId, openModal, handleNewConnectionSubmit);  // 传递 submit 给模态
};

export const updateConnection = async (payload: any) => {
  const { updateTreePath } = useTreeStore.getState();
  return toast.promise(
    (async () => {
      const res = await fetch(`/api/config/connections/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('更新失败');
      const updated = await res.json();
      updateTreePath(payload.id, () => ({
        ...updated,
        connected: false, // 编辑后强制断开，需重新连接
        children: [],
      }));
      return true;
    })(),
    { loading: '保存中...', success: '连接已更新', error: '更新失败' }
  );
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
          const msgText = await r.text();
          let extractedMsg = msgText || '连接失败';
          try {
            const errJson = JSON.parse(msgText);
            if (errJson && typeof errJson.message === 'string') {
              extractedMsg = errJson.message;
            }
          } catch (error) {
            console.warn('Failed to parse error JSON:', error);
          }
          throw new Error(extractedMsg);
        }
      // 连接成功 → 更新状态 + 加载数据库列表
      const dbKids = await loadDatabasesForConnection(node);
      updateTreePath(node.id, (curr: any) => ({
        ...curr,
        connected: true,
        status: 'connected',
        children: dbKids,
        expanded: true,
      }));
      toast.success(`已连接: ${node.name}`);
      return true;
    })(),
    {
      loading: '连接中...',
      success: '连接成功',
      error: (e) => e.message || '连接失败',
    }
  );
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
    expanded: false,
  }));
  toast.success(`已断开: ${node.name}`);
};

export const refreshConnection = async (node: any, setExpandedKeys?: Function) => {
  if (!node.connected) {
    toast.error('请先连接');
    return;
  }
  toast.loading('刷新中...');
  try {
    const dbKids = await loadDatabasesForConnection(node);
    const { updateTreePath } = useTreeStore.getState();
    updateTreePath(node.id, (curr: any) => ({
      ...curr,
      children: dbKids,
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
        if (!res.ok) throw new Error('删除失败');
        useTreeStore.getState().deleteNode(node.id);
        toast.success('连接已删除');
        // 删除后刷新父级树
        useTreeStore.getState().refreshTree();
      } catch (e) {
        console.error('Delete connection error:', e);
        toast.error('删除失败');
      }
    },
    'danger',
    openModal
  );
};

export const openEditConnection = async (connection: any, openModal?: Function) => {
  openRenameFolderModal(connection, openModal);
};