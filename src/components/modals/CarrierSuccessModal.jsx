import { motion, AnimatePresence } from 'framer-motion'

export default function CarrierSuccessModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay active"
          onClick={e => e.target === e.currentTarget && onClose()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="modal"
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="modal-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
            >🚛</motion.span>
            <div className="modal-title">Compte créé !</div>
            <p className="modal-text">
              Bienvenue dans le réseau FretNow ! Votre compte est actif et votre dossier est en cours d'examen.
              Un email de confirmation vient de vous être envoyé.
            </p>
            <motion.button className="modal-close" onClick={onClose} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              Accéder à mon espace
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
