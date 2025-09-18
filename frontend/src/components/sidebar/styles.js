// 样式和主题配置

const ACCENT_COLOR = '#0b69ff';

// 节点主题配置
export const getThemeColors = (nodeType) => {
  switch (nodeType) {
    case 'folder':
      return {
        hoverBg: 'linear-gradient(90deg, #f8f9ff 0%, #f0f2ff 100%)',
        textColor: '#5b6d8f',
        iconColor: '#667eea',
        accentColor: ACCENT_COLOR
      };
    case 'connection':
      return {
        hoverBg: `linear-gradient(90deg, rgba(11, 105, 255, 0.05) 0%, rgba(11, 105, 255, 0.1) 100%)`,
        textColor: '#2e7d32',
        iconColor: '#4caf50',
        accentColor: ACCENT_COLOR
      };
    case 'schema':
      return {
        hoverBg: 'linear-gradient(90deg, #fff3e0 0%, #ffecb3 100%)',
        textColor: '#e65100',
        iconColor: '#ff9800',
        accentColor: ACCENT_COLOR
      };
    case 'table':
      return {
        hoverBg: 'linear-gradient(90deg, #f3e5f5 0%, #f1e8fd 100%)',
        textColor: '#6a1b9a',
        iconColor: '#9c27b0',
        accentColor: ACCENT_COLOR
      };
    default:
      return {
        hoverBg: '#f5f5f5',
        textColor: '#333',
        iconColor: '#666',
        accentColor: ACCENT_COLOR
      };
  }
};

// 节点基础样式
export const nodeBaseStyles = {
  padding: '6px 8px',
  margin: '1px 0',
  display: 'flex',
  alignItems: 'center',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  fontFamily: 'var(--font)',
  fontSize: '13px'
};

// 悬浮时的基础样式
export const nodeHoverStyles = (theme) => ({
  background: theme.hoverBg,
  border: `1px solid ${theme.accentColor}20`,
  transform: 'translateX(1px)',
  boxShadow: `0 1px 4px ${theme.accentColor}10`,
  paddingRight: '4px'
});

// 展开图标样式
export const expandIconStyles = (isHovered, theme) => ({
  width: 12,
  height: 12,
  marginRight: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
  color: isHovered ? theme.accentColor : '#999'
});

// 节点图标样式
export const nodeIconStyles = (isHovered, theme) => ({
  width: 14,
  height: 14,
  marginRight: 4,
  flexShrink: 0,
  filter: isHovered ? `drop-shadow(0 0 1px ${theme.accentColor}30)` : 'none',
  transition: 'all 0.2s ease',
  transform: isHovered ? 'scale(1.02)' : 'scale(1)'
});

// 节点名称样式
export const nodeNameStyles = (isHovered) => ({
  flex: 1,
  fontSize: isHovered ? '13.2px' : '13px',
  fontWeight: isHovered ? '500' : '400',
  color: isHovered ? '#333' : '#333', // 这里可以根据theme.textColor动态设置
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  transition: 'all 0.2s ease',
  letterSpacing: isHovered ? '0.1px' : '0px',
  marginRight: isHovered ? '8px' : '0'
});

// 类型标签样式
export const typeLabelStyles = (isHovered, theme) => ({
  fontSize: '10px',
  color: isHovered ? theme.accentColor : '#999',
  background: isHovered ? `${theme.accentColor}10` : '#f0f0f0',
  padding: isHovered ? '2px 6px' : '1px 4px',
  borderRadius: '10px',
  border: isHovered ? `1px solid ${theme.accentColor}20` : 'none',
  transition: 'all 0.2s ease',
  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  marginLeft: '4px'
});

// 功能按钮样式
export const actionButtonStyles = (theme) => ({
  width: 20,
  height: 20,
  border: 'none',
  background: 'rgba(255, 255, 255, 0.8)',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: theme.accentColor,
  fontSize: '12px',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  flexShrink: 0
});

// 更多按钮样式
export const moreButtonStyles = (isHovered, theme) => ({
  ...actionButtonStyles(theme),
  color: isHovered ? theme.accentColor : '#666',
  background: isHovered ? 'white' : 'rgba(255, 255, 255, 0.8)',
  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
  boxShadow: isHovered ? '0 2px 6px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
});

// 左侧指示条样式
export const indicatorBarStyles = (theme) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '2px',
  background: `linear-gradient(to bottom, ${theme.accentColor}, ${theme.accentColor}80)`,
  borderRadius: '0 2px 2px 0'
});

// 子项指示器样式
export const childIndicatorStyles = (theme) => ({
  position: 'absolute',
  right: 6,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 3,
  height: 3,
  background: theme.accentColor,
  borderRadius: '50%',
  opacity: 0.6
});

// 按钮容器样式
export const actionContainerStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  marginLeft: '4px',
  paddingLeft: '2px'
};