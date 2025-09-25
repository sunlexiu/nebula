// src/components/NewConnectionModal.jsx
import React, { useState } from "react";
import "../../css/NewConnectionModal.css";

const NewConnectionModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    connectionName: "",
    host: "",
    port: "",
    username: "",
    password: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.connectionName.trim() && formData.host.trim()) {
      onSubmit(formData);
      setFormData({
        connectionName: "",
        host: "",
        port: "",
        username: "",
        password: "",
      });
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData({
      connectionName: "",
      host: "",
      port: "",
      username: "",
      password: "",
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">新建连接</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="connectionName">连接名称</label>
            <input
              type="text"
              id="connectionName"
              name="connectionName"
              value={formData.connectionName}
              onChange={handleChange}
              placeholder="输入连接名称"
              className="modal-input"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="host">主机</label>
            <input
              type="text"
              id="host"
              name="host"
              value={formData.host}
              onChange={handleChange}
              placeholder="输入主机地址"
              className="modal-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="port">端口</label>
            <input
              type="text"
              id="port"
              name="port"
              value={formData.port}
              onChange={handleChange}
              placeholder="输入端口号"
              className="modal-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="输入用户名"
              className="modal-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="输入密码"
              className="modal-input"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={handleCancel}>
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!formData.connectionName.trim() || !formData.host.trim()}
            >
              确认
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConnectionModal;