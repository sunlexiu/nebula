import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { handleNewGroupSubmit } from '../../actions/treeActions'; // 移到 actions

const NewGroupModal = ({ isOpen, onClose, parentId, onSubmit = handleNewGroupSubmit }) => {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setGroupName("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError("文件夹名称不能为空");
      return;
    }
    try {
      await onSubmit(groupName, parentId);
      toast.success('新建分组成功');
      onClose();
    } catch (err) {
      setError("创建分组失败，请重试。");
      toast.error('创建失败');
    }
  };

  const handleCancel = () => {
    setGroupName("");
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
            <button type="button" className="btn btn-cancel" onClick={handleCancel}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={!groupName.trim()}>确认</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGroupModal;

