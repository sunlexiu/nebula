import { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import { ModalProvider } from './components/modals/ModalProvider';
import { Toaster } from 'react-hot-toast';
import { useTreeStore } from './stores/useTreeStore';
import './css/index.css';

export default function App() {
  const { refreshTree } = useTreeStore.getState(); // ← 取函数

  useEffect(() => {
    // 挂载即拉取初始数据
    refreshTree();
  }, []);

  return (
    <ModalProvider>
      <AppLayout />
      <Toaster position="top-center" />
    </ModalProvider>
  );
}