import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import './Accueil.css';

const homePhotos = [
  '/photos/photo1.jpeg',
  '/photos/photo2.jpeg',
  '/photos/photo3.jpeg',
  '/photos/photo4.jpeg',
  '/photos/photo5.jpeg',
  '/photos/photo6.jpeg',
  '/photos/photo7.jpeg',
  '/photos/photo8.jpeg',
];

const homeVideos = [
  '/videos/clip1.mp4',
  '/videos/clip2.mp4',
  '/videos/clip3.mp4',
  '/videos/clip4.mp4',
  '/videos/clip5.mp4',
];

const clampIndex = (i, len) => {
  if (!len) return 0;
  return (i + len) % len;
};

function Chevron({ dir = 'right' }) {
  const d = dir === 'left'
    ? 'M10 12L6 8l4-4'
    : 'M6 4l4 4-4 4';
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeatureIcon({ name }) {
  if (name === 'bolt') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
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
      <path d="M4 4h7v7H4V4z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 4h7v10h-7V4z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 13h7v7H4v-7z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 16h7v4h-7v-4z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const update = () => setReduced(!!mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

function VideoCard({ t, clip, index }) {

  const [showFallback, setShowFallback] = useState(true);

  return (
    <div className="home-video-card">
      <div className="home-video-top">
        <div className="home-video-chip">{t.videoCards[index]?.chip ?? t.videoChip}</div>
        <div className="home-video-title">{t.videoCards[index]?.title ?? t.videoTitle}</div>

      </div>

      <div className="home-video">
        <video
          playsInline
          muted
          autoPlay
          preload="metadata"
          poster="/photos/photo1.jpeg"

          src={clip}
          onCanPlay={() => setShowFallback(false)}
          onError={() => setShowFallback(true)}
        />

        {showFallback && (
          <div className="home-video-fallback">
            <div>
              <div className="home-video-fallback-title">{t.addVideos}</div>
              <div className="home-video-fallback-text">
                {t.videoHelp} <code>frontend/public/videos</code> :
                <code>clip1.mp4</code>, <code>clip2.mp4</code>, <code>clip3.mp4</code>.
              </div>

            </div>
          </div>
        )}
      </div>

      <div className="home-video-meta">
        <div className="home-pill">LED</div>
        <div className="home-pill">{t.vestiaires}</div>
        <div className="home-pill">{t.synthetic}</div>

      </div>
    </div>
  );
}

export default function Accueil() {
  const { t } = useI18n();
  const home = t.home;
  const reducedMotion = usePrefersReducedMotion();
  const slides = useMemo(() => home.slides, [home.slides]);

  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setIdx((i) => clampIndex(i + 1, slides.length)), 5500);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [slides.length, reducedMotion]);

  const prev = () => setIdx((i) => clampIndex(i - 1, slides.length));
  const next = () => setIdx((i) => clampIndex(i + 1, slides.length));

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-hero-bg" aria-hidden="true" />

        <div className="home-hero-inner">
          <div className="home-hero-left">
            <div className="home-badge">
              <span className="home-badge-dot" />
              {home.badge}

            </div>

            <h1 className="home-title">
              Foot<em>Field</em>
              <span className="home-title-sub">{home.slogan}</span>

            </h1>

            <p className="home-lead">
              {home.lead}

            </p>

            <div className="home-cta">
              <Link className="home-btn home-btn--primary" to="/services">
                {home.bookNow}

                <span className="home-btn-arrow" aria-hidden="true">→</span>
              </Link>
              <Link className="home-btn" to="/contact">{home.needHelp}</Link>

            </div>

            <div className="home-kpis">
              <div className="home-kpi">
                <div className="home-kpi-n">7j/7</div>
                <div className="home-kpi-l">{home.availability}</div>

              </div>
              <div className="home-kpi">
                <div className="home-kpi-n">1h</div>
                <div className="home-kpi-l">{home.perSession}</div>

              </div>
              <div className="home-kpi">
                <div className="home-kpi-n">PDF</div>
                <div className="home-kpi-l">{home.proReceipt}</div>

              </div>
            </div>
          </div>

          <div className="home-hero-right">
            <div className="home-card home-card--glass">
              <div className="home-carousel" role="region" aria-label={home.carouselLabel}>

                <div className="home-carousel-top">
                  <div className="home-carousel-badge">{slides[idx].badge}</div>
                  <div className="home-carousel-actions">
                    <button type="button" className="home-icon-btn" onClick={prev} aria-label={home.prevSlide}>

                      <Chevron dir="left" />
                    </button>
                    <button type="button" className="home-icon-btn" onClick={next} aria-label={home.nextSlide}>

                      <Chevron dir="right" />
                    </button>
                  </div>
                </div>

                <div className="home-carousel-body">
                  <div className="home-carousel-anim" key={idx}>
                    <div className="home-carousel-title">{slides[idx].title}</div>
                    <div className="home-carousel-text">{slides[idx].text}</div>
                  </div>
                </div>

                <div className="home-dots" aria-label={home.pagination}>

                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`home-dot ${i === idx ? 'active' : ''}`}
                      aria-label={`${home.goSlide} ${i + 1}`}

                      onClick={() => setIdx(i)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="home-media">
              <div className="home-media-frame" aria-label={home.preview}>
                <video
                  className="home-hero-video"
                  src={homeVideos[0]}
                  poster={homePhotos[0]}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={home.appPreview}
                />
                <div className="home-media-overlay">
                  <span>BissauJogo</span>
                  <strong>{home.bookNow}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-gallery-section">
        <div className="home-section-head">
          <h2>{home.preview}</h2>
          <p>{home.premiumText}</p>
        </div>

        <div className="home-photo-gallery">
          {homePhotos.map((photo, i) => (
            <figure key={photo} className={`home-photo-card home-photo-card--${(i % 4) + 1}`}>
              <img src={photo} alt={`${home.preview} ${i + 1}`} loading="lazy" />
            </figure>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>{home.premiumTitle}</h2>
          <p>{home.premiumText}</p>
        </div>

        <div className="home-grid">
          {home.features.map((f) => (

            <div key={f.title} className="home-feature">
              <div className="home-feature-icon" aria-hidden="true"><FeatureIcon name={f.icon} /></div>
              <div className="home-feature-title">{f.title}</div>
              <div className="home-feature-text">{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section home-section--dark">
        <div className="home-section-head">
          <h2>{home.videosTitle}</h2>
          <p>
            {home.videosText}
          </p>

        </div>

        <div className="home-video-grid">
          {homeVideos.slice(1, 4).map((clip, i) => (
            <VideoCard key={clip} t={home} clip={clip} index={i} />
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-final">
          <div>
            <h2>{home.readyTitle}</h2>
            <p>{home.readyText}</p>

          </div>
          <div className="home-final-actions">
            <Link className="home-btn home-btn--primary" to="/services">{home.accessServices}</Link>
            <Link className="home-btn" to="/apropos">{home.learnMore}</Link>

          </div>
        </div>
      </section>
    </main>
  );
}