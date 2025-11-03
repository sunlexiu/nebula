import { useState, useRef, useEffect, useCallback } from 'react';

export const useResize = (initialSidebarWidth = 260, initialEditorHeight = 300, sidebarRef) => { // 修复：接收 sidebarRef 参数
  const [sidebarWidth, setSidebarWidth] = useState(initialSidebarWidth);
  const [editorHeight, setEditorHeight] = useState(initialEditorHeight);
  const isResizingSidebar = useRef(false);
  const isResizingEditor = useRef({ active: false }); // 修复：用对象管理状态，避免布尔混淆

  const handleSidebarMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingSidebar.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('dragging');
  }, []);

  const handleEditorMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const initialMouseY = e.clientY;
    const initialEditorHeightState = editorHeight;
    isResizingEditor.current = { active: true, initialMouseY, initialEditorHeight: initialEditorHeightState };
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('dragging');
  }, [editorHeight]);

  const handleMouseMoveOptimized = useCallback((e) => {
    if (isResizingSidebar.current && sidebarRef?.current) { // 修复：安全检查 sidebarRef
      const newWidth = Math.min(Math.max(e.clientX, 180), 500);
      sidebarRef.current.style.width = `${newWidth}px`;
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
      setSidebarWidth(newWidth);
    }

    if (isResizingEditor.current.active) { // 修复：用对象.active 检查
      const resizeState = isResizingEditor.current;
      const currentMouseY = e.clientY;
      const newHeight = resizeState.initialEditorHeight + (currentMouseY - resizeState.initialMouseY);

      const minHeight = 150;
      const maxHeight = window.innerHeight * 0.8;
      const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);

      if (document.documentElement) { // 安全设置 CSS 变量
        document.documentElement.style.setProperty('--editor-height', `${clampedHeight}px`);
      }
      setEditorHeight(clampedHeight);
    }
  }, [sidebarRef]); // 依赖：添加 sidebarRef

  const handleMouseUp = useCallback(() => {
    if (isResizingSidebar.current || isResizingEditor.current.active) {
      isResizingSidebar.current = false;
      isResizingEditor.current = { active: false };
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.classList.remove('dragging');
    }
  }, []);

  useEffect(() => {
    let rafId;
    const handleGlobalMouseMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => handleMouseMoveOptimized(e));
    };
    const handleGlobalMouseUp = handleMouseUp;

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [handleMouseMoveOptimized, handleMouseUp]); // 修复：依赖正确

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    document.documentElement.style.setProperty('--editor-height', `${editorHeight}px`);
  }, [sidebarWidth, editorHeight]);

  return {
    sidebarWidth,
    editorHeight,
    handleSidebarMouseDown,
    handleEditorMouseDown,
  };
};

// =========================================