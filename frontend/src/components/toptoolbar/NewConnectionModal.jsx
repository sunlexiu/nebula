import React, { useState } from "react";
import "../../css/NewConnectionModal.css";

const NewConnectionModal = ({ isOpen, onClose, onSubmit }) => {
  const [connectionData, setConnectionData] = useState({
    host: "localhost",
    port: "5432",
    database: "postgres",
    username: "",
    password: "",
    savePassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConnectionData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTestConnection = async () => {
    // 模拟测试连接逻辑（实际应替换为数据库连接代码）
    setConnectionStatus("Testing...");
    try {
      // 示例：假设使用 fetch 或数据库客户端测试连接
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟延迟
      setConnectionStatus("Connected successfully!");
    } catch (error) {
      setConnectionStatus("Connection failed: " + error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (connectionData.host && connectionData.username) {
      onSubmit(connectionData);
      if (connectionData.savePassword) {
        // 安全存储密码（建议加密）
        localStorage.setItem("savedPassword", connectionData.password);
      }
      onClose();
    }
  };

  const handleCancel = () => {
    setConnectionData({
      host: "localhost",
      port: "5432",
      database: "postgres",
      username: "",
      password: "",
      savePassword: false,
    });
    setConnectionStatus(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">新建连接</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="host">主机</label>
              <input
                type="text"
                id="host"
                name="host"
                value={connectionData.host}
                onChange={handleChange}
                placeholder="e.g., localhost"
                className="modal-input"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="port">端口</label>
              <input
                type="number"
                id="port"
                name="port"
                value={connectionData.port}
                onChange={handleChange}
                placeholder="e.g., 5432"
                className="modal-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="database">数据库</label>
              <input
                type="text"
                id="database"
                name="database"
                value={connectionData.database}
                onChange={handleChange}
                placeholder="e.g., postgres"
                className="modal-input"
              />
            </div>
          </div>
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                type="text"
                id="username"
                name="username"
                value={connectionData.username}
                onChange={handleChange}
                placeholder="输入用户名"
                className="modal-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">密码</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={connectionData.password}
                  onChange={handleChange}
                  placeholder="输入密码"
                  className="modal-input"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "隐藏" : "显示"}
                </button>
              </div>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="savePassword"
                  checked={connectionData.savePassword}
                  onChange={handleChange}
                />
                记住密码
              </label>
            </div>
          </div>
          {connectionStatus && (
            <div className={`status-message ${connectionStatus.includes("success") ? "success" : "error"}`}>
              {connectionStatus}
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleTestConnection}>
              测试连接
            </button>
            <button type="button" className="btn btn-cancel" onClick={handleCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={!connectionData.username}>
              确认
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConnectionModal;