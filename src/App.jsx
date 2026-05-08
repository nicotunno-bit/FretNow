import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import PageTabs from './components/PageTabs'
import ClientPage from './pages/ClientPage'
import CarrierPage from './pages/CarrierPage'
import AuthModal from './components/auth/AuthModal'
import Footer from './components/Footer'
import SuccessModal from './components/modals/SuccessModal'
import CarrierSuccessModal from './components/modals/CarrierSuccessModal'

export default function App() {
  const {
    activePage,
    successModal,
    setSuccessModal,
    carrierSuccessModal,
    setCarrierSuccessModal,
    showClientDashboard,
    currentRole,
    showCarrierDashboard,
  } = useAuth()

  // Load global FretNow modules after React mounts
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
      {activePage === 'client' ? <ClientPage /> : <CarrierPage />}
      <Footer />
      <AuthModal />
      <SuccessModal
        open={successModal.open}
        onClose={handleCloseSuccessModal}
        text={successModal.text}
      />
      <CarrierSuccessModal
        open={carrierSuccessModal}
        onClose={handleCloseCarrierModal}
      />
    </>
  )
}
