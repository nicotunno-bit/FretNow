import { motion, AnimatePresence } from 'framer-motion'

export default function SuccessModal({ open, onClose, text }) {
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
            >✅</motion.span>
            <div className="modal-title">Demande envoyée !</div>
            <p className="modal-text">
              {text || "Votre demande de transport est en cours d'analyse. Recherche du transporteur le plus proche…"}
            </p>
            <motion.button className="modal-close" onClick={onClose} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              Voir mon espace
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
