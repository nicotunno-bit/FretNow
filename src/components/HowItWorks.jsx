import { motion } from 'framer-motion'

const steps = [
  { num: '01', title: 'Configurez', desc: 'Renseignez les caractéristiques de votre expédition en 2 minutes via notre formulaire express.' },
  { num: '02', title: 'Recherche', desc: 'Notre système contacte les transporteurs dans un rayon de 10 km, puis élargit jusqu\'à 100 km si besoin.' },
  { num: '03', title: 'Prise en charge', desc: 'Le premier transporteur disponible accepte votre fret et démarre vers le point de chargement.' },
  { num: '04', title: 'Suivez', desc: 'Tracking GPS temps réel de la prise en charge jusqu\'à la livraison finale.' },
]

export default function HowItWorks() {
  return (
    <section className="how-section" id="fonctionnement">
      <motion.div
        className="section-tag"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >Processus</motion.div>

      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >Comment ça marche</motion.h2>

      <div className="steps-grid">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            className="step"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
          >
            <div className="step-dot" />
            <div className="step-num">{step.num}</div>
            <div className="step-title">{step.title}</div>
            <div className="step-desc">{step.desc}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
