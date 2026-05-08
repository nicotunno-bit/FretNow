import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const {
    currentUser,
    currentRole,
    activePage,
    setActivePage,
    openAuth,
    handleLogout,
    showClientDashboard,
    showCarrierDashboard,
  } = useAuth()

  const email = currentUser?.email || ''
  const clientName = currentUser?.user_metadata?.company_name || email.split('@')[0]
  const carrierName = currentUser?.user_metadata?.company_name || email.split('@')[0]

  return (
    <nav>
      <div className="logo">
        <img src="logo.png" alt="FretNow" style={{ height: '100px' }} />
      </div>

      {activePage === 'client' && (
        <div className="nav-links" id="clientNavLinks">
          {currentUser && currentRole === 'client' && (
            <a
              href="#"
              className="nav-dash-link"
              style={{ color: 'var(--orange)' }}
              onClick={(e) => { e.preventDefault(); showClientDashboard() }}
            >
              Mon espace
            </a>
          )}
          <a href="#commande">Commander</a>
          <a href="#fonctionnement">Comment ça marche</a>
          <a href="#services">Services</a>
          <a href="#commande" className="nav-cta">Devis Express</a>

          {currentUser && currentRole === 'client' ? (
            <div className="user-badge visible">
              <div className="avatar">
                {clientName.charAt(0).toUpperCase()}
              </div>
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email}
              </span>
              <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('client')}
              className="btn-nav-login"
            >
              Connexion
            </button>
          )}
        </div>
      )}

      {activePage === 'carrier' && (
        <div className="nav-links" id="carrierNavLinks">
          {currentUser && currentRole === 'carrier' && (
            <a
              href="#"
              className="nav-dash-link"
              style={{ color: 'var(--orange)' }}
              onClick={(e) => { e.preventDefault(); showCarrierDashboard() }}
            >
              Mon espace
            </a>
          )}
          <a href="#carrier-inscription">S'inscrire</a>
          <a href="#carrier-avantages">Avantages</a>
          <a href="#carrier-inscription" className="nav-cta">Rejoindre le réseau</a>

          {currentUser && currentRole === 'carrier' ? (
            <div className="user-badge visible">
              <div className="avatar">
                {carrierName.charAt(0).toUpperCase()}
              </div>
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email}
              </span>
              <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('carrier')}
              className="btn-nav-login"
            >
              Connexion
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
