import { useState, useEffect, useCallback } from 'react';
import useReservationStore from '../store/reservationStore';
import { useI18n } from '../i18n';
import './Services.css';

const createMethodes = (texts) => [
  {
    id: 'especes',
    label: texts.methods.especes.label,
    desc: texts.methods.especes.desc,

    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <circle cx="12" cy="12" r="2"/>
        <path d="M6 12h.01M18 12h.01"/>
      </svg>
    ),
  },
  {
    id: 'en_ligne',
    label: texts.methods.en_ligne.label,
    desc: texts.methods.en_ligne.desc,
    disabled: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/>
        <path d="M1 10h22"/>
        <path d="M7 15h2M11 15h4"/>
      </svg>
    ),
  },
];

const INIT_FORM = { nom: '', prenom: '', telephone: '', email: '' };

const toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

const validate = (form, texts) => {
  const errs = {};
  const nameRe  = /^[A-Za-zÀ-ÿ\s'\-]+$/;
  const telRe   = /^(\+?245)?\d{7,9}$/;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.nom.trim()    || !nameRe.test(form.nom.trim()))    errs.nom       = texts.validation.nom;
  if (!form.prenom.trim() || !nameRe.test(form.prenom.trim())) errs.prenom    = texts.validation.prenom;
  if (!telRe.test(form.telephone.replace(/[\s\-\.\(\)]/g,''))) errs.telephone = texts.validation.telephone;
  if (!emailRe.test(form.email.trim()))                        errs.email     = texts.validation.email;
  return errs;
};

// ── Step Indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ step, success, steps }) {

  return (
    <div className="resa-stepper">
      {steps.map((label, i) => {
        const done   = i < step || success;
        const active = i === step && !success;
        return (
          <div key={i} className="resa-step">
            <div className="resa-step-content">
              <div className={`resa-step-dot ${done ? 'done' : active ? 'active' : ''}`}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i + 1}
              </div>
              <span className={`resa-step-label ${done ? 'done' : active ? 'active' : ''}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`resa-step-line ${done ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Calendrier ─────────────────────────────────────────────────────────────────
function Calendrier({ selected, onSelect, months, daysShort }) {

  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const prevMonth = () => setCursor(c => { const d = new Date(c); d.setMonth(d.getMonth()-1); return d; });
  const nextMonth = () => setCursor(c => { const d = new Date(c); d.setMonth(d.getMonth()+1); return d; });

  const todayD   = today();
  const maxDate  = new Date(todayD); maxDate.setDate(maxDate.getDate() + 90);
  const year     = cursor.getFullYear();
  const month    = cursor.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInM  = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInM; d++) cells.push(new Date(year, month, d));

  return (
    <div>
      <div className="cal-nav">
        <button type="button" className="cal-nav-btn" onClick={prevMonth}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="#4a5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="cal-month">{months[month]} {year}</span>

        <button type="button" className="cal-nav-btn" onClick={nextMonth}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="#4a5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="cal-grid">
        {daysShort.map(j => <div key={j} className="cal-head">{j}</div>)}

        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="cal-cell cal-cell--empty" />;
          const ds       = toDateStr(d);
          const isPast   = d < todayD;
          const isFutur  = d > maxDate;
          const isToday  = d.toDateString() === todayD.toDateString();
          const isSel    = ds === selected;
          const disabled = isPast || isFutur;
          const cls = [
            'cal-cell',
            isSel    ? 'cal-cell--selected' : '',
            isToday  ? 'cal-cell--today'    : '',
            disabled ? 'cal-cell--disabled' : '',
          ].filter(Boolean).join(' ');
          return (
            <div key={ds} className={cls} onClick={() => !disabled && onSelect(ds)}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className={`field-wrap ${error ? 'field-wrap--error' : ''}`}>
      <label>{label}</label>
      {children}
      {error && <span className="field-err">{error}</span>}
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function Reservation() {
  const { t, lang } = useI18n();
  const texts = t.services;
  const methodes = createMethodes(texts);
  const {
    terrains, creneaux, loading, error, success, reservationId, reservationRef,
    fetchTerrains, fetchCreneaux, soumettre, resetForm,
  } = useReservationStore();

  const [step,      setStep]      = useState(0);
  const [terrainId, setTerrainId] = useState(null);
  const [date,      setDate]      = useState('');
  const [creneauId, setCreneauId] = useState(null);
  const [form,      setForm]      = useState(INIT_FORM);
  const [formErrs,  setFormErrs]  = useState({});
  const [methode,   setMethode]   = useState('especes');

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { resetForm(); }, []);
  useEffect(() => { fetchTerrains(); }, []);
  useEffect(() => {
    if (success) setShowSuccess(true);
  }, [success]);

  useEffect(() => {
    if (date && terrainId) {
      setCreneauId(null);
      fetchCreneaux(date, terrainId);
    }
  }, [date, terrainId]);

  const handleDateSelect = useCallback((ds) => { setDate(ds); }, []);

  const goStep1 = () => { if (terrainId && date && creneauId) setStep(1); };
  const goStep2 = () => {
    const errs = validate(form, texts);

    setFormErrs(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  };
  const handleSubmit = async () => {
    const resa = await soumettre({
      nom:              form.nom.trim(),
      prenom:           form.prenom.trim(),
      telephone:        form.telephone.replace(/[\s\-\.\(\)]/g,''),
      email:            form.email.trim().toLowerCase(),
      terrain_id:       terrainId,
      creneau_id:       creneauId,
      date_reservation: date,
      methode_paiement: methode,
      langue:           lang,
    });

  };

  const creneau = creneaux.find(c => c.id === creneauId);
  const terrain = terrains.find(t => t.id === terrainId);
  const totalXof = terrain?.prix_reservation ?? 12000;

  const handleNewReservation = () => {
    window.location.reload();
  };

  return (
    <div className="resa-page">
      <div className="resa-wrap">
        <div className="resa-hero">
          <div className="resa-hero-inner">
            <div className="resa-hero-badge">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" fill="#0e3d70"/>
              </svg>
              {texts.heroBadge}
            </div>
            <h1>{texts.heroTitleA}<br /><span>{texts.heroTitleB}</span></h1>
            <p className="resa-hero-sub">{texts.heroSub}</p>
            <div className="resa-hero-stats">
              {[['11v11',texts.statFormat],['1h',texts.statDuration],['12 000 XOF',texts.statPerSession]].map(([n,l]) => (
                <div key={l}>
                  <div className="resa-hero-stat-n">{n}</div>
                  <div className="resa-hero-stat-l">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <StepIndicator step={step} success={success} steps={texts.steps} />

        {step === 0 && (
          <div className="resa-animate">
            <div className="resa-card">
              <div className="resa-section-title"><span>🏟️</span> {texts.chooseTerrain}</div>
              {loading && terrains.length === 0 && <p className="resa-hint">{texts.loadingTerrains}</p>}
              {!loading && terrains.length === 0 && <p className="resa-hint resa-hint--error">{texts.noTerrain}</p>}
              {terrains.length > 0 && (
                <div className="terrain-grid">
                  {terrains.map(t => {
                    const selected = terrainId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={['terrain-card', selected ? 'terrain-card--selected' : ''].filter(Boolean).join(' ')}
                        onClick={() => setTerrainId(t.id)}
                      >
                        <div className="terrain-card-media" aria-hidden="true">
                          {t.photo_url ? <img src={t.photo_url} alt="" loading="lazy" /> : <div className="terrain-card-media-placeholder" />}
                        </div>
                        <div className="terrain-card-body">
                          <div className="terrain-card-top">
                            <div className="terrain-card-name">{t.nom}</div>
                            <div className="terrain-card-price">{Number(t.prix_reservation ?? 12000).toLocaleString()} XOF</div>
                          </div>
                          <div className="terrain-card-addr">{t.adresse || texts.noAddress}</div>
                          <div className="terrain-card-meta">
                            <span>{texts.duration1h}</span>
                            <span>•</span>
                            <span>{texts.lighting}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="resa-card">
              <div className="resa-section-title"><span>📅</span> {texts.chooseDate}</div>
              <Calendrier selected={date} onSelect={handleDateSelect} months={texts.months} daysShort={texts.daysShort} />
            </div>

            <div className="resa-card">
              <div className="resa-section-title"><span>🕐</span> {texts.chooseSlot}</div>
              {!terrainId && <p className="resa-hint">{texts.selectTerrainFirst}</p>}
              {terrainId && !date && <p className="resa-hint">{texts.selectDateNext}</p>}
              {terrainId && date && loading && <p className="resa-hint">{texts.loadingSlots}</p>}
              {terrainId && date && !loading && error && <p className="resa-hint resa-hint--error">{error}</p>}
              {terrainId && date && !loading && creneaux.length > 0 && (
                <div className="creneau-grid">
                  {creneaux.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!c.disponible}
                      className={['creneau-btn', !c.disponible ? 'creneau-btn--taken' : '', creneauId===c.id ? 'creneau-btn--selected' : ''].filter(Boolean).join(' ')}
                      onClick={() => c.disponible && setCreneauId(c.id)}
                    >
                      {c.heure_debut.slice(0,5)} – {c.heure_fin.slice(0,5)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="btn-primary" disabled={!terrainId || !date || !creneauId} onClick={goStep1}>
              {texts.continue}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="resa-animate">
            <div className="resa-card">
              <div className="resa-section-title"><span>👤</span> {texts.yourDetails}</div>
              <div className="grid2">
                <Field label={texts.name} error={formErrs.nom}>
                  <input type="text" placeholder="Benali" maxLength={100} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
                </Field>
                <Field label={texts.firstName} error={formErrs.prenom}>
                  <input type="text" placeholder="Youcef" maxLength={100} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
                </Field>
              </div>
              <div className="grid1">
                <Field label={texts.phone} error={formErrs.telephone}>
                  <input type="tel" placeholder="XXXXXXX ou +245XXXXXXX" maxLength={20} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
                </Field>
              </div>
              <div>
                <Field label={texts.email} error={formErrs.email}>
                  <input type="email" placeholder="youcef@mail.com" maxLength={254} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </Field>
              </div>
            </div>
            <div className="btn-row">
              <button className="btn-ghost" onClick={() => setStep(0)}>{texts.backArrow}</button>
              <button className="btn-primary flex1" onClick={goStep2}>{texts.continue}</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="resa-animate">
            <div className="resa-card">
              <div className="resa-section-title"><span>💳</span> {texts.paymentMethod}</div>
              <div className="pay-grid">
                {methodes.map(m => {
                  const sel = methode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={m.disabled}
                      className={`pay-option ${sel ? 'pay-option--selected' : ''} ${m.disabled ? 'pay-option--disabled' : ''}`}
                      onClick={() => !m.disabled && setMethode(m.id)}
                    >
                      <div className="pay-option-icon">{m.icon}</div>
                      <div className="pay-option-label">{m.label}</div>
                      <div className="pay-option-desc">{m.desc}</div>
                      {m.disabled && <div className="pay-option-disabled">{texts.unavailable}</div>}
                      {sel && <div className="pay-option-check">{texts.selected}</div>}
                    </button>
                  );
                })}
              </div>
              {methode === 'especes' && <div className="pay-notice pay-notice--cash"><strong>{texts.cashNoticeTitle}</strong> — {texts.cashNoticeText}</div>}
            </div>

            <div className="resa-card">
              <div className="resa-section-title"><span>📋</span> {texts.recap}</div>
              {[
                [texts.date, date.split('-').reverse().join('/')],
                [texts.terrain, terrain?.nom ?? '-'],
                [texts.slot, `${creneau?.heure_debut?.slice(0,5)} – ${creneau?.heure_fin?.slice(0,5)}`],
                [texts.client, `${form.prenom} ${form.nom.toUpperCase()}`],
                [texts.mode, methodes.find(m => m.id === methode)?.label],
              ].map(([k, v]) => (
                <div key={k} className="recap-row">
                  <span>{k}</span><span>{v}</span>
                </div>
              ))}
              <div className="recap-row recap-total">
                <span>{texts.total}</span><span>{Number(totalXof).toLocaleString()} XOF</span>
              </div>
            </div>

            {error && <div className="api-error">{error}</div>}

            <div className="btn-row">
              <button className="btn-ghost" onClick={() => setStep(1)}>{texts.back}</button>
              <button className="btn-primary flex1" disabled={loading} onClick={handleSubmit}>
                {loading ? texts.processing : texts.confirmReservation}
              </button>
            </div>
          </div>
        )}
      </div>

      {showSuccess && success && (
        <div className="resa-modal" role="dialog" aria-modal="true">
          <div className="resa-modal-backdrop" onClick={handleNewReservation} />
          <div className="resa-modal-card">
            <div className="resa-card success-card" style={{ boxShadow: 'none', border: 'none' }}>
              <div className="success-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M6 16l7 7L26 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="success-title">{texts.successCashTitle}</div>
              <p className="success-sub">{texts.successEmail} <strong>{form.email}</strong>.</p>
              <div className="success-ref">{texts.ref} {reservationRef || `#${reservationId}`}</div>
              <div className="success-details">
                {[
                  [texts.date, date.split('-').reverse().join('/')],
                  [texts.slot, `${creneau?.heure_debut?.slice(0,5)} – ${creneau?.heure_fin?.slice(0,5)}`],
                  [texts.mode, methodes.find(m => m.id === methode)?.label],
                  [texts.total, `${Number(totalXof).toLocaleString()} XOF`],
                ].map(([k, v]) => (
                  <div key={k} className="success-detail-row">
                    <span>{k}</span><span>{v}</span>
                  </div>
                ))}
              </div>
              <div className="btn-row" style={{ justifyContent: 'center' }}>
                <button className="btn-ghost" type="button" onClick={handleNewReservation}>
                  {texts.closeWindow}
                </button>
                <button className="btn-primary" type="button" style={{ width: 'auto' }} onClick={handleNewReservation}>
                  {texts.newReservation}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}