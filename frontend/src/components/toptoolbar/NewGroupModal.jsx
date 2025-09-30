// NewGroupModal.jsx
import React, { useState } from "react";
import "../../css/NewGroupModal.css";

const NewGroupModal = ({ isOpen, onClose, onSubmit, refreshTree }) => {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
     const response = await fetch(
       `/api/config/folders`, // 这里直接使用 /api
       {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ name: groupName , type: 'folder' }),
       }
     );

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      const data = await response.json();
      onSubmit(groupName, data);
      setGroupName("");
      onClose();
      // 成功后自动刷新树
      if (refreshTree) {
        refreshTree();
      }
    } catch (err) {
      console.error("Error creating group:", err);
      setError("创建分组失败，请重试。");
    }
  };

  const handleCancel = () => {
    setGroupName("");
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">新建分组</h2>
        {error && <div className="error-message">{error}</div>}
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

export default NewGroupModal;