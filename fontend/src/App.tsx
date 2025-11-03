import React, { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import { ModalProvider } from './components/modals/ModalProvider';
import { Toaster } from 'react-hot-toast'; // 通知组件
import { useTreeConfigStore } from './stores/useTreeConfigStore';  // 新增：初始化全局 store
import './css/index.css';

export default function App() {
  // 移除 Zustand Provider：Zustand hooks 直接在组件中使用，无需全局包装
  useEffect(() => {
    // 初始化全局 treeConfigStore（供 utils/dbActions fallback 使用）
    window.treeConfigStore = useTreeConfigStore;
  }, []);

  return (
    <ModalProvider>
      <AppLayout />
      <Toaster position="top-right" />
    </ModalProvider>
  );
}

// =========================================