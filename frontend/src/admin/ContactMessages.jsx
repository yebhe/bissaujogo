import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import ConfirmModal from './ConfirmModal';
import './admin.css';

const motifOptions = [
  { value: '', label: 'Tous' },
  { value: 'annuler_reservation', label: 'Annulation' },
  { value: 'modifier_reservation', label: 'Modification' },
  { value: 'autres_infos', label: 'Autres infos' },
];

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function StatusBadge({ traite }) {
  return <span className={`badge ${traite ? 'badge--ok' : 'badge--pending'}`}>{traite ? 'Traité' : 'À traiter'}</span>;
}

export default function ContactMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, count: 0 });
  const [filters, setFilters] = useState({ search: '', motif: '', traite: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmLabel: 'Confirmer', danger: false });
  const [pendingAction, setPendingAction] = useState(null);

  const unreadCount = useMemo(() => messages.filter(m => !m.traite).length, [messages]);

  const askConfirm = ({ title, message, confirmLabel = 'Confirmer', danger = false }, action) => {
    setConfirm({ open: true, title, message, confirmLabel, danger });
    setPendingAction(() => action);
  };

  const fetchMessages = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/contact-messages/', {
        params: {
          page,
          page_size: pagination.page_size,
          search: filters.search.trim() || undefined,
          motif: filters.motif || undefined,
          traite: filters.traite || undefined,
        },
      });
      setMessages(data.results ?? []);
      setPagination({
        page: data.page ?? page,
        page_size: data.page_size ?? pagination.page_size,
        count: data.count ?? 0,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de charger les messages de contact.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(1); }, []);

  const applyFilters = () => {
    setPagination(s => ({ ...s, page: 1 }));
    fetchMessages(1);
  };

  const goPage = (page) => {
    const next = Math.max(1, page);
    setPagination(s => ({ ...s, page: next }));
    fetchMessages(next);
  };

  const toggleTraite = async (message) => {
    await api.patch(`/admin/contact-messages/${message.id}/`, { traite: !message.traite });
    if (selected?.id === message.id) setSelected(s => ({ ...s, traite: !message.traite }));
    await fetchMessages();
  };

  const deleteMessage = async (message) => {
    askConfirm(
      {
        title: 'Supprimer ce message ?',
        message: `${message.prenom} ${message.nom} — ${message.motif_display}`,
        confirmLabel: 'Supprimer',
        danger: true,
      },
      async () => {
        await api.delete(`/admin/contact-messages/${message.id}/`);
        if (selected?.id === message.id) setSelected(null);
        await fetchMessages();
      }
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-wrap">
        <div className="admin-top">
          <div>
            <div className="admin-title">Messages de contact</div>
            <div className="admin-sub">Consulter, filtrer et traiter les demandes envoyées depuis la page Contact</div>
          </div>
          <div className="admin-actions">
            <button className="admin-btn" onClick={() => navigate('/dashboard')}>← Retour</button>
            <button className="admin-btn" onClick={() => fetchMessages()} disabled={loading}>Actualiser</button>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Messages affichés</div>
            <div className="kpi-value">{messages.length}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">À traiter</div>
            <div className="kpi-value">{unreadCount}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Total filtré</div>
            <div className="kpi-value">{pagination.count}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Page</div>
            <div className="kpi-value">{pagination.page}</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Filtres</div>
          <div className="filter-row">
            <div className="filter-field">
              <label>Recherche</label>
              <input
                value={filters.search}
                onChange={(e) => setFilters(s => ({ ...s, search: e.target.value }))}
                placeholder="Nom, email, téléphone, message..."
              />
            </div>
            <div className="filter-field">
              <label>Motif</label>
              <select value={filters.motif} onChange={(e) => setFilters(s => ({ ...s, motif: e.target.value }))}>
                {motifOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>Statut</label>
              <select value={filters.traite} onChange={(e) => setFilters(s => ({ ...s, traite: e.target.value }))}>
                <option value="">Tous</option>
                <option value="false">À traiter</option>
                <option value="true">Traités</option>
              </select>
            </div>
            <button className="admin-btn admin-btn--primary" onClick={applyFilters} disabled={loading}>Appliquer</button>
          </div>
          {error && <div className="admin-error">{error}</div>}
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Liste des messages</div>
          <div className="filter-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="muted" style={{ fontSize: 13 }}>Total: <strong>{pagination.count}</strong></div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="admin-btn" onClick={() => goPage(pagination.page - 1)} disabled={loading || pagination.page <= 1}>Précédent</button>
              <button className="admin-btn" onClick={() => goPage(pagination.page + 1)} disabled={loading || (pagination.page * pagination.page_size) >= pagination.count}>Suivant</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="admin-table" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Référence</th>
                  <th>Motif</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className="row-click" onClick={() => setSelected(m)}>
                    <td>{formatDateTime(m.created_at)}</td>
                    <td>
                      <strong>{m.prenom} {m.nom}</strong>
                      <div className="muted" style={{ fontSize: 12 }}>{m.email}</div>
                    </td>
                    <td>{m.reference_reservation || '-'}</td>
                    <td>{m.motif_display}</td>
                    <td><StatusBadge traite={m.traite} /></td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr><td colSpan={5} className="empty">Aucun message</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Détail du message</div>
          {!selected ? (
            <div className="empty">Sélectionnez un message pour consulter son contenu.</div>
          ) : (
            <>
              <div className="kv">
                <div><span>Client</span><strong>{selected.prenom} {selected.nom}</strong></div>
                <div><span>Statut</span><StatusBadge traite={selected.traite} /></div>
                <div><span>Email</span><strong>{selected.email}</strong></div>
                <div><span>Téléphone</span><strong>{selected.telephone || '-'}</strong></div>
                <div><span>Référence</span><strong>{selected.reference_reservation || '-'}</strong></div>
                <div><span>Motif</span><strong>{selected.motif_display}</strong></div>
                <div><span>Reçu le</span><strong>{formatDateTime(selected.created_at)}</strong></div>
              </div>
              <div className="sep" />
              <div className="admin-card-subtitle">Message</div>
              <div className="contact-message-box">{selected.message}</div>
              <div className="admin-modal-actions">
                <button className="admin-btn" onClick={() => toggleTraite(selected)} disabled={loading}>
                  {selected.traite ? 'Marquer à traiter' : 'Marquer traité'}
                </button>
                <a className="admin-btn" href={`mailto:${selected.email}`}>Répondre</a>
                <button className="admin-btn admin-btn--danger" onClick={() => deleteMessage(selected)}>Supprimer</button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        loading={loading}
        onCancel={() => { setConfirm(s => ({ ...s, open: false })); setPendingAction(null); }}
        onConfirm={async () => {
          const action = pendingAction;
          setConfirm(s => ({ ...s, open: false }));
          setPendingAction(null);
          if (action) await action();
        }}
      />
    </div>
  );
}
