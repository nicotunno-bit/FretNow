export default function CarrierHero() {
  return (
    <section className="carrier-hero" id="carrier-accueil">
      <div className="carrier-hero-bg"></div>
      <div className="hero-grid"></div>
      <div className="hero-content">
        <div className="hero-tag">Réseau Transporteur</div>
        <h1>Développez<br /><em>votre activité.</em></h1>
        <p>Rejoignez le réseau FretNow et accédez à des missions de transport industriel qualifiées, sans démarchage commercial. Vous vous concentrez sur la route, on gère le reste.</p>
        <div className="hero-ctas">
          <a href="#carrier-inscription" className="btn-primary">S'inscrire maintenant</a>
          <a href="#carrier-avantages" className="btn-ghost">Nos avantages</a>
        </div>
        <div className="hero-stats" style={{ marginTop: '40px' }}>
          <div className="stat">
            <div className="stat-num">0€</div>
            <div className="stat-label">Inscription</div>
          </div>
          <div className="stat">
            <div className="stat-num">48H</div>
            <div className="stat-label">Validation dossier</div>
          </div>
          <div className="stat">
            <div className="stat-num">+missions</div>
            <div className="stat-label">Dès l'activation</div>
          </div>
        </div>
      </div>
    </section>
  )
}
