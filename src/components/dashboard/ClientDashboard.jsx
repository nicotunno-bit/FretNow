import { useAuth } from '../../context/AuthContext'

function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const STATUS_LABELS = {
  pending:     { label: 'En attente',      cls: 'status-pending'   },
  dispatching: { label: 'Recherche…',      cls: 'status-pending'   },
  assigned:    { label: 'Assigné',         cls: 'status-confirmed' },
  en_route:    { label: 'En route',        cls: 'status-transit'   },
  picked_up:   { label: 'Chargé',          cls: 'status-transit'   },
  delivered:   { label: 'Livré',           cls: 'status-delivered' },
  cancelled:   { label: 'Annulé',          cls: 'status-pending'   },
  failed:      { label: 'Aucun transport', cls: 'status-pending'   },
}

export default function ClientDashboard() {
  const {
    clientOrders,
    clientDashboardVisible,
    hideClientDashboard,
    radiusCascade,
    currentUser,
    activePage,
  } = useAuth()

  function scrollToForm() {
    const el = document.getElementById('commande')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    hideClientDashboard()
  }

  const total   = clientOrders.length
  const pending = clientOrders.filter(o => ['pending', 'dispatching'].includes(o.status)).length
  const transit = clientOrders.filter(o => ['assigned', 'en_route', 'picked_up'].includes(o.status)).length
  const done    = clientOrders.filter(o => o.status === 'delivered').length

  const email = currentUser?.email || ''
  const clientName = currentUser?.user_metadata?.company_name || email.split('@')[0] || '—'

  const CASCADE_RADII = [10, 25, 50, 100]

  // Only show if visible and on client page
  if (!clientDashboardVisible || activePage !== 'client') return null

  return (
    <section className="dashboard-section visible" id="dashboardClient">
      <div className="dashboard-header">
        <div>
          <div className="section-tag">Espace client</div>
          <div className="dashboard-welcome">
            Bonjour, <span id="dashNameClient">{clientName}</span>
          </div>
        </div>
        <button onClick={scrollToForm} className="btn-primary">
          + Nouvelle commande
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="dash-stat">
          <div className="dash-stat-num" id="statTotal">{total}</div>
          <div className="dash-stat-label">Commandes totales</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-num" id="statPending">{pending}</div>
          <div className="dash-stat-label">En attente</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-num" id="statTransit">{transit}</div>
          <div className="dash-stat-label">En transit</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-num" id="statDone">{done}</div>
          <div className="dash-stat-label">Livrées</div>
        </div>
      </div>

      {/* Cascade de recherche en live */}
      {radiusCascade.visible && (
        <div className="radius-cascade" id="radiusCascade">
          <div className="radius-cascade-title">Recherche d'un transporteur en cours</div>
          <div className="radius-steps" id="radiusSteps">
            {CASCADE_RADII.map(r => (
              <div
                key={r}
                className={`radius-step${radiusCascade.steps[r] === 'active' ? ' active' : ''}${radiusCascade.steps[r] === 'done' ? ' done' : ''}`}
                data-radius={r}
              >
                {r} km
              </div>
            ))}
          </div>
          <div
            className="radius-status"
            id="radiusStatus"
            style={
              radiusCascade.found
                ? { color: '#5dc87a', fontWeight: 'bold' }
                : radiusCascade.failed
                ? { color: '#ff6b6b', fontWeight: 'bold' }
                : {}
            }
          >
            {radiusCascade.status}
          </div>
        </div>
      )}

      <div className="section-tag" style={{ marginBottom: '16px' }}>Mes commandes</div>
      <div className="orders-table-wrap" id="ordersTableWrap">
        {clientOrders.length === 0 ? (
          <div className="empty-state" id="ordersEmpty">
            <span className="empty-icon">📦</span>
            <p>Aucune commande pour l'instant.</p>
            <button
              onClick={scrollToForm}
              style={{
                background: 'var(--orange)',
                color: 'var(--dark)',
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '12px 28px',
                border: 'none',
                cursor: 'pointer',
                clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
              }}
            >
              Passer ma première commande
            </button>
          </div>
        ) : (
          <table className="orders-table" id="ordersTable">
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Expédition</th>
                <th>Destination</th>
                <th>Colisage</th>
                <th>Véhicule</th>
                <th>Délai</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody id="ordersTbody">
              {clientOrders.map((o, i) => {
                const s = STATUS_LABELS[o.status] || { label: o.status, cls: 'status-pending' }
                const date = new Date(o.created_at).toLocaleDateString('fr-FR')
                const ref = 'FN-' + String(clientOrders.length - i).padStart(4, '0')
                return (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange)' }}>{ref}</td>
                    <td>{o.pickup_address || '—'}</td>
                    <td>{o.delivery_address || '—'}</td>
                    <td>{o.package_type || '—'}</td>
                    <td>{o.vehicle_type_required || '—'}</td>
                    <td>{o.delay_required || '—'}</td>
                    <td><span className={`status-badge ${s.cls}`}>{s.label}</span></td>
                    <td>{date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
