import { motion } from 'framer-motion'

const benefits = [
  { icon: '✓', num: '01', title: 'Missions qualifiées', desc: 'Chaque transport est vérifié et détaillé avant attribution — marchandise, format, délai, itinéraire. Aucune mauvaise surprise.' },
  { icon: '💳', num: '02', title: 'Paiement rapide', desc: 'Règlement sous 30 jours maximum, souvent moins. Pas de relances, pas de paperasse interminable.' },
  { icon: '📱', num: '03', title: 'Interface dédiée', desc: 'Un espace transporteur pour gérer vos missions, mettre à jour le tracking et accéder à vos documents depuis n\'importe où.' },
  { icon: '📡', num: '04', title: 'Zéro démarchage', desc: 'Fini le porte-à-porte. FretNow apporte les clients, vous apportez les camions. C\'est aussi simple que ça.' },
  { icon: '🎧', num: '05', title: 'Support 7j/7', desc: 'Une équipe disponible pour vous accompagner en cas d\'imprévu sur la route ou de question logistique.' },
  { icon: '🌍', num: '06', title: 'Visibilité nationale', desc: 'Accédez à des chargeurs partout en France et en Europe sans investir dans une force de vente.' },
]

export default function CarrierBenefits() {
  return (
    <section className="carrier-benefits" id="carrier-avantages">
      <motion.div
        className="section-tag"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >Pourquoi nous rejoindre</motion.div>

      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >Ce qu'on vous apporte</motion.h2>

      <div className="benefits-grid">
        {benefits.map((b, i) => (
          <motion.div
            key={b.num}
            className="benefit-card"
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          >
            <span className="benefit-icon">{b.icon}</span>
            <div className="benefit-num">{b.num}</div>
            <div className="benefit-title">{b.title}</div>
            <div className="benefit-desc">{b.desc}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
