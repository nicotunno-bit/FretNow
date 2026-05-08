import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import sb from '../../lib/supabase.js'

export default function AuthModal() {
  const { authModalOpen, closeAuth, authAccountType, setAuthAccountType, setActivePage } = useAuth()

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

  function showMsg(msg, type) { setAuthMsg(msg); setAuthMsgType(type) }
  function clearMsg() { setAuthMsg(''); setAuthMsgType('') }
  function switchTab(tab) { setActiveTab(tab); clearMsg() }
  function handleAccountType(type) { setAuthAccountType(type); clearMsg() }

  async function handleLogin() {
    if (!loginEmail || !loginPassword) { showMsg('Veuillez remplir tous les champs.', 'error'); return }
    setLoading(true)
    const { error } = await sb.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
    setLoading(false)
    if (error) showMsg('Email ou mot de passe incorrect.', 'error')
  }

  async function handleRegisterClient() {
    if (!regName || !regEmail || !regPassword) { showMsg('Remplissez les champs obligatoires.', 'error'); return }
    if (regPassword.length < 8) { showMsg('Mot de passe trop court (8 caractères min.).', 'error'); return }
    setLoading(true)
    const { error } = await sb.auth.signUp({
      email: regEmail, password: regPassword,
      options: { data: { company_name: regName, phone: regPhone, full_name: regName } },
    })
    setLoading(false)
    if (error) showMsg(error.message, 'error')
    else showMsg('Compte créé ! Vérifiez votre email pour confirmer.', 'success')
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!loginEmail) { showMsg("Entrez votre email d'abord.", 'error'); return }
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
    if (authMsg || loginPassword) return
    closeAuth()
  }

  const modalTitle = authAccountType === 'client' ? 'Espace Client' : 'Espace Transporteur'
  const modalSub = authAccountType === 'client'
    ? 'Connectez-vous pour suivre vos transports'
    : 'Connectez-vous pour gérer vos courses'

  const showLogin = activeTab === 'login'
  const showRegisterClient = activeTab === 'register' && authAccountType === 'client'
  const showRegisterCarrier = activeTab === 'register' && authAccountType === 'carrier'

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          className="auth-modal-overlay active"
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <button className="auth-close" onClick={closeAuth}>×</button>
            <div className="auth-modal-title">{modalTitle}</div>
            <div className="auth-modal-sub">{modalSub}</div>

            <div className="account-type-switch">
              {['client', 'carrier'].map(type => (
                <motion.button
                  key={type}
                  type="button"
                  className={`account-type-btn${authAccountType === type ? ' active' : ''}`}
                  onClick={() => handleAccountType(type)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {type === 'client' ? '📦 Client' : '🚛 Transporteur'}
                </motion.button>
              ))}
            </div>

            <div className="auth-tabs">
              {['login', 'register'].map(tab => (
                <div
                  key={tab}
                  className={`auth-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => switchTab(tab)}
                >
                  {tab === 'login' ? 'Connexion' : 'Créer un compte'}
                </div>
              ))}
            </div>

            <div className={`auth-msg ${authMsgType}`}>{authMsg}</div>

            {/* LOGIN */}
            <div className={`auth-form-panel${showLogin ? ' active' : ''}`}>
              <input className="auth-input" type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <input className="auth-input" type="password" placeholder="Mot de passe" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              <motion.button className="auth-btn" onClick={handleLogin} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </motion.button>
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <a href="#" onClick={handleForgotPassword} style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}
                  onMouseOver={e => e.target.style.color = 'var(--orange)'} onMouseOut={e => e.target.style.color = 'var(--muted)'}>
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            {/* REGISTER CLIENT */}
            <div className={`auth-form-panel${showRegisterClient ? ' active' : ''}`}>
              <input className="auth-input" type="text" placeholder="Nom de votre société" value={regName} onChange={e => setRegName(e.target.value)} />
              <input className="auth-input" type="email" placeholder="Email professionnel" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              <input className="auth-input" type="tel" placeholder="Téléphone" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
              <input className="auth-input" type="password" placeholder="Mot de passe (8 caractères min.)" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
              <motion.button className="auth-btn" onClick={handleRegisterClient} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {loading ? 'Création…' : 'Créer mon compte'}
              </motion.button>
            </div>

            {/* REGISTER CARRIER */}
            <div className={`auth-form-panel${showRegisterCarrier ? ' active' : ''}`}>
              <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '12px' }}>
                L'inscription transporteur nécessite des informations détaillées (SIRET, véhicules, zones d'intervention).
              </p>
              <motion.button className="auth-btn" onClick={redirectToCarrierForm} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                Accéder au formulaire complet
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
