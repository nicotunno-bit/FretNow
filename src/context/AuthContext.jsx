import { createContext, useContext, useState, useEffect, useRef } from 'react'
import sb from '../lib/supabase.js'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

const CASCADE_RADII = [10, 25, 50, 100]
const CASCADE_WAIT_MS = 20000

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentRole, setCurrentRole] = useState(null)
  const [currentTransporter, setCurrentTransporter] = useState(null)
  const [authAccountType, setAuthAccountType] = useState('client')
  const [activePage, setActivePage] = useState('client')
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const [clientDashboardVisible, setClientDashboardVisible] = useState(false)
  const [carrierDashboardVisible, setCarrierDashboardVisible] = useState(false)

  const [clientOrders, setClientOrders] = useState([])
  const [carrierCourses, setCarrierCourses] = useState({ active: [], history: [] })
  const [carrierStats, setCarrierStats] = useState({
    total: 0, active: 0, done: 0, rating: null, weight: 0, acceptance: null
  })
  const [availabilityState, setAvailabilityState] = useState(false)

  const [successModal, setSuccessModal] = useState({ open: false, text: '' })
  const [carrierSuccessModal, setCarrierSuccessModal] = useState(false)

  const [radiusCascade, setRadiusCascade] = useState({
    visible: false,
    steps: { 10: '', 25: '', 50: '', 100: '' }, // '' | 'active' | 'done'
    status: '',
  })

  const currentTransporterRef = useRef(null)
  const currentUserRef = useRef(null)
  const currentRoleRef = useRef(null)

  useEffect(() => {
    currentTransporterRef.current = currentTransporter
  }, [currentTransporter])
  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])
  useEffect(() => {
    currentRoleRef.current = currentRole
  }, [currentRole])

  async function detectUserRole(userId) {
    const { data: transporter } = await sb
      .from('transporteurs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (transporter) return { role: 'carrier', transporter }
    return { role: 'client', transporter: null }
  }

  async function handleSessionEstablished(user) {
    setCurrentUser(user)
    const { role, transporter } = await detectUserRole(user.id)
    setCurrentRole(role)
    setCurrentTransporter(transporter)
    setAuthModalOpen(false)

    if (role === 'client') {
      await loadClientDashboard(user)
    } else {
      setActivePage('carrier')
      await loadCarrierDashboard(user, transporter)
      startListeningForDispatches(transporter)
    }
  }

  function handleSessionEnded() {
    setCurrentUser(null)
    setCurrentRole(null)
    setCurrentTransporter(null)
    setAvailabilityState(false)
    stopListeningForDispatches()
    if (window.GpsEmitter) window.GpsEmitter.stop()
    setClientDashboardVisible(false)
    setCarrierDashboardVisible(false)
  }

  async function initAuth() {
    const { data: { session } } = await sb.auth.getSession()
    if (session) {
      await handleSessionEstablished(session.user)
    }

    sb.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        if (currentUserRef.current?.id !== session.user.id) {
          await handleSessionEstablished(session.user)
        }
      } else {
        handleSessionEnded()
      }
    })
  }

  useEffect(() => {
    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── CLIENT DASHBOARD ────────────────────────────────────────
  async function loadClientDashboard(user) {
    const u = user || currentUserRef.current
    if (!u) return
    const { data: orders, error } = await sb
      .from('courses')
      .select('*')
      .eq('client_id', u.id)
      .order('created_at', { ascending: false })
    if (error) { console.error(error); return }
    setClientOrders(orders || [])
  }

  function showClientDashboard() {
    setClientDashboardVisible(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    loadClientDashboard()
  }

  function hideClientDashboard() {
    setClientDashboardVisible(false)
  }

  // ─── CARRIER DASHBOARD ───────────────────────────────────────
  async function loadCarrierDashboard(user, transporter) {
    const u = user || currentUserRef.current
    const role = currentRoleRef.current
    if (!u || (role !== 'carrier' && role !== null && transporter == null)) return
    // if role is null we may still be initializing

    let t = transporter || currentTransporterRef.current
    if (!t) {
      const { data } = await sb
        .from('transporteurs')
        .select('*')
        .eq('user_id', u.id)
        .maybeSingle()
      if (!data) return
      t = data
    } else {
      // refresh
      const { data } = await sb
        .from('transporteurs')
        .select('*')
        .eq('user_id', u.id)
        .maybeSingle()
      if (data) t = data
    }

    setCurrentTransporter(t)
    setAvailabilityState(!!t.is_available)

    const { data: courses } = await sb
      .from('courses')
      .select('*')
      .eq('transporteur_id', t.id)
      .order('created_at', { ascending: false })

    const all = courses || []
    const active = all.filter(c => ['assigned', 'en_route', 'picked_up'].includes(c.status))
    const history = all.filter(c => ['delivered', 'cancelled'].includes(c.status))
    setCarrierCourses({ active, history })

    const delivered = history.filter(c => c.status === 'delivered')
    const totalKg = delivered.reduce((sum, c) => sum + (c.weight_kg || 0), 0)
    const weightStr = totalKg >= 1000 ? (totalKg / 1000).toFixed(1) + ' t' : totalKg + ' kg'

    const { data: dispatches } = await sb
      .from('dispatch_requests')
      .select('status')
      .eq('transporteur_id', t.id)
      .in('status', ['accepted', 'refused'])

    let acceptanceStr = '—'
    if (dispatches && dispatches.length) {
      const accepted = dispatches.filter(d => d.status === 'accepted').length
      const rate = Math.round((accepted / dispatches.length) * 100)
      acceptanceStr = rate + '%'
    }

    setCarrierStats({
      total: all.length,
      active: active.length,
      done: delivered.length,
      rating: t.rating ? Number(t.rating).toFixed(1) : null,
      weight: weightStr,
      acceptance: acceptanceStr,
      status: t.status,
      statusLine: buildStatusLine(t),
    })
  }

  function buildStatusLine(t) {
    const labels = { active: 'Actif', pending: 'En attente de validation', inactive: 'Inactif', suspended: 'Suspendu' }
    const label = labels[t.status] || t.status
    return { label, isPending: t.status === 'pending', isActive: t.status === 'active' }
  }

  function showCarrierDashboard() {
    setCarrierDashboardVisible(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    loadCarrierDashboard()
  }

  function hideCarrierDashboard() {
    setCarrierDashboardVisible(false)
  }

  // ─── AUTH ────────────────────────────────────────────────────
  function openAuth(accountType) {
    setAuthAccountType(accountType || 'client')
    setAuthModalOpen(true)
  }

  function closeAuth() {
    setAuthModalOpen(false)
  }

  async function handleLogin(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function handleRegisterClient(name, email, phone, password) {
    const { error } = await sb.auth.signUp({
      email, password,
      options: { data: { company_name: name, phone, full_name: name } }
    })
    if (error) throw error
  }

  async function handleLogout() {
    await sb.auth.signOut()
    hideClientDashboard()
    hideCarrierDashboard()
  }

  // ─── AVAILABILITY TOGGLE ─────────────────────────────────────
  async function toggleAvailability() {
    const t = currentTransporterRef.current
    if (!t) return
    if (t.status !== 'active') {
      alert('Votre compte doit être validé par un administrateur avant de recevoir des courses.')
      return
    }
    const newState = !t.is_available
    const { error } = await sb
      .from('transporteurs')
      .update({ is_available: newState })
      .eq('id', t.id)
    if (error) { alert('Erreur : ' + error.message); return }
    setCurrentTransporter(prev => ({ ...prev, is_available: newState }))
    setAvailabilityState(newState)

    if (newState && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        if (window.FretNowAPI) {
          try {
            await window.FretNowAPI.transporteurs.updateLocation(pos.coords.latitude, pos.coords.longitude)
          } catch (e) { console.warn('updateLocation:', e) }
        }
      })
    }
  }

  // ─── ADVANCE COURSE STATUS ───────────────────────────────────
  async function advanceCourseStatus(courseId, newStatus) {
    const extraFields = {}
    if (newStatus === 'picked_up') extraFields.picked_up_at = new Date().toISOString()
    if (newStatus === 'delivered') extraFields.delivered_at = new Date().toISOString()

    const { error } = await sb
      .from('courses')
      .update({ status: newStatus, ...extraFields })
      .eq('id', courseId)

    if (error) { alert('Erreur : ' + error.message); return }

    if (window.GpsEmitter) {
      if (newStatus === 'en_route' || newStatus === 'picked_up') {
        window.GpsEmitter.start(courseId)
      } else if (newStatus === 'delivered') {
        window.GpsEmitter.stop()
        const t = currentTransporterRef.current
        if (t) {
          await sb.from('transporteurs').update({ is_available: true }).eq('id', t.id)
        }
      }
    }

    await loadCarrierDashboard()
  }

  // ─── DISPATCH LISTENING ──────────────────────────────────────
  function startListeningForDispatches(transporter) {
    const t = transporter || currentTransporterRef.current
    if (!t || !window.TransporterDispatch) return
    window.TransporterDispatch.startListening(t.id, async (dispatchReq) => {
      window.TransporterDispatch.showDispatchNotification(
        dispatchReq,
        async (dr) => {
          if (window.NotificationService) window.NotificationService.onCourseAccepted(dr.course)
          await loadCarrierDashboard()
        },
        () => {
          if (window.NotificationService) window.NotificationService.onCourseRefused()
        },
        () => {
          if (window.NotificationService) window.NotificationService.onDispatchExpired()
        }
      )
    })
  }

  function stopListeningForDispatches() {
    if (window.TransporterDispatch) window.TransporterDispatch.stopListening()
  }

  // ─── RADIUS CASCADE ──────────────────────────────────────────
  async function startRadiusCascade(courseId, pickupAddress, vehicleType) {
    setRadiusCascade({
      visible: true,
      steps: { 10: '', 25: '', 50: '', 100: '' },
      status: 'Initialisation…',
    })

    setTimeout(() => {
      const el = document.getElementById('radiusCascade')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 300)

    let cascadeDone = false

    const channel = sb
      .channel(`cascade:${courseId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'courses', filter: `id=eq.${courseId}` },
        async (payload) => {
          const s = payload.new.status
          if (['assigned', 'en_route', 'picked_up', 'delivered'].includes(s)) {
            cascadeDone = true
            setRadiusCascade(prev => ({
              ...prev,
              status: '✓ Transporteur trouvé et assigné !',
              found: true,
            }))
            setTimeout(async () => {
              setRadiusCascade(prev => ({ ...prev, visible: false }))
              await loadClientDashboard()
              sb.removeChannel(channel)
            }, 3000)
          }
        })
      .subscribe()

    for (let i = 0; i < CASCADE_RADII.length; i++) {
      if (cascadeDone) break
      const radius = CASCADE_RADII[i]

      setRadiusCascade(prev => {
        const steps = { ...prev.steps }
        CASCADE_RADII.forEach(r => {
          if (steps[r] === 'active') steps[r] = ''
        })
        steps[radius] = 'active'
        return { ...prev, steps, status: `Recherche dans un rayon de ${radius} km…` }
      })

      try {
        if (window.FretNowAPI) {
          await window.FretNowAPI.courses.dispatchCourse(courseId, pickupAddress, vehicleType, radius)
        }
      } catch (err) {
        console.warn(`[cascade] Rayon ${radius}km : ${err.message}`)
      }

      await new Promise(r => setTimeout(r, CASCADE_WAIT_MS))

      if (cascadeDone) break

      const { data: check } = await sb.from('courses').select('status').eq('id', courseId).single()
      if (check && !['pending', 'dispatching', 'failed'].includes(check.status)) {
        cascadeDone = true
        break
      }

      setRadiusCascade(prev => {
        const steps = { ...prev.steps }
        steps[radius] = 'done'
        return { ...prev, steps }
      })
    }

    if (!cascadeDone) {
      setRadiusCascade(prev => ({
        ...prev,
        status: 'Aucun transporteur disponible pour le moment. Notre équipe vous recontactera manuellement sous 2h.',
        failed: true,
      }))
      sb.removeChannel(channel)
    }
  }

  const value = {
    currentUser,
    currentRole,
    currentTransporter,
    authAccountType,
    setAuthAccountType,
    activePage,
    setActivePage,
    authModalOpen,
    openAuth,
    closeAuth,
    handleLogin,
    handleRegisterClient,
    handleLogout,
    detectUserRole,
    loadClientDashboard,
    loadCarrierDashboard,
    clientDashboardVisible,
    carrierDashboardVisible,
    showClientDashboard,
    hideClientDashboard,
    showCarrierDashboard,
    hideCarrierDashboard,
    clientOrders,
    carrierCourses,
    carrierStats,
    availabilityState,
    toggleAvailability,
    advanceCourseStatus,
    radiusCascade,
    startRadiusCascade,
    successModal,
    setSuccessModal,
    carrierSuccessModal,
    setCarrierSuccessModal,
    sb,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
