import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n';
import './Footer.css';

function LogoMark() {
  return (
    <img src="/photos/balon.ico" alt="BissauJogo" />
  );
}

function SocialIcon({ name }) {
  if (name === 'instagram') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="5" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16.8" cy="7.2" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (name === 'facebook') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13V9c0-.6.4-1 1-1z" fill="currentColor" />
      </svg>
    );
  }
  if (name === 'tiktok') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 3v10.2a3.6 3.6 0 1 1-3-3.5V6.6a7 7 0 1 0 6.5 6.9V9.1c1.1.8 2.4 1.2 3.5 1.3V7.4c-2.2-.2-4-1.9-4.2-4.4H14z" fill="currentColor" />
      </svg>
    );
  }
  if (name === 'whatsapp') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4a8 8 0 0 0-6.9 12l-.7 4 4.1-1.1A8 8 0 1 0 12 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9.6 9.3c.2-.4.4-.4.7-.4h.6c.2 0 .4 0 .5.3l.7 1.6c.1.2.1.5-.1.7l-.4.5c-.1.1-.1.3 0 .5.4.7 1.3 1.5 2 1.9.2.1.4.1.5 0l.6-.4c.2-.2.5-.2.7-.1l1.5.7c.3.1.3.3.3.5v.6c0 .3 0 .5-.4.7-.4.2-1.3.5-2.5.2-1.2-.3-2.6-1.3-3.9-2.6-1.3-1.3-2.2-2.8-2.5-4-.3-1.2 0-2.1.2-2.5z" fill="currentColor" opacity=".9" />
      </svg>
    );
  }
  return null;
}

function ContactIcon({ name }) {
  if (name === 'pin') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 22s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === 'mail') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16v12H4V6z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.6 3.6h2.6l1 3.4-1.6 1.6c1.2 2.2 3 4 5.2 5.2l1.6-1.6 3.4 1v2.6c0 .5-.2 1-.6 1.4-1.2 1.2-3.9 1-7.5-2.6S2.8 8 4 6.8c.4-.4.9-.6 1.4-.6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useI18n();
  const links = [
    { to: '/', label: t.nav.home },
    { to: '/services', label: t.nav.services },
    { to: '/contact', label: t.nav.contact },
    { to: '/apropos', label: t.nav.about },
  ];

  return (
    <footer className="ff-footer">
      <div className="ff-footer-wrap">
        <div className="ff-footer-top">
          <div className="ff-footer-col">
            <NavLink to="/" className="ff-footer-brand">
              <span className="ff-footer-mark"><LogoMark /></span>
              <span className="ff-footer-name">Bissau<em>Jogo</em></span>
            </NavLink>

            <div className="ff-footer-desc">
              {t.footer.desc}
            </div>

            <div className="ff-footer-social" aria-label="Social">
              <a className="ff-footer-social-btn" href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
                <SocialIcon name="instagram" />
              </a>
              <a className="ff-footer-social-btn" href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook" title="Facebook">
                <SocialIcon name="facebook" />
              </a>
              <a className="ff-footer-social-btn" href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok" title="TikTok">
                <SocialIcon name="tiktok" />
              </a>
              <a className="ff-footer-social-btn" href="https://www.whatsapp.com/" target="_blank" rel="noreferrer" aria-label="WhatsApp" title="WhatsApp">
                <SocialIcon name="whatsapp" />
              </a>
            </div>
          </div>

          <div className="ff-footer-col" aria-label="Liens">
            <div className="ff-footer-col-title">{t.footer.navigation}</div>
            <div className="ff-footer-links">
              {links.map((item) => (
                <NavLink key={item.to} to={item.to} className="ff-footer-link">{item.label}</NavLink>
              ))}
            </div>
          </div>

          <div className="ff-footer-col" aria-label="Coordonnées">
            <div className="ff-footer-col-title">{t.footer.contacts}</div>
            <div className="ff-footer-contact">
              <div className="ff-footer-contact-row">
                <span className="ff-footer-contact-ico"><ContactIcon name="pin" /></span>
                <span className="ff-footer-contact-text">Bissau, Guinée Bissau</span>
              </div>
              <a className="ff-footer-contact-row" href="mailto:contact@bissaujogo.com">
                <span className="ff-footer-contact-ico"><ContactIcon name="mail" /></span>
                <span className="ff-footer-contact-text">contact@bissaujogo.com</span>
              </a>
              <a className="ff-footer-contact-row" href="tel:+225000000000">
                <span className="ff-footer-contact-ico"><ContactIcon name="phone" /></span>
                <span className="ff-footer-contact-text">+245 00 00 00 00 00</span>
              </a>
            </div>
          </div>
        </div>

        <div className="ff-footer-bottom">
          <div className="ff-footer-copy">© {year} BissauJogo. {t.footer.rights}</div>
          <div className="ff-footer-badges">
            <span className="ff-footer-badge">{t.footer.reservation}</span>
            <span className="ff-footer-badge">{t.footer.payment}</span>
            <span className="ff-footer-badge">{t.footer.receipt}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
