export default function Services() {
  return (
    <section className="services-section" id="services">
      <div className="section-tag">Ce qu'on transporte</div>
      <h2 className="section-title">Nos spécialités</h2>
      <div className="services-grid">
        <div className="service-card">
          <span className="service-num-bg">01</span>
          <span className="service-icon">📦</span>
          <div className="service-title">Colis &amp; Palettes</div>
          <div className="service-desc">De la palette Europe au colis express, nous gérons tous volumes avec soin. Enlèvements partout en France.</div>
        </div>
        <div className="service-card">
          <span className="service-num-bg">02</span>
          <span className="service-icon">🏗</span>
          <div className="service-title">Pièces Industrielles</div>
          <div className="service-desc">Machines, équipements hors gabarit, convois spéciaux. Nous gérons les transports complexes avec escorte si besoin.</div>
        </div>
        <div className="service-card">
          <span className="service-num-bg">03</span>
          <span className="service-icon">⚡</span>
          <div className="service-title">Express 24H</div>
          <div className="service-desc">Urgence ? Notre réseau de transporteurs dédiés assure des livraisons dans les 24h sur tout le territoire.</div>
        </div>
        <div className="service-card">
          <span className="service-num-bg">04</span>
          <span className="service-icon">🌍</span>
          <div className="service-title">Transport Europe</div>
          <div className="service-desc">Couverture internationale sur l'ensemble de l'Union Européenne avec gestion des formalités douanières.</div>
        </div>
        <div className="service-card">
          <span className="service-num-bg">05</span>
          <span className="service-icon">❄️</span>
          <div className="service-title">Transport Frigorifique</div>
          <div className="service-desc">Denrées sensibles à température dirigée, chaîne du froid garantie de bout en bout.</div>
        </div>
        <div className="service-card">
          <span className="service-num-bg">06</span>
          <span className="service-icon">🛡</span>
          <div className="service-title">Marchandises de valeur</div>
          <div className="service-desc">Assurance ad valorem, véhicules sécurisés, convoyeurs dédiés pour vos expéditions à haute valeur.</div>
        </div>
      </div>
    </section>
  )
}
