import { useState, useEffect } from 'react';
import { moveNode } from '../../../actions/treeActions';

export const useDragDrop = () => {
  const [dragSourceId, setDragSourceId] = useState(null);
  const [dragOverNodeId, setDragOverNodeId] = useState(null);
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);

  useEffect(() => {
    const handleDragEnd = () => {
      setTimeout(() => {
        setDragSourceId(null);
        setDragOverNodeId(null);
        setIsDragOverRoot(false);
      }, 100);
    };
    document.addEventListener('dragend', handleDragEnd);
    return () => document.removeEventListener('dragend', handleDragEnd);
  }, []);

  return {
    dragSourceId, setDragSourceId, dragOverNodeId, setDragOverNodeId, isDragOverRoot, setIsDragOverRoot
  };
};

// =========================================