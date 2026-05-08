export default function HowItWorks() {
  return (
    <section className="how-section" id="fonctionnement">
      <div className="section-tag">Processus</div>
      <h2 className="section-title">Comment ça marche</h2>
      <div className="steps-grid">
        <div className="step">
          <div className="step-dot"></div>
          <div className="step-num">01</div>
          <div className="step-title">Configurez</div>
          <div className="step-desc">Renseignez les caractéristiques de votre expédition en 2 minutes via notre formulaire express.</div>
        </div>
        <div className="step">
          <div className="step-dot"></div>
          <div className="step-num">02</div>
          <div className="step-title">Recherche</div>
          <div className="step-desc">Notre système contacte les transporteurs dans un rayon de 10 km, puis élargit jusqu'à 100 km si besoin.</div>
        </div>
        <div className="step">
          <div className="step-dot"></div>
          <div className="step-num">03</div>
          <div className="step-title">Prise en charge</div>
          <div className="step-desc">Le premier transporteur disponible accepte votre fret et démarre vers le point de chargement.</div>
        </div>
        <div className="step">
          <div className="step-dot"></div>
          <div className="step-num">04</div>
          <div className="step-title">Suivez</div>
          <div className="step-desc">Tracking GPS temps réel de la prise en charge jusqu'à la livraison finale.</div>
        </div>
      </div>
    </section>
  )
}
