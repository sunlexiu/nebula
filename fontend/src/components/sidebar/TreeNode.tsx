import React, {useState, memo, useEffect} from 'react';
import toast from 'react-hot-toast';
import {useModal} from '../modals/ModalProvider';
import {useTreeStore} from '@/stores/useTreeStore.ts';
import {dynamicHandler, getAllActions} from '@/actions/dbActions';
import {getExpandIcon, getNodeIcon, loadNodeChildren} from '@/utils/treeUtils.ts';
import {
    getThemeColors,
    nodeBaseStyles,
    expandIconStyles,
    nodeIconStyles,
    nodeNameStyles,
    typeLabelStyles,
    actionButtonStyles,
    indicatorBarStyles,
    childIndicatorStyles,
    actionContainerStyles,
    dragOverStyles,
    dragSourceStyles
} from './styles';

interface TreeNodeProps {
    node: any;
    level?: number;
    hoveredNode: string | null;
    setHoveredNode: (id: string | null) => void;
    expandedKeys: Map<string, boolean>;
    setExpandedKeys: React.Dispatch<React.SetStateAction<Map<string, boolean>>>;
    onMoreMenu: (e: React.MouseEvent, node: any, actions: any[]) => void;
    activeMoreMenuNode: string | null;
    setActiveMoreMenuNode: (id: string | null) => void;
    dragSourceId: string | null;
    setDragSourceId: (id: string | null) => void;
    dragOverNodeId: string | null;
    setDragOverNodeId: (id: string | null) => void;
    moveNode: (sourceId: string, targetId: string) => void;
    openNewGroup: () => void;
    openNewConnection: () => void;
    openRenameFolder: () => void;
    openEditConnection: () => void;
}

const TreeNode = memo(({
                           node,
                           level = 0,
                           hoveredNode,
                           setHoveredNode,
                           expandedKeys,
                           setExpandedKeys,
                           onMoreMenu,
                           activeMoreMenuNode,
                           setActiveMoreMenuNode,
                           dragSourceId,
                           setDragSourceId,
                           dragOverNodeId,
                           setDragOverNodeId,
                           moveNode,
                           openNewGroup,
                           openNewConnection,
                           openRenameFolder,
                           openEditConnection,
                       }: TreeNodeProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const {openModal} = useModal();
    const isHovered = hoveredNode === node.id;
    const isActive = activeMoreMenuNode === node.id;
    const isDragging = dragSourceId === node.id;
    const isDragOver = dragOverNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isExpandable = hasChildren || node.virtual || node.config?.nextLevel;
    const isDraggable = node.type === 'folder' || node.type === 'connection';
    const isDropTarget = node.type === 'folder' || node.config?.allowDrop;
    const theme = getThemeColors(node.type);
    const {updateTreePath} = useTreeStore();
    const isExpanded = node.expanded;
    const isConnected = node.connected;
    if (isConnected) theme.accentColor = '#10b981';

    // 新增：获取过滤后的动作列表
    const [filteredActions, setFilteredActions] = useState<any[]>([]);
    const [primaryAction, setPrimaryAction] = useState<any>(null);

    useEffect(() => {
        const loadActions = async () => {
            try {
                const actions = await getAllActions(node.type, node);
                setFilteredActions(actions);
                setPrimaryAction(actions.find(action => action.primary) || actions[0] || null);
            } catch (error) {
                console.error('Failed to load actions:', error);
                setFilteredActions([]);
                setPrimaryAction(null);
            }
        };

        loadActions();
    }, [node.type, node]);

    const combinedStyles = {
        ...nodeBaseStyles,
        ...(isDragging && dragSourceStyles),
        ...(isDragOver && dragOverStyles(theme)),
        paddingLeft: `${12 + level * 12}px`,
        cursor: isDraggable ? 'grab' : (isExpandable ? 'pointer' : (isLoading ? 'wait' : 'default')),
        background: (isDragging ? 'transparent' : ((isHovered || isActive) ? theme.hoverBg : 'transparent')),
        border: (isDragOver ? `2px dashed ${theme.accentColor}` : ((isHovered || isActive) ? `1px solid ${theme.accentColor}20` : (isConnected ? `1px solid ${theme.accentColor}10` : '1px solid transparent'))),
        transform: (isDragging ? 'rotate(5deg)' : ((isHovered || isActive) ? 'translateX(1px)' : 'translateX(0)')),
        boxShadow: (isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : ((isHovered || isActive) ? `0 1px 4px ${theme.accentColor}10` : 'none')),
        opacity: isDragging ? 0.5 : 1,
        paddingRight: (isHovered || isActive) ? '4px' : '8px'
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (isDraggable) {
            setDragSourceId(node.id);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', node.id);
        }
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (isDropTarget && dragSourceId && dragSourceId !== node.id) setDragOverNodeId(node.id);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.stopPropagation();
        if (isDropTarget && dragOverNodeId === node.id) setDragOverNodeId(null);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDropTarget && dragSourceId && dragSourceId !== node.id) {
            moveNode(dragSourceId, node.id);
        }
        setDragOverNodeId(null);
    };


// 提取核心点击行为到独立函数
    const toggleExpandOrLoad = async () => {
        const willExpand = !isExpanded;

        if (willExpand && isExpandable && (!node.children || node.children.length === 0)) {
            setIsLoading(true);
            try {
                const updated = await loadNodeChildren(node);
                updateTreePath(node.id, () => ({
                    ...updated,
                    expanded: true,
                }));
                setExpandedKeys(prev => new Map(prev).set(node.id, true));
            } catch (err) {
                toast.error('加载失败');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        } else {
            setExpandedKeys(prev => {
                const next = new Map(prev);
                next.set(node.id, willExpand);
                return next;
            });
        }
    };

    // 原 handleClick 只保留事件相关操作
    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await toggleExpandOrLoad();
    };

    // 新增键盘事件处理器
    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            await toggleExpandOrLoad();
        }
    };

    const handlePrimaryAction = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (primaryAction && !activeMoreMenuNode) {
            await dynamicHandler(primaryAction.handler, node, {
                setExpandedKeys,
                openModal,
            });
        }
    };

    const handleMoreMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeMoreMenuNode) {
            setActiveMoreMenuNode(node.id);
            // 修改：传递 filteredActions 给 onMoreMenu（父组件用它渲染菜单）
            onMoreMenu(e, node, filteredActions);
        }
    };
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleMoreMenu(e);
    };

    return (
        <div
            className={`tree-node ${node.type} ${isExpanded ? 'expanded' : ''} ${isHovered || isActive ? 'hovered' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
            style={combinedStyles}
            draggable={isDraggable}
            onMouseEnter={() => !isDragging && setHoveredNode(node.id)}
            onMouseLeave={() => !isDragging && setHoveredNode(null)}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onKeyDown={(e) => {
                if (e.key === 'Enter') handleKeyDown(e);
            }}
            tabIndex={0}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {(isHovered || isActive || isDragOver) && <div style={indicatorBarStyles(theme)}/>}

            <div style={expandIconStyles(isHovered || isActive || isDragOver, theme)}>
                {isLoading ? (
                    <span style={{fontSize: 9}}>⟳</span>
                ) : getExpandIcon(node) ? (
                    <span style={{fontSize: 9, fontWeight: 'bold'}}>{getExpandIcon(node)}</span>
                ) : (
                    <div style={{width: 10, height: 10}}/>
                )}
            </div>

            <img
                src={getNodeIcon(node)}
                alt={node.type + (isConnected ? ' (connected)' : '')}
                style={nodeIconStyles(isHovered || isActive || isDragOver, theme)}
            />

            <span style={{
                ...nodeNameStyles(isHovered || isActive || isDragOver),
                color: (isHovered || isActive || isDragOver) ? theme.textColor : '#333'
            }}>
        {node.name}
      </span>

            {(isHovered || isActive || isDragOver) && (
                <span style={typeLabelStyles(isHovered || isActive || isDragOver, theme)}>
          {node.type} {isConnected && '(已连接)'} {node.virtual && '(虚拟)'}
        </span>
            )}

            {(isHovered || isActive) && !isLoading && !isDragging && (
                <div style={actionContainerStyles}>
                    {primaryAction && (
                        <button
                            onClick={handlePrimaryAction}
                            style={actionButtonStyles(theme)}
                            disabled={!!activeMoreMenuNode}
                            onMouseEnter={(e) => {
                                if (!activeMoreMenuNode) {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!activeMoreMenuNode) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                                }
                            }}
                        >
                            {primaryAction.icon}
                        </button>
                    )}

                    <button
                        onClick={handleMoreMenu}
                        style={{...actionButtonStyles(theme), color: '#666', fontSize: '14px'}}
                        disabled={!!activeMoreMenuNode && activeMoreMenuNode !== node.id}
                        onMouseEnter={(e) => {
                            if (!activeMoreMenuNode || activeMoreMenuNode === node.id) {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                                e.currentTarget.style.color = theme.accentColor;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!activeMoreMenuNode || activeMoreMenuNode === node.id) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.color = '#666';
                            }
                        }}
                    >
                        ⋯
                    </button>
                </div>
            )}

            {(isHovered || isActive || isDragOver) && hasChildren && !primaryAction && !isLoading && (
                <div style={childIndicatorStyles(theme)}/>
            )}
        </div>
    );
});

TreeNode.displayName = 'TreeNode';
export default TreeNode;