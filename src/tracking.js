// ============================================================
//  src/tracking.js
//  Tracking GPS temps réel
//
//  CÔTÉ CLIENT : Abonnement Realtime pour voir la position
//                du transporteur évoluer sur une carte
//  CÔTÉ TRANSPORTEUR : Envoi de position GPS en continu
//                      via l'API Geolocation du navigateur
// ============================================================

// ============================================================
//  LiveTracker — Côté client
//  S'abonne aux mises à jour de position d'un transporteur
//  via Supabase Realtime et met à jour l'UI
// ============================================================
const LiveTracker = {
  _channel:   null,
  _courseId:  null,
  _callbacks: [],

  /**
   * Démarrer le suivi temps réel d'une course
   * @param {string} courseId - UUID de la course à suivre
   * @param {Function} onPositionUpdate - Callback({ lat, lng, speed_kmh, heading, recorded_at })
   * @param {Function} onStatusChange   - Callback(newStatus) quand la course change de statut
   */
  start(courseId, onPositionUpdate, onStatusChange) {
    const sb = getSupabase()
    this._courseId = courseId

    // Nettoyage préventif si un tracking était déjà actif
    this.stop()

    this._channel = sb
      .channel(`tracking:${courseId}`)

      // Écoute les nouvelles entrées GPS dans `locations`
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'locations',
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          const pos = {
            lat:         payload.new.lat,
            lng:         payload.new.lng,
            speed_kmh:   payload.new.speed_kmh,
            heading:     payload.new.heading,
            recorded_at: payload.new.recorded_at,
          }
          onPositionUpdate(pos)
        }
      )

      // Écoute les changements de statut de la course
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'courses',
          filter: `id=eq.${courseId}`,
        },
        (payload) => {
          onStatusChange(payload.new.status, payload.new)

          // Auto-stop si course terminée
          if (['delivered', 'cancelled', 'failed'].includes(payload.new.status)) {
            this.stop()
          }
        }
      )

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[tracking] Suivi actif pour course ${courseId}`)
        }
      })

    return this._channel
  },

  /** Arrêter le suivi */
  stop() {
    const sb = getSupabase()
    if (this._channel) {
      sb.removeChannel(this._channel)
      this._channel = null
    }
    console.log('[tracking] Suivi arrêté')
  },

  /**
   * Charger les positions historiques et simuler une relecture
   * Utile pour rejoindre un tracking en cours
   * @param {string} courseId
   * @param {Function} onPositionUpdate
   */
  async replayHistory(courseId, onPositionUpdate) {
    const positions = await window.FretNowAPI.locations.getForCourse(courseId, 200)
    for (const pos of positions) {
      onPositionUpdate(pos)
    }
    return positions
  },
}

// ============================================================
//  GpsEmitter — Côté transporteur
//  Lit le GPS du navigateur et envoie les positions au backend
// ============================================================
const GpsEmitter = {
  _watchId:    null,
  _courseId:   null,
  _interval:   null,
  _lastPos:    null,
  _minDistM:   50,    // Envoie uniquement si déplacement > 50 mètres
  _maxAgeMs:   10000, // Envoie au moins toutes les 10 secondes si en mouvement

  /**
   * Démarrer l'émission GPS
   * @param {string|null} courseId - UUID de la course en cours (null si hors mission)
   * @param {Object} options
   * @param {number} options.minDistanceMeters  - Distance min entre 2 envois (défaut 50m)
   * @param {number} options.maxIntervalMs      - Intervalle max d'envoi (défaut 10s)
   */
  start(courseId = null, { minDistanceMeters = 50, maxIntervalMs = 10_000 } = {}) {
    if (!navigator.geolocation) {
      console.warn('[GpsEmitter] Geolocation non disponible dans ce navigateur')
      return false
    }

    this._courseId  = courseId
    this._minDistM  = minDistanceMeters
    this._maxAgeMs  = maxIntervalMs

    // Surveiller la position GPS du navigateur
    this._watchId = navigator.geolocation.watchPosition(
      (position) => this._onPosition(position),
      (error)    => console.error('[GpsEmitter] Erreur GPS :', error),
      {
        enableHighAccuracy: true,
        timeout:            10_000,
        maximumAge:         2_000,
      }
    )

    // Fallback : envoyer même si pas de mouvement (pour "je suis vivant")
    this._interval = setInterval(() => {
      if (this._lastPos) {
        this._sendPosition(this._lastPos)
      }
    }, maxIntervalMs)

    console.log(`[GpsEmitter] Démarré pour course ${courseId || '(hors mission)'}`)
    return true
  },

  _onPosition(geoPos) {
    const { latitude: lat, longitude: lng, speed, heading } = geoPos.coords

    // Calculer la distance avec la dernière position envoyée
    if (this._lastPos) {
      const dist = this._haversine(this._lastPos.lat, this._lastPos.lng, lat, lng)
      // Ne rien envoyer si pas assez de déplacement (sauf via l'interval)
      if (dist < this._minDistM) return
    }

    const pos = {
      lat,
      lng,
      speed_kmh: speed != null ? Math.round(speed * 3.6) : null,
      heading:   heading != null ? Math.round(heading) : null,
    }

    this._lastPos = pos
    this._sendPosition(pos)
  },

  async _sendPosition(pos) {
    try {
      await window.FretNowAPI.transporteurs.updateLocation(
        pos.lat,
        pos.lng,
        this._courseId,
        pos.speed_kmh,
        pos.heading
      )
    } catch (err) {
      console.warn('[GpsEmitter] Erreur envoi position :', err)
    }
  },

  /** Arrêter l'émission GPS */
  stop() {
    if (this._watchId != null) {
      navigator.geolocation.clearWatch(this._watchId)
      this._watchId = null
    }
    if (this._interval) {
      clearInterval(this._interval)
      this._interval = null
    }
    this._lastPos = null
    console.log('[GpsEmitter] Arrêté')
  },

  /**
   * Formule Haversine — distance en mètres entre deux points GPS
   * @returns {number} Distance en mètres
   */
  _haversine(lat1, lng1, lat2, lng2) {
    const R  = 6_371_000 // Rayon Terre en mètres
    const dL = (lat2 - lat1) * Math.PI / 180
    const dl = (lng2 - lng1) * Math.PI / 180
    const a  = Math.sin(dL / 2) ** 2
              + Math.cos(lat1 * Math.PI / 180)
              * Math.cos(lat2 * Math.PI / 180)
              * Math.sin(dl / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  },
}

// ── Raccourci Supabase ────────────────────────────────────────
function getSupabase() {
  return window._supabaseClient || window.supabase
}

// Export global
window.LiveTracker = LiveTracker
window.GpsEmitter  = GpsEmitter
