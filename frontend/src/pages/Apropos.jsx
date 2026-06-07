import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import './Apropos.css';

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" opacity=".35" />
      <path d="M4.2 8.2l2.3 2.3L11.9 5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 14.2A6.2 6.2 0 1 0 8 1.8a6.2 6.2 0 0 0 0 12.4z" stroke="currentColor" strokeWidth="1.2" opacity=".35" />
      <path d="M6.6 6.2c.2-1 1-1.6 2-1.6 1.1 0 2 .7 2 1.8 0 1.4-1.4 1.6-1.8 2.5-.1.2-.1.5-.1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.6" r=".8" fill="currentColor" />
    </svg>
  );
}

export default function Apropos() {
  const { t } = useI18n();
  const about = t.about;
  return (
    <main className="about">
      <section className="about-hero">
        <div className="about-hero-bg" aria-hidden="true" />

        <div className="about-wrap about-hero-inner">
          <div className="about-badge">
            <span className="about-badge-dot" />
            {about.badge}

          </div>

          <h1 className="about-title">
            {about.titleA}
            <span>{about.titleB}</span>

          </h1>

          <p className="about-lead">
            {about.lead}

          </p>

          <div className="about-hero-actions">
            <Link className="about-btn about-btn--primary" to="/services">{about.bookSlot}</Link>
            <Link className="about-btn" to="/contact">{about.support}</Link>

          </div>

          <div className="about-stats">
            <div className="about-stat">
              <div className="about-stat-n">7j/7</div>
              <div className="about-stat-l">{about.reservations}</div>

            </div>
            <div className="about-stat">
              <div className="about-stat-n">1h</div>
              <div className="about-stat-l">{about.perSession}</div>

            </div>
            <div className="about-stat">
              <div className="about-stat-n">PDF</div>
              <div className="about-stat-l">{about.professionalReceipt}</div>

            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-wrap">
          <div className="about-grid2">
            <div className="about-card">
              <div className="about-card-title">{about.missionTitle}</div>
              <p className="about-text">
                {about.missionText}
              </p>

              <div className="about-list">
                {about.missionItems.map((x) => (

                  <div key={x} className="about-list-item">
                    <div className="about-list-ico"><Check /></div>
                    <div>{x}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="about-card about-card--accent">
              <div className="about-card-title">{about.whyTitle}</div>
              <p className="about-text">
                {about.whyText}
              </p>

              <div className="about-pill-row">
                {about.pills.map((pill) => <div key={pill} className="about-pill">{pill}</div>)}
              </div>

              <div className="about-mini-cta">
                <div className="about-mini-cta-title">{about.startTitle}</div>
                <div className="about-mini-cta-text">{about.startText}</div>
                <Link className="about-btn about-btn--small about-btn--primary" to="/services">{t.home.accessServices}</Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      <section className="about-section about-section--dark">
        <div className="about-wrap">
          <div className="about-section-head">
            <h2>{about.faqTitle}</h2>
            <p>{about.faqText}</p>

          </div>

          <div className="about-faq">
            {about.faqs.map((item) => (

              <div key={item.q} className="about-faq-item">
                <div className="about-faq-q">
                  <span className="about-faq-ico"><QIcon /></span>
                  <strong>{item.q}</strong>
                </div>
                <div className="about-faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-wrap">
          <div className="about-final">
            <div>
              <div className="about-final-title">{about.specialTitle}</div>
              <div className="about-final-text">{about.specialText}</div>

            </div>
            <div className="about-final-actions">
              <Link className="about-btn about-btn--primary" to="/contact">{about.contactUs}</Link>
              <Link className="about-btn" to="/services">{about.book}</Link>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}