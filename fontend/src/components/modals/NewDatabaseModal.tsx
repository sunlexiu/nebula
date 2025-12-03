// src/components/modals/NewDatabaseModal.tsx
import React, { useState, useEffect } from 'react';
import '../../css/NewConnectionModal.css'; // 复用已有样式
import toast from 'react-hot-toast';

interface NewDatabaseModalProps {
    isOpen?: boolean;
    onClose: () => void;
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
    onSubmit?: (values: any) => Promise<void>;
}

const tabBtnStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    marginRight: 8,
    transition: 'all 0.2s ease',
};

const tabContainerStyle: React.CSSProperties = {
    display: 'flex',
    marginBottom: 12,
    borderBottom: '1px solid #e0e0e0',
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
};

const colStyle: React.CSSProperties = {
    flex: 1,
};

const modalContentStyle: React.CSSProperties = {
    maxWidth: 800,
    width: '95%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
};

const tabContentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    minHeight: 0,
};

const NewDatabaseModal: React.FC<NewDatabaseModalProps> = ({
                                                               isOpen = false,
                                                               onClose,
                                                               connectionId,
                                                               dbType,
                                                               defaultValues,
                                                               onSubmit,
                                                           }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'definition' | 'storage' | 'security' | 'sql' | 'advanced'>('general');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSqlPreview, setShowSqlPreview] = useState(false);
    const [allowManualSql, setAllowManualSql] = useState(false);
    const [manualSql, setManualSql] = useState('');
    const [generatedSql, setGeneratedSql] = useState('');
    const [dbOptions, setDbOptions] = useState<any>({
        encodings: [],
        collations: [],
        templates: [],
        tablespaces: [],
        roles: [],
        owners: [],
        localeProviders: [],
    });

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
        isTemplate: false,
        localeProvider: 'libc',
        icuLocale: '',
        icuRules: '',
        extensions: '',
        rolePrivileges: [
            { role: 'public', connect: true, temp: false, create: false, grantOption: false },
            { role: 'app_user', connect: true, temp: true, create: false, grantOption: false },
            { role: 'readonly', connect: true, temp: false, create: false, grantOption: false },
            { role: 'dba', connect: true, temp: true, create: true, grantOption: true },
        ],
    });

    // 获取数据库选项
    useEffect(() => {
        if (isOpen && connectionId) {
            fetchDbOptions();
        }
    }, [isOpen, connectionId]);

    const fetchDbOptions = async () => {
        try {
            const response = await fetch(`/api/db/options/${connectionId}`);
            if (response.ok) {
                const options = await response.json();
                setDbOptions(options);

                // 设置默认值
                if (!form.encoding && options.encodings.length > 0) {
                    setForm(prev => ({ ...prev, encoding: options.encodings[0].value }));
                }
                if (!form.template && options.templates.length > 0) {
                    setForm(prev => ({ ...prev, template: options.templates[0].value }));
                }
                if (!form.tablespace && options.tablespaces.length > 0) {
                    setForm(prev => ({ ...prev, tablespace: options.tablespaces[0].value }));
                }
                if (!form.owner && options.owners.length > 0) {
                    setForm(prev => ({ ...prev, owner: options.owners[0].value }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch database options:', error);
        }
    };

    // 生成SQL
    const generateSql = async () => {
        try {
            const response = await fetch('/api/db/generate-sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connectionId,
                    ...form,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setGeneratedSql(result.sql);
                return result.sql;
            } else {
                throw new Error('Failed to generate SQL');
            }
        } catch (error) {
            console.error('Generate SQL error:', error);
            toast.error('生成SQL失败');
            return '';
        }
    };

    const handlePreviewSql = async () => {
        const sql = await generateSql();
        setManualSql(sql);
        setShowSqlPreview(true);
    };

    const handleCopySql = () => {
        navigator.clipboard.writeText(manualSql || generatedSql);
        toast.success('SQL已复制到剪贴板');
    };

    const handleReset = () => {
        setForm({
            name: defaultValues?.name || '',
            owner: dbOptions.owners.length > 0 ? dbOptions.owners[0].value : '',
            encoding: dbOptions.encodings.length > 0 ? dbOptions.encodings[0].value : '',
            template: dbOptions.templates.length > 0 ? dbOptions.templates[0].value : '',
            collation: dbOptions.collations.length > 0 ? dbOptions.collations[0].value : '',
            ctype: dbOptions.collations.length > 0 ? dbOptions.collations[0].value : '',
            tablespace: dbOptions.tablespaces.length > 0 ? dbOptions.tablespaces[0].value : '',
            allowConnections: true,
            connectionLimit: -1,
            comment: '',
            isTemplate: false,
            localeProvider: 'libc',
            icuLocale: '',
            icuRules: '',
            extensions: '',
            rolePrivileges: [
                { role: 'public', connect: true, temp: false, create: false, grantOption: false },
                { role: 'app_user', connect: true, temp: true, create: false, grantOption: false },
                { role: 'readonly', connect: true, temp: false, create: false, grantOption: false },
                { role: 'dba', connect: true, temp: true, create: true, grantOption: true },
            ],
        });
        setError(null);
        setGeneratedSql('');
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
            setError(err?.message || '创建失败，请稍后重试');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (!saving) onClose();
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type, checked } = e.target as any;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleRolePrivilegeChange = (index: number, field: string, value: boolean) => {
        const updatedPrivileges = [...form.rolePrivileges];
        updatedPrivileges[index] = {
            ...updatedPrivileges[index],
            [field]: value,
        };
        setForm(prev => ({ ...prev, rolePrivileges: updatedPrivileges }));
    };

    const requiredOk = !!form.name.trim();

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={modalContentStyle}>
                <h3 className="modal-title" style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px', marginBottom: 0 }}>
                    新建数据库
                </h3>

                {/* Tab切换 */}
                <div style={tabContainerStyle}>
                    {[
                        { key: 'general', label: '常规' },
                        { key: 'definition', label: '定义' },
                        { key: 'storage', label: '存储' },
                        { key: 'security', label: '安全' },
                        { key: 'sql', label: 'SQL定义' },
                        { key: 'advanced', label: '高级' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            style={{
                                ...tabBtnStyle,
                                background: activeTab === tab.key ? '#0b69ff' : 'transparent',
                                color: activeTab === tab.key ? '#fff' : '#666',
                                borderBottom: activeTab === tab.key ? '2px solid #0b69ff' : 'none',
                                marginBottom: activeTab === tab.key ? '-1px' : '0',
                            }}
                            onClick={() => setActiveTab(tab.key as any)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab内容 - 固定高度容器 */}
                <div style={tabContentStyle}>
                    {/* 常规 Tab */}
                    {activeTab === 'general' && (
                        <>
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
                                    <select
                                        id="owner"
                                        name="owner"
                                        value={form.owner}
                                        onChange={handleChange}
                                        className="modal-input"
                                    >
                                        {dbOptions.owners.map((owner: any) => (
                                            <option key={owner.value} value={owner.value}>
                                                {owner.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group" style={colStyle}>
                                    <label htmlFor="template">模板库</label>
                                    <select
                                        id="template"
                                        name="template"
                                        value={form.template}
                                        onChange={handleChange}
                                        className="modal-input"
                                    >
                                        {dbOptions.templates.map((template: any) => (
                                            <option key={template.value} value={template.value}>
                                                {template.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

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
                        </>
                    )}

                    {/* 定义 Tab */}
                    {activeTab === 'definition' && (
                        <>
                            <div style={rowStyle}>
                                <div className="form-group" style={colStyle}>
                                    <label htmlFor="encoding">字符集 / 编码</label>
                                    <select
                                        id="encoding"
                                        name="encoding"
                                        value={form.encoding}
                                        onChange={handleChange}
                                        className="modal-input"
                                    >
                                        {dbOptions.encodings.map((encoding: any) => (
                                            <option key={encoding.value} value={encoding.value}>
                                                {encoding.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group" style={colStyle}>
                                    <label htmlFor="collation">排序规则</label>
                                    <select
                                        id="collation"
                                        name="collation"
                                        value={form.collation}
                                        onChange={handleChange}
                                        className="modal-input"
                                    >
                                        {dbOptions.collations.map((collation: any) => (
                                            <option key={collation.value} value={collation.value}>
                                                {collation.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={rowStyle}>
                                <div className="form-group" style={colStyle}>
                                    <label htmlFor="ctype">字符分类</label>
                                    <select
                                        id="ctype"
                                        name="ctype"
                                        value={form.ctype}
                                        onChange={handleChange}
                                        className="modal-input"
                                    >
                                        {dbOptions.collations.map((collation: any) => (
                                            <option key={collation.value} value={collation.value}>
                                                {collation.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group" style={colStyle}>
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
                            </div>

                            <div className="form-group">
                                <label className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        name="isTemplate"
                                        checked={form.isTemplate}
                                        onChange={handleChange}
                                    />
                                    <span style={{ marginLeft: 6 }}>是否作为模板库</span>
                                </label>
                            </div>
                        </>
                    )}

                    {/* 存储 Tab */}
                    {activeTab === 'storage' && (
                        <>
                            <div className="form-group">
                                <label htmlFor="tablespace">表空间</label>
                                <select
                                    id="tablespace"
                                    name="tablespace"
                                    value={form.tablespace}
                                    onChange={handleChange}
                                    className="modal-input"
                                >
                                    {dbOptions.tablespaces.map((tablespace: any) => (
                                        <option key={tablespace.value} value={tablespace.value}>
                                            {tablespace.label}
                                        </option>
                                    ))}
                                </select>
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
                        </>
                    )}

                    {/* 安全 Tab */}
                    {activeTab === 'security' && (
                        <div>
                            <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
                                角色授权（数据库级权限）
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>角色</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>CONNECT</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>TEMP</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>CREATE</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>WITH GRANT</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {form.rolePrivileges.map((priv, index) => (
                                        <tr key={priv.role} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '8px' }}>{priv.role}</td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={priv.connect}
                                                    onChange={(e) => handleRolePrivilegeChange(index, 'connect', e.target.checked)}
                                                />
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={priv.temp}
                                                    onChange={(e) => handleRolePrivilegeChange(index, 'temp', e.target.checked)}
                                                />
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={priv.create}
                                                    onChange={(e) => handleRolePrivilegeChange(index, 'create', e.target.checked)}
                                                />
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={priv.grantOption}
                                                    onChange={(e) => handleRolePrivilegeChange(index, 'grantOption', e.target.checked)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SQL定义 Tab */}
                    {activeTab === 'sql' && (
                        <div>
                            <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
                                根据当前配置自动生成 SQL：
                            </div>

                            <div style={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 4,
                                padding: 12,
                                backgroundColor: '#f8f9fa',
                                fontFamily: 'monospace',
                                fontSize: 12,
                                whiteSpace: 'pre-wrap',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {generatedSql || '点击"重新生成"按钮生成SQL'}
                            </div>

                            <div style={{ marginTop: 12 }}>
                                <label className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        checked={allowManualSql}
                                        onChange={(e) => setAllowManualSql(e.target.checked)}
                                    />
                                    <span style={{ marginLeft: 6 }}>允许手动编辑 SQL（高级）</span>
                                </label>
                            </div>

                            {allowManualSql && (
                                <textarea
                                    value={manualSql}
                                    onChange={(e) => setManualSql(e.target.value)}
                                    className="modal-input"
                                    rows={10}
                                    style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
                                />
                            )}

                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCopySql}
                                >
                                    复制 SQL
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handlePreviewSql}
                                >
                                    重新生成
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 高级 Tab */}
                    {activeTab === 'advanced' && (
                        <>
                            <div className="form-group">
                                <label htmlFor="localeProvider">Locale Provider</label>
                                <select
                                    id="localeProvider"
                                    name="localeProvider"
                                    value={form.localeProvider}
                                    onChange={handleChange}
                                    className="modal-input"
                                >
                                    {dbOptions.localeProviders.map((provider: any) => (
                                        <option key={provider.value} value={provider.value}>
                                            {provider.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {form.localeProvider === 'icu' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="icuLocale">ICU Locale</label>
                                        <input
                                            id="icuLocale"
                                            name="icuLocale"
                                            type="text"
                                            value={form.icuLocale}
                                            onChange={handleChange}
                                            className="modal-input"
                                            placeholder="例如: en-US"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="icuRules">ICU Rules</label>
                                        <input
                                            id="icuRules"
                                            name="icuRules"
                                            type="text"
                                            value={form.icuRules}
                                            onChange={handleChange}
                                            className="modal-input"
                                            placeholder="例如: @strength=primary"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label>数据库级参数扩展（key=value，自定义）</label>
                                <textarea
                                    name="extensions"
                                    value={form.extensions}
                                    onChange={handleChange}
                                    className="modal-input"
                                    rows={3}
                                    placeholder="max_locks_per_transaction = 128&#10;work_mem = 64MB"
                                />
                            </div>
                        </>
                    )}
                </div>

                {error && (
                    <div
                        style={{
                            padding: '12px',
                            borderRadius: 4,
                            background: 'rgba(220, 53, 69, 0.1)',
                            color: '#dc3545',
                            fontSize: 12,
                            margin: '0 16px'
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* 底部操作区 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderTop: '1px solid #e0e0e0',
                    gap: 8
                }}>
                    <div>
                        <button
                            type="button"
                            className="btn btn-cancel"
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleReset}
                            disabled={saving}
                        >
                            重置
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handlePreviewSql}
                            disabled={saving}
                        >
                            预览 SQL
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!requiredOk || saving}
                            onClick={handleSubmit}
                        >
                            {saving ? '创建中…' : '创建'}
                        </button>
                    </div>
                </div>
            </div>

            {/* SQL预览弹窗 */}
            {showSqlPreview && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 700, width: '90%' }}>
                        <h3 className="modal-title">SQL 预览</h3>

                        <div style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 4,
                            padding: 12,
                            backgroundColor: '#f8f9fa',
                            fontFamily: 'monospace',
                            fontSize: 12,
                            whiteSpace: 'pre-wrap',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            marginBottom: 12
                        }}>
                            {manualSql || generatedSql}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCopySql}
                            >
                                复制 SQL
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setShowSqlPreview(false)}
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewDatabaseModal;
