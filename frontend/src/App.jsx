import React from 'react';
import AppLayout from './components/layout/AppLayout';
import { ModalProvider } from './components/modals/ModalProvider';
import { Toaster } from 'react-hot-toast'; // 通知组件
import './css/index.css';

export default function App() {
  // 移除 Zustand Provider：Zustand hooks 直接在组件中使用，无需全局包装
  return (
    <ModalProvider>
      <AppLayout />
      <Toaster position="top-right" />
    </ModalProvider>
  );
}