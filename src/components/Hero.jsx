import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}
const itemRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

function AnimatedBar({ width, delay }) {
  const [w, setW] = useState('0%')
  useEffect(() => {
    const t = setTimeout(() => setW(width), 800 + delay)
    return () => clearTimeout(t)
  }, [width, delay])
  return (
    <div className="coverage-bar-wrap">
      <div className="coverage-bar" style={{ width: w, transition: 'width 1s cubic-bezier(0.22,1,0.36,1)' }} />
    </div>
  )
}

export default function Hero() {
  return (
    <section className="hero" id="accueil">
      <div className="hero-bg" />
      <div className="hero-grid" />

      <motion.div
        className="hero-content"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero-tag" variants={item}>Transport Industriel</motion.div>
        <motion.h1 variants={item}>Votre fret,<br /><em>livré vite.</em></motion.h1>
        <motion.p variants={item}>
          Colis, palettes, pièces industrielles hors gabarit — FretNow organise votre transport
          de A à Z avec des délais maîtrisés et une traçabilité totale.
        </motion.p>
        <motion.div className="hero-ctas" variants={item}>
          <motion.a href="#commande" className="btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            Demander un devis
          </motion.a>
          <motion.a href="#fonctionnement" className="btn-ghost" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            Comment ça marche
          </motion.a>
        </motion.div>
        <motion.div className="hero-stats" variants={container}>
          {[
            { num: '24H', label: 'Délai express' },
            { num: '100%', label: 'Traçabilité' },
            { num: 'FR+EU', label: 'Couverture' },
          ].map((s, i) => (
            <motion.div key={i} className="stat" variants={item}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-right"
        variants={itemRight}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="hero-live-card"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-live-label">
            <span className="hero-live-dot" />Réseau en ligne
          </div>
          <motion.div
            className="hero-live-num"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
          >847</motion.div>
          <div className="hero-live-sub">transporteurs disponibles</div>
        </motion.div>

        <div className="hero-coverage">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: '4px' }}>
            Couverture
          </div>
          {[
            { label: 'France', width: '94%', val: '94%', delay: 0 },
            { label: 'Europe', width: '68%', val: '68%', delay: 150 },
            { label: 'Express 24H', width: '100%', val: '100%', delay: 300 },
          ].map(({ label, width, val, delay }) => (
            <div key={label} className="coverage-row">
              <span className="coverage-label">{label}</span>
              <AnimatedBar width={width} delay={delay} />
              <span className="coverage-val">{val}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
