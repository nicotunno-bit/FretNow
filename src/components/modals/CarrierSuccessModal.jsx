export default function CarrierSuccessModal({ open, onClose }) {
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className={`modal-overlay${open ? ' active' : ''}`}
      id="modalCarrierOverlay"
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <span className="modal-icon">🚛</span>
        <div className="modal-title">Compte créé !</div>
        <p className="modal-text">
          Bienvenue dans le réseau FretNow ! Votre compte est actif et votre dossier est en cours d'examen. Un email de confirmation vient de vous être envoyé.
        </p>
        <button className="modal-close" onClick={onClose}>Accéder à mon espace</button>
      </div>
    </div>
  )
}
