import React from 'react';
import { createPortal } from 'react-dom';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title = '确认操作', message = '您确定要执行此操作吗？此操作不可恢复。', confirmText = '确认', cancelText = '取消', variant = 'danger' }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = onClose;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'Enter') handleConfirm();
  };

  const buttonVariant = variant === 'danger'
    ? { bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)', color: 'white' }
    : { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' };

  return createPortal(
    <div
      className="confirm-modal-overlay"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)'
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="confirm-modal"
        style={{
          background: 'white', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          width: 'min(90vw, 400px)', maxWidth: '400px', padding: '24px', fontFamily: 'var(--font)',
          animation: 'modalSlideIn 0.3s ease-out'
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333', lineHeight: '1.4' }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#666', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 20px', border: '1px solid #e0e0e0', background: 'white', borderRadius: '8px',
              fontSize: '14px', fontWeight: '500', color: '#666', cursor: 'pointer', transition: 'all 0.2s ease',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => { e.target.style.background = '#f8f9fa'; e.target.style.borderColor = '#ccc'; }}
            onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#e0e0e0'; }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 20px', border: 'none', background: buttonVariant.bg, color: buttonVariant.color,
              borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease',
              minWidth: '80px', boxShadow: '0 4px 14px rgba(255, 107, 107, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 14px rgba(255, 107, 107, 0.3)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;