// ============================================================
//  src/api.js
//  Couche d'abstraction API pour FretNow
//  Centralise tous les appels Supabase + Edge Functions
// ============================================================

// Récupère le client Supabase initialisé dans index.html
function getSupabase() {
  return window._supabaseClient || window.sb;
}

// ── Helpers ───────────────────────────────────────────────────

/** Appel générique à une Edge Function Supabase */
async function callEdgeFunction(name, body) {
  const sb = getSupabase()
  const { data: { session } } = await sb.auth.getSession()

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':         SUPABASE_ANON_KEY,
      'Authorization': session ? `Bearer ${session.access_token}` : `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`)
  return json
}

// ============================================================
//  API COURSES
// ============================================================

const CoursesAPI = {
  /**
   * Créer une nouvelle demande de transport
   * @param {Object} payload - Données du formulaire de commande
   * @returns {Object} La course créée
   */
  async create(payload) {
    const sb = getSupabase()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Vous devez être connecté pour créer une course')

    const { data, error } = await sb
      .from('courses')
      .insert({
        client_id:            user.id,
        pickup_address:       payload.pickup_address,
        delivery_address:     payload.delivery_address,
        package_type:         payload.package_type,
        weight_kg:            payload.weight_kg,
        volume_m3:            payload.volume_m3,
        declared_value:       payload.declared_value,
        vehicle_type_required: payload.vehicle_type,
        delay_required:       payload.delay_required,
        notes:                payload.notes,
        status:               'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Lancer le processus complet :
   *   1. Géocode l'adresse + trouve les transporteurs proches
   *   2. Lance le dispatch (notifications cascade)
   * @param {string} courseId
   * @param {string} pickupAddress
   * @param {string|null} vehicleType
   */
  async dispatchCourse(courseId, pickupAddress, vehicleType = null) {
    // Étape 1 : géocodage + matching
    const matchResult = await callEdgeFunction('find-transporters', {
      course_id:      courseId,
      pickup_address: pickupAddress,
      vehicle_type:   vehicleType,
      radius_km:      50,
    })

    if (!matchResult.transporters?.length) {
      throw new Error('Aucun transporteur disponible dans un rayon de 50 km')
    }

    // Étape 2 : lancer le dispatch
    const dispatchResult = await callEdgeFunction('dispatch-order', {
      course_id: courseId,
    })

    return { matchResult, dispatchResult }
  },

  /** Récupérer toutes les courses du client connecté */
  async list() {
    const sb = getSupabase()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return []

    const { data, error } = await sb
      .from('courses')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /** Récupérer une course par son ID */
  async getById(courseId) {
    const sb = getSupabase()
    const { data, error } = await sb
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (error) throw error
    return data
  },
}

// ============================================================
//  API TRANSPORTEURS
// ============================================================

const TransporteursAPI = {
  /**
   * Répondre à un dispatch (accepter ou refuser)
   * @param {string} dispatchRequestId
   * @param {'accept'|'refuse'} action
   */
  async respondToDispatch(dispatchRequestId, action) {
    return callEdgeFunction('accept-course', {
      dispatch_request_id: dispatchRequestId,
      action,
    })
  },

  /**
   * Envoyer une position GPS (tracking temps réel)
   * @param {number} lat
   * @param {number} lng
   * @param {string|null} courseId - ID de la course en cours
   * @param {number|null} speedKmh
   * @param {number|null} heading
   */
  async updateLocation(lat, lng, courseId = null, speedKmh = null, heading = null) {
    return callEdgeFunction('update-location', {
      lat,
      lng,
      course_id: courseId,
      speed_kmh: speedKmh,
      heading,
    })
  },

  /** Mettre à jour le statut de disponibilité */
  async setAvailability(isAvailable) {
    const sb = getSupabase()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { error } = await sb
      .from('transporteurs')
      .update({ is_available: isAvailable })
      .eq('user_id', user.id)

    if (error) throw error
    return { success: true }
  },

  /** Récupérer les dispatch_requests en attente pour le transporteur connecté */
  async getPendingDispatches() {
    const sb = getSupabase()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return []

    const { data: transporter } = await sb
      .from('transporteurs')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!transporter) return []

    const { data, error } = await sb
      .from('dispatch_requests')
      .select('*, courses(*)')
      .eq('transporteur_id', transporter.id)
      .eq('status', 'notified')
      .gte('expires_at', new Date().toISOString())

    if (error) throw error
    return data || []
  },
}

// ============================================================
//  API LOCATIONS (Tracking)
// ============================================================

const LocationsAPI = {
  /**
   * Récupérer l'historique de position pour une course
   * @param {string} courseId
   * @param {number} limitPoints - Nombre de points max (défaut 100)
   */
  async getForCourse(courseId, limitPoints = 100) {
    const sb = getSupabase()
    const { data, error } = await sb
      .from('locations')
      .select('lat, lng, speed_kmh, heading, recorded_at')
      .eq('course_id', courseId)
      .order('recorded_at', { ascending: false })
      .limit(limitPoints)

    if (error) throw error
    return (data || []).reverse() // Chronologique
  },

  /** Récupérer la dernière position d'un transporteur */
  async getLatestForTransporter(transporteurId) {
    const sb = getSupabase()
    const { data, error } = await sb
      .from('locations')
      .select('lat, lng, speed_kmh, heading, recorded_at')
      .eq('transporteur_id', transporteurId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data
  },
}

// Export global pour utilisation dans index.html
window.FretNowAPI = {
  courses:      CoursesAPI,
  transporteurs: TransporteursAPI,
  locations:    LocationsAPI,
}
