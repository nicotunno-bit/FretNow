// ============================================================
//  src/notifications.js
//  Système de notifications UI + intégrations futures
//
//  MVP : Toasts dans le navigateur + logs
//  Prod : Brancher Twilio (SMS), Resend (email), Firebase (push)
// ============================================================

// ============================================================
//  ToastNotifier — Notifications UI in-app
//  Affiche des toasts non-intrusifs en haut à droite
// ============================================================
const ToastNotifier = {
  _container: null,

  /** Initialiser le conteneur de toasts (injecter dans le DOM) */
  init() {
    if (document.getElementById('toast-container')) return

    const container = document.createElement('div')
    container.id = 'toast-container'
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 340px;
    `
    document.body.appendChild(container)
    this._container = container
  },

  /**
   * Afficher un toast
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {number} durationMs - Durée d'affichage (défaut 4s)
   */
  show(message, type = 'info', durationMs = 4000) {
    this.init()

    const colors = {
      success: { bg: '#1a2e1a', border: '#4caf50', icon: '✓' },
      error:   { bg: '#2e1a1a', border: '#f44336', icon: '✕' },
      info:    { bg: '#1a1e2e', border: '#FF6B00', icon: 'ℹ' },
      warning: { bg: '#2e261a', border: '#ff9800', icon: '⚠' },
    }
    const style = colors[type] || colors.info

    const toast = document.createElement('div')
    toast.style.cssText = `
      background: ${style.bg};
      border: 1px solid ${style.border};
      border-left: 3px solid ${style.border};
      color: #f0ede8;
      padding: 12px 16px;
      border-radius: 4px;
      font-family: 'Barlow', sans-serif;
      font-size: 14px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      animation: slideIn 0.2s ease;
      cursor: pointer;
    `
    toast.innerHTML = `
      <span style="color:${style.border};font-weight:bold;flex-shrink:0">${style.icon}</span>
      <span>${message}</span>
    `
    toast.addEventListener('click', () => toast.remove())

    this._container.appendChild(toast)

    // Suppression automatique
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transition = 'opacity 0.3s'
      setTimeout(() => toast.remove(), 300)
    }, durationMs)
  },

  success: (msg, ms)  => ToastNotifier.show(msg, 'success', ms),
  error:   (msg, ms)  => ToastNotifier.show(msg, 'error',   ms),
  info:    (msg, ms)  => ToastNotifier.show(msg, 'info',    ms),
  warning: (msg, ms)  => ToastNotifier.show(msg, 'warning', ms),
}

// ============================================================
//  NotificationService — Notifications métier
//  Centralise tous les événements de notification de l'app
//  MVP = Toast + console.log
//  Prod = brancher les vraies APIs ci-dessous
// ============================================================
const NotificationService = {

  // ── Événements côté CLIENT ────────────────────────────────

  /** Client : demande créée */
  onOrderCreated(course) {
    ToastNotifier.success('Votre demande a été enregistrée. Recherche d\'un transporteur...')
    console.log('[notify] Demande créée :', course.id)
  },

  /** Client : transporteur trouvé et notifié */
  onTransporterNotified(transporter) {
    ToastNotifier.info(
      `Notification envoyée à ${transporter.company_name} (${transporter.distance_km} km)`
    )
  },

  /** Client : course assignée */
  onCourseAssigned(course, transporter) {
    ToastNotifier.success(
      `Course acceptée par ${transporter?.company_name || 'un transporteur'} ! Suivi disponible.`,
      6000
    )
    // PROD : envoyer un email de confirmation au client
    // EmailService.sendCourseConfirmation(course.client_email, course, transporter)
  },

  /** Client : livraison confirmée */
  onCourseDelivered(course) {
    ToastNotifier.success('Livraison confirmée ! Merci d\'avoir utilisé FretNow.', 7000)
    // PROD : envoyer un email de confirmation + lien pour notation
    // EmailService.sendDeliveryConfirmation(course.client_email, course)
  },

  /** Client : aucun transporteur disponible */
  onNoTransporterAvailable() {
    ToastNotifier.error(
      'Aucun transporteur disponible dans un rayon de 50 km pour le moment. Veuillez réessayer.',
      8000
    )
    // PROD : SMS d'alerte
    // SmsService.send(clientPhone, 'FretNow : Aucun transporteur disponible...')
  },

  // ── Événements côté TRANSPORTEUR ─────────────────────────

  /** Transporteur : nouvelle course disponible */
  onNewCourseAvailable(course) {
    ToastNotifier.warning(
      `Nouvelle course : ${course.pickup_address} → ${course.delivery_address}`,
      15000 // 15s = durée de la fenêtre de réponse
    )
    // PROD : notification push Firebase
    // PushService.send(transporter.fcm_token, 'Nouvelle course FretNow', ...)
  },

  /** Transporteur : course acceptée avec succès */
  onCourseAccepted(course) {
    ToastNotifier.success(`Course acceptée ! Rendez-vous à : ${course.pickup_address}`)
  },

  /** Transporteur : course refusée */
  onCourseRefused() {
    ToastNotifier.info('Course refusée. Vous restez disponible pour de nouvelles demandes.')
  },

  /** Transporteur : fenêtre expirée */
  onDispatchExpired() {
    ToastNotifier.warning('Temps expiré. La course a été proposée au prochain transporteur.')
  },

  // ── Utilitaires ───────────────────────────────────────────

  /**
   * Mapper un statut de course vers un message lisible
   * @param {string} status
   * @returns {{ label: string, type: 'success'|'info'|'warning'|'error' }}
   */
  statusToMessage(status) {
    const map = {
      pending:     { label: 'En attente',             type: 'info'    },
      dispatching: { label: 'Recherche transporteur', type: 'info'    },
      assigned:    { label: 'Transporteur assigné',   type: 'success' },
      en_route:    { label: 'En route',                type: 'success' },
      picked_up:   { label: 'Marchandise chargée',    type: 'success' },
      delivered:   { label: 'Livré',                  type: 'success' },
      cancelled:   { label: 'Annulé',                 type: 'warning' },
      failed:      { label: 'Échec dispatch',          type: 'error'   },
    }
    return map[status] || { label: status, type: 'info' }
  },

  /**
   * Afficher un toast selon le statut d'une course
   * @param {string} status
   */
  notifyStatus(status) {
    const { label, type } = this.statusToMessage(status)
    ToastNotifier.show(`Statut : ${label}`, type)
  },
}

/*
============================================================
  INTÉGRATIONS FUTURES (à décommenter/brancher en prod)
============================================================

// ── Twilio SMS ──────────────────────────────────────────────
const SmsService = {
  async send(to, body) {
    const res = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, body })
    })
    return res.json()
  }
}

// ── Resend / SendGrid Email ─────────────────────────────────
const EmailService = {
  async sendCourseConfirmation(toEmail, course, transporter) {
    const res = await fetch('/api/email/course-confirmed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: toEmail, course, transporter })
    })
    return res.json()
  }
}

// ── Firebase Push Notifications ─────────────────────────────
const PushService = {
  async send(fcmToken, title, body) {
    const res = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: fcmToken, title, body })
    })
    return res.json()
  }
}
*/

// CSS pour l'animation des toasts (injecté dynamiquement)
const toastStyle = document.createElement('style')
toastStyle.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
`
document.head.appendChild(toastStyle)

// Export global
window.ToastNotifier      = ToastNotifier
window.NotificationService = NotificationService
