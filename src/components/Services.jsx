import { motion } from 'framer-motion'

const services = [
  { num: '01', icon: '📦', title: 'Colis & Palettes', desc: 'De la palette Europe au colis express, nous gérons tous volumes avec soin. Enlèvements partout en France.' },
  { num: '02', icon: '🏗', title: 'Pièces Industrielles', desc: 'Machines, équipements hors gabarit, convois spéciaux. Nous gérons les transports complexes avec escorte si besoin.' },
  { num: '03', icon: '⚡', title: 'Express 24H', desc: 'Urgence ? Notre réseau de transporteurs dédiés assure des livraisons dans les 24h sur tout le territoire.' },
  { num: '04', icon: '🌍', title: 'Transport Europe', desc: 'Couverture internationale sur l\'ensemble de l\'Union Européenne avec gestion des formalités douanières.' },
  { num: '05', icon: '❄️', title: 'Transport Frigorifique', desc: 'Denrées sensibles à température dirigée, chaîne du froid garantie de bout en bout.' },
  { num: '06', icon: '🛡', title: 'Marchandises de valeur', desc: 'Assurance ad valorem, véhicules sécurisés, convoyeurs dédiés pour vos expéditions à haute valeur.' },
]

export default function Services() {
  return (
    <section className="services-section" id="services">
      <motion.div
        className="section-tag"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >Ce qu'on transporte</motion.div>

      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >Nos spécialités</motion.h2>

      <div className="services-grid">
        {services.map((s, i) => (
          <motion.div
            key={s.num}
            className="service-card"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: (i % 3) * 0.1 + Math.floor(i / 3) * 0.15, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
          >
            <span className="service-num-bg">{s.num}</span>
            <span className="service-icon">{s.icon}</span>
            <div className="service-title">{s.title}</div>
            <div className="service-desc">{s.desc}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
