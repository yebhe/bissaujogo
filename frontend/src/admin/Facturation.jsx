import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { downloadPdfResponse } from '../utils/download';
import './admin.css';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const toXof = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return `${value} XOF`;
  return `${n.toLocaleString('fr-FR')} XOF`;
};

export default function Facturation() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y, y - 1, y - 2];
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/facturation/', {
        params: {
          year,
          month: month || undefined,
        },
      });
      setData(res.data);
    } catch {
      setError('Impossible de charger la facturation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [year, month]);

  const downloadReport = async ({ year, month }) => {
    try {
      const res = await api.get(`/admin/facturation/rapport/`, {
        params: { year, month: month || undefined },
        responseType: 'blob',
      });
      downloadPdfResponse(
        res,
        month ? `rapport_facturation_${year}_${String(month).padStart(2, '0')}.pdf` : `rapport_facturation_${year}.pdf`
      );
    } catch {
      setError("Impossible de télécharger le rapport PDF.");
    }
  };

  const yearTotal = data?.stats?.year_total ?? '0';
  const monthTotal = useMemo(() => {
    if (!month) return '0';
    const m = Number(month);
    const row = (data?.stats?.by_month ?? []).find(x => Number(x.month) === m);
    return row?.total ?? '0';
  }, [data, month]);

  return (
    <div className="admin-page">
      <div className="admin-wrap">
        <div className="admin-top">
          <div>
            <div className="admin-title">Facturation</div>
            <div className="admin-sub">Suivi des gains par mois / année et téléchargement des reçus PDF</div>
          </div>
          <div className="admin-actions">
            <button className="admin-btn" onClick={() => navigate('/dashboard')}>← Retour</button>
            <button className="admin-btn" onClick={fetchData} disabled={loading}>Actualiser</button>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Filtres</div>
          <div className="filter-row">
            <div className="filter-field">
              <label>Année</label>
              <select value={String(year)} onChange={(e) => { setYear(Number(e.target.value)); }}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>Mois</label>
              <select value={month} onChange={(e) => { setMonth(e.target.value); }}>
                <option value="">Tous</option>
                {MOIS.map((m, idx) => (
                  <option key={m} value={String(idx + 1)}>{m}</option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Total année</label>
              <input value={toXof(yearTotal)} readOnly />
            </div>
            <div className="filter-field">
              <label>Total mois</label>
              <input value={toXof(monthTotal)} readOnly />
            </div>
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => downloadReport({ year })}
              disabled={loading}
            >
              Télécharger rapport annuel (PDF)
            </button>
            <button
              className="admin-btn"
              onClick={() => downloadReport({ year, month: Number(month) })}
              disabled={loading || !month}
            >
              Télécharger rapport du mois (PDF)
            </button>
          </div>
          {error && <div className="admin-error">{error}</div>}
        </div>

        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="kpi">
            <div className="kpi-label">Total année ({year})</div>
            <div className="kpi-value">{toXof(yearTotal)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Total mois {month ? MOIS[Number(month) - 1] : '—'}</div>
            <div className="kpi-value">{month ? toXof(monthTotal) : '—'}</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Stats par mois</div>
          <div className="table-wrap">
            <table className="admin-table" style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.stats?.by_month ?? []).map((row) => {
                  const isSel = month && Number(month) === Number(row.month);
                  return (
                    <tr key={row.month} style={isSel ? { background: '#fbfdff' } : undefined}>
                      <td>
                        <strong>{MOIS[(row.month ?? 1) - 1]}</strong>
                        <span className="muted">{' '}{year}</span>
                      </td>
                      <td><strong>{toXof(row.total)}</strong></td>
                    </tr>
                  );
                })}
                {!loading && (data?.stats?.by_month ?? []).length === 0 && (
                  <tr><td colSpan={2} className="empty">Aucune donnée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
