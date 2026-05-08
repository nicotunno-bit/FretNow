import { useAuth } from '../context/AuthContext'
import Hero from '../components/Hero'
import TruckScene from '../components/TruckScene'
import TransportForm from '../components/TransportForm'
import HowItWorks from '../components/HowItWorks'
import Services from '../components/Services'
import ClientDashboard from '../components/dashboard/ClientDashboard'

export default function ClientPage() {
  const { startRadiusCascade, setSuccessModal, loadClientDashboard, showClientDashboard } = useAuth()

  async function handleFormSuccess(course) {
    // Show success modal
    setSuccessModal({
      open: true,
      text: 'Votre demande est enregistrée. Recherche du transporteur le plus proche…',
    })

    // Reload dashboard data
    await loadClientDashboard()

    // Show dashboard
    showClientDashboard()

    // Start cascade display + backend dispatch
    startRadiusCascade(course.id, course.pickup_address, course.vehicle_type_required)
  }

  return (
    <div className="page-view active" id="page-client">
      <Hero />
      <TruckScene />
      <TransportForm onSuccess={handleFormSuccess} />
      <HowItWorks />
      <Services />
      <ClientDashboard />
    </div>
  )
}
