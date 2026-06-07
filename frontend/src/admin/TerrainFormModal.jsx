import React, { useEffect, useState } from 'react';

export default function TerrainFormModal({
  open,
  title,
  initial,
  confirmLabel = 'Enregistrer',
  onCancel,
  onConfirm,
  loading = false,
}) {
  const [form, setForm] = useState({ nom: '', adresse: '', photo: null, prix_reservation: 12000, actif: true });

  useEffect(() => {
    if (!open) return;
    setForm({
      nom: initial?.nom ?? '',
      adresse: initial?.adresse ?? '',
      photo: null,
      prix_reservation: initial?.prix_reservation ?? 12000,
      actif: initial?.actif ?? true,
    });
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="admin-modal" role="dialog" aria-modal="true">
      <div className="admin-modal-backdrop" onClick={onCancel} />
      <div className="admin-modal-card">
        <div className="admin-modal-title">{title}</div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <div className="filter-field" style={{ flex: 1, minWidth: 240 }}>
            <label>Nom</label>
            <input
              value={form.nom}
              onChange={(e) => setForm(s => ({ ...s, nom: e.target.value }))}
              placeholder="Ex: Terrain A"
            />
          </div>
          <div className="filter-field" style={{ flex: 1, minWidth: 240 }}>
            <label>Adresse</label>
            <input
              value={form.adresse}
              onChange={(e) => setForm(s => ({ ...s, adresse: e.target.value }))}
              placeholder="Ex: Bairro..., Bissau"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="filter-field" style={{ flex: 1, minWidth: 240 }}>
            <label>Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm(s => ({ ...s, photo: e.target.files?.[0] ?? null }))}
            />
            {initial?.photo_url ? (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <img
                  src={initial.photo_url}
                  alt={initial.nom}
                  style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <span style={{ fontSize: 13, color: '#475569' }}>
                  Choisir une nouvelle photo remplacera automatiquement l’actuelle.
                </span>
              </div>
            ) : null}
          </div>
          <div className="filter-field">
            <label>Prix (XOF)</label>
            <input
              type="number"
              value={form.prix_reservation}
              onChange={(e) => setForm(s => ({ ...s, prix_reservation: Number(e.target.value) }))}
              min={0}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="filter-field">
            <label>Actif</label>
            <select
              value={form.actif ? '1' : '0'}
              onChange={(e) => setForm(s => ({ ...s, actif: e.target.value === '1' }))}
            >
              <option value="1">Oui</option>
              <option value="0">Non</option>
            </select>
          </div>
        </div>

        <div className="admin-modal-actions">
          <button className="admin-btn" type="button" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button
            className="admin-btn admin-btn--primary"
            type="button"
            onClick={() => {
              const fd = new FormData();
              fd.append('nom', form.nom.trim());
              fd.append('adresse', form.adresse.trim());
              fd.append('prix_reservation', String(Number(form.prix_reservation)));
              fd.append('actif', form.actif ? 'true' : 'false');
              if (form.photo) fd.append('photo', form.photo);

              onConfirm(fd);
            }}
            disabled={loading || !form.nom.trim()}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
