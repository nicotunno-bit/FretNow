import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function PageTabs() {
  const { activePage, setActivePage } = useAuth()

  return (
    <motion.div
      className="page-tabs"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {['client', 'carrier'].map((page, i) => (
        <motion.div
          key={page}
          className={`page-tab ${activePage === page ? 'active' : ''}`}
          onClick={() => setActivePage(page)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span className="tab-icon">{page === 'client' ? '📦' : '🚛'}</span>
          {page === 'client' ? 'Espace Client' : 'Espace Transporteur'}
        </motion.div>
      ))}
    </motion.div>
  )
}
