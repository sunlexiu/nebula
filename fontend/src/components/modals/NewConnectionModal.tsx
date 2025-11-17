import React, { useState, useEffect, useMemo } from "react";
import "../../css/NewConnectionModal.css"; // 保留你现有样式
import toast from "react-hot-toast";
import { handleNewConnectionSubmit } from '../../actions/impl/connectionActions';

// 小工具：根据 dbType 给出默认端口
const defaultPort = (dbType) => ({
  POSTGRESQL: "5432",
  MYSQL: "3306",
  SQLSERVER: "1433",
  ORACLE: "1521",
}[dbType] || "");

const rowStyle = { display: "flex", gap: 12, flexWrap: "wrap" };
const colStyle = { flex: "1 1 240px", minWidth: 240 };

const statusBox = (ok) => ({
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 8,
  fontSize: 13,
  lineHeight: 1.5,
  border: `1px solid ${ok ? "#16a34a30" : "#ef444430"}`,
  background: ok ? "#16a34a15" : "#ef44441a",
  color: ok ? "#065f46" : "#7f1d1d",
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
});

const footerStyle = {
  position: "sticky",
  bottom: 0,
  background: "#fff",
  paddingTop: 12,
  marginTop: 12,
  borderTop: "1px solid #eee",
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
};

const NewConnectionModal = ({
  isOpen,
  onClose,
  parentId,
  onSubmit = handleNewConnectionSubmit,
}) => {
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
  const [connectionStatus, setConnectionStatus] = useState(null); // { ok:boolean, msg:string }
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setConnectionStatus(null);
  }, [isOpen]);

  // 切换数据库类型时，智能填充端口（仅当当前端口是其他默认值或为空时）
  useEffect(() => {
    setConnectionData((prev) => {
      const nextDefault = defaultPort(prev.dbType);
      const knownDefaults = ["5432", "3306", "1433", "1521", ""];
      if (knownDefaults.includes(prev.port)) {
        return { ...prev, port: nextDefault };
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionData.dbType]);

  const requiredOk = useMemo(() => {
    const { name, host, port, username } = connectionData;
    return !!name && !!host && !!port && !!username;
  }, [connectionData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConnectionData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const normalizeHost = (host) => (host === "localhost" ? "127.0.0.1" : host);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus({ ok: null, msg: "Testing..." });
    try {
      const response = await fetch("/api/config/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...connectionData,
          host: normalizeHost(connectionData.host),
          port: parseInt(connectionData.port, 10),
          type: "connection",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          result?.message ||
          "Connection failed. Please check host/port and DB service.";
        setConnectionStatus({ ok: false, msg });
        return;
      }
      setConnectionStatus({ ok: true, msg: "Connected successfully!" });
      toast.success("连接测试成功");
    } catch (error) {
      setConnectionStatus({
        ok: false,
        msg:
          error?.message ||
          "Connection failed. Check that the service is listening.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requiredOk) return;
    setIsSaving(true);
    try {
      const payload = {
        ...connectionData,
        host: normalizeHost(connectionData.host),
        port: parseInt(connectionData.port, 10),
        type: "connection",
        parentId,
      };
      await onSubmit(payload, parentId);
      if (connectionData.savePassword) {
        // 仅示例，真实项目建议安全存储
        localStorage.setItem("savedPassword", connectionData.password);
      }
      toast.success("新建连接成功");
      onClose();
    } catch (error) {
      toast.error("新建连接失败");
    } finally {
      setIsSaving(false);
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
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680, width: "92%", maxHeight: "82vh", overflow: "auto" }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "#fff",
            paddingBottom: 10,
            marginBottom: 8,
            zIndex: 1,
          }}
        >
          <h2 className="modal-title" style={{ marginBottom: 0 }}>
            新建连接
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section" style={{ paddingBottom: 0 }}>
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

            <div style={rowStyle}>
              <div className="form-group" style={colStyle}>
                <label htmlFor="host">主机</label>
                <input
                  type="text"
                  id="host"
                  name="host"
                  value={connectionData.host}
                  onChange={handleChange}
                  placeholder="localhost / 127.0.0.1 / 192.168.x.x"
                  className="modal-input"
                />
              </div>
              <div className="form-group" style={{ ...colStyle, maxWidth: 200 }}>
                <label htmlFor="port">端口</label>
                <input
                  type="number"
                  id="port"
                  name="port"
                  value={connectionData.port}
                  onChange={handleChange}
                  placeholder={defaultPort(connectionData.dbType)}
                  className="modal-input"
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="database">数据库</label>
              <input
                type="text"
                id="database"
                name="database"
                value={connectionData.database}
                onChange={handleChange}
                placeholder="postgres / db_name"
                className="modal-input"
              />
            </div>

            <div style={rowStyle}>
              <div className="form-group" style={colStyle}>
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

              <div className="form-group" style={colStyle}>
                <label htmlFor="password">密码</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={connectionData.password}
                    onChange={handleChange}
                    placeholder="可留空"
                    className="modal-input"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "隐藏" : "显示"}
                  </button>
                </div>
              </div>
            </div>

            {connectionStatus && (
              <div style={statusBox(!!connectionStatus.ok)}>
                <span style={{ fontWeight: 700 }}>
                  {connectionStatus.ok === true ? "✓" : connectionStatus.ok === false ? "!" : "…" }
                </span>
                <span>{connectionStatus.msg}</span>
              </div>
            )}
          </div>

          <div style={footerStyle}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={isSaving || isTesting}
            >
              {isTesting ? "测试中…" : "测试连接"}
            </button>
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={isSaving}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!requiredOk || isSaving || isTesting}
            >
              {isSaving ? "保存中…" : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConnectionModal;

