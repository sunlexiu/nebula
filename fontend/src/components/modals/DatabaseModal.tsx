// src/components/modals/DatabaseModal.tsx
import React, { useState, useEffect } from 'react';
import '../../css/DatabaseModal.css';
import toast from 'react-hot-toast';

interface DatabaseModalProps {
    isOpen?: boolean;
    onClose: () => void;
    connectionId: string;
    dbType?: string;
    mode: 'create' | 'edit';
    databaseId?: string;
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
        rolePrivileges?: Array<{
            role: string;
            connect: boolean;
            temp: boolean;
            create: boolean;
            grantOption: boolean;
        }>;
    };
    onSubmit?: (values: any) => Promise<void>;
    permissions?: {
        name?: boolean;
        owner?: boolean;
        encoding?: boolean;
        template?: boolean;
        collation?: boolean;
        ctype?: boolean;
        tablespace?: boolean;
        allowConnections?: boolean;
        connectionLimit?: boolean;
        comment?: boolean;
        isTemplate?: boolean;
        localeProvider?: boolean;
        icuLocale?: boolean;
        icuRules?: boolean;
        extensions?: boolean;
        rolePrivileges?: boolean;
    };
}

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

const DatabaseModal: React.FC<DatabaseModalProps> = ({
                                                         isOpen = false,
                                                         onClose,
                                                         connectionId,
                                                         dbType,
                                                         mode = 'create',
                                                         databaseId,
                                                         defaultValues,
                                                         onSubmit,
                                                         permissions = {},
                                                     }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'definition' | 'storage' | 'security' | 'sql' | 'advanced'>('general');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSqlPreview, setShowSqlPreview] = useState(false);
    const [allowManualSql, setAllowManualSql] = useState(false);
    const [manualSql, setManualSql] = useState('');
    const [generatedSql, setGeneratedSql] = useState('');
    const [ownerSearchTerm, setOwnerSearchTerm] = useState('');
    const [loadingOptions, setLoadingOptions] = useState<Set<string>>(new Set());
    const [dbOptions, setDbOptions] = useState<any>({
        encodings: [],
        collations: [],
        templates: [],
        tablespaces: [],
        roles: [],
        owners: [],
        localeProviders: [],
    });

    // 默认权限配置
    const defaultPermissions = {
        name: mode === 'create',
        owner: true,
        encoding: true,
        template: true,
        collation: true,
        ctype: true,
        tablespace: true,
        allowConnections: true,
        connectionLimit: true,
        comment: true,
        isTemplate: true,
        localeProvider: true,
        icuLocale: true,
        icuRules: true,
        extensions: true,
        rolePrivileges: true,
    };

    // 合并权限配置
    const fieldPermissions = { ...defaultPermissions, ...permissions };

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
        isTemplate: defaultPermissions?.isTemplate || false,
        localeProvider: 'libc',
        icuLocale: '',
        icuRules: '',
        extensions: '',
        rolePrivileges: defaultValues?.rolePrivileges || [
            { role: 'public', connect: true, temp: false, create: false, grantOption: false },
            { role: 'app_user', connect: true, temp: true, create: false, grantOption: false },
            { role: 'readonly', connect: true, temp: false, create: false, grantOption: false },
            { role: 'dba', connect: true, temp: true, create: true, grantOption: true },
        ],
    });

    // 获取数据库选项和角色列表
    useEffect(() => {
        if (isOpen && connectionId) {
            // 初始只加载 roles 和 templates
            fetchDbOptions(['roles', 'templates']);
            if (mode === 'edit' && databaseId) {
                fetchDatabaseData();
            }
        }
    }, [isOpen, connectionId, mode, databaseId]);

    // Tab 切换时加载对应的选项
    useEffect(() => {
        if (!isOpen) return;

        switch (activeTab) {
            case 'definition':
                fetchDbOptions(['encodings', 'collations']);
                break;
            case 'storage':
                fetchDbOptions(['tablespaces']);
                break;
            case 'advanced':
                fetchDbOptions(['localeProviders']);
                break;
        }
    }, [activeTab, isOpen]);

    const fetchDbOptions = async (types: string[] = []) => {
        try {
            // 避免重复请求
            const typesToFetch = types.filter(type =>
                !dbOptions[type] || dbOptions[type].length === 0
            );

            if (typesToFetch.length === 0) return;

            setLoadingOptions(prev => new Set([...prev, ...typesToFetch]));

            const response = await fetch(
                `/api/meta/db/options/${connectionId}?types=${typesToFetch.join(',')}`
            );

            if (response.ok) {
                const body = await response.json();
                const options = body?.data;
                setDbOptions(prev => ({ ...prev, ...options }));

                // 设置默认值（仅当首次加载时）
                if (types.includes('encodings') && !form.encoding && options.encodings?.length > 0) {
                    setForm(prev => ({ ...prev, encoding: options.encodings[0].value }));
                }
                if (types.includes('templates') && !form.template && options.templates?.length > 0) {
                    setForm(prev => ({ ...prev, template: options.templates[0].value }));
                }
                if (types.includes('tablespaces') && !form.tablespace && options.tablespaces?.length > 0) {
                    setForm(prev => ({ ...prev, tablespace: options.tablespaces[0].value }));
                }
                if (types.includes('roles') && !form.owner && options.roles?.length > 0) {
                    setForm(prev => ({ ...prev, owner: options.roles[0].value }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch database options:', error);
        } finally {
            setLoadingOptions(prev => {
                const newSet = new Set(prev);
                types.forEach(type => newSet.delete(type));
                return newSet;
            });
        }
    };

    // 编辑模式下获取数据库现有数据
    const fetchDatabaseData = async () => {
        try {
            const response = await fetch(`/api/db/database/${databaseId}`);
            if (response.ok) {
                const data = await response.json();
                setForm(prev => ({
                    ...prev,
                    ...data,
                    // 确保rolePrivileges有默认值
                    rolePrivileges: data.rolePrivileges || prev.rolePrivileges,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch database data:', error);
            toast.error('获取数据库信息失败');
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
                    mode,
                    databaseId,
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
            owner: dbOptions.roles.length > 0 ? dbOptions.roles[0].value : '',
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
            rolePrivileges: defaultValues?.rolePrivileges || [
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
                    mode,
                    databaseId,
                });
            }
            onClose();
        } catch (err: any) {
            setError(err?.message || (mode === 'create' ? '创建失败' : '修改失败') + '，请稍后重试');
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
        // 检查字段权限
        if (mode === 'edit' && !fieldPermissions[name as keyof typeof fieldPermissions]) {
            return;
        }
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // 新增权限行
    const handleAddPrivilegeRow = () => {
        setForm(prev => ({
            ...prev,
            rolePrivileges: [
                ...prev.rolePrivileges,
                { role: '', connect: false, temp: false, create: false, grantOption: false }
            ]
        }));
    };

    // 删除权限行
    const handleDeletePrivilegeRow = (index: number) => {
        setForm(prev => ({
            ...prev,
            rolePrivileges: prev.rolePrivileges.filter((_, i) => i !== index)
        }));
    };

    // 更新权限行
    const handleRolePrivilegeChange = (index: number, field: string, value: boolean | string) => {
        // 检查权限
        if (mode === 'edit' && !fieldPermissions.rolePrivileges) {
            return;
        }
        const updatedPrivileges = [...form.rolePrivileges];
        updatedPrivileges[index] = {
            ...updatedPrivileges[index],
            [field]: value,
        };
        setForm(prev => ({ ...prev, rolePrivileges: updatedPrivileges }));
    };

    const requiredOk = !!form.name.trim();

    if (!isOpen) return null;

    // 动态标题和按钮文本
    const modalTitle = mode === 'create' ? '新建数据库' : '修改数据库';
    const submitButtonText = mode === 'create' ? '创建' : '保存';
    const submitButtonLoadingText = mode === 'create' ? '创建中…' : '保存中…';

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={modalContentStyle}>
                <h3 className="modal-title" style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px', marginBottom: 0 }}>
                    {modalTitle}
                </h3>

                {/* Tab切换 */}
                <div style={{ display: 'flex', marginBottom: 12, borderBottom: '1px solid #e0e0e0' }}>
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
                                padding: '6px 12px',
                                borderRadius: 4,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 12,
                                marginRight: 8,
                                transition: 'all 0.2s ease',
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
                                    className="form-input"
                                    placeholder="例如: app_db / reporting"
                                    disabled={mode === 'edit' && !fieldPermissions.name}
                                    autoFocus
                                />
                                {mode === 'edit' && !fieldPermissions.name && (
                                    <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                                        数据库名称不可修改
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <div className="form-group" style={{ flex: 1, minWidth: 240 }}>
                                    <label htmlFor="owner">所有者</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            value={ownerSearchTerm || form.owner}
                                            onChange={(e) => setOwnerSearchTerm(e.target.value)}
                                            onFocus={() => setOwnerSearchTerm('')}
                                            onBlur={() => {
                                                // 延迟关闭，以便点击选项
                                                setTimeout(() => setOwnerSearchTerm(''), 200);
                                            }}
                                            className="form-input"
                                            placeholder="搜索或选择所有者"
                                            disabled={mode === 'edit' && !fieldPermissions.owner}
                                        />
                                        {ownerSearchTerm !== '' && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                border: '1px solid #ccc',
                                                backgroundColor: '#fff',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                zIndex: 1000,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                            }}>
                                                {dbOptions.roles
                                                    .filter(role =>
                                                        role.label.toLowerCase().includes(ownerSearchTerm.toLowerCase())
                                                    )
                                                    .map(role => (
                                                        <div
                                                            key={role.value}
                                                            onClick={() => {
                                                                setForm(prev => ({ ...prev, owner: role.value }));
                                                                setOwnerSearchTerm('');
                                                            }}
                                                            style={{
                                                                padding: '8px 12px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #f0f0f0'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                                        >
                                                            {role.label}
                                                        </div>
                                                    ))}
                                                {dbOptions.roles.filter(role =>
                                                    role.label.toLowerCase().includes(ownerSearchTerm.toLowerCase())
                                                ).length === 0 && (
                                                    <div style={{ padding: '8px 12px', color: '#999' }}>
                                                        没有匹配的角色
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {loadingOptions.has('roles') && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                padding: '8px',
                                                textAlign: 'center',
                                                color: '#666',
                                                border: '1px solid #e0e0e0',
                                                borderTop: 'none'
                                            }}>
                                                加载中...
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group" style={{ flex: 1, minWidth: 240 }}>
                                    <label htmlFor="template">模板库</label>
                                    <select
                                        id="template"
                                        name="template"
                                        value={form.template}
                                        onChange={handleChange}
                                        className="form-input"
                                        disabled={mode === 'edit' && !fieldPermissions.template}
                                    >
                                        {loadingOptions.has('templates') ? (
                                            <option key="loading-templates" disabled>加载中...</option>  // 添加 key
                                        ) : (
                                            dbOptions.templates.map((template: any) => (
                                                <option key={template.value} value={template.value}>
                                                    {template.label}
                                                </option>
                                            ))
                                        )}
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
                                    className="form-input"
                                    rows={2}
                                    placeholder="用于标记数据库用途，例如：BI 报表库 / 归档库"
                                    disabled={mode === 'edit' && !fieldPermissions.comment}
                                />
                            </div>
                        </>
                    )}

                    {/* 定义 Tab */}
                    {activeTab === 'definition' && (
                        <>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <div className="form-group" style={{ flex: 1, minWidth: 240 }}>
                                    <label htmlFor="encoding">字符集 / 编码</label>
                                    <select
                                        id="encoding"
                                        name="encoding"
                                        value={form.encoding}
                                        onChange={handleChange}
                                        className="form-input"
                                        disabled={mode === 'edit' && !fieldPermissions.encoding}
                                    >
                                        {loadingOptions.has('encodings') ? (
                                            <option>加载中...</option>
                                        ) : (
                                            dbOptions.encodings.map((encoding: any) => (
                                                <option key={encoding.value} value={encoding.value}>
                                                    {encoding.label}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div className="form-group" style={{ flex: 1, minWidth: 240 }}>
                                    <label htmlFor="collation">排序规则</label>
                                    <select
                                        id="collation"
                                        name="collation"
                                        value={form.collation}
                                        onChange={handleChange}
                                        className="form-input"
                                        disabled={mode === 'edit' && !fieldPermissions.collation}
                                    >
                                        {loadingOptions.has('collations') ? (
                                            <option>加载中...</option>
                                        ) : (
                                            dbOptions.collations.map((collation: any) => (
                                                <option key={collation.value} value={collation.value}>
                                                    {collation.label}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <div className="form-group" style={{ flex: 1, minWidth: 240 }}>
                                    <label htmlFor="ctype">字符分类</label>
                                    <select
                                        id="ctype"
                                        name="ctype"
                                        value={form.ctype}
                                        onChange={handleChange}
                                        className="form-input"
                                        disabled={mode === 'edit' && !fieldPermissions.ctype}
                                    >
                                        {loadingOptions.has('collations') ? (
                                            <option>加载中...</option>
                                        ) : (
                                            dbOptions.collations.map((collation: any) => (
                                                <option key={collation.value} value={collation.value}>
                                                    {collation.label}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div className="form-group" style={{ flex: 1, minWidth: 240 }}>
                                    <label className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            name="allowConnections"
                                            checked={form.allowConnections}
                                            onChange={handleChange}
                                            disabled={mode === 'edit' && !fieldPermissions.allowConnections}
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
                                        disabled={mode === 'edit' && !fieldPermissions.isTemplate}
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
                                    className="form-input"
                                    disabled={mode === 'edit' && !fieldPermissions.tablespace}
                                >
                                    {loadingOptions.has('tablespaces') ? (
                                        <option>加载中...</option>
                                    ) : (
                                        dbOptions.tablespaces.map((tablespace: any) => (
                                            <option key={tablespace.value} value={tablespace.value}>
                                                {tablespace.label}
                                            </option>
                                        ))
                                    )}
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
                                    className="form-input"
                                    disabled={mode === 'edit' && !fieldPermissions.connectionLimit}
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
                            <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>角色授权（数据库级权限）</span>
                                {mode === 'create' && fieldPermissions.rolePrivileges && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleAddPrivilegeRow}
                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                    >
                                        + 新增权限
                                    </button>
                                )}
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                                        <th style={{ padding: '8px', textAlign: 'left', minWidth: 120 }}>角色</th>
                                        <th style={{ padding: '8px', textAlign: 'center', minWidth: 80 }}>CONNECT</th>
                                        <th style={{ padding: '8px', textAlign: 'center', minWidth: 80 }}>TEMP</th>
                                        <th style={{ padding: '8px', textAlign: 'center', minWidth: 80 }}>CREATE</th>
                                        <th style={{ padding: '8px', textAlign: 'center', minWidth: 100 }}>WITH GRANT</th>
                                        {mode === 'create' && fieldPermissions.rolePrivileges && (
                                            <th style={{ padding: '8px', textAlign: 'center', minWidth: 60 }}>操作</th>
                                        )}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {form.rolePrivileges.map((priv, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '8px' }}>
                                                <select
                                                    value={priv.role}
                                                    onChange={(e) => handleRolePrivilegeChange(index, 'role', e.target.value)}
                                                    className="form-input"
                                                    style={{ width: '100%', fontSize: 12 }}
                                                    disabled={mode === 'edit' && !fieldPermissions.rolePrivileges}
                                                >
                                                    <option value="">选择角色</option>
                                                    {dbOptions.roles.map((role: any) => (
                                                        <option key={role.value} value={role.value}>
                                                            {role.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={priv.connect}
                                                    onChange={(e) => handleRolePrivilegeChange(index, 'connect', e.target.checked)}
                                                    disabled={mode === 'edit' && !fieldPermissions.rolePrivileges}
                                                />
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={priv.temp}
                                                    onChange={(e) => handleRolePrivilegeChange(index, 'temp', e.target.checked)}
                                                    disabled={mode === 'edit' && !fieldPermissions.rolePrivileges}
                                                />
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={priv.create}
                                                    onChange={(e) => handleRolePrivilegeChange(index, 'create', e.target.checked)}
                                                    disabled={mode === 'edit' && !fieldPermissions.rolePrivileges}
                                                />
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={priv.grantOption}
                                                    onChange={(e) => handleRolePrivilegeChange(index, 'grantOption', e.target.checked)}
                                                    disabled={mode === 'edit' && !fieldPermissions.rolePrivileges}
                                                />
                                            </td>
                                            {mode === 'create' && fieldPermissions.rolePrivileges && (
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => handleDeletePrivilegeRow(index)}
                                                        style={{ padding: '2px 6px', fontSize: '10px' }}
                                                    >
                                                        删除
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            {form.rolePrivileges.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                    暂无权限配置，点击"新增权限"添加
                                </div>
                            )}
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
                                    className="form-input"
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
                                    className="form-input"
                                    disabled={mode === 'edit' && !fieldPermissions.localeProvider}
                                >
                                    {loadingOptions.has('localeProviders') ? (
                                        <option>加载中...</option>
                                    ) : (
                                        dbOptions.localeProviders.map((provider: any) => (
                                            <option key={provider.value} value={provider.value}>
                                                {provider.label}
                                            </option>
                                        ))
                                    )}
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
                                            className="form-input"
                                            placeholder="例如: en-US"
                                            disabled={mode === 'edit' && !fieldPermissions.icuLocale}
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
                                            className="form-input"
                                            placeholder="例如: @strength=primary"
                                            disabled={mode === 'edit' && !fieldPermissions.icuRules}
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
                                    className="form-input"
                                    rows={3}
                                    placeholder="max_locks_per_transaction = 128&#10;work_mem = 64MB"
                                    disabled={mode === 'edit' && !fieldPermissions.extensions}
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
                    <div style={{ display: 'flex', gap: 8 }}>
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
                            {saving ? submitButtonLoadingText : submitButtonText}
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

export default DatabaseModal;
