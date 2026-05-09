import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.4 } },
}

export default function HeroTruck() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x0b0b0b, 1)

    // ── Scene ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0b0b0b, 0.018)

    // ── Camera ────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 500)
    camera.position.set(6, 3, 12)
    camera.lookAt(0, 1.5, 0)

    // ── Lighting ──────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x334466, 1.2))

    const sun = new THREE.DirectionalLight(0xfff4e0, 4.5)
    sun.position.set(8, 14, 10)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 60
    sun.shadow.camera.left = -15
    sun.shadow.camera.right = 15
    sun.shadow.camera.top = 15
    sun.shadow.camera.bottom = -15
    sun.shadow.bias = -0.0003
    scene.add(sun)

    const fill = new THREE.DirectionalLight(0x4466cc, 1.2)
    fill.position.set(-8, 6, -6)
    scene.add(fill)

    const orange = new THREE.DirectionalLight(0xff6b00, 0.8)
    orange.position.set(4, 2, 8)
    scene.add(orange)

    const rim = new THREE.DirectionalLight(0x1a2255, 1.0)
    rim.position.set(-4, 10, -14)
    scene.add(rim)

    // ── Ground ────────────────────────────────────────────────────────────
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x080706, roughness: 0.92, metalness: 0.04 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Subtle orange lane lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xff6b00, transparent: true, opacity: 0.09 })
    for (const x of [-2.5, 0, 2.5]) {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 60), lineMat)
      l.rotation.x = -Math.PI / 2
      l.position.set(x, 0.002, 0)
      scene.add(l)
    }

    // Puddle reflection
    const puddle = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 26),
      new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 0.03, metalness: 0.02, transparent: true, opacity: 0.55 })
    )
    puddle.rotation.x = -Math.PI / 2
    puddle.position.y = 0.001
    scene.add(puddle)

    // ── Load GLB ──────────────────────────────────────────────────────────
    const draco = new DRACOLoader()
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(draco)

    let truck = null
    let mixer = null
    let camTarget = { x: camera.position.x, y: camera.position.y, z: camera.position.z }

    loader.load(
      '/truck.glb',
      (gltf) => {
        truck = gltf.scene

        // Auto-fit: center and scale to reasonable size
        const box = new THREE.Box3().setFromObject(truck)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        // Normalize to ~8 units long
        const targetLength = 8
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = targetLength / maxDim
        truck.scale.setScalar(scale)

        // Re-compute after scale
        box.setFromObject(truck)
        const newCenter = box.getCenter(new THREE.Vector3())
        const newSize = box.getSize(new THREE.Vector3())

        // Place on ground, centered XZ
        truck.position.x = -newCenter.x
        truck.position.y = -box.min.y
        truck.position.z = -newCenter.z

        truck.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        scene.add(truck)

        // Reposition camera based on actual model size
        const camDist = newSize.z * 1.4 + newSize.x * 0.6
        const camH = newSize.y * 0.55
        camera.position.set(camDist * 0.45, camH, camDist)
        camera.lookAt(0, newSize.y * 0.35, 0)
        camTarget = { x: camera.position.x, y: camera.position.y, z: camera.position.z }

        // Play embedded animations if any
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(truck)
          gltf.animations.forEach(clip => mixer.clipAction(clip).play())
        }
      },
      undefined,
      (err) => console.error('GLB load error:', err)
    )

    // ── Scroll-linked camera rotation ─────────────────────────────────────
    let scrollProgress = 0
    function onScroll() {
      const section = canvas.parentElement
      const rect = section.getBoundingClientRect()
      const sectionH = section.offsetHeight
      // progress 0→1 as user scrolls through the hero section
      scrollProgress = Math.max(0, Math.min(1, -rect.top / (sectionH - window.innerHeight || sectionH)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── Render loop ───────────────────────────────────────────────────────
    const clock = new THREE.Clock()
    let animId
    let autoRotY = 0

    function animate() {
      animId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const elapsed = clock.elapsedTime

      if (mixer) mixer.update(delta)

      if (truck) {
        // Gentle idle sway
        autoRotY += delta * 0.08
        // Scroll adds extra rotation and slight lift
        const scrollRot = scrollProgress * Math.PI * 0.6
        truck.rotation.y = autoRotY + scrollRot

        // Camera bobs very slightly
        camera.position.y = camTarget.y + Math.sin(elapsed * 0.3) * 0.05
      }

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ────────────────────────────────────────────────────────────
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      renderer.dispose()
      draco.dispose()
    }
  }, [])

  return (
    <section className="hero-truck-section" id="accueil">
      <canvas ref={canvasRef} className="hero-truck-canvas" aria-label="Camion FretNow 3D" />

      {/* Text overlay — left-aligned, vertically centered */}
      <motion.div
        className="hero-truck-overlay"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero-tag" variants={item}>Transport Industriel</motion.div>
        <motion.h1 className="hero-truck-h1" variants={item}>
          Votre fret,<br /><em>livré vite.</em>
        </motion.h1>
        <motion.p className="hero-truck-p" variants={item}>
          Colis, palettes, pièces industrielles hors gabarit — FretNow organise
          votre transport de A à Z avec des délais maîtrisés et une traçabilité totale.
        </motion.p>
        <motion.div className="hero-ctas" variants={item}>
          <motion.a href="#commande" className="btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            Demander un devis
          </motion.a>
          <motion.a href="#fonctionnement" className="btn-ghost" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            Comment ça marche
          </motion.a>
        </motion.div>

        <motion.div className="hero-stats hero-truck-stats" variants={item}>
          {[
            { num: '24H', label: 'Délai express' },
            { num: '847', label: 'Transporteurs' },
            { num: 'FR+EU', label: 'Couverture' },
          ].map((s, i) => (
            <div key={i} className="stat">
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        className="hero-scroll-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >↓</motion.span>
        <span>SCROLL</span>
      </motion.div>
    </section>
  )
}
