// src/components/modals/NewDatabaseModal.tsx

import React, { useState } from 'react';
import '../../css/NewConnectionModal.css'; // 复用已有样式

interface NewDatabaseModalProps {
    isOpen?: boolean;
    onClose: () => void;

    // 从 openModal 里传进来
    connectionId: string;
    dbType?: string;

    defaultValues?: {
        name?: string;
        owner?: string;
        encoding?: string;
        template?: string;
        collation?: string;
        ctype?: string;
        tablespace?: string;
        allowConnections?: boolean;
        connectionLimit?: number;
        comment?: string;
    };

    // databaseActions.createNewDatabase 注入
    onSubmit?: (values: any) => Promise<void>;
}

const tabBtnStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    marginRight: 8,
};

const tabContainerStyle: React.CSSProperties = {
    display: 'flex',
    marginBottom: 12,
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
};

const colStyle: React.CSSProperties = {
    flex: 1,
};

const NewDatabaseModal: React.FC<NewDatabaseModalProps> = ({
                                                               isOpen = false,
                                                               onClose,
                                                               connectionId,
                                                               dbType,
                                                               defaultValues,
                                                               onSubmit,
                                                           }) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: defaultValues?.name || '',
        owner: defaultValues?.owner || '',
        encoding: defaultValues?.encoding || '',
        template: defaultValues?.template || '',
        collation: defaultValues?.collation || '',
        ctype: defaultValues?.ctype || '',
        tablespace: defaultValues?.tablespace || '',
        allowConnections: defaultValues?.allowConnections ?? true,
        connectionLimit: defaultValues?.connectionLimit ?? -1,
        comment: defaultValues?.comment || '',
    });

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type, checked } = e.target as any;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError('数据库名称不能为空');
            return;
        }
        setError(null);
        try {
            setSaving(true);
            if (onSubmit) {
                await onSubmit({
                    ...form,
                    name: form.name.trim(),
                    connectionId,
                    dbType,
                });
            }
            onClose();
        } catch (err: any) {
            // onSubmit 里已经 toast，这里只保留文本提示
            setError(err?.message || '创建失败，请稍后重试');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (!saving) onClose();
    };

    const isPg = (dbType || '').toLowerCase().includes('postgres');
    const isMysql = (dbType || '').toLowerCase().includes('mysql');
    const isSqlServer = (dbType || '').toLowerCase().includes('sqlserver');

    const requiredOk = !!form.name.trim();

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 className="modal-title">新建数据库</h3>
                <form onSubmit={handleSubmit}>
                    {/* 顶部：连接信息只读 */}
                    <div style={{ marginBottom: 12, fontSize: 12, color: '#999' }}>
                        <span>连接 ID：</span>
                        <code style={{ fontSize: 11 }}>{connectionId}</code>
                        {dbType && (
                            <>
                                <span style={{ marginLeft: 8 }}>类型：</span>
                                <code style={{ fontSize: 11 }}>{dbType}</code>
                            </>
                        )}
                    </div>

                    {/* Tab 切换 */}
                    <div style={tabContainerStyle}>
                        <button
                            type="button"
                            style={{
                                ...tabBtnStyle,
                                background: activeTab === 'basic' ? '#2f855a' : 'transparent',
                                color: activeTab === 'basic' ? '#fff' : '#ccc',
                            }}
                            onClick={() => setActiveTab('basic')}
                        >
                            常规
                        </button>
                        <button
                            type="button"
                            style={{
                                ...tabBtnStyle,
                                background: activeTab === 'advanced' ? '#2f855a' : 'transparent',
                                color: activeTab === 'advanced' ? '#fff' : '#ccc',
                            }}
                            onClick={() => setActiveTab('advanced')}
                        >
                            高级
                        </button>
                    </div>

                    {activeTab === 'basic' && (
                        <div className="form-section">
                            <div className="form-group">
                                <label htmlFor="name">数据库名称 *</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="modal-input"
                                    placeholder="例如: app_db / reporting"
                                    autoFocus
                                />
                            </div>

                            <div style={rowStyle}>
                                <div className="form-group" style={colStyle}>
                                    <label htmlFor="owner">所有者</label>
                                    <input
                                        id="owner"
                                        name="owner"
                                        type="text"
                                        value={form.owner}
                                        onChange={handleChange}
                                        className="modal-input"
                                        placeholder="默认为当前登录用户"
                                    />
                                </div>

                                <div className="form-group" style={colStyle}>
                                    <label htmlFor="encoding">字符集 / 编码</label>
                                    {isPg && (
                                        <select
                                            id="encoding"
                                            name="encoding"
                                            value={form.encoding}
                                            onChange={handleChange}
                                            className="modal-input"
                                        >
                                            <option value="">跟随模板</option>
                                            <option value="UTF8">UTF8</option>
                                            <option value="SQL_ASCII">SQL_ASCII</option>
                                            <option value="LATIN1">LATIN1</option>
                                        </select>
                                    )}
                                    {isMysql && (
                                        <select
                                            id="encoding"
                                            name="encoding"
                                            value={form.encoding}
                                            onChange={handleChange}
                                            className="modal-input"
                                        >
                                            <option value="">使用服务器默认</option>
                                            <option value="utf8mb4">utf8mb4</option>
                                            <option value="latin1">latin1</option>
                                        </select>
                                    )}
                                    {isSqlServer && (
                                        <input
                                            id="encoding"
                                            name="encoding"
                                            type="text"
                                            value={form.encoding}
                                            onChange={handleChange}
                                            className="modal-input"
                                            placeholder="例如: Chinese_PRC_CI_AS"
                                        />
                                    )}
                                    {!isPg && !isMysql && !isSqlServer && (
                                        <input
                                            id="encoding"
                                            name="encoding"
                                            type="text"
                                            value={form.encoding}
                                            onChange={handleChange}
                                            className="modal-input"
                                            placeholder="可选，按具体数据库类型填写"
                                        />
                                    )}
                                </div>
                            </div>

                            {isPg && (
                                <div style={rowStyle}>
                                    <div className="form-group" style={colStyle}>
                                        <label htmlFor="template">模板库</label>
                                        <select
                                            id="template"
                                            name="template"
                                            value={form.template}
                                            onChange={handleChange}
                                            className="modal-input"
                                        >
                                            <option value="">template1 (默认)</option>
                                            <option value="template0">template0</option>
                                        </select>
                                    </div>

                                    <div className="form-group" style={colStyle}>
                                        <label htmlFor="tablespace">表空间</label>
                                        <input
                                            id="tablespace"
                                            name="tablespace"
                                            type="text"
                                            value={form.tablespace}
                                            onChange={handleChange}
                                            className="modal-input"
                                            placeholder="留空使用默认表空间"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="comment">备注</label>
                                <textarea
                                    id="comment"
                                    name="comment"
                                    value={form.comment}
                                    onChange={handleChange}
                                    className="modal-input"
                                    rows={2}
                                    placeholder="用于标记数据库用途，例如：BI 报表库 / 归档库"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'advanced' && (
                        <div className="form-section">
                            {isPg && (
                                <>
                                    <div style={rowStyle}>
                                        <div className="form-group" style={colStyle}>
                                            <label htmlFor="collation">LC_COLLATE（排序规则）</label>
                                            <input
                                                id="collation"
                                                name="collation"
                                                type="text"
                                                value={form.collation}
                                                onChange={handleChange}
                                                className="modal-input"
                                                placeholder="例如: zh_CN.UTF-8，留空跟随模板库"
                                            />
                                        </div>
                                        <div className="form-group" style={colStyle}>
                                            <label htmlFor="ctype">LC_CTYPE（字符分类）</label>
                                            <input
                                                id="ctype"
                                                name="ctype"
                                                type="text"
                                                value={form.ctype}
                                                onChange={handleChange}
                                                className="modal-input"
                                                placeholder="例如: zh_CN.UTF-8，留空跟随模板库"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        name="allowConnections"
                                        checked={form.allowConnections}
                                        onChange={handleChange}
                                    />
                                    <span style={{ marginLeft: 6 }}>允许连接到此数据库</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label htmlFor="connectionLimit">最大连接数</label>
                                <input
                                    id="connectionLimit"
                                    name="connectionLimit"
                                    type="number"
                                    value={form.connectionLimit}
                                    onChange={handleChange}
                                    className="modal-input"
                                />
                                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                                    -1 表示不限制（受全局配置控制）
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div
                            style={{
                                marginTop: 8,
                                marginBottom: 8,
                                padding: '6px 8px',
                                borderRadius: 4,
                                background: 'rgba(220, 53, 69, 0.12)',
                                color: '#f87171',
                                fontSize: 12,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
                        <button
                            type="button"
                            className="btn btn-cancel"
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!requiredOk || saving}
                        >
                            {saving ? '创建中…' : '创建'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewDatabaseModal;
