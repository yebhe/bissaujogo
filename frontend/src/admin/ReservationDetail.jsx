
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminReservationStore from '../store/adminReservationStore';
import ConfirmModal from './ConfirmModal';
import MessagePopup from './MessagePopup';
import api from '../api/axiosConfig';
import { downloadPdfResponse } from '../utils/download';
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


export default function ReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    selected, terrains, creneaux,
    loading, error,
    fetchReservation, fetchTerrains, fetchCreneaux,
    updateReservation, encaisser, marquerNonPaye, clearError,
  } = adminReservationStore();

  const [statut, setStatut] = useState('');
  const [note, setNote] = useState('');
  const [editMove, setEditMove] = useState({
    date_reservation: '',
    terrain_id: '',
    creneau_id: '',
  });
  const [cash, setCash] = useState({ methode: 'especes', reference: '' });
  const [histPage, setHistPage] = useState(1);
  const histPageSize = 7;

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

  useEffect(() => {
    fetchTerrains();
    fetchReservation(id, { historique_page: 1, historique_page_size: histPageSize });
  }, [id]);

  useEffect(() => {
    fetchReservation(id, { historique_page: histPage, historique_page_size: histPageSize });
  }, [histPage]);

  useEffect(() => {
    if (!selected) return;
    setStatut(selected.statut);
    setNote(selected.note ?? '');
    setEditMove({
      date_reservation: selected.date_reservation ?? '',
      terrain_id: selected.terrain?.id ?? '',
      creneau_id: selected.creneau?.id ?? '',
    });
  }, [selected]);

  useEffect(() => {
    if (!editMove.date_reservation || !editMove.terrain_id) return;
    fetchCreneaux(editMove.date_reservation, editMove.terrain_id);
  }, [editMove.date_reservation, editMove.terrain_id]);

  const recap = useMemo(() => {
    if (!selected) return null;
    const r = selected;
    return {
      id: r.id,
      reference: r.code_reference || `#${r.id}`,
      date: String(r.date_reservation).split('-').reverse().join('/'),
      terrain: r.terrain?.nom ?? '-',
      creneau: r.creneau ? `${String(r.creneau.heure_debut).slice(0,5)}–${String(r.creneau.heure_fin).slice(0,5)}` : '-',
      client: r.client ? `${r.client.prenom} ${r.client.nom}` : '-',
      tel: r.client?.telephone ?? '-',
      email: r.client?.email ?? '-',
    };
  }, [selected]);

  const doUpdateStatut = async () => {
    if (!selected) return;

    const isCancel = statut === 'annulee' && selected.statut !== 'annulee';
    askConfirm(
      {
        title: isCancel ? 'Annuler la réservation ?' : 'Modifier le statut ? ',
        message: isCancel
          ? 'Cette action va annuler la réservation. Voulez-vous continuer ?'
          : `Statut actuel: ${selected.statut}. Nouveau statut: ${statut}.`,
        confirmLabel: isCancel ? 'Annuler la réservation' : 'Appliquer',
        danger: isCancel,
      },
      async () => {
        const updated = await updateReservation(selected.id, { statut });
        if (updated) await fetchReservation(id, { historique_page: histPage, historique_page_size: histPageSize });
      }
    );
  };

  const doUpdateNote = async () => {
    if (!selected) return;
    askConfirm(
      {
        title: 'Enregistrer la note ? ',
        message: 'Confirmer la mise à jour de la note interne.',
        confirmLabel: 'Enregistrer',
      },
      async () => {
        const updated = await updateReservation(selected.id, { note });
        if (updated) await fetchReservation(id, { historique_page: histPage, historique_page_size: histPageSize });
      }
    );
  };

  const doMove = async () => {
    if (!selected) return;
    const payload = {};
    if (editMove.date_reservation) payload.date_reservation = editMove.date_reservation;
    if (editMove.terrain_id) payload.terrain_id = Number(editMove.terrain_id);
    if (editMove.creneau_id) payload.creneau_id = Number(editMove.creneau_id);

    askConfirm(
      {
        title: 'Déplacer la réservation ? ',
        message: 'Confirmer le déplacement (date/terrain/créneau).',
        confirmLabel: 'Déplacer',
      },
      async () => {
        const updated = await updateReservation(selected.id, payload);
        if (updated) await fetchReservation(id, { historique_page: histPage, historique_page_size: histPageSize });
      }
    );
  };

  const doEncaisser = async () => {
    if (!selected) return;
    if (selected.paiement?.statut === 'paye') return;
    askConfirm(
      {
        title: 'Marquer payé ? ',
        message: 'Le paiement en espèces sera marqué comme payé et la réservation sera automatiquement confirmée. Voulez-vous continuer ?',
        confirmLabel: 'Marquer payé',
      },
      async () => {
        const updated = await encaisser(selected.id, {
          methode: 'especes',
          reference: '',
        });
        if (updated) await fetchReservation(id, { historique_page: histPage, historique_page_size: histPageSize });
      }
    );
  };

  const doMarquerNonPaye = async () => {
    if (!selected) return;
    if (selected.paiement?.statut !== 'paye') return;
    askConfirm(
      {
        title: 'Marquer non payé ? ',
        message: 'Le paiement repassera en attente. La réservation ne sera pas annulée automatiquement.',
        confirmLabel: 'Marquer non payé',
        danger: true,
      },
      async () => {
        const updated = await marquerNonPaye(selected.id);
        if (updated) await fetchReservation(id, { historique_page: histPage, historique_page_size: histPageSize });
      }
    );
  };

  if (loading && !selected) {
    return (
      <div className="admin-page">
        <div className="admin-wrap">
          <div className="admin-card">Chargement…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-wrap">
        <div className="admin-top">
          <div>
            <div className="admin-title">Réservation {recap?.reference ?? `#${id}`}</div>
            <div className="admin-sub">Gérer la réservation</div>
          </div>
          <div className="admin-actions">
            <button className="admin-btn" onClick={() => navigate('/dashboard')}>← Retour</button>
            <button className="admin-btn" onClick={() => fetchReservation(id)} disabled={loading}>Actualiser</button>
          </div>
        </div>

        {selected && (
          <>
            <div className="admin-grid2">
              <div className="admin-card">
                <div className="admin-card-title">Résumé</div>
                <div className="kv">
                  <div><span>Référence réservation</span><strong>{recap.reference}</strong></div>
                  <div><span>Statut</span><strong><Badge statut={selected.statut} /></strong></div>
                  <div><span>Date</span><strong>{recap.date}</strong></div>
                  <div><span>Terrain</span><strong>{recap.terrain}</strong></div>
                  <div><span>Créneau</span><strong>{recap.creneau}</strong></div>
                  <div><span>Client</span><strong>{recap.client}</strong></div>
                  <div><span>Téléphone</span><strong>{recap.tel}</strong></div>
                  <div><span>Email</span><strong>{recap.email}</strong></div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-title">Paiement</div>
                {selected.paiement ? (
                  <div className="kv">
                    <div><span>Méthode</span><strong>{selected.paiement.methode_display}</strong></div>
                    <div><span>Statut</span><strong>{selected.paiement.statut_display}</strong></div>
                    {selected.paiement.reference && (
                      <div><span>Référence</span><strong>{selected.paiement.reference}</strong></div>
                    )}
                    <div><span>Montant</span><strong>{selected.paiement.montant} XOF</strong></div>
                  </div>
                ) : (
                  <div className="muted">Aucun paiement</div>
                )}

                <div className="sep" />
                <div className="admin-card-subtitle">Documents</div>
                <button
                  className="admin-btn"
                  type="button"
                  onClick={async () => {
                    if (!selected?.id) return;
                    try {
                      const res = await api.get(`/admin/reservations/${selected.id}/recu/`, { responseType: 'blob' });
                      downloadPdfResponse(res, `recu_bissaujogo_${selected.id}.pdf`);
                    } catch {
                      navigate(0);
                    }
                  }}
                  disabled={loading}
                >
                  Télécharger le reçu (PDF)
                </button>

                <div className="sep" />
                <div className="admin-card-subtitle">Encaissement sur place</div>
                <div className="form-row">
                  <div className="filter-field">
                    <label>Méthode</label>
                    <input value="Espèces" disabled />
                  </div>
                </div>
                <div className="admin-actions" style={{ justifyContent: 'flex-start' }}>
                  <button className="admin-btn admin-btn--primary" onClick={doEncaisser} disabled={loading || selected.paiement?.statut === 'paye'}>
                    {selected.paiement?.statut === 'paye' ? 'Paiement déjà payé' : 'Marquer payé'}
                  </button>
                  <button className="admin-btn admin-btn--danger" onClick={doMarquerNonPaye} disabled={loading || selected.paiement?.statut !== 'paye'}>
                    Marquer non payé
                  </button>
                </div>
              </div>
            </div>

            <div className="admin-grid2">
              <div className="admin-card">
                <div className="admin-card-title">Actions</div>
                <div className="form-row">
                  <div className="filter-field">
                    <label>Statut</label>
                    <select value={statut} onChange={(e) => setStatut(e.target.value)}>
                      <option value="en_attente">En attente</option>
                      <option value="confirmee">Confirmée</option>
                      <option value="annulee">Annulée</option>
                      <option value="terminee">Terminée</option>
                    </select>
                  </div>
                  <button className="admin-btn admin-btn--primary admin-btn--compact" onClick={doUpdateStatut} disabled={loading}>
                    Appliquer
                  </button>
                </div>

                <div className="sep" />
                <div className="admin-card-subtitle">Note</div>
                <textarea className="admin-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note interne…" />
                <button className="admin-btn" onClick={doUpdateNote} disabled={loading}>Enregistrer la note</button>
              </div>

              <div className="admin-card">
                <div className="admin-card-title">Déplacer la réservation</div>
                <div className="form-row">
                  <div className="filter-field">
                    <label>Date</label>
                    <input type="date" value={editMove.date_reservation} onChange={(e) => setEditMove(s => ({ ...s, date_reservation: e.target.value }))} />
                  </div>
                  <div className="filter-field">
                    <label>Terrain</label>
                    <select value={editMove.terrain_id} onChange={(e) => setEditMove(s => ({ ...s, terrain_id: e.target.value }))}>
                      <option value="">—</option>
                      {terrains.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="filter-field" style={{ flex: 1 }}>
                    <label>Créneau</label>
                    <select value={editMove.creneau_id} onChange={(e) => setEditMove(s => ({ ...s, creneau_id: e.target.value }))}>
                      <option value="">—</option>
                      {creneaux.map(c => (
                        <option key={c.id} value={c.id} disabled={!c.disponible && c.id !== selected.creneau?.id}>
                          {String(c.heure_debut).slice(0,5)}–{String(c.heure_fin).slice(0,5)}{!c.disponible && c.id !== selected.creneau?.id ? ' (pris)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="admin-btn admin-btn--primary" onClick={doMove} disabled={loading}>
                  Déplacer
                </button>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-title">Historique</div>
              {selected.historique_pagination && (
                <div className="filter-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Total: <strong>{selected.historique_pagination.count}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      className="admin-btn"
                      onClick={() => setHistPage(p => Math.max(1, p - 1))}
                      disabled={loading || (selected.historique_pagination.page ?? histPage) <= 1}
                    >
                      Précédent
                    </button>
                    <div className="muted" style={{ fontSize: 13 }}>
                      Page <strong>{selected.historique_pagination.page ?? histPage}</strong>
                    </div>
                    <button
                      className="admin-btn"
                      onClick={() => setHistPage(p => p + 1)}
                      disabled={loading || ((selected.historique_pagination.page ?? histPage) * (selected.historique_pagination.page_size ?? histPageSize)) >= (selected.historique_pagination.count ?? 0)}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
              <div className="timeline">
                {(selected.historique ?? []).map((h) => (
                  <div key={h.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-body">
                      <div className="timeline-top">
                        <strong>{h.action_display}</strong>
                        <span className="muted">{new Date(h.date_action).toLocaleString()}</span>
                      </div>
                      {h.details && <div className="timeline-details">{h.details}</div>}
                    </div>
                  </div>
                ))}
                {(selected.historique ?? []).length === 0 && (
                  <div className="empty">Aucun historique</div>
                )}
              </div>
            </div>
          </>
        )}
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
        onClose={clearError}
      />
    </div>
  );
}
