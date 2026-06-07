export default function MessagePopup({ open, title = 'Message', message, type = 'error', onClose }) {
  if (!open || !message) return null;

  return (
    <div className="admin-message-popup" role="alertdialog" aria-modal="true">
      <div className="admin-message-popup-backdrop" onClick={onClose} />
      <div className={`admin-message-popup-card admin-message-popup-card--${type}`}>
        <div className="admin-message-popup-title">{title}</div>
        <div className="admin-message-popup-text">{message}</div>
        <div className="admin-message-popup-actions">
          <button className="admin-btn admin-btn--primary" type="button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
