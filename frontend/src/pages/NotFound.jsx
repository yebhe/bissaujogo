import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <main className="notfound-page">
      <section className="notfound-card">
        <div className="notfound-logo">
          <img src="/photos/balon.ico" alt="BissauJogo" />
        </div>
        <div className="notfound-code">404</div>
        <h1>Page introuvable</h1>
        <p>
          Le lien que vous avez saisi n’existe pas ou a été déplacé. Retournez à l’accueil pour continuer votre réservation.
        </p>
        <div className="notfound-actions">
          <Link className="notfound-btn notfound-btn--primary" to="/">Accueil</Link>
          <Link className="notfound-btn" to="/services">Réserver un terrain</Link>
        </div>
      </section>
    </main>
  );
}
