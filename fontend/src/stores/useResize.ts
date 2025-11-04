import { useState, useRef, useEffect, useCallback } from 'react';

export const useResize = (initialSidebarWidth = 260, initialEditorHeight = 300) => {
  const [sidebarWidth, setSidebarWidth] = useState(initialSidebarWidth);
  const [editorHeight, setEditorHeight] = useState(initialEditorHeight);
  const isResizingSidebar = useRef(false);
  const isResizingEditor = useRef(false);

  const handleSidebarMouseDown = useCallback((e, sidebarRef) => {
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
    isResizingEditor.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('dragging');
  }, []);

  const handleMouseMoveOptimized = useCallback((e) => {
    if (isResizingSidebar.current && sidebarRef.current) { // 假设 sidebarRef 从组件传入
      const newWidth = Math.min(Math.max(e.clientX, 180), 500);
      sidebarRef.current.style.width = `${newWidth}px`;
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
      setSidebarWidth(newWidth);
    }

    if (isResizingEditor.current) {
      const newHeight = isResizingEditor.current.initialEditorHeight + (e.clientY - isResizingEditor.current.initialMouseY);
      const minHeight = 150;
      const maxHeight = window.innerHeight * 0.8;
      const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
      document.documentElement.style.setProperty('--editor-height', `${clampedHeight}px`);
      setEditorHeight(clampedHeight);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isResizingSidebar.current || isResizingEditor.current) {
      isResizingSidebar.current = false;
      isResizingEditor.current = false;
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
    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [handleMouseMoveOptimized, handleMouseUp]);

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

