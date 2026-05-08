import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import PageTabs from './components/PageTabs'
import ClientPage from './pages/ClientPage'
import CarrierPage from './pages/CarrierPage'
import AuthModal from './components/auth/AuthModal'
import Footer from './components/Footer'
import SuccessModal from './components/modals/SuccessModal'
import CarrierSuccessModal from './components/modals/CarrierSuccessModal'

const pageVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
}

export default function App() {
  const {
    activePage,
    successModal, setSuccessModal,
    carrierSuccessModal, setCarrierSuccessModal,
    showClientDashboard, showCarrierDashboard,
    currentRole,
  } = useAuth()

  useEffect(() => {
    const scripts = ['src/api.js', 'src/notifications.js', 'src/dispatch.js', 'src/tracking.js']
    scripts.forEach(src => {
      const s = document.createElement('script')
      s.src = src
      document.body.appendChild(s)
    })
  }, [])

  function handleCloseSuccessModal() {
    setSuccessModal({ open: false, text: '' })
    showClientDashboard()
  }

  function handleCloseCarrierModal() {
    setCarrierSuccessModal(false)
    if (currentRole === 'carrier') showCarrierDashboard()
  }

  return (
    <>
      <Navbar />
      <PageTabs />

      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {activePage === 'client' ? <ClientPage /> : <CarrierPage />}
        </motion.div>
      </AnimatePresence>

      <Footer />
      <AuthModal />
      <SuccessModal open={successModal.open} onClose={handleCloseSuccessModal} text={successModal.text} />
      <CarrierSuccessModal open={carrierSuccessModal} onClose={handleCloseCarrierModal} />
    </>
  )
}
