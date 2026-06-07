// src/components/NavBar.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import authStore from '../store/authStore';
import { useI18n } from '../i18n';
import './NavBar.css';

const links = [
  { to: '/',         label: 'Accueil'  },
  { to: '/services', label: 'Services' },
  { to: '/contact',  label: 'Contact'  },
  { to: '/apropos',  label: 'À propos' },
];

function DashboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" opacity=".6"/>
      <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor"/>
      <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor"/>
      <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" opacity=".6"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M11 11l3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="14" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

export default function NavBar() {
  const [open, setOpen]          = useState(false);
  const { user, isAuth, logout } = authStore();
  const navigate                 = useNavigate();
  const { lang, setLang, t }     = useI18n();
  const links = [
    { to: '/',         label: t.nav.home  },
    { to: '/services', label: t.nav.services },
    { to: '/contact',  label: t.nav.contact  },
    { to: '/apropos',  label: t.nav.about },
  ];

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const goToDashboard = () => {
    setOpen(false);
    navigate('/dashboard');
  };

  const goToProfil = () => {
    setOpen(false);
    navigate('/dashboard/profil');
  };

  return (
    <header>
      <nav className="navbar">
        <NavLink to="/" className="logo" onClick={() => setOpen(false)}>
          <div className="logo-ball">
            <img src="/photos/balon.ico" alt="BissauJogo" />
          </div>
          <span className="logo-name">Bissau<em>Jogo</em></span>
        </NavLink>

        <div className="nav-links">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {label}
            </NavLink>
          ))}
        </div>

        <div className="nav-right">
          {isAuth ? (
            <>
              {/* Chip utilisateur */}
              <button className="nav-user" onClick={goToProfil} title={t.nav.profileTitle}>
                <div className="nav-avatar">
                  {user?.username?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <span>{user?.username ?? 'Admin'}</span>
              </button>

              <div className="nav-sep" />

              {/* Bouton Dashboard (admin) */}
              <button className="nav-admin" onClick={goToDashboard}>
                <DashboardIcon />
                {t.nav.dashboard}
              </button>

              {/* Bouton Déconnexion */}
              <button className="nav-logout" onClick={handleLogout}>
                <LogoutIcon />
                {t.nav.logout}
              </button>
            </>
          ) : (
            <NavLink to="/login" className="nav-login">{t.nav.login}</NavLink>
          )}
          <div className="lang-switch" aria-label="Langue">
            <button type="button" className={lang === 'pt' ? 'active' : ''} onClick={() => setLang('pt')}>PT</button>
            <button type="button" className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
          </div>
        </div>

        <button
          className={`hamburger ${open ? 'open' : ''}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>
      </nav>

      {open && (
        <div className="mobile-menu" role="dialog" aria-label={t.nav.menuLabel}>
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}

          <div className="mobile-actions">
            {isAuth ? (
              <>
                {/* Identité utilisateur */}
                <div className="mobile-user-info">
                  <div className="nav-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                    {user?.username?.[0]?.toUpperCase() ?? 'A'}
                  </div>
                  <div>
                    <div className="mobile-username">{user?.username ?? 'Admin'}</div>
                    <div className="mobile-role">{t.nav.role}</div>
                  </div>
                </div>

                <div className="mobile-btns">
                  <button className="mobile-dashboard" onClick={goToDashboard}>
                    {t.nav.dashboard}
                  </button>
                  <button className="mobile-logout" onClick={handleLogout}>
                    {t.nav.logout}
                  </button>
                </div>
              </>
            ) : (
              <NavLink to="/login" className="mobile-login" onClick={() => setOpen(false)}>
                {t.nav.login}
              </NavLink>
            )}
            <div className="mobile-lang-switch" aria-label="Langue">
              <button type="button" className={lang === 'pt' ? 'active' : ''} onClick={() => setLang('pt')}>PT</button>
              <button type="button" className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}