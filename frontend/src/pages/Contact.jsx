import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { useI18n } from '../i18n';
import '../components/Login.css';
import './Contact.css';

function Contact() {
  const { t } = useI18n();
  const contact = t.contact;

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    reference_reservation: '',
    motif: 'autres_infos',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowSuccess(false);

    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim() || !form.message.trim()) {
      if (['annuler_reservation', 'modifier_reservation'].includes(form.motif)) {
        if (!form.email.trim() || !form.reference_reservation.trim() || !form.message.trim()) {
          setError(contact.requiredReservation);

          return;
        }
      } else {
        setError(contact.requiredAll);

        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/contact/', {
        nom: form.motif === 'autres_infos' ? form.nom.trim() : '',
        prenom: form.motif === 'autres_infos' ? form.prenom.trim() : '',
        email: form.email.trim(),
        telephone: form.motif === 'autres_infos' ? form.telephone.trim() : '',
        reference_reservation: form.reference_reservation.trim().toUpperCase(),
        motif: form.motif,
        message: form.message.trim(),
      });
      setSuccess(contact.success);

      setShowSuccess(true);
      setForm({ nom: '', prenom: '', email: '', telephone: '', reference_reservation: '', motif: 'autres_infos', message: '' });
    } catch (err) {

      const data = err.response?.data;
      const referenceError = data?.reference_reservation;
      const msg = referenceError
        ? contact.noReservation

        : data
          ? Object.values(data).flat().join(' ')
          : contact.sendError;

      setError(msg);
    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="login-page contact-page">
      <div className={`login-card ${(error || success) ? "" : ""}`}>

        <div className="login-top">
          <div className="login-ball">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="#0e3d70" strokeWidth="1.5"/>
              <polygon
                points="14,4 17.5,10 24,10 19,14.5 21,21 14,17.5 7,21 9,14.5 4,10 10.5,10"
                fill="#0e3d70"
                stroke="#0e3d70"
                strokeWidth=".5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="login-title">Foot<em>Field</em></h2>
          <p className="login-sub">{contact.subtitle}</p>
        </div>

        <form className="login-body" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login-error contact-full" role="alert">

              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="8" cy="11.5" r=".8" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          <div className="login-field contact-full">
            <label>{contact.reason}</label>
            <select value={form.motif} onChange={update('motif')}>
              <option value="annuler_reservation">{contact.cancel}</option>
              <option value="modifier_reservation">{contact.modify}</option>
              <option value="autres_infos">{contact.other}</option>
            </select>
          </div>

          {['annuler_reservation', 'modifier_reservation'].includes(form.motif) ? (
            <>
              <div className="login-field">
                <label>{contact.email}</label>
                <input type="email" value={form.email} onChange={update('email')} placeholder={contact.emailPlaceholder} autoComplete="email" />
              </div>

              <div className="login-field">
                <label>{contact.reservationRef}</label>
                <input value={form.reference_reservation} onChange={(e) => setForm(prev => ({ ...prev, reference_reservation: e.target.value.toUpperCase() }))} placeholder={contact.refPlaceholder} />
              </div>
            </>
          ) : (
            <>
              <div className="login-field">
                <label>{contact.name}</label>
                <input value={form.nom} onChange={update('nom')} placeholder={contact.namePlaceholder} autoComplete="family-name" />
              </div>

              <div className="login-field">
                <label>{contact.firstName}</label>
                <input value={form.prenom} onChange={update('prenom')} placeholder={contact.firstNamePlaceholder} autoComplete="given-name" />
              </div>

              <div className="login-field">
                <label>{contact.email}</label>
                <input type="email" value={form.email} onChange={update('email')} placeholder={contact.emailExample} autoComplete="email" />
              </div>

              <div className="login-field">
                <label>{contact.phone}</label>
                <input value={form.telephone} onChange={update('telephone')} placeholder={contact.phonePlaceholder} autoComplete="tel" />
              </div>
            </>
          )}

          <div className="login-field contact-full">
            <label>{contact.message}</label>
            <textarea value={form.message} onChange={update('message')} placeholder={contact.messagePlaceholder} />
          </div>

          <button type="submit" className="login-btn contact-full" disabled={loading}>
            {loading ? contact.sending : contact.send}
          </button>

        </form>

        <div className="login-footer">
          <p>{contact.footer}</p>
        </div>
      </div>

      {showSuccess && (
        <div className="contact-modal" role="dialog" aria-modal="true">
          <div className="contact-modal-backdrop" onClick={() => setShowSuccess(false)} />
          <div className="contact-modal-card">
            <div className="contact-modal-title">{contact.successTitle}</div>

            <div className="contact-modal-text">{success}</div>
            <div className="contact-modal-actions">
              <button className="login-btn" type="button" onClick={() => setShowSuccess(false)}>
                {contact.ok}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Contact