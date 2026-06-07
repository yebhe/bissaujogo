import React from 'react';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="admin-modal" role="dialog" aria-modal="true">
      <div className="admin-modal-backdrop" onClick={onCancel} />
      <div className="admin-modal-card">
        <div className="admin-modal-title">{title}</div>
        {message && <div className="admin-modal-text">{message}</div>}
        <div className="admin-modal-actions">
          <button className="admin-btn" type="button" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`admin-btn admin-btn--primary ${danger ? 'admin-btn--danger' : ''}`}
            type="button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
