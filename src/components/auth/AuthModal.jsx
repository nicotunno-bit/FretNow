import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import sb from '../../lib/supabase.js'

export default function AuthModal() {
  const {
    authModalOpen,
    closeAuth,
    authAccountType,
    setAuthAccountType,
    setActivePage,
  } = useAuth()

  const [activeTab, setActiveTab] = useState('login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [authMsg, setAuthMsg] = useState('')
  const [authMsgType, setAuthMsgType] = useState('')
  const [loading, setLoading] = useState(false)

  function showMsg(msg, type) {
    setAuthMsg(msg)
    setAuthMsgType(type)
  }

  function clearMsg() {
    setAuthMsg('')
    setAuthMsgType('')
  }

  function switchTab(tab) {
    setActiveTab(tab)
    clearMsg()
  }

  function handleAccountType(type) {
    setAuthAccountType(type)
    clearMsg()
  }

  async function handleLogin() {
    if (!loginEmail || !loginPassword) {
      showMsg('Veuillez remplir tous les champs.', 'error')
      return
    }
    setLoading(true)
    const { error } = await sb.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
    setLoading(false)
    if (error) {
      showMsg('Email ou mot de passe incorrect.', 'error')
    }
    // onAuthStateChange → handleSessionEstablished closes modal
  }

  async function handleRegisterClient() {
    if (!regName || !regEmail || !regPassword) {
      showMsg('Remplissez les champs obligatoires.', 'error')
      return
    }
    if (regPassword.length < 8) {
      showMsg('Mot de passe trop court (8 caractères min.).', 'error')
      return
    }
    setLoading(true)
    const { error } = await sb.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: { data: { company_name: regName, phone: regPhone, full_name: regName } },
    })
    setLoading(false)
    if (error) {
      showMsg(error.message, 'error')
    } else {
      showMsg('Compte créé ! Vérifiez votre email pour confirmer.', 'success')
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!loginEmail) {
      showMsg("Entrez votre email d'abord.", 'error')
      return
    }
    const { error } = await sb.auth.resetPasswordForEmail(loginEmail)
    if (error) showMsg('Erreur : ' + error.message, 'error')
    else showMsg('Email de réinitialisation envoyé !', 'success')
  }

  function redirectToCarrierForm() {
    closeAuth()
    setActivePage('carrier')
    setTimeout(() => {
      const el = document.getElementById('carrier-inscription')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 200)
  }

  function handleOverlayClick(e) {
    if (e.target !== e.currentTarget) return
    if (authMsg) return
    if (loginPassword) return
    closeAuth()
  }

  const modalTitle = authAccountType === 'client' ? 'Espace Client' : 'Espace Transporteur'
  const modalSub = authAccountType === 'client'
    ? 'Connectez-vous pour suivre vos transports'
    : 'Connectez-vous pour gérer vos courses'

  const showRegisterClient = activeTab === 'register' && authAccountType === 'client'
  const showRegisterCarrier = activeTab === 'register' && authAccountType === 'carrier'
  const showLogin = activeTab === 'login'

  return (
    <div
      className={`auth-modal-overlay${authModalOpen ? ' active' : ''}`}
      id="authModalOverlay"
      onClick={handleOverlayClick}
    >
      <div className="auth-modal">
        <button className="auth-close" onClick={closeAuth}>×</button>
        <div className="auth-modal-title" id="authModalTitle">{modalTitle}</div>
        <div className="auth-modal-sub" id="authModalSub">{modalSub}</div>

        <div className="account-type-switch">
          <button
            type="button"
            className={`account-type-btn${authAccountType === 'client' ? ' active' : ''}`}
            id="accountTypeClient"
            onClick={() => handleAccountType('client')}
          >
            📦 Client
          </button>
          <button
            type="button"
            className={`account-type-btn${authAccountType === 'carrier' ? ' active' : ''}`}
            id="accountTypeCarrier"
            onClick={() => handleAccountType('carrier')}
          >
            🚛 Transporteur
          </button>
        </div>

        <div className="auth-tabs">
          <div
            className={`auth-tab${activeTab === 'login' ? ' active' : ''}`}
            id="authTabLogin"
            onClick={() => switchTab('login')}
          >
            Connexion
          </div>
          <div
            className={`auth-tab${activeTab === 'register' ? ' active' : ''}`}
            id="authTabRegister"
            onClick={() => switchTab('register')}
          >
            Créer un compte
          </div>
        </div>

        {authMsg && (
          <div id="authMsg" className={`auth-msg ${authMsgType}`}>{authMsg}</div>
        )}
        {!authMsg && <div id="authMsg" className="auth-msg"></div>}

        {/* LOGIN */}
        <div className={`auth-form-panel${showLogin ? ' active' : ''}`} id="authPanelLogin">
          <input
            className="auth-input"
            type="email"
            id="loginEmail"
            placeholder="Email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
          />
          <input
            className="auth-input"
            type="password"
            id="loginPassword"
            placeholder="Mot de passe"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
          />
          <button
            className="auth-btn"
            id="loginBtn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <a
              href="#"
              onClick={handleForgotPassword}
              style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}
              onMouseOver={e => e.target.style.color = 'var(--orange)'}
              onMouseOut={e => e.target.style.color = 'var(--muted)'}
            >
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        {/* REGISTER CLIENT */}
        <div className={`auth-form-panel${showRegisterClient ? ' active' : ''}`} id="authPanelRegisterClient">
          <input
            className="auth-input"
            type="text"
            id="regNameClient"
            placeholder="Nom de votre société"
            value={regName}
            onChange={e => setRegName(e.target.value)}
          />
          <input
            className="auth-input"
            type="email"
            id="regEmailClient"
            placeholder="Email professionnel"
            value={regEmail}
            onChange={e => setRegEmail(e.target.value)}
          />
          <input
            className="auth-input"
            type="tel"
            id="regPhoneClient"
            placeholder="Téléphone"
            value={regPhone}
            onChange={e => setRegPhone(e.target.value)}
          />
          <input
            className="auth-input"
            type="password"
            id="regPasswordClient"
            placeholder="Mot de passe (8 caractères min.)"
            value={regPassword}
            onChange={e => setRegPassword(e.target.value)}
          />
          <button
            className="auth-btn"
            id="registerClientBtn"
            onClick={handleRegisterClient}
            disabled={loading}
          >
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </div>

        {/* REGISTER CARRIER */}
        <div className={`auth-form-panel${showRegisterCarrier ? ' active' : ''}`} id="authPanelRegisterCarrier">
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '12px' }}>
            L'inscription transporteur nécessite des informations détaillées (SIRET, véhicules, zones d'intervention).
          </p>
          <button className="auth-btn" onClick={redirectToCarrierForm}>
            Accéder au formulaire complet
          </button>
        </div>
      </div>
    </div>
  )
}
