// RenameFolderModal.jsx
import React, { useState, useEffect } from "react";
import "../../css/NewGroupModal.css";

const RenameFolderModal = ({ isOpen, onClose, onSubmit, parentId, defaultName }) => {
  const [groupName, setGroupName] = useState(defaultName || "");
  const [error, setError] = useState(null);

  useEffect(() => {
    setGroupName(defaultName || "");
    setError(null);
  }, [defaultName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError("文件夹名称不能为空");
      return;
    }

    try {
      onSubmit(groupName, parentId);
      setGroupName(defaultName || "");
      onClose();
    } catch (err) {
      console.error("Error renaming folder:", err);
      setError("重命名文件夹失败，请重试。");
    }
  };

  const handleCancel = () => {
    setGroupName(defaultName || "");
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">重命名文件夹</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="groupName">文件夹名称</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="输入文件夹名称"
              className="modal-input"
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!groupName.trim()}
            >
              确认
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameFolderModal;