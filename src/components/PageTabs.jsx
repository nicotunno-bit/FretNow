import { useAuth } from '../context/AuthContext'

export default function PageTabs() {
  const { activePage, setActivePage } = useAuth()

  return (
    <div className="page-tabs">
      <div
        className={`page-tab ${activePage === 'client' ? 'active' : ''}`}
        onClick={() => setActivePage('client')}
      >
        <span className="tab-icon">📦</span> Espace Client
      </div>
      <div
        className={`page-tab ${activePage === 'carrier' ? 'active' : ''}`}
        onClick={() => setActivePage('carrier')}
      >
        <span className="tab-icon">🚛</span> Espace Transporteur
      </div>
    </div>
  )
}
