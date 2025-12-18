import React, { useState, useEffect, useRef } from 'react';

type RoleOption = {
    value: string;
    label: string;
};

interface RoleSearchSelectProps {
    connectionId: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    style?: React.CSSProperties;
}

/**
 * RoleSearchSelect
 *
 * 通用的“远程角色搜索”组件：
 * - 不在前端缓存全量角色
 * - 用户输入关键字时，调用后端接口搜索
 * - 适用于“所有者 Owner”和“安全 Tab 里的角色选择”
 *
 * 约定后端接口：
 *   GET /api/meta/db/roles/search?connectionId={id}&q={keyword}&limit=20
 * 返回：
 *   { data: [ { value: string, label: string }, ... ], hasMore: boolean }
 */
const RoleSearchSelect: React.FC<RoleSearchSelectProps> = ({
                                                               connectionId,
                                                               value,
                                                               onChange,
                                                               disabled = false,
                                                               placeholder = '搜索角色',
                                                               style,
                                                           }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<RoleOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);

    // 点击外部关闭下拉
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
                setQuery('');
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    // 根据 query 做防抖搜索
    useEffect(() => {
        if (!open) return;
        if (!query || query.trim().length === 0) {
            setOptions([]);
            setHasMore(false);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const resp = await fetch(
                    `/api/meta/db/options/${encodeURIComponent(connectionId)}`,
                    { method: 'POST', headers:{'Content-type':'application/json'}, body: JSON.stringify({ roleFilter: query, types: ['ROLES'] }) }
                );
                if (resp.ok) {
                    const body = await resp.json();
                    const data: RoleOption[] = (body?.data?.roles || []).map((item: any) =>
                        typeof item === 'string'
                            ? { value: item, label: item }
                            : item
                    );
                    setOptions(data);
                    setHasMore(!!body?.hasMore);
                } else {
                    // 失败时简单清空即可
                    setOptions([]);
                    setHasMore(false);
                }
            } catch (e: any) {
                if (e.name !== 'AbortError') {
                    console.error('search roles error', e);
                }
            } finally {
                setLoading(false);
            }
        }, 300); // 300ms 防抖

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [query, connectionId, open]);

    const displayValue = query !== '' ? query : value;

    const handleSelect = (option: RoleOption) => {
        onChange(option.value);
        setQuery('');
        setOpen(false);
    };

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', ...style }}
        >
            <input
                type="text"
                className="form-input"
                disabled={disabled}
                placeholder={placeholder}
                value={displayValue}
                onFocus={() => {
                    if (!disabled) {
                        setOpen(true);
                        setQuery('');
                    }
                }}
                onChange={(e) => {
                    if (disabled) return;
                    setQuery(e.target.value);
                    setOpen(true);
                }}
            />

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        border: '1px solid #ccc',
                        backgroundColor: '#fff',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        marginTop: 2,
                    }}
                >
                    {loading && (
                        <div
                            style={{
                                padding: '8px 12px',
                                textAlign: 'center',
                                color: '#666',
                            }}
                        >
                            加载中...
                        </div>
                    )}

                    {!loading && query.trim() === '' && (
                        <div
                            style={{
                                padding: '8px 12px',
                                color: '#999',
                                fontSize: 12,
                            }}
                        >
                            输入关键字开始搜索角色
                        </div>
                    )}

                    {!loading && query.trim() !== '' && options.length === 0 && (
                        <div
                            style={{
                                padding: '8px 12px',
                                color: '#999',
                                fontSize: 12,
                            }}
                        >
                            没有匹配的角色
                        </div>
                    )}

                    {!loading &&
                        options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option)}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f0f0f0',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fff';
                                }}
                            >
                                {option.label}
                            </div>
                        ))}

                    {!loading && hasMore && options.length > 0 && (
                        <div
                            style={{
                                padding: '6px 12px',
                                color: '#999',
                                fontSize: 11,
                                borderTop: '1px solid #f0f0f0',
                            }}
                        >
                            结果过多，仅显示前 20 条，请继续输入以缩小范围
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RoleSearchSelect;
