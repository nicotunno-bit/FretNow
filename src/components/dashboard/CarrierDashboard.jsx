import { useAuth } from '../../context/AuthContext'

const ACTIVE_STATUS_LABELS = {
  assigned:  { label: 'Assigné',   cls: 'status-confirmed' },
  en_route:  { label: 'En route',  cls: 'status-transit'   },
  picked_up: { label: 'Chargé',    cls: 'status-transit'   },
}

const HISTORY_STATUS_LABELS = {
  delivered: { label: 'Livré',   cls: 'status-delivered' },
  cancelled: { label: 'Annulé',  cls: 'status-pending'   },
}

const NEXT_ACTION = { assigned: 'en_route', en_route: 'picked_up', picked_up: 'delivered' }
const ACTION_LABEL = { assigned: 'Démarrer', en_route: 'Marchandise chargée', picked_up: 'Confirmer livraison' }

export default function CarrierDashboard() {
  const {
    carrierCourses,
    carrierStats,
    carrierDashboardVisible,
    hideCarrierDashboard,
    toggleAvailability,
    advanceCourseStatus,
    availabilityState,
    currentUser,
    currentTransporter,
    activePage,
  } = useAuth()

  const email = currentUser?.email || ''
  const carrierName = currentTransporter?.company_name || currentUser?.user_metadata?.company_name || email.split('@')[0] || '—'

  if (!carrierDashboardVisible || activePage !== 'carrier') return null

  const { active = [], history = [] } = carrierCourses

  const statusLabels = { active: 'Actif', pending: 'En attente de validation', inactive: 'Inactif', suspended: 'Suspendu' }
  const statusColor = carrierStats.status === 'active' ? '#5dc87a' : 'var(--orange)'

  return (
    <section className="dashboard-section visible" id="dashboardCarrier">
      <div className="dashboard-header">
        <div>
          <div className="section-tag">Espace transporteur</div>
          <div className="dashboard-welcome">
            Bonjour, <span id="dashNameCarrier">{carrierName}</span>
          </div>
          {carrierStats.statusLine && (
            <div id="carrierStatusLine" style={{ marginTop: '8px', fontSize: '13px', color: 'var(--muted)' }}>
              Statut : <strong style={{ color: statusColor }}>
                {carrierStats.statusLine.label}
              </strong>
              {carrierStats.statusLine.isPending && ' — votre dossier est en cours d\'examen.'}
            </div>
          )}
        </div>
        <div
          className={`availability-toggle${availabilityState ? ' on' : ''}`}
          id="availabilityToggle"
          onClick={toggleAvailability}
        >
          <div className="availability-switch"></div>
          <span className="availability-label" id="availabilityLabel">
            {availabilityState ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="dash-stat">
          <div className="dash-stat-num" id="tStatTotal">{carrierStats.total || 0}</div>
          <div className="dash-stat-label">Courses totales</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-num" id="tStatActive">{carrierStats.active || 0}</div>
          <div className="dash-stat-label">En cours</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-num" id="tStatDone">{carrierStats.done || 0}</div>
          <div className="dash-stat-label">Livrées</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-num" id="tStatRating">{carrierStats.rating || '—'}</div>
          <div className="dash-stat-label">Note moyenne</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-num" id="tStatWeight">{carrierStats.weight || '0 kg'}</div>
          <div className="dash-stat-label">Tonnage traité</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-num" id="tStatAcceptance">{carrierStats.acceptance || '—'}</div>
          <div className="dash-stat-label">Taux d'acceptation</div>
        </div>
      </div>

      <div className="section-tag" style={{ marginBottom: '16px' }}>Courses en cours</div>
      <div className="orders-table-wrap" style={{ marginBottom: '32px' }}>
        {active.length === 0 ? (
          <div className="empty-state" id="activeCoursesEmpty">
            <span className="empty-icon">🚛</span>
            <p>Aucune course active. Activez votre disponibilité pour recevoir des missions.</p>
          </div>
        ) : (
          <table className="orders-table" id="activeCoursesTable">
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Départ</th>
                <th>Arrivée</th>
                <th>Colisage</th>
                <th>Poids</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="activeCoursesTbody">
              {active.map(c => {
                const s = ACTIVE_STATUS_LABELS[c.status] || { label: c.status, cls: 'status-pending' }
                const next = NEXT_ACTION[c.status]
                const ref = 'FN-' + c.id.slice(0, 6).toUpperCase()
                return (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange)' }}>{ref}</td>
                    <td>{c.pickup_address || '—'}</td>
                    <td>{c.delivery_address || '—'}</td>
                    <td>{c.package_type || '—'}</td>
                    <td>{c.weight_kg ? c.weight_kg + ' kg' : '—'}</td>
                    <td><span className={`status-badge ${s.cls}`}>{s.label}</span></td>
                    <td>
                      {next && (
                        <button
                          className="course-action-btn"
                          onClick={() => advanceCourseStatus(c.id, next)}
                        >
                          {ACTION_LABEL[c.status]}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="section-tag" style={{ marginBottom: '16px' }}>Historique</div>
      <div className="orders-table-wrap">
        {history.length === 0 ? (
          <div className="empty-state" id="historyCoursesEmpty">
            <span className="empty-icon">📋</span>
            <p>Pas encore d'historique.</p>
          </div>
        ) : (
          <table className="orders-table" id="historyCoursesTable">
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Départ</th>
                <th>Arrivée</th>
                <th>Colisage</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody id="historyCoursesTbody">
              {history.map(c => {
                const s = HISTORY_STATUS_LABELS[c.status] || { label: c.status, cls: 'status-pending' }
                const date = new Date(c.created_at).toLocaleDateString('fr-FR')
                const ref = 'FN-' + c.id.slice(0, 6).toUpperCase()
                return (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange)' }}>{ref}</td>
                    <td>{c.pickup_address || '—'}</td>
                    <td>{c.delivery_address || '—'}</td>
                    <td>{c.package_type || '—'}</td>
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
