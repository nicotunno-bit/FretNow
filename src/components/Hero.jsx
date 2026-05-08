export default function Hero() {
  return (
    <section className="hero" id="accueil">
      <div className="hero-bg"></div>
      <div className="hero-grid"></div>
      <div className="hero-content">
        <div className="hero-tag">Transport Industriel</div>
        <h1>Votre fret,<br /><em>livré vite.</em></h1>
        <p>Colis, palettes, pièces industrielles hors gabarit — FretNow organise votre transport de A à Z avec des délais maîtrisés et une traçabilité totale.</p>
        <div className="hero-ctas">
          <a href="#commande" className="btn-primary">Demander un devis</a>
          <a href="#fonctionnement" className="btn-ghost">Comment ça marche</a>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">24H</div>
            <div className="stat-label">Délai express</div>
          </div>
          <div className="stat">
            <div className="stat-num">100%</div>
            <div className="stat-label">Traçabilité</div>
          </div>
          <div className="stat">
            <div className="stat-num">FR+EU</div>
            <div className="stat-label">Couverture</div>
          </div>
        </div>
      </div>
      <div className="hero-right">
        <div className="hero-live-card">
          <div className="hero-live-label">
            <span className="hero-live-dot"></span>Réseau en ligne
          </div>
          <div className="hero-live-num">847</div>
          <div className="hero-live-sub">transporteurs disponibles</div>
        </div>
        <div className="hero-coverage">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: '4px' }}>Couverture</div>
          <div className="coverage-row">
            <span className="coverage-label">France</span>
            <div className="coverage-bar-wrap">
              <div className="coverage-bar" style={{ width: '94%' }}></div>
            </div>
            <span className="coverage-val">94%</span>
          </div>
          <div className="coverage-row">
            <span className="coverage-label">Europe</span>
            <div className="coverage-bar-wrap">
              <div className="coverage-bar" style={{ width: '68%' }}></div>
            </div>
            <span className="coverage-val">68%</span>
          </div>
          <div className="coverage-row">
            <span className="coverage-label">Express 24H</span>
            <div className="coverage-bar-wrap">
              <div className="coverage-bar" style={{ width: '100%' }}></div>
            </div>
            <span className="coverage-val">100%</span>
          </div>
        </div>
      </div>
    </section>
  )
}
