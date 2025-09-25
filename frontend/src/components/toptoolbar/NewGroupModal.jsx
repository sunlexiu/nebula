// src/components/NewGroupModal.jsx
import React, { useState } from "react";
import "../../css/NewGroupModal.css";

const NewGroupModal = ({ isOpen, onClose, onSubmit }) => {
  const [groupName, setGroupName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (groupName.trim()) {
      onSubmit(groupName);
      setGroupName("");
      onClose();
    }
  };

  const handleCancel = () => {
    setGroupName("");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">新建分组</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="groupName">分组名称</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="输入分组名称"
              className="modal-input"
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={handleCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={!groupName.trim()}>
              确认
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGroupModal;