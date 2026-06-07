import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminReservationStore from '../store/adminReservationStore';
import api from '../api/axiosConfig';
import ConfirmModal from './ConfirmModal';
import MessagePopup from './MessagePopup';
import TerrainFormModal from './TerrainFormModal';
import './admin.css';

const getApiErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.error) return data.error;
  const firstKey = Object.keys(data)[0];
  const firstValue = firstKey ? data[firstKey] : null;
  if (Array.isArray(firstValue)) return `${firstKey}: ${firstValue.join(' ')}`;
  if (firstValue) return `${firstKey}: ${firstValue}`;
  return fallback;
};

export default function Terrains() {
  const navigate = useNavigate();
  const { loading, error } = adminReservationStore();
  const [terrains, setTerrains] = useState([]);
  const [localError, setLocalError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, count: 0 });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nom: '', adresse: '', photo: null, prix_reservation: 12000, actif: true });

  const [editModal, setEditModal] = useState({ open: false, terrain: null });
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmer',
    danger: false,
  });
  const [pendingAction, setPendingAction] = useState(null);

  const askConfirm = ({ title, message, confirmLabel = 'Confirmer', danger = false }, action) => {
    setConfirm({ open: true, title, message, confirmLabel, danger });
    setPendingAction(() => action);
  };

  const fetchAll = async () => {
    setLocalError('');
    try {
      const { data } = await api.get('/admin/terrains/', {
        params: {
          page: pagination.page,
          page_size: pagination.page_size,
          search: search.trim() || undefined,
        },
      });
      setTerrains(data.results ?? []);
      setPagination({
        page: data.page ?? pagination.page,
        page_size: data.page_size ?? pagination.page_size,
        count: data.count ?? 0,
      });
    } catch {
      setLocalError('Impossible de charger les terrains.');
    }
  };

  useEffect(() => { fetchAll(); }, [pagination.page]);

  const createTerrain = async () => {
    if (!form.nom.trim()) return;
    askConfirm(
      {
        title: 'Créer ce terrain ? ',
        message: `Nom: ${form.nom.trim()}${form.adresse.trim() ? ` • Adresse: ${form.adresse.trim()}` : ''}`,
        confirmLabel: 'Créer',
      },
      async () => {
        try {
          setLocalError('');
          const fd = new FormData();
          fd.append('nom', form.nom.trim());
          fd.append('adresse', form.adresse.trim());
          fd.append('prix_reservation', String(Number(form.prix_reservation)));
          fd.append('actif', form.actif ? 'true' : 'false');
          if (form.photo) fd.append('photo', form.photo);

          await api.post('/admin/terrains/', fd);
          setForm({ nom: '', adresse: '', photo: null, prix_reservation: 12000, actif: true });
          setPagination(s => ({ ...s, page: 1 }));
          await fetchAll();
        } catch (err) {
          setLocalError(getApiErrorMessage(err, 'Impossible de créer le terrain.'));
        }
      }
    );
  };

  const deleteTerrain = async (t) => {
    askConfirm(
      {
        title: 'Supprimer ce terrain ? ',
        message: `${t.nom}${t.adresse ? ` — ${t.adresse}` : ''}`,
        confirmLabel: 'Supprimer',
        danger: true,
      },
      async () => {
        try {
          setLocalError('');
          await api.delete(`/admin/terrains/${t.id}/`);
          await fetchAll();
        } catch (err) {
          const msg = err.response?.data?.error ?? 'Impossible de supprimer le terrain.';
          setLocalError(msg);
        }
      }
    );
  };

  const toggleActif = async (t) => {
    const danger = t.actif;
    askConfirm(
      {
        title: danger ? 'Désactiver ce terrain ?' : 'Activer ce terrain ? ',
        message: `${t.nom}${t.adresse ? ` — ${t.adresse}` : ''}`,
        confirmLabel: danger ? 'Désactiver' : 'Activer',
        danger,
      },
      async () => {
        try {
          setLocalError('');
          await api.patch(`/admin/terrains/${t.id}/`, { actif: !t.actif });
          await fetchAll();
        } catch (err) {
          const msg = err.response?.data?.error ?? 'Impossible de modifier le terrain.';
          setLocalError(msg);
        }
      }
    );
  };

  const openEdit = (t) => {
    setEditModal({ open: true, terrain: t });
  };

  return (
    <div className="admin-page">
      <div className="admin-wrap">
        <div className="admin-top">
          <div>
            <div className="admin-title">Terrains</div>
            <div className="admin-sub">Créer et activer/désactiver les terrains</div>
          </div>
          <div className="admin-actions">
            <button className="admin-btn" onClick={() => navigate('/dashboard')}>← Retour</button>
            <button className="admin-btn" onClick={fetchAll} disabled={loading || saving}>Actualiser</button>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Créer un terrain</div>
          <div className="form-row">
            <div className="filter-field">
              <label>Nom</label>
              <input value={form.nom} onChange={(e) => setForm(s => ({ ...s, nom: e.target.value }))} placeholder="Ex: Terrain A" />
            </div>
            <div className="filter-field">
              <label>Adresse</label>
              <input value={form.adresse} onChange={(e) => setForm(s => ({ ...s, adresse: e.target.value }))} placeholder="Ex: Bairro..., Bissau" />
            </div>
            <div className="filter-field">
              <label>Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm(s => ({ ...s, photo: e.target.files?.[0] ?? null }))}
              />
            </div>
            <div className="filter-field">
              <label>Prix (XOF)</label>
              <input type="number" value={form.prix_reservation} onChange={(e) => setForm(s => ({ ...s, prix_reservation: Number(e.target.value) }))} min={0} />
            </div>
            <div className="filter-field">
              <label>Actif</label>
              <select value={form.actif ? '1' : '0'} onChange={(e) => setForm(s => ({ ...s, actif: e.target.value === '1' }))}>
                <option value="1">Oui</option>
                <option value="0">Non</option>
              </select>
            </div>
            <button className="admin-btn admin-btn--primary" onClick={createTerrain} disabled={loading}>Créer</button>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Liste</div>
          <div className="filter-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="filter-field">
              <label>Recherche</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom du terrain..." />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="admin-btn admin-btn--primary" onClick={() => { setPagination(s => ({ ...s, page: 1 })); fetchAll(); }} disabled={loading}>Chercher</button>
              <div className="muted" style={{ fontSize: 13 }}>Total: <strong>{pagination.count}</strong></div>
              <button className="admin-btn" onClick={() => setPagination(s => ({ ...s, page: Math.max(1, s.page - 1) }))} disabled={loading || pagination.page <= 1}>Précédent</button>
              <div className="muted" style={{ fontSize: 13 }}>Page <strong>{pagination.page}</strong></div>
              <button className="admin-btn" onClick={() => setPagination(s => ({ ...s, page: s.page + 1 }))} disabled={loading || (pagination.page * pagination.page_size) >= pagination.count}>Suivant</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="admin-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Adresse</th>
                  <th>Actif</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {terrains.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td>{t.nom}</td>
                    <td>{t.adresse || '-'}</td>
                    <td>{t.actif ? 'Oui' : 'Non'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="admin-btn admin-btn--compact" onClick={() => openEdit(t)}>Modifier</button>
                        <button className={`admin-btn admin-btn--compact ${t.actif ? '' : 'admin-btn--primary'}`} onClick={() => toggleActif(t)}>
                          {t.actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <button className="admin-btn admin-btn--compact admin-btn--danger" onClick={() => deleteTerrain(t)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {terrains.length === 0 && (
                  <tr><td colSpan={5} className="empty">Aucun terrain</td></tr>
                )}
              </tbody>
            </table>
          </div>
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

      <MessagePopup
        open={Boolean(error || localError)}
        title="Information"
        message={error || localError}
        type="error"
        onClose={() => setLocalError('')}
      />

      <TerrainFormModal
        open={editModal.open}
        title={editModal.terrain ? `Modifier — ${editModal.terrain.nom}` : 'Modifier'}
        initial={editModal.terrain}
        confirmLabel="Enregistrer"
        loading={saving}
        onCancel={() => setEditModal({ open: false, terrain: null })}
        onConfirm={async (payload) => {
          if (!editModal.terrain) return;
          setSaving(true);
          try {
            setLocalError('');
            await api.patch(`/admin/terrains/${editModal.terrain.id}/`, payload);
            setEditModal({ open: false, terrain: null });
            await fetchAll();
          } catch (err) {
            setLocalError(getApiErrorMessage(err, 'Impossible de modifier le terrain.'));
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
