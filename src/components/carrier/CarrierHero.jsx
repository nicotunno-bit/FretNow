import { motion } from 'framer-motion'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function CarrierHero() {
  return (
    <section className="carrier-hero" id="carrier-accueil">
      <div className="carrier-hero-bg" />
      <div className="hero-grid" />
      <motion.div className="hero-content" variants={container} initial="hidden" animate="visible">
        <motion.div className="hero-tag" variants={item}>Réseau Transporteur</motion.div>
        <motion.h1 variants={item}>Développez<br /><em>votre activité.</em></motion.h1>
        <motion.p variants={item}>
          Rejoignez le réseau FretNow et accédez à des missions de transport industriel qualifiées,
          sans démarchage commercial. Vous vous concentrez sur la route, on gère le reste.
        </motion.p>
        <motion.div className="hero-ctas" variants={item}>
          <motion.a href="#carrier-inscription" className="btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            S'inscrire maintenant
          </motion.a>
          <motion.a href="#carrier-avantages" className="btn-ghost" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            Nos avantages
          </motion.a>
        </motion.div>
        <motion.div className="hero-stats" style={{ marginTop: '40px' }} variants={container}>
          {[
            { num: '0€', label: 'Inscription' },
            { num: '48H', label: 'Validation dossier' },
            { num: '+missions', label: 'Dès l\'activation' },
          ].map((s, i) => (
            <motion.div key={i} className="stat" variants={item}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
