
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authStore from '../store/authStore';
import adminReservationStore from '../store/adminReservationStore';
import api from '../api/axiosConfig';
import MessagePopup from './MessagePopup';
import './admin.css';


function Badge({ statut }) {
  const cls = {
    en_attente: 'badge badge--pending',
    confirmee: 'badge badge--ok',
    annulee: 'badge badge--bad',
    terminee: 'badge badge--muted',
  }[statut] ?? 'badge';

  const label = {
    en_attente: 'En attente',
    confirmee: 'Confirmée',
    annulee: 'Annulée',
    terminee: 'Terminée',
  }[statut] ?? statut;

  return <span className={cls}>{label}</span>;
}


export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = authStore();
  const {
    reservations, loading, error, filters, pagination, search, terrains, creneaux,
    setFilters, setSearch, setPage, fetchReservations, fetchTerrains, fetchCreneaux, createPaiementManuel, clearError,
  } = adminReservationStore();
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    terrain_id: '',
    date_reservation: '',
    creneau_id: '',
  });
  const [manualError, setManualError] = useState('');
  const [popup, setPopup] = useState({ open: false, title: '', message: '', type: 'error' });

  useEffect(() => { fetchReservations(); fetchTerrains(); }, []);
  useEffect(() => {
    if (manualForm.date_reservation && manualForm.terrain_id) {
      fetchCreneaux(manualForm.date_reservation, manualForm.terrain_id);
    }
  }, [manualForm.date_reservation, manualForm.terrain_id]);

  const updateManualForm = (patch) => {
    setManualError('');
    setManualForm((s) => ({ ...s, ...patch }));
  };
  const resetManualForm = () => {
    setManualError('');
    setManualForm({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    terrain_id: '',
    date_reservation: '',
    creneau_id: '',
    });
  };
  const manualFormValid = Object.values(manualForm).every((value) => String(value).trim());

  const submitPaiementManuel = async () => {
    if (!manualFormValid) {
      setManualError('Veuillez remplir toutes les informations du client, le terrain, la date et le créneau.');
      return;
    }
    const created = await createPaiementManuel({
      ...manualForm,
      terrain_id: Number(manualForm.terrain_id),
      creneau_id: Number(manualForm.creneau_id),
    });
    if (created) {
      resetManualForm();
      setManualOpen(false);
      navigate(`/dashboard/reservations/${created.id}`);
    } else {
      setManualError(error || 'Impossible de créer le paiement manuel. Vérifiez les informations saisies.');
    }
  };

  const downloadReservationsJourPdf = async () => {
    try {
      const { data } = await api.get('/admin/reservations/confirmations-du-jour/pdf/', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10).replaceAll('-', '_');
      link.href = url;
      link.download = `reservations_confirmees_${today}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setPopup({ open: true, title: 'Téléchargement lancé', message: 'Le PDF des matchs du jour est en cours de téléchargement.', type: 'success' });
    } catch {
      setPopup({ open: true, title: 'Erreur', message: 'Impossible de télécharger le PDF des matchs du jour.', type: 'error' });
    }
  };

  const kpis = useMemo(() => {
    const total = reservations.length;
    const attente = reservations.filter(r => r.statut === 'en_attente').length;
    const conf = reservations.filter(r => r.statut === 'confirmee').length;
    const paye = reservations.filter(r => r.paiement?.statut === 'paye').length;
    return { total, attente, conf, paye };
  }, [reservations]);

  return (
    <div className="admin-page">
      <div className="admin-wrap">
        <div className="admin-top">
          <div>
            <div className="admin-title">Dashboard</div>
            <div className="admin-sub">Bienvenue, <strong>{user?.username ?? 'Admin'}</strong></div>
          </div>
          <div className="admin-actions">
            <button className="admin-btn admin-btn--primary" onClick={() => setManualOpen(true)}>
              Reservation sur place
            </button>
            <button className="admin-btn" onClick={() => navigate('/dashboard/terrains')}>Terrains</button>
            <button className="admin-btn" onClick={() => navigate('/dashboard/creneaux')}>Créneaux</button>
            <button className="admin-btn" onClick={() => navigate('/dashboard/facturation')}>Facturation</button>
            <button className="admin-btn" onClick={() => navigate('/dashboard/contact-messages')}>Messages</button>
            <button className="admin-btn" onClick={fetchReservations} disabled={loading}>
              Actualiser
            </button>
          </div>
        </div>

        {manualOpen && (
          <div className="admin-card">
            <div className="admin-card-title">Ajouter manuellement un paiement sur place</div>
            <div className="admin-sub" style={{ marginBottom: 12 }}>
              La réservation sera créée avec une référence automatique, paiement espèces payé et statut confirmé.
            </div>
            {manualError && <div className="admin-error" style={{ marginBottom: 12 }}>{manualError}</div>}
            <div className="form-row">
              <div className="filter-field">
                <label>Nom</label>
                <input value={manualForm.nom} onChange={(e) => updateManualForm({ nom: e.target.value })} />
              </div>
              <div className="filter-field">
                <label>Prénom</label>
                <input value={manualForm.prenom} onChange={(e) => updateManualForm({ prenom: e.target.value })} />
              </div>
              <div className="filter-field">
                <label>Téléphone</label>
                <input value={manualForm.telephone} onChange={(e) => updateManualForm({ telephone: e.target.value })} />
              </div>
              <div className="filter-field">
                <label>Email</label>
                <input type="email" value={manualForm.email} onChange={(e) => updateManualForm({ email: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="filter-field">
                <label>Terrain</label>
                <select value={manualForm.terrain_id} onChange={(e) => updateManualForm({ terrain_id: e.target.value, creneau_id: '' })}>
                  <option value="">Choisir</option>
                  {terrains.map((t) => (
                    <option key={t.id} value={t.id}>{t.nom}</option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label>Date</label>
                <input type="date" value={manualForm.date_reservation} onChange={(e) => updateManualForm({ date_reservation: e.target.value, creneau_id: '' })} />
              </div>
              <div className="filter-field">
                <label>Créneau</label>
                <select value={manualForm.creneau_id} onChange={(e) => updateManualForm({ creneau_id: e.target.value })}>
                  <option value="">Choisir</option>
                  {creneaux.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.disponible === false}>
                      {String(c.heure_debut).slice(0, 5)} – {String(c.heure_fin).slice(0, 5)}
                      {c.disponible === false ? ' — Indisponible' : ''}
                    </option>
                  ))}
                </select>
                {manualForm.date_reservation && manualForm.terrain_id && creneaux.length === 0 && (
                  <div className="muted" style={{ fontSize: 12 }}>Aucun créneau trouvé pour cette date.</div>
                )}
              </div>
            </div>
            <div className="admin-actions" style={{ marginTop: 12 }}>
              <button className="admin-btn" onClick={() => { resetManualForm(); setManualOpen(false); }} disabled={loading}>
                Annuler
              </button>
              <button className="admin-btn admin-btn--primary" onClick={submitPaiementManuel} disabled={loading || !manualFormValid}>
                Créer et marquer payé
              </button>
            </div>
          </div>
        )}

        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Réservations</div>
            <div className="kpi-value">{kpis.total}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">En attente</div>
            <div className="kpi-value">{kpis.attente}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Confirmées</div>
            <div className="kpi-value">{kpis.conf}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Paiements OK</div>
            <div className="kpi-value">{kpis.paye}</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Filtres</div>
          <div className="filter-row">
            <div className="filter-field">
              <label>Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ date: e.target.value })}
              />
            </div>
            <div className="filter-field">
              <label>Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters({ statut: e.target.value })}
              >
                <option value="">Tous</option>
                <option value="en_attente">En attente</option>
                <option value="confirmee">Confirmée</option>
                <option value="annulee">Annulée</option>
                <option value="terminee">Terminée</option>
              </select>
            </div>
            <div className="filter-field">
              <label>Recherche</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Référence, client, téléphone, email, terrain..."
              />
            </div>
            <button className="admin-btn admin-btn--primary" onClick={() => fetchReservations({ page: 1 })} disabled={loading}>
              Appliquer
            </button>
            <button className="admin-btn" onClick={downloadReservationsJourPdf}>
              Match du jour pdf
            </button>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Réservations</div>
          <div className="filter-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="muted" style={{ fontSize: 13 }}>
              Total: <strong>{pagination.count}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="admin-btn"
                onClick={() => fetchReservations({ page: Math.max(1, pagination.page - 1) })}
                disabled={loading || pagination.page <= 1}
              >
                Précédent
              </button>
              <div className="muted" style={{ fontSize: 13 }}>
                Page <strong>{pagination.page}</strong>
              </div>
              <button
                className="admin-btn"
                onClick={() => fetchReservations({ page: pagination.page + 1 })}
                disabled={loading || (pagination.page * pagination.page_size) >= pagination.count}
              >
                Suivant
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Terrain</th>
                  <th>Créneau</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Paiement</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="row-click" onClick={() => navigate(`/dashboard/reservations/${r.id}`)}>
                    <td>{r.code_reference || `#${r.id}`}</td>
                    <td>{String(r.date_reservation).split('-').reverse().join('/')}</td>
                    <td>{r.terrain?.nom ?? '-'}</td>
                    <td>{r.creneau ? `${String(r.creneau.heure_debut).slice(0,5)}–${String(r.creneau.heure_fin).slice(0,5)}` : '-'}</td>
                    <td>{r.client ? `${r.client.prenom} ${r.client.nom}` : '-'}</td>
                    <td><Badge statut={r.statut} /></td>
                    <td>
                      {r.paiement
                        ? `${r.paiement.methode_display} • ${r.paiement.statut_display}`
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty">Aucune réservation</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <MessagePopup
        open={Boolean(error) || popup.open}
        title={error ? 'Information' : popup.title}
        message={error || popup.message}
        type={error ? 'error' : popup.type}
        onClose={() => {
          clearError();
          setPopup({ open: false, title: '', message: '', type: 'error' });
        }}
      />
    </div>
  );
}
