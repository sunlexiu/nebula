import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { handleNewConnectionSubmit } from '../../actions/treeActions'; // 移到 actions

const NewConnectionModal = ({ isOpen, onClose, parentId, onSubmit = handleNewConnectionSubmit }) => {
  const [connectionData, setConnectionData] = useState({
    name: "", dbType: "POSTGRESQL", host: "localhost", port: "5432",
    database: "postgres", username: "", password: "", savePassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    if (isOpen) setConnectionStatus(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConnectionData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleTestConnection = async () => {
    setConnectionStatus("Testing...");
    try {
      const response = await fetch('/api/config/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...connectionData, port: parseInt(connectionData.port), type: "connection" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
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
        await onSubmit({ ...connectionData, port: parseInt(connectionData.port), parentId }, parentId);
        if (connectionData.savePassword) localStorage.setItem("savedPassword", connectionData.password);
        toast.success('新建连接成功');
        onClose();
      } catch (error) {
        toast.error('新建连接失败');
      }
    }
  };

  const handleCancel = () => {
    setConnectionData({ name: "", dbType: "POSTGRESQL", host: "localhost", port: "5432", database: "postgres", username: "", password: "", savePassword: false });
    setConnectionStatus(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">新建连接</h2>
        <form onSubmit={handleSubmit}>
          {/* 表单字段保持原样，省略以节省空间 */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="name">连接名称</label>
              <input type="text" id="name" name="name" value={connectionData.name} onChange={handleChange} placeholder="e.g., 开发环境-deego" className="modal-input" autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="dbType">数据库类型</label>
              <select id="dbType" name="dbType" value={connectionData.dbType} onChange={handleChange} className="modal-input">
                <option value="POSTGRESQL">PostgreSQL</option>
                <option value="MYSQL">MySQL</option>
                <option value="SQLSERVER">SQL Server</option>
                <option value="ORACLE">Oracle</option>
              </select>
            </div>
            {/* 其他字段类似：host, port, database */}
          </div>
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input type="text" id="username" name="username" value={connectionData.username} onChange={handleChange} placeholder="输入用户名" className="modal-input" />
            </div>
            <div className="form-group">
              <label htmlFor="password">密码</label>
              <div className="password-wrapper">
                <input type={showPassword ? "text" : "password"} id="password" name="password" value={connectionData.password} onChange={handleChange} placeholder="输入密码" className="modal-input" />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "隐藏" : "显示"}</button>
              </div>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="savePassword" checked={connectionData.savePassword} onChange={handleChange} />
                记住密码
              </label>
            </div>
          </div>
          {connectionStatus && <div className={`status-message ${connectionStatus.includes("success") ? "success" : "error"}`}>{connectionStatus}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleTestConnection}>测试连接</button>
            <button type="button" className="btn btn-cancel" onClick={handleCancel}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={!connectionData.name || !connectionData.host || !connectionData.port || !connectionData.username}>确认</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConnectionModal;