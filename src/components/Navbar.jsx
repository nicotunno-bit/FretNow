import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const {
    currentUser, currentRole, activePage,
    openAuth, handleLogout, showClientDashboard, showCarrierDashboard,
  } = useAuth()

  const email = currentUser?.email || ''
  const name = currentUser?.user_metadata?.company_name || email.split('@')[0]

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ zIndex: 1000 }}
    >
      <div className="logo">
        <motion.img
          src="/logo.png"
          alt="FretNow"
          style={{ height: '100px' }}
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {activePage === 'client' ? (
          <motion.div
            key="client-nav"
            className="nav-links"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentUser && currentRole === 'client' && (
              <a href="#" className="nav-dash-link" style={{ color: 'var(--orange)' }}
                onClick={e => { e.preventDefault(); showClientDashboard() }}>Mon espace</a>
            )}
            <a href="#commande">Commander</a>
            <a href="#fonctionnement">Comment ça marche</a>
            <a href="#services">Services</a>
            <a href="#commande" className="nav-cta">Devis Express</a>
            {currentUser && currentRole === 'client' ? (
              <div className="user-badge visible">
                <div className="avatar">{name.charAt(0).toUpperCase()}</div>
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
                <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
              </div>
            ) : (
              <motion.button
                type="button"
                className="btn-nav-login"
                onClick={() => openAuth('client')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >Connexion</motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="carrier-nav"
            className="nav-links"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentUser && currentRole === 'carrier' && (
              <a href="#" className="nav-dash-link" style={{ color: 'var(--orange)' }}
                onClick={e => { e.preventDefault(); showCarrierDashboard() }}>Mon espace</a>
            )}
            <a href="#carrier-inscription">S'inscrire</a>
            <a href="#carrier-avantages">Avantages</a>
            <a href="#carrier-inscription" className="nav-cta">Rejoindre le réseau</a>
            {currentUser && currentRole === 'carrier' ? (
              <div className="user-badge visible">
                <div className="avatar">{name.charAt(0).toUpperCase()}</div>
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
                <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
              </div>
            ) : (
              <motion.button
                type="button"
                className="btn-nav-login"
                onClick={() => openAuth('carrier')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >Connexion</motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
