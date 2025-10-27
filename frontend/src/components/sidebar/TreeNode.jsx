// src/components/sidebar/TreeNode.jsx
import React from 'react';

/**
 * props:
 * - node: { id,name,type,icon,hasChildren,_ctx,actions,badges }
 * - selected: boolean
 * - onToggle(node): 展开/收起
 * - onClick(node): 选中
 * - onAction(node, action): 执行后端返回的动作（可在父组件统一处理）
 */
export default function TreeNode({
                                   node,
                                   selected,
                                   onToggle,
                                   onClick,
                                   onAction
                                 }) {
  // 图标类名：已在 adapter 里映射为最终类名
  const iconClass = node.icon || 'icon-default';

  // 节点文本
  const label = node.name || node.id;

  // 动作（来自后端 YAML），在 hover 时显示
  const actions = Array.isArray(node.actions) ? node.actions : [];

  return (
      <div
          className={`tree-node ${selected ? 'is-selected' : ''}`}
          data-node-id={node.id}
          onClick={(e) => {
            e.stopPropagation();
            onClick && onClick(node);
          }}
      >
        {/* 展开/收起箭头（如果你原来有），可按需切换 class */}
        {node.hasChildren ? (
            <span
                className={`tree-node-toggle ${node.__expanded ? 'is-open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle && onToggle(node);
                }}
            />
        ) : (
            <span className="tree-node-toggle is-leaf" />
        )}

        {/* 图标：使用映射后的 icon class，不破坏你原有样式 */}
        <i className={`tree-node-icon ${iconClass}`} aria-hidden="true" />

        {/* 文本 */}
        <span className="tree-node-label" title={label}>
        {label}
      </span>

        {/* Actions：hover 时展示（保持容器类名） */}
        <div className="tree-node-actions">
          {actions.map((act) => (
              <button
                  key={act.id}
                  className={`tree-node-action ${act.danger ? 'is-danger' : ''}`}
                  title={act.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (act.confirm && !window.confirm(act.label || 'Confirm')) return;
                    onAction && onAction(node, act);
                  }}
              >
                {/* 如果你有动作图标类名，可加在这里 */}
                {act.iconClass ? <i className={`action-icon ${act.iconClass}`} /> : null}
              </button>
          ))}
        </div>
      </div>
  );
}
