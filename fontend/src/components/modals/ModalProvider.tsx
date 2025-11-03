import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import ConfirmModal from './ConfirmModal';
import NewGroupModal from './NewGroupModal';
import NewConnectionModal from './NewConnectionModal';
import RenameFolderModal from './RenameFolderModal';
import EditConnectionModal from './EditConnectionModal';
import toast from 'react-hot-toast';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({});

  const openModal = (type, config = {}) => {
    setModals((prev) => ({ ...prev, [type]: { isOpen: true, ...config } }));
  };

  const closeModal = (type) => {
    setModals((prev) => ({ ...prev, [type]: { ...prev[type], isOpen: false } }));
    // 延迟关闭以动画
    setTimeout(() => setModals((prev) => { const newModals = { ...prev }; delete newModals[type]; return newModals; }), 300);
  };

  const value = { openModal, closeModal };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {createPortal(
        <>
          {modals.confirm && <ConfirmModal {...modals.confirm} onClose={() => closeModal('confirm')} />}
          {modals.newGroup && <NewGroupModal {...modals.newGroup} onClose={() => closeModal('newGroup')} />}
          {modals.newConnection && <NewConnectionModal {...modals.newConnection} onClose={() => closeModal('newConnection')} />}
          {modals.renameFolder && <RenameFolderModal {...modals.renameFolder} onClose={() => closeModal('renameFolder')} />}
          {modals.editConnection && <EditConnectionModal {...modals.editConnection} onClose={() => closeModal('editConnection')} />}
        </>,
        document.body
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);

// =========================================