import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import ConfirmModal from './ConfirmModal';
import MessagePopup from './MessagePopup';
import './admin.css';

export default function Creneaux() {
  const navigate = useNavigate();
  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const [pagination, setPagination] = useState({ page: 1, page_size: 50, count: 0 });
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ heure_debut: '08:00', heure_fin: '09:00', actif: true });
  const [gen, setGen] = useState({ heure_debut: '08:00', heure_fin: '22:00', duree_min: 60 });

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/creneaux/', {
        params: {
          page: pagination.page,
          page_size: pagination.page_size,
          search: search.trim() || undefined,
        },
      });
      setCreneaux(data.results ?? []);
      setPagination({
        page: data.page ?? pagination.page,
        page_size: data.page_size ?? pagination.page_size,
        count: data.count ?? 0,
      });
    } catch {
      setError('Impossible de charger les créneaux.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [pagination.page]);

  const createOne = async () => {
    askConfirm(
      {
        title: 'Créer ce créneau ? ',
        message: `${form.heure_debut} → ${form.heure_fin} • Actif: ${form.actif ? 'Oui' : 'Non'}`,
        confirmLabel: 'Créer',
      },
      async () => {
        setLoading(true);
        setError(null);
        try {
          await api.post('/admin/creneaux/', {
            heure_debut: form.heure_debut,
            heure_fin: form.heure_fin,
            actif: form.actif,
          });
          setPagination(s => ({ ...s, page: 1 }));
          await fetchAll();
        } catch {
          setError('Créneau invalide ou déjà existant.');
          setLoading(false);
        }
      }
    );
  };

  const deleteOne = async (c) => {
    askConfirm(
      {
        title: 'Supprimer ce créneau ? ',
        message: `${String(c.heure_debut).slice(0,5)} → ${String(c.heure_fin).slice(0,5)} • Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
        danger: true,
      },
      async () => {
        setLoading(true);
        setError(null);
        try {
          await api.delete(`/admin/creneaux/${c.id}/`);
          setPagination(s => ({ ...s, page: 1 }));
          await fetchAll();
        } catch (err) {
          const msg = err.response?.data?.error ?? 'Impossible de supprimer le créneau.';
          setError(msg);
          setLoading(false);
        }
      }
    );
  };

  const toggleActif = async (c) => {
    const danger = c.actif;
    askConfirm(
      {
        title: danger ? 'Désactiver ce créneau ?' : 'Activer ce créneau ? ',
        message: `${String(c.heure_debut).slice(0,5)} → ${String(c.heure_fin).slice(0,5)}`,
        confirmLabel: danger ? 'Désactiver' : 'Activer',
        danger,
      },
      async () => {
        setLoading(true);
        setError(null);
        try {
          await api.patch(`/admin/creneaux/${c.id}/`, { actif: !c.actif });
          await fetchAll();
        } catch {
          setError('Impossible de modifier le créneau.');
          setLoading(false);
        }
      }
    );
  };

  const generate = async () => {
    askConfirm(
      {
        title: 'Générer les créneaux ? ',
        message: `Début: ${gen.heure_debut} • Fin: ${gen.heure_fin} • Durée: ${gen.duree_min} min`,
        confirmLabel: 'Générer',
      },
      async () => {
        setLoading(true);
        setError(null);
        try {
          await api.post('/admin/creneaux/generate/', gen);
          setPagination(s => ({ ...s, page: 1 }));
          await fetchAll();
        } catch {
          setError('Impossible de générer les créneaux.');
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-wrap">
        <div className="admin-top">
          <div>
            <div className="admin-title">Créneaux</div>
            <div className="admin-sub">Gérer les créneaux (1h) et générer automatiquement une grille</div>
          </div>
          <div className="admin-actions">
            <button className="admin-btn" onClick={() => navigate('/dashboard')}>← Retour</button>
            <button className="admin-btn" onClick={fetchAll} disabled={loading}>Actualiser</button>
          </div>
        </div>

        <div className="admin-grid2">
          <div className="admin-card">
            <div className="admin-card-title">Créer un créneau</div>
            <div className="form-row">
              <div className="filter-field">
                <label>Début</label>
                <input type="time" value={form.heure_debut} onChange={(e) => setForm(s => ({ ...s, heure_debut: e.target.value }))} />
              </div>
              <div className="filter-field">
                <label>Fin</label>
                <input type="time" value={form.heure_fin} onChange={(e) => setForm(s => ({ ...s, heure_fin: e.target.value }))} />
              </div>
              <div className="filter-field">
                <label>Actif</label>
                <select value={form.actif ? '1' : '0'} onChange={(e) => setForm(s => ({ ...s, actif: e.target.value === '1' }))}>
                  <option value="1">Oui</option>
                  <option value="0">Non</option>
                </select>
              </div>
              <button className="admin-btn admin-btn--primary" onClick={createOne} disabled={loading}>Créer</button>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-title">Générer automatiquement</div>
            <div className="form-row">
              <div className="filter-field">
                <label>Début</label>
                <input type="time" value={gen.heure_debut} onChange={(e) => setGen(s => ({ ...s, heure_debut: e.target.value }))} />
              </div>
              <div className="filter-field">
                <label>Fin</label>
                <input type="time" value={gen.heure_fin} onChange={(e) => setGen(s => ({ ...s, heure_fin: e.target.value }))} />
              </div>
              <div className="filter-field">
                <label>Durée (min)</label>
                <input type="number" value={gen.duree_min} onChange={(e) => setGen(s => ({ ...s, duree_min: Number(e.target.value) }))} />
              </div>
              <button className="admin-btn admin-btn--primary" onClick={generate} disabled={loading}>Générer</button>
            </div>
            <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              Exemple: 08:00 → 22:00 en 60 min crée: 08-09, 09-10, ...
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Liste des créneaux</div>
          <div className="filter-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="filter-field">
              <label>Recherche</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ex: 08:00" />
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
            <table className="admin-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Actif</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {creneaux.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>{String(c.heure_debut).slice(0,5)}</td>
                    <td>{String(c.heure_fin).slice(0,5)}</td>
                    <td>{c.actif ? 'Oui' : 'Non'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="admin-btn admin-btn--compact" onClick={() => toggleActif(c)} disabled={loading}>
                          {c.actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <button className="admin-btn admin-btn--compact admin-btn--danger" onClick={() => deleteOne(c)} disabled={loading}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {creneaux.length === 0 && (
                  <tr><td colSpan={5} className="empty">Aucun créneau</td></tr>
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
        open={Boolean(error)}
        title="Information"
        message={error}
        type="error"
        onClose={() => setError(null)}
      />
    </div>
  );
}
