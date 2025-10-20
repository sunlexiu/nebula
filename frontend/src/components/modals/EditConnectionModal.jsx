import React, { useState, useEffect } from "react";
import "../../css/NewConnectionModal.css"; // 复用现有样式
import toast from 'react-hot-toast';

const EditConnectionModal = ({ isOpen, onClose, connection, onSubmit }) => {
  const [connectionData, setConnectionData] = useState({
    name: "",
    dbType: "POSTGRESQL",
    host: "localhost",
    port: "5432",
    database: "postgres",
    username: "",
    password: "",
    savePassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    if (isOpen && connection) {
      setConnectionData({
        name: connection.name || "",
        dbType: connection.dbType || "POSTGRESQL",
        host: connection.host || "localhost",
        port: connection.port?.toString() || "5432",
        database: connection.database || "postgres",
        username: connection.username || "",
        password: connection.password || "", // 注意：密码可能需要从后端安全获取，或提示重新输入
        savePassword: connection.savePassword || false,
      });
      setConnectionStatus(null);
    }
  }, [isOpen, connection]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConnectionData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTestConnection = async () => {
    // 实际测试连接逻辑：调用后端测试接口
    setConnectionStatus("Testing...");
    try {
      const testPayload = {
        dbType: connectionData.dbType,
        host: connectionData.host,
        port: parseInt(connectionData.port),
        database: connectionData.database,
        username: connectionData.username,
        password: connectionData.password,
        type: "connection",
      };
      const response = await fetch('/api/config/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });
      const result = await response.json();
      if (!response.ok) {
        setConnectionStatus("Connection failed: " + result.message);
        toast.error('连接测试失败');
        return;
      }
      setConnectionStatus("Connected successfully!");
      toast.success('连接测试成功');
    } catch (error) {
      setConnectionStatus("Connection failed: " + error.message);
      toast.error('连接测试失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (connectionData.name && connectionData.host && connectionData.port && connectionData.username) {
      try {
        // 构建完整 payload，包括 id 用于更新
        const payload = {
          id: connection.id,
          ...connectionData,
          port: parseInt(connectionData.port),
          type: 'connection',
        };
        await onSubmit(payload);
        if (connectionData.savePassword) {
          // 安全存储密码（建议加密）
          localStorage.setItem(`savedPassword_${connection.id}`, connectionData.password);
        }
        toast.success('编辑连接成功');
        onClose();
      } catch (error) {
        console.error('Error updating connection:', error);
        toast.error('编辑连接失败');
      }
    }
  };

  const handleCancel = () => {
    setConnectionData({
      name: "",
      dbType: "POSTGRESQL",
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
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">编辑连接</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="name">连接名称</label>
              <input
                type="text"
                id="name"
                name="name"
                value={connectionData.name}
                onChange={handleChange}
                placeholder="e.g., 开发环境-deego"
                className="modal-input"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="dbType">数据库类型</label>
              <select
                id="dbType"
                name="dbType"
                value={connectionData.dbType}
                onChange={handleChange}
                className="modal-input"
              >
                <option value="POSTGRESQL">PostgreSQL</option>
                <option value="MYSQL">MySQL</option>
                <option value="SQLSERVER">SQL Server</option>
                <option value="ORACLE">Oracle</option>
              </select>
            </div>
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
            <button type="submit" className="btn btn-primary" disabled={
              !connectionData.name || !connectionData.host || !connectionData.port || !connectionData.username
            }>
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditConnectionModal;