import { useAuth } from '../context/AuthContext'
import CarrierHero from '../components/carrier/CarrierHero'
import CarrierBenefits from '../components/carrier/CarrierBenefits'
import CarrierForm from '../components/carrier/CarrierForm'
import CarrierDashboard from '../components/dashboard/CarrierDashboard'

export default function CarrierPage() {
  const { setCarrierSuccessModal, showCarrierDashboard } = useAuth()

  function handleCarrierSuccess() {
    setCarrierSuccessModal(true)
  }

  return (
    <div className="page-view active" id="page-carrier">
      <CarrierHero />
      <CarrierBenefits />
      <CarrierForm onSuccess={handleCarrierSuccess} />
      <CarrierDashboard />
    </div>
  )
}
