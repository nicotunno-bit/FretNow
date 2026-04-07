// ============================================================
//  src/dispatch.js
//  Logique de dispatch côté frontend
//
//  Responsabilités :
//  - Client : soumettre une course + afficher l'état du dispatch
//  - Transporteur : afficher les notifications de course entrantes
//                   + minuteur de 15 secondes + boutons accept/refuse
// ============================================================

// ── CÔTÉ CLIENT : soumettre une course et suivre le dispatch ──

const DispatchManager = {
  /**
   * Processus complet de création + dispatch d'une course
   *   1. Sauvegarde la course en base
   *   2. Lance le géocodage + matching + notification
   *   3. Écoute les mises à jour de statut en Realtime
   *
   * @param {Object} formData - Données du formulaire client
   * @param {Function} onStatusChange - Callback(status, detail)
   * @returns {string} course_id
   */
  async submitAndDispatch(formData, onStatusChange) {
    const sb = getSupabase()

    // 1. Créer la course
    onStatusChange('creating', { message: 'Enregistrement de votre demande...' })
    const course = await window.FretNowAPI.courses.create(formData)

    // 2. Lancer le dispatch (géocode + matching + notification)
    onStatusChange('matching', { message: 'Recherche des transporteurs disponibles...' })
    let dispatchResult
    try {
      dispatchResult = await window.FretNowAPI.courses.dispatchCourse(
        course.id,
        formData.pickup_address,
        formData.vehicle_type
      )
      onStatusChange('dispatching', {
        message:    `${dispatchResult.matchResult.count} transporteur(s) trouvé(s). Notification en cours...`,
        transporter: dispatchResult.dispatchResult.first_notified,
      })
    } catch (err) {
      onStatusChange('failed', { message: err.message })
      return course.id
    }

    // 3. Écouter les mises à jour de statut de la course en Realtime
    DispatchManager._subscribeToCourseUpdates(course.id, onStatusChange)

    return course.id
  },

  /**
   * S'abonner aux changements de statut d'une course via Supabase Realtime
   * @param {string} courseId
   * @param {Function} onStatusChange - Callback(status, detail)
   * @returns {RealtimeChannel} Le channel Supabase (pour le désabonnement)
   */
  _subscribeToCourseUpdates(courseId, onStatusChange) {
    const sb = getSupabase()

    const channel = sb
      .channel(`course:${courseId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'courses', filter: `id=eq.${courseId}` },
        (payload) => {
          const newStatus = payload.new.status

          const messages = {
            dispatching: 'Un transporteur est en cours de notification...',
            assigned:    'Transporteur assigné ! Il arrive bientôt.',
            en_route:    'Le transporteur est en route vers le chargement.',
            picked_up:   'Marchandise chargée. Livraison en cours.',
            delivered:   'Livraison confirmée !',
            cancelled:   'Course annulée.',
            failed:      'Aucun transporteur disponible. Veuillez réessayer plus tard.',
          }

          onStatusChange(newStatus, {
            message:  messages[newStatus] || `Statut : ${newStatus}`,
            raw:      payload.new,
          })

          // Désabonnement automatique si course terminée
          if (['delivered', 'cancelled', 'failed'].includes(newStatus)) {
            sb.removeChannel(channel)
          }
        }
      )
      .subscribe()

    return channel
  },
}

// ── CÔTÉ TRANSPORTEUR : gérer les notifications entrantesenter ──

const TransporterDispatch = {
  _activeChannel:  null,
  _countdownTimer: null,

  /**
   * Démarrer l'écoute des dispatches entrants pour le transporteur connecté
   * Doit être appelé après connexion du transporteur
   * @param {string} transporteurId - UUID du transporteur
   * @param {Function} onNewDispatch - Callback(dispatchRequest)
   */
  startListening(transporteurId, onNewDispatch) {
    const sb = getSupabase()

    // Nettoyage préventif
    if (this._activeChannel) {
      sb.removeChannel(this._activeChannel)
    }

    // S'abonner aux nouvelles notifications de dispatch
    this._activeChannel = sb
      .channel(`dispatch:transporter:${transporteurId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'dispatch_requests',
          filter: `transporteur_id=eq.${transporteurId}`,
        },
        async (payload) => {
          if (payload.new.status === 'notified') {
            // Charger les détails de la course associée
            const sb = getSupabase()
            const { data: course } = await sb
              .from('courses')
              .select('*')
              .eq('id', payload.new.course_id)
              .single()

            onNewDispatch({ ...payload.new, course })
          }
        }
      )
      .subscribe()

    return this._activeChannel
  },

  /**
   * Afficher une notification de dispatch avec minuteur de 15 secondes
   * Insère un panneau dans le DOM et gère le compte à rebours
   *
   * @param {Object} dispatchReq - Données du dispatch_request + course
   * @param {Function} onAccept - Callback si accepté
   * @param {Function} onRefuse - Callback si refusé
   * @param {Function} onExpire - Callback si expiré
   */
  showDispatchNotification(dispatchReq, onAccept, onRefuse, onExpire) {
    const course = dispatchReq.course || {}

    // Créer le panneau de notification
    const panel = document.createElement('div')
    panel.id = 'dispatch-notification'
    panel.innerHTML = `
      <div class="dispatch-overlay">
        <div class="dispatch-card">
          <div class="dispatch-header">
            <span class="dispatch-badge">Nouvelle course</span>
            <span class="dispatch-timer" id="dispatch-countdown">15</span>s
          </div>

          <div class="dispatch-body">
            <div class="dispatch-route">
              <div class="dispatch-point pickup">
                <span class="dot"></span>
                <span>${course.pickup_address || '—'}</span>
              </div>
              <div class="dispatch-line"></div>
              <div class="dispatch-point delivery">
                <span class="dot"></span>
                <span>${course.delivery_address || '—'}</span>
              </div>
            </div>

            <div class="dispatch-meta">
              <span>📦 ${course.package_type || '—'}</span>
              <span>⚖️ ${course.weight_kg ? course.weight_kg + ' kg' : '—'}</span>
              <span>📍 ${dispatchReq.distance_km ? dispatchReq.distance_km + ' km' : '—'}</span>
            </div>
          </div>

          <div class="dispatch-actions">
            <button class="btn-refuse" id="btn-dispatch-refuse">Refuser</button>
            <button class="btn-accept" id="btn-dispatch-accept">Accepter</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(panel)

    // Minuteur de compte à rebours
    let remaining = Math.max(
      0,
      Math.floor((new Date(dispatchReq.expires_at) - Date.now()) / 1000)
    )
    const countdownEl = document.getElementById('dispatch-countdown')

    this._countdownTimer = setInterval(() => {
      remaining--
      if (countdownEl) countdownEl.textContent = Math.max(0, remaining)

      if (remaining <= 0) {
        clearInterval(this._countdownTimer)
        this._removeNotification()
        onExpire(dispatchReq)
      }
    }, 1000)

    // Bouton Accepter
    document.getElementById('btn-dispatch-accept').addEventListener('click', async () => {
      clearInterval(this._countdownTimer)
      this._removeNotification()
      try {
        const result = await window.FretNowAPI.transporteurs.respondToDispatch(dispatchReq.id, 'accept')
        onAccept(dispatchReq, result)
      } catch (err) {
        console.error('[dispatch] Erreur acceptation :', err)
        onExpire(dispatchReq)
      }
    })

    // Bouton Refuser
    document.getElementById('btn-dispatch-refuse').addEventListener('click', async () => {
      clearInterval(this._countdownTimer)
      this._removeNotification()
      try {
        const result = await window.FretNowAPI.transporteurs.respondToDispatch(dispatchReq.id, 'refuse')
        onRefuse(dispatchReq, result)
      } catch (err) {
        console.error('[dispatch] Erreur refus :', err)
      }
    })
  },

  _removeNotification() {
    const panel = document.getElementById('dispatch-notification')
    if (panel) panel.remove()
  },

  /** Arrêter l'écoute Realtime */
  stopListening() {
    const sb = getSupabase()
    if (this._activeChannel) {
      sb.removeChannel(this._activeChannel)
      this._activeChannel = null
    }
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
      this._countdownTimer = null
    }
  },
}

// ── Raccourci pour récupérer le client Supabase ──────────────
function getSupabase() {
  return window._supabaseClient || window.supabase
}

// Export global
window.DispatchManager    = DispatchManager
window.TransporterDispatch = TransporterDispatch
