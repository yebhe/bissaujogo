import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import authStore from '../store/authStore';
import './admin.css';

export default function Profil() {
  const navigate = useNavigate();
  const { user, loading, error, fetchMe, updateMe } = authStore();

  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
  });

  const [pwd, setPwd] = useState({ old_password: '', new_password: '', new_password_confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState(null);
  const [pwdOk, setPwdOk] = useState(null);

  useEffect(() => {
    if (!user) fetchMe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm({
      username: user.username ?? '',
      email: user.email ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
    });
  }, [user]);

  const changed = useMemo(() => {
    if (!user) return false;
    return (
      (form.username ?? '') !== (user.username ?? '') ||
      (form.email ?? '') !== (user.email ?? '') ||
      (form.first_name ?? '') !== (user.first_name ?? '') ||
      (form.last_name ?? '') !== (user.last_name ?? '')
    );
  }, [form, user]);

  const submit = async (e) => {
    e.preventDefault();
    const patch = {
      username: form.username.trim(),
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
    };
    await updateMe(patch);
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPwdOk(null);
    setPwdError(null);

    if (!pwd.old_password || !pwd.new_password || !pwd.new_password_confirm) {
      setPwdError('Veuillez renseigner tous les champs.');
      return;
    }
    if (pwd.new_password !== pwd.new_password_confirm) {
      setPwdError('Les mots de passe ne correspondent pas.');
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/me/password/', {
        old_password: pwd.old_password,
        new_password: pwd.new_password,
        new_password_confirm: pwd.new_password_confirm,
      });
      setPwd({ old_password: '', new_password: '', new_password_confirm: '' });
      setPwdOk('Mot de passe mis à jour avec succès.');
    } catch (err) {
      const data = err.response?.data;
      const msg = data
        ? Object.values(data).flat().join(' ')
        : 'Impossible de mettre à jour le mot de passe.';
      setPwdError(msg);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-wrap">
        <div className="admin-top">
          <div>
            <div className="admin-title">Profil administrateur</div>
            <div className="admin-sub">Gérez les informations de votre compte</div>
          </div>
          <div className="admin-actions">
            <button className="admin-btn" onClick={() => navigate('/dashboard')}>← Retour</button>
            <button className="admin-btn" onClick={fetchMe} disabled={loading}>Actualiser</button>
          </div>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-grid2">
          <div className="admin-card">
            <div className="admin-card-title">Informations</div>

            <form onSubmit={submit}>
              <div className="filter-row">
                <div className="filter-field">
                  <label>Nom d'utilisateur</label>
                  <input value={form.username} onChange={(e) => setForm(s => ({ ...s, username: e.target.value }))} />
                </div>

                <div className="filter-field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))} />
                </div>

                <div className="filter-field">
                  <label>Prénom</label>
                  <input value={form.first_name} onChange={(e) => setForm(s => ({ ...s, first_name: e.target.value }))} />
                </div>

                <div className="filter-field">
                  <label>Nom</label>
                  <input value={form.last_name} onChange={(e) => setForm(s => ({ ...s, last_name: e.target.value }))} />
                </div>

                <button className="admin-btn admin-btn--primary" type="submit" disabled={loading || !changed}>
                  Enregistrer
                </button>
              </div>
            </form>

            {!user && loading && <div className="muted" style={{ marginTop: 10 }}>Chargement…</div>}
          </div>

          <div className="admin-card">
            <div className="admin-card-title">Compte</div>
            <div className="kv">
              <div><span>Superuser</span><strong>{user?.is_superuser ? 'Oui' : 'Non'}</strong></div>
              <div><span>Date de création</span><strong>{user?.date_joined ? new Date(user.date_joined).toLocaleString() : '-'}</strong></div>
              <div><span>Dernière connexion</span><strong>{user?.last_login ? new Date(user.last_login).toLocaleString() : '-'}</strong></div>
            </div>

            <div className="sep" />

            <div className="admin-card-title" style={{ marginBottom: 10 }}>Sécurité</div>
            {pwdError && <div className="admin-error">{pwdError}</div>}
            {pwdOk && (
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 14 }}>
                {pwdOk}
              </div>
            )}

            <form onSubmit={submitPassword}>
              <div className="filter-row">
                <div className="filter-field">
                  <label>Mot de passe actuel</label>
                  <input type="password" value={pwd.old_password} onChange={(e) => setPwd(s => ({ ...s, old_password: e.target.value }))} autoComplete="current-password" />
                </div>
                <div className="filter-field">
                  <label>Nouveau mot de passe</label>
                  <input type="password" value={pwd.new_password} onChange={(e) => setPwd(s => ({ ...s, new_password: e.target.value }))} autoComplete="new-password" />
                </div>
                <div className="filter-field">
                  <label>Confirmer</label>
                  <input type="password" value={pwd.new_password_confirm} onChange={(e) => setPwd(s => ({ ...s, new_password_confirm: e.target.value }))} autoComplete="new-password" />
                </div>
                <button className="admin-btn admin-btn--primary" type="submit" disabled={pwdLoading}>
                  {pwdLoading ? 'Mise à jour…' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
