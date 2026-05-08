export default function SuccessModal({ open, onClose, text }) {
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className={`modal-overlay${open ? ' active' : ''}`}
      id="modalOverlay"
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <span className="modal-icon">✅</span>
        <div className="modal-title">Demande envoyée !</div>
        <p className="modal-text" id="modalText">
          {text || "Votre demande de transport est en cours d'analyse. Recherche du transporteur le plus proche…"}
        </p>
        <button className="modal-close" onClick={onClose}>Voir mon espace</button>
      </div>
    </div>
  )
}
