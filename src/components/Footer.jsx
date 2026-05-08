import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6 }}
    >
      <div className="footer-logo">
        <img src="/logo.png" alt="FretNow" style={{ height: '100px' }} />
      </div>
      <p className="footer-copy">© 2026 FretNow — Transport Industriel</p>
      <div className="footer-links">
        <a href="#">CGV</a>
        <a href="#">Mentions légales</a>
        <a href="#">Contact</a>
      </div>
    </motion.footer>
  )
}
