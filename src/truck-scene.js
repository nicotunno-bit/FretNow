import * as THREE from 'https://esm.sh/three@0.167.1'
import { gsap } from 'https://esm.sh/gsap@3.12.5'
import { ScrollTrigger } from 'https://esm.sh/gsap@3.12.5/dist/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ─── Text steps shown as the truck rotates ───────────────────
const STEPS = [
  {
    tag:   'Réactivité',
    title: 'Mise en relation<br><em>en 15 minutes.</em>',
    desc:  "Notre algorithme contacte les transporteurs disponibles dans votre zone en temps réel. Premier retour garanti sous le quart d'heure.",
  },
  {
    tag:   'Traçabilité',
    title: 'Suivi GPS<br><em>en direct.</em>',
    desc:  'Chaque camion transmet sa position à la seconde. Suivez votre marchandise sur la carte depuis la prise en charge jusqu\'à la livraison.',
  },
  {
    tag:   'Sécurité',
    title: 'Assurance<br><em>tout risque.</em>',
    desc:  'Palettes, pièces industrielles hors-gabarit, colis fragiles — chaque transport est couvert par une assurance marchandise incluse dans le prix.',
  },
]

// ─── Build DOM for text panels ────────────────────────────────
function buildTextPanels() {
  const panel = document.querySelector('.truck-text-panel')
  if (!panel) return
  panel.innerHTML = STEPS.map((s, i) => `
    <div class="truck-text-item" data-step="${i}">
      <div class="section-tag">${s.tag}</div>
      <h2 class="truck-h2">${s.title}</h2>
      <p class="truck-p">${s.desc}</p>
    </div>`).join('')
}

// ─── Main ─────────────────────────────────────────────────────
function initTruckScene() {
  buildTextPanels()

  const section = document.getElementById('truck-scene')
  const canvas  = document.getElementById('truck-canvas')
  if (!section || !canvas) return

  // ── Renderer ────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap
  renderer.toneMapping       = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25
  renderer.setClearColor(0x0d0c0a)

  // ── Scene & Camera ──────────────────────────────────────────
  const scene  = new THREE.Scene()
  scene.fog    = new THREE.Fog(0x0d0c0a, 14, 28)
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  camera.position.set(0, 2.4, 10)
  camera.lookAt(0, 1.4, 0)

  // ── Lights ──────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xfff0e0, 0.3))

  const key = new THREE.DirectionalLight(0xfff5e0, 3.0)
  key.position.set(7, 12, 7)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.near   = 0.5
  key.shadow.camera.far    = 45
  key.shadow.camera.left   = -12
  key.shadow.camera.right  = 12
  key.shadow.camera.top    = 12
  key.shadow.camera.bottom = -12
  scene.add(key)

  const fill = new THREE.DirectionalLight(0x3060d0, 0.7)
  fill.position.set(-7, 4, -5)
  scene.add(fill)

  const accent = new THREE.PointLight(0xff6a00, 5, 9, 1.5)
  accent.position.set(0, 0.6, 5)
  scene.add(accent)

  const rimLight = new THREE.PointLight(0xff8800, 1.5, 12, 2)
  rimLight.position.set(0, 6, -6)
  scene.add(rimLight)

  // ── Ground ──────────────────────────────────────────────────
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x0f0e0c, roughness: 0.95, metalness: 0.2 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Orange floor lines for industrial feel
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xff6a00, transparent: true, opacity: 0.18 })
  for (const x of [-2.2, 0, 2.2]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 28), lineMat)
    l.rotation.x = -Math.PI / 2
    l.position.set(x, 0.002, 0)
    scene.add(l)
  }

  // ── Materials ────────────────────────────────────────────────
  const M = {
    orange: new THREE.MeshStandardMaterial({ color: 0xff6a00, metalness: 0.2,  roughness: 0.45 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x1c1a18, metalness: 0.2,  roughness: 0.72 }),
    glass:  new THREE.MeshStandardMaterial({ color: 0x7ab4cc, metalness: 0.05, roughness: 0.02, transparent: true, opacity: 0.55 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.98, roughness: 0.07 }),
    wheel:  new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4,  roughness: 0.55 }),
    light:  new THREE.MeshStandardMaterial({ color: 0xffe890, emissive: 0xffaa00, emissiveIntensity: 2.5 }),
    stripe: new THREE.MeshStandardMaterial({ color: 0xff6a00, metalness: 0.05, roughness: 0.8, transparent: true, opacity: 0.65 }),
  }

  // ── Geometry helpers ─────────────────────────────────────────
  function addBox(parent, mat, w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z)
    m.rotation.set(rx, ry, rz)
    m.castShadow = true
    m.receiveShadow = true
    parent.add(m)
    return m
  }

  function addCyl(parent, mat, rTop, rBot, h, seg, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat)
    m.position.set(x, y, z)
    m.rotation.set(rx, ry, rz)
    m.castShadow = true
    parent.add(m)
    return m
  }

  // ── Truck group ──────────────────────────────────────────────
  const truck = new THREE.Group()
  scene.add(truck)

  // —— TRAILER ————————————————————————————————————————————————
  const trailer = new THREE.Group()

  addBox(trailer, M.dark,   2.02, 2.35, 5.4,  0,  2.175, -2.2)   // body
  addBox(trailer, M.chrome, 2.02, 0.05, 5.45, 0,  3.355, -2.2)   // roof rail
  addBox(trailer, M.chrome, 0.04, 2.35, 5.45, -1.03, 2.175, -2.2) // left rail
  addBox(trailer, M.chrome, 0.04, 2.35, 5.45,  1.03, 2.175, -2.2) // right rail
  addBox(trailer, M.stripe, 2.06, 0.09, 5.48, 0,  1.12,  -2.2)   // reflective stripe
  addBox(trailer, M.chrome, 2.05, 0.13, 0.1,  0,  0.88,  -4.92)  // rear bumper
  // Rear doors — vertical bar detail
  addBox(trailer, M.chrome, 0.04, 1.9,  0.06, -0.1, 2.2, -4.93)
  addBox(trailer, M.chrome, 0.04, 1.9,  0.06,  0.1, 2.2, -4.93)
  addBox(trailer, M.chrome, 2.02, 0.04, 0.06,  0,   1.3, -4.93)
  addBox(trailer, M.chrome, 2.02, 0.04, 0.06,  0,   3.1, -4.93)
  // Underframe
  addBox(trailer, M.chrome, 1.8, 0.12, 5.2, 0, 0.86, -2.2)
  // Mud flaps
  for (const [x, z] of [[-1.03, -1.9], [1.03, -1.9], [-1.03, -4.1], [1.03, -4.1]]) {
    addBox(trailer, M.dark, 0.07, 0.44, 0.9, x, 0.82, z)
  }
  truck.add(trailer)

  // —— CAB ————————————————————————————————————————————————————
  const cab = new THREE.Group()

  addBox(cab, M.orange, 1.96, 2.15, 2.3,  0,   2.075,  1.75) // main body
  addBox(cab, M.orange, 1.96, 0.5,  1.55, 0,   0.9,    2.62) // hood
  addBox(cab, M.dark,   1.96, 0.42, 0.18, 0,   0.57,   3.38) // lower front
  addBox(cab, M.chrome, 2.0,  0.19, 0.19, 0,   0.74,   3.42) // front bumper
  addBox(cab, M.glass,  1.62, 0.95, 0.08, 0,   2.65,   2.84) // windshield
  addBox(cab, M.glass,  0.08, 0.62, 0.95, -0.99, 2.5,  1.95) // left window
  addBox(cab, M.glass,  0.08, 0.62, 0.95,  0.99, 2.5,  1.95) // right window
  addBox(cab, M.glass,  0.08, 0.36, 0.42, -0.99, 2.6,  1.2)  // left vent
  addBox(cab, M.glass,  0.08, 0.36, 0.42,  0.99, 2.6,  1.2)  // right vent
  addBox(cab, M.orange, 1.96, 0.08, 2.3,  0,   3.18,   1.75) // roof
  addBox(cab, M.chrome, 2.0,  0.06, 0.42, 0,   3.15,   2.82) // sun visor
  // Roof rack / beacons
  addBox(cab, M.chrome, 0.8,  0.05, 1.6,  0,   3.22,   1.75)
  addCyl(cab, M.orange, 0.06, 0.06, 0.15, 8,  -0.28,   3.32, 1.4)
  addCyl(cab, M.orange, 0.06, 0.06, 0.15, 8,   0.28,   3.32, 1.4)
  // Exhaust stacks
  addCyl(cab, M.chrome, 0.075, 0.075, 1.3, 12, -0.87, 2.95, 1.55)
  addCyl(cab, M.chrome, 0.075, 0.075, 1.3, 12,  0.87, 2.95, 1.55)
  addCyl(cab, M.chrome, 0.125, 0.075, 0.09, 12, -0.87, 3.615, 1.55)
  addCyl(cab, M.chrome, 0.125, 0.075, 0.09, 12,  0.87, 3.615, 1.55)
  // Headlights
  addBox(cab, M.light,  0.4,  0.24, 0.06, -0.68, 0.84, 3.43)
  addBox(cab, M.light,  0.4,  0.24, 0.06,  0.68, 0.84, 3.43)
  addBox(cab, M.light,  0.19, 0.13, 0.06, -0.7,  0.58, 3.43) // fog L
  addBox(cab, M.light,  0.19, 0.13, 0.06,  0.7,  0.58, 3.43) // fog R
  // Grille
  addBox(cab, M.chrome, 1.24, 0.42, 0.08, 0, 0.82, 3.43)
  for (let i = 0; i < 6; i++) addBox(cab, M.dark, 1.22, 0.03, 0.1, 0, 0.61 + i * 0.065, 3.44)
  // Mirrors
  addBox(cab, M.dark,   0.3,  0.19, 0.07, -1.13, 2.85, 2.65)
  addBox(cab, M.dark,   0.3,  0.19, 0.07,  1.13, 2.85, 2.65)
  addBox(cab, M.chrome, 0.06, 0.19, 0.07, -1.04, 2.85, 2.65)
  addBox(cab, M.chrome, 0.06, 0.19, 0.07,  1.04, 2.85, 2.65)
  // Step bars
  addBox(cab, M.chrome, 0.32, 0.06, 1.3, -0.99, 0.88, 2.1)
  addBox(cab, M.chrome, 0.32, 0.06, 1.3,  0.99, 0.88, 2.1)
  // Door handles
  addBox(cab, M.chrome, 0.09, 0.06, 0.06, -1.0, 2.05, 2.22)
  addBox(cab, M.chrome, 0.09, 0.06, 0.06,  1.0, 2.05, 2.22)
  // Hood stripe
  addBox(cab, M.stripe, 0.85, 0.045, 1.6, 0, 1.19, 2.62)
  truck.add(cab)

  // Fifth-wheel plate
  addBox(truck, M.chrome, 0.85, 0.1, 0.55, 0, 0.9, 0.7)

  // —— WHEELS ——————————————————————————————————————————————————
  function makeWheel(x, y, z) {
    const grp = new THREE.Group()
    grp.position.set(x, y, z)

    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.145, 14, 30), M.wheel)
    tire.rotation.y = Math.PI / 2
    tire.castShadow = true
    grp.add(tire)

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.28, 18), M.chrome)
    rim.rotation.z = Math.PI / 2
    grp.add(rim)

    // Hub bolt circle (decorative)
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.32, 6), M.chrome)
    bolt.rotation.z = Math.PI / 2
    for (let i = 0; i < 6; i++) {
      const b = bolt.clone()
      const angle = (i / 6) * Math.PI * 2
      b.position.set(0, Math.sin(angle) * 0.18, Math.cos(angle) * 0.18)
      grp.add(b)
    }

    truck.add(grp)
  }

  const wy = 0.44 // wheel center height
  makeWheel(-1.1, wy,  2.85)  // steer L
  makeWheel( 1.1, wy,  2.85)  // steer R
  makeWheel(-1.1, wy,  0.2)   // drive 1 L
  makeWheel( 1.1, wy,  0.2)   // drive 1 R
  makeWheel(-1.1, wy, -0.85)  // drive 2 L
  makeWheel( 1.1, wy, -0.85)  // drive 2 R
  makeWheel(-1.1, wy, -3.2)   // trailer 1 L
  makeWheel( 1.1, wy, -3.2)   // trailer 1 R
  makeWheel(-1.1, wy, -4.15)  // trailer 2 L
  makeWheel( 1.1, wy, -4.15)  // trailer 2 R

  // ── Resize handler ───────────────────────────────────────────
  function onResize() {
    const sticky = document.querySelector('.truck-sticky')
    const w = sticky.clientWidth
    const h = sticky.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  onResize()
  window.addEventListener('resize', onResize)

  // ── Render loop ──────────────────────────────────────────────
  let scrollProgress = 0
  const clock = new THREE.Clock()

  ;(function tick() {
    requestAnimationFrame(tick)
    const t = clock.getElapsedTime()

    truck.rotation.y = scrollProgress * Math.PI * 2
    truck.position.y = Math.sin(t * 0.75) * 0.045  // subtle float

    accent.intensity  = 4.0 + Math.sin(t * 1.9) * 0.9
    rimLight.position.x = Math.sin(t * 0.4) * 2   // slowly orbit rim light

    renderer.render(scene, camera)
  })()

  // ── ScrollTrigger ────────────────────────────────────────────
  const textItems    = section.querySelectorAll('.truck-text-item')
  const progressFill = document.getElementById('truckProgressFill')
  const stepDots     = section.querySelectorAll('.truck-step-dot')

  // Initial state — show first panel only
  textItems.forEach((el, i) => gsap.set(el, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 40 }))

  gsap.to({}, {
    scrollTrigger: {
      trigger: section,
      start:   'top top',
      end:     'bottom bottom',
      pin:     '.truck-sticky',
      scrub:   1.4,
      onUpdate(self) {
        scrollProgress = self.progress

        if (progressFill) progressFill.style.height = (scrollProgress * 100) + '%'

        const step = Math.min(Math.floor(scrollProgress * 3), 2)

        textItems.forEach((el, i) => {
          const active = i === step
          gsap.to(el, {
            opacity:  active ? 1 : 0,
            y:        active ? 0 : i < step ? -28 : 36,
            duration: 0.5,
            ease:     'power2.out',
            overwrite: true,
          })
        })

        stepDots.forEach((dot, i) => {
          dot.classList.toggle('active', i === step)
        })
      },
    },
  })
}

initTruckScene()
