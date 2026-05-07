import * as THREE from 'https://esm.sh/three@0.167.1'
import { gsap } from 'https://esm.sh/gsap@3.12.5'
import ScrollTrigger from 'https://esm.sh/gsap@3.12.5/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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

function initTruckScene() {
  buildTextPanels()
  const section = document.getElementById('truck-scene')
  const canvas  = document.getElementById('truck-canvas')
  if (!section || !canvas) return

  // ── Renderer ────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap
  renderer.toneMapping       = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.setClearColor(0x0b0a09)

  // ── Scene ────────────────────────────────────────────────────
  const scene = new THREE.Scene()
  scene.fog   = new THREE.FogExp2(0x0b0a09, 0.028)

  // ── Camera ───────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120)
  camera.position.set(0, 3.8, 16)
  camera.lookAt(0, 1.8, 0)

  // ── Lighting — natural outdoor setup ────────────────────────
  // Sky/ground hemisphere (blue sky, warm ground bounce)
  const hemi = new THREE.HemisphereLight(0xb8d0ee, 0x6b4a1e, 0.65)
  scene.add(hemi)

  // Main sun — warm, high-angle, from front-right
  const sun = new THREE.DirectionalLight(0xfff4d6, 3.2)
  sun.position.set(9, 18, 14)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  sun.shadow.camera.near   = 1
  sun.shadow.camera.far    = 65
  sun.shadow.camera.left   = -15
  sun.shadow.camera.right  = 15
  sun.shadow.camera.top    = 15
  sun.shadow.camera.bottom = -15
  sun.shadow.bias          = -0.00035
  sun.shadow.normalBias    = 0.02
  scene.add(sun)

  // Cool blue sky-fill from upper-left
  const skyFill = new THREE.DirectionalLight(0x6699cc, 0.55)
  skyFill.position.set(-8, 12, 6)
  scene.add(skyFill)

  // Rim/back light — defines truck silhouette against dark bg
  const rim = new THREE.DirectionalLight(0x2255aa, 0.7)
  rim.position.set(-4, 8, -14)
  scene.add(rim)

  // Warm orange accent — headlights reflecting off ground
  const accent = new THREE.PointLight(0xff7700, 3.5, 11, 1.8)
  accent.position.set(0, 0.4, 7.5)
  scene.add(accent)

  // ── Ambient fill (replaces env map — compatible Three.js r163+) ─
  scene.add(new THREE.AmbientLight(0x334466, 0.9))

  // ── Ground ───────────────────────────────────────────────────
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x0e0d0b, roughness: 0.92, metalness: 0.08, envMapIntensity: 0.4 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Subtle floor lines (industrial / depot atmosphere)
  const lmat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.14 })
  for (const x of [-2.6, 0, 2.6]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 35), lmat)
    l.rotation.x = -Math.PI / 2; l.position.set(x, 0.001, 0)
    scene.add(l)
  }

  // ── Materials (physically based) ─────────────────────────────
  const M = {
    // Truck paint — MeshPhysicalMaterial with clearcoat for car-paint look
    paint: new THREE.MeshPhysicalMaterial({
      color: 0xff6a00, metalness: 0.05, roughness: 0.28,
      clearcoat: 1.0, clearcoatRoughness: 0.06, envMapIntensity: 1.2,
    }),
    // Chrome — near-perfect mirror
    chrome: new THREE.MeshPhysicalMaterial({
      color: 0xd8d8d8, metalness: 1.0, roughness: 0.05, envMapIntensity: 2.8,
    }),
    // Cab interior / dark plastic
    dark:  new THREE.MeshStandardMaterial({ color: 0x1c1a17, metalness: 0.1, roughness: 0.82 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0d0c0b, metalness: 0.05, roughness: 0.9 }),
    // Windshield / windows
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x7fb0cc, metalness: 0.0, roughness: 0.0,
      transmission: 0.88, transparent: true, opacity: 0.35, envMapIntensity: 1.8,
    }),
    // Tires
    rubber: new THREE.MeshStandardMaterial({ color: 0x111010, metalness: 0.15, roughness: 0.75 }),
    // Trailer body
    trailer: new THREE.MeshStandardMaterial({ color: 0x1e1c1a, metalness: 0.12, roughness: 0.78 }),
    // Aluminium fuel tanks
    tank: new THREE.MeshPhysicalMaterial({
      color: 0x9a9a9a, metalness: 0.75, roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.25,
    }),
    // Headlights
    headlight: new THREE.MeshStandardMaterial({ color: 0xfffce0, emissive: 0xffcc44, emissiveIntensity: 3.2 }),
    // Turn signals
    amber: new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0xff7700, emissiveIntensity: 2.0 }),
    // Marker lights (DOT)
    marker: new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff1100, emissiveIntensity: 1.8 }),
    markerW: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5 }),
    // Orange reflective trailer stripe
    refl: new THREE.MeshStandardMaterial({
      color: 0xff6a00, emissive: 0x441800, emissiveIntensity: 0.5, roughness: 0.3,
    }),
    // Grille bars
    grille: new THREE.MeshStandardMaterial({ color: 0x1e1e1e, metalness: 0.35, roughness: 0.65 }),
  }

  // ── Geometry helpers ─────────────────────────────────────────
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d)
  const C = (rt, rb, h, s=16) => new THREE.CylinderGeometry(rt, rb, h, s)

  function mesh(parent, geo, mat, x=0, y=0, z=0, rx=0, ry=0, rz=0) {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.rotation.set(rx, ry, rz)
    m.castShadow = true; m.receiveShadow = true
    parent.add(m); return m
  }
  const bx = (p,m,w,h,d,...args) => mesh(p, B(w,h,d), m, ...args)
  const cy = (p,m,rt,rb,h,s,...args) => mesh(p, C(rt,rb,h,s), m, ...args)

  // ── TRUCK GROUP ──────────────────────────────────────────────
  // Centered on Z: front bumper ≈ +6.5, trailer rear ≈ -6.5
  const truck = new THREE.Group()
  scene.add(truck)

  // ════════════════════════════════════════════════════════════
  //  TRAILER  (Z center ≈ -3.5)
  // ════════════════════════════════════════════════════════════
  const TR = new THREE.Group()
  truck.add(TR)

  const TZ = -3.5 // trailer center Z

  bx(TR, M.trailer, 2.04, 2.55, 7.0,  0, 2.275, TZ)          // main body
  bx(TR, M.chrome,  2.06, 0.06, 7.06, 0, 3.58,  TZ)           // roof rail
  bx(TR, M.chrome,  0.05, 2.55, 7.06,-1.045, 2.275, TZ)       // left edge
  bx(TR, M.chrome,  0.05, 2.55, 7.06, 1.045, 2.275, TZ)       // right edge
  bx(TR, M.refl,    2.08, 0.12, 7.1,  0, 1.05, TZ)            // DOT stripe
  // Nose plate
  bx(TR, M.chrome,  2.06, 2.55, 0.07, 0, 2.275, TZ+3.53)
  // Rear bumper + door detail
  bx(TR, M.chrome,  2.08, 0.18, 0.18, 0, 0.84, TZ-3.56)
  bx(TR, M.chrome,  0.05, 2.15, 0.07,-0.12, 2.275, TZ-3.54)
  bx(TR, M.chrome,  0.05, 2.15, 0.07, 0.12, 2.275, TZ-3.54)
  bx(TR, M.chrome,  2.06, 0.05, 0.07, 0, 1.3,  TZ-3.54)
  bx(TR, M.chrome,  2.06, 0.05, 0.07, 0, 3.22, TZ-3.54)
  // Rear DOT markers
  for (const [x, y] of [[-0.72,3.1],[0.72,3.1],[-0.72,1.18],[0.72,1.18]]) {
    bx(TR, M.marker, 0.2, 0.07, 0.04, x, y, TZ-3.55)
  }
  // Underframe
  bx(TR, M.dark, 1.92, 0.16, 6.85, 0, 0.85, TZ)
  bx(TR, M.chrome, 0.9, 0.14, 0.55, 0, 0.84, TZ+3.3)  // king pin plate
  // Vertical side ribs
  for (let dz = -2.8; dz <= 2.8; dz += 1.4) {
    bx(TR, M.chrome, 0.03, 2.54, 0.05,-1.04, 2.275, TZ+dz)
    bx(TR, M.chrome, 0.03, 2.54, 0.05, 1.04, 2.275, TZ+dz)
  }
  // Mud flaps (trailer)
  for (const [x,z] of [[-1.05,TZ+2.8],[1.05,TZ+2.8],[-1.05,TZ-2.4],[1.05,TZ-2.4]]) {
    bx(TR, M.black, 0.07, 0.5, 0.95, x, 0.86, z)
  }

  // ════════════════════════════════════════════════════════════
  //  CAB  — conventional American semi (Kenworth/Peterbilt style)
  //  Front bumper at Z≈+6.5, cab rear at Z≈+1.0
  // ════════════════════════════════════════════════════════════
  const CAB = new THREE.Group()
  truck.add(CAB)

  // ── CHROME FRONT BUMPER ──────────────────────────────────────
  bx(CAB, M.chrome, 2.14, 0.36, 0.26, 0, 0.9,  6.46)   // main bar
  bx(CAB, M.chrome, 2.14, 0.13, 0.18, 0, 0.72, 6.46)   // chin
  bx(CAB, M.chrome, 0.22, 0.36, 0.62,-1.15, 0.9,  6.24) // left end wrap
  bx(CAB, M.chrome, 0.22, 0.36, 0.62, 1.15, 0.9,  6.24) // right end wrap
  bx(CAB, M.black,  0.52, 0.16, 0.1, -0.56, 0.9, 6.48)  // air intake L
  bx(CAB, M.black,  0.52, 0.16, 0.1,  0.56, 0.9, 6.48)  // air intake R

  // ── FRONT FENDERS ────────────────────────────────────────────
  bx(CAB, M.paint,  0.26, 0.6,  1.7, -1.17, 1.38, 5.75)
  bx(CAB, M.paint,  0.26, 0.6,  1.7,  1.17, 1.38, 5.75)
  bx(CAB, M.paint,  0.2,  0.18, 1.7, -1.33, 1.06, 5.75) // fender lip L
  bx(CAB, M.paint,  0.2,  0.18, 1.7,  1.33, 1.06, 5.75) // fender lip R

  // ── LONG HOOD ────────────────────────────────────────────────
  // Main hood body (slight downward angle toward front)
  bx(CAB, M.paint, 1.86, 0.76, 2.85, 0, 1.64, 4.9, -0.032)
  // Hood sides
  bx(CAB, M.paint, 0.14, 0.76, 2.85,-1.04, 1.64, 4.9, -0.032)
  bx(CAB, M.paint, 0.14, 0.76, 2.85, 1.04, 1.64, 4.9, -0.032)
  // Hood front lower slope
  bx(CAB, M.paint, 1.86, 0.22, 0.45, 0, 1.17, 6.25)
  bx(CAB, M.paint, 1.86, 0.07, 0.22, 0, 1.04, 6.44)
  // Hood louvres / vents
  for (let i = 0; i < 4; i++) {
    bx(CAB, M.dark, 0.54, 0.055, 0.96,-0.58, 1.77+i*0.065, 4.95)
    bx(CAB, M.dark, 0.54, 0.055, 0.96, 0.58, 1.77+i*0.065, 4.95)
  }

  // ── GRILLE ───────────────────────────────────────────────────
  bx(CAB, M.chrome, 1.28, 0.55, 0.1, 0, 1.42, 6.48)          // surround
  for (let i = 0; i < 9; i++) {
    bx(CAB, M.grille, 1.22, 0.045, 0.13, 0, 1.16+i*0.056, 6.5) // bars
  }
  bx(CAB, M.chrome, 0.32, 0.14, 0.1, 0, 1.5, 6.5)             // center logo area

  // ── HEADLIGHTS ───────────────────────────────────────────────
  bx(CAB, M.chrome,   0.58, 0.28, 0.11,-0.64, 1.06, 6.48)
  bx(CAB, M.chrome,   0.58, 0.28, 0.11, 0.64, 1.06, 6.48)
  bx(CAB, M.headlight,0.46, 0.22, 0.08,-0.64, 1.06, 6.5)      // H.L. L
  bx(CAB, M.headlight,0.46, 0.22, 0.08, 0.64, 1.06, 6.5)      // H.L. R
  // Fog lights
  bx(CAB, M.headlight,0.2,  0.13, 0.08,-0.64, 0.8,  6.5)
  bx(CAB, M.headlight,0.2,  0.13, 0.08, 0.64, 0.8,  6.5)
  // Turn signal
  bx(CAB, M.amber, 0.2, 0.13, 0.08,-1.08, 1.0, 6.38)
  bx(CAB, M.amber, 0.2, 0.13, 0.08, 1.08, 1.0, 6.38)

  // ── MAIN CAB BODY ────────────────────────────────────────────
  bx(CAB, M.paint, 2.08, 2.52, 2.2, 0, 2.36, 2.25)    // cab box
  // Cab rear wall
  bx(CAB, M.paint, 2.08, 2.52, 0.1, 0, 2.36, 1.15)

  // ── SLEEPER BERTH (behind main cab) ──────────────────────────
  bx(CAB, M.paint, 2.08, 2.28, 1.4, 0, 2.24, 0.3)
  bx(CAB, M.paint, 2.08, 2.28, 0.1, 0, 2.24,-0.45)

  // ── WINDSHIELD & WINDOWS ─────────────────────────────────────
  bx(CAB, M.glass,  1.76, 1.08, 0.08, 0, 3.0, 3.35, -0.04)   // windshield
  // Windshield black frame
  bx(CAB, M.dark,  1.84, 0.08, 0.1,  0, 3.56, 3.35)
  bx(CAB, M.dark,  1.84, 0.08, 0.1,  0, 2.44, 3.35)
  bx(CAB, M.dark,  0.09, 1.08, 0.1, -0.92, 3.0, 3.35)
  bx(CAB, M.dark,  0.09, 1.08, 0.1,  0.92, 3.0, 3.35)
  // Door windows (main)
  bx(CAB, M.glass, 0.09, 0.76, 0.92,-1.05, 2.94, 2.3)
  bx(CAB, M.glass, 0.09, 0.76, 0.92, 1.05, 2.94, 2.3)
  // Vent quarter windows
  bx(CAB, M.glass, 0.09, 0.52, 0.48,-1.05, 2.96, 3.0)
  bx(CAB, M.glass, 0.09, 0.52, 0.48, 1.05, 2.96, 3.0)
  // Sleeper windows
  bx(CAB, M.glass, 0.09, 0.52, 0.6, -1.05, 2.72, 0.32)
  bx(CAB, M.glass, 0.09, 0.52, 0.6,  1.05, 2.72, 0.32)

  // ── ROOF & AERODYNAMIC FAIRING ───────────────────────────────
  bx(CAB, M.paint, 2.08, 0.09, 3.68, 0, 3.64, 1.68)    // main roof panel
  bx(CAB, M.paint, 2.08, 0.62, 0.65, 0, 3.72, 3.3)     // front rise
  bx(CAB, M.paint, 2.08, 0.4,  2.38, 0, 3.82, 2.1, -0.045) // fairing slope
  bx(CAB, M.chrome,2.08, 0.07, 0.44, 0, 3.6,  3.28)    // sun visor

  // ── 5 DOT ROOF MARKER LIGHTS ─────────────────────────────────
  for (const x of [-0.74,-0.37,0,0.37,0.74]) {
    bx(CAB, M.markerW, 0.11, 0.06, 0.04, x, 3.7, 3.3)
  }

  // ── EXHAUST STACKS ───────────────────────────────────────────
  // Shield (slightly larger black cylinder)
  cy(CAB, M.dark,   0.115,0.115,1.65,14,-0.88,3.55,1.5)
  cy(CAB, M.dark,   0.115,0.115,1.65,14, 0.88,3.55,1.5)
  // Chrome inner stack
  cy(CAB, M.chrome, 0.085,0.085,1.7, 14,-0.88,3.57,1.5)
  cy(CAB, M.chrome, 0.085,0.085,1.7, 14, 0.88,3.57,1.5)
  // Stack rain caps
  cy(CAB, M.chrome, 0.145,0.09,0.1, 12,-0.88,4.45,1.5)
  cy(CAB, M.chrome, 0.145,0.09,0.1, 12, 0.88,4.45,1.5)

  // ── SIDE MIRRORS ─────────────────────────────────────────────
  // Mirror arm
  bx(CAB, M.chrome, 0.09, 0.07, 0.26,-1.16, 3.12, 3.18)
  bx(CAB, M.chrome, 0.09, 0.07, 0.26, 1.16, 3.12, 3.18)
  // Mirror head (main)
  bx(CAB, M.dark,   0.38, 0.26, 0.09,-1.22, 3.04, 3.05)
  bx(CAB, M.dark,   0.38, 0.26, 0.09, 1.22, 3.04, 3.05)
  bx(CAB, M.glass,  0.3,  0.2,  0.07,-1.22, 3.04, 3.06)
  bx(CAB, M.glass,  0.3,  0.2,  0.07, 1.22, 3.04, 3.06)
  // Lower convex mirror
  bx(CAB, M.dark,   0.24, 0.17, 0.07,-1.2, 2.75, 3.04)
  bx(CAB, M.dark,   0.24, 0.17, 0.07, 1.2, 2.75, 3.04)

  // ── DOOR HANDLES & STEPS ─────────────────────────────────────
  bx(CAB, M.chrome, 0.1, 0.07, 0.07,-1.06, 2.68, 2.45)
  bx(CAB, M.chrome, 0.1, 0.07, 0.07, 1.06, 2.68, 2.45)
  bx(CAB, M.chrome, 0.36, 0.07, 1.38,-1.05, 1.32, 2.28)  // step bar 1
  bx(CAB, M.chrome, 0.36, 0.07, 1.38, 1.05, 1.32, 2.28)
  bx(CAB, M.chrome, 0.36, 0.07, 1.38,-1.05, 1.65, 2.28)  // step bar 2
  bx(CAB, M.chrome, 0.36, 0.07, 1.38, 1.05, 1.65, 2.28)

  // ── FUEL TANKS ───────────────────────────────────────────────
  cy(CAB, M.tank, 0.32,0.32,1.55,20,-1.08,1.28,0.45, 0,0,Math.PI/2)
  cy(CAB, M.tank, 0.32,0.32,1.55,20, 1.08,1.28,0.45, 0,0,Math.PI/2)
  bx(CAB, M.chrome, 0.04, 0.7, 1.58,-1.38,1.28,0.45) // tank strap L
  bx(CAB, M.chrome, 0.04, 0.7, 1.58, 1.38,1.28,0.45) // tank strap R
  cy(CAB, M.chrome, 0.07,0.07,0.07,8,-1.08,1.65,0.45)  // fuel cap L
  cy(CAB, M.chrome, 0.07,0.07,0.07,8, 1.08,1.65,0.45)  // fuel cap R

  // ── AIR FAIRINGS (cab ↔ trailer) ─────────────────────────────
  bx(CAB, M.paint, 0.08, 1.2, 0.9,-1.05, 2.7, 0.65)
  bx(CAB, M.paint, 0.08, 1.2, 0.9, 1.05, 2.7, 0.65)

  // ── MUD FLAPS ────────────────────────────────────────────────
  bx(CAB, M.black, 0.08, 0.5, 0.95,-1.06, 0.95, 0.1)
  bx(CAB, M.black, 0.08, 0.5, 0.95, 1.06, 0.95, 0.1)

  // ── 5TH WHEEL PLATE ──────────────────────────────────────────
  bx(truck, M.chrome, 0.92, 0.12, 0.6, 0, 0.9, 0.75)

  // ════════════════════════════════════════════════════════════
  //  WHEELS — realistic CylinderGeometry + dual rear
  // ════════════════════════════════════════════════════════════
  function makeWheel(x, y, z, dual = false) {
    const outer = x < 0 ? -1 : 1  // which face is visible

    function tire(offX) {
      const grp = new THREE.Group()
      grp.position.set(x + offX, y, z)
      truck.add(grp)

      // Tire body
      const t = new THREE.Mesh(C(0.46,0.46,0.26,28), M.rubber)
      t.rotation.z = Math.PI/2; t.castShadow = true; t.receiveShadow = true
      grp.add(t)

      // Sidewall (slightly wider disc)
      const sw = new THREE.Mesh(C(0.47,0.47,0.04,28), M.rubber)
      sw.rotation.z = Math.PI/2
      sw.position.x = outer * 0.14
      grp.add(sw)

      // Rim
      const rim = new THREE.Mesh(C(0.3,0.3,0.24,22), M.chrome)
      rim.rotation.z = Math.PI/2; rim.castShadow = true
      grp.add(rim)

      // Hub cap disc
      const hub = new THREE.Mesh(C(0.27,0.27,0.05,22), M.chrome)
      hub.rotation.z = Math.PI/2; hub.position.x = outer * 0.12
      grp.add(hub)

      // Center hub
      const hc = new THREE.Mesh(C(0.09,0.09,0.09,12), M.chrome)
      hc.rotation.z = Math.PI/2; hc.position.x = outer * 0.12
      grp.add(hc)

      // 8 lug nuts
      for (let i = 0; i < 8; i++) {
        const a = (i/8)*Math.PI*2
        const ln = new THREE.Mesh(C(0.024,0.024,0.07,6), M.chrome)
        ln.rotation.z = Math.PI/2
        ln.position.set(outer*0.12, Math.sin(a)*0.19, Math.cos(a)*0.19)
        grp.add(ln)
      }
    }

    if (dual) {
      tire(-0.17); tire(0.17)
    } else {
      tire(0)
    }
  }

  const WY = 0.46  // wheel center height
  // Front steer (single)
  makeWheel(-1.2, WY,  5.9, false)
  makeWheel( 1.2, WY,  5.9, false)
  // Drive axle 1 (dual)
  makeWheel(-1.2, WY,  0.7, true)
  makeWheel( 1.2, WY,  0.7, true)
  // Drive axle 2 (dual)
  makeWheel(-1.2, WY, -0.32, true)
  makeWheel( 1.2, WY, -0.32, true)
  // Trailer axle 1 (dual)
  makeWheel(-1.2, WY, -5.5, true)
  makeWheel( 1.2, WY, -5.5, true)
  // Trailer axle 2 (dual)
  makeWheel(-1.2, WY, -6.6, true)
  makeWheel( 1.2, WY, -6.6, true)

  // Axle bars
  for (const z of [5.9, 0.7, -0.32, -5.5, -6.6]) {
    bx(truck, M.chrome, 2.52, 0.13, 0.13, 0, WY, z)
  }

  // ── Resize ───────────────────────────────────────────────────
  function onResize() {
    const el = document.querySelector('.truck-sticky')
    const w = el.clientWidth, h = el.clientHeight
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
    truck.position.y = Math.sin(t * 0.7) * 0.035       // subtle float
    accent.intensity  = 3.2 + Math.sin(t * 1.6) * 0.7  // headlight pulse

    renderer.render(scene, camera)
  })()

  // ── GSAP ScrollTrigger ───────────────────────────────────────
  const textItems    = section.querySelectorAll('.truck-text-item')
  const progressFill = document.getElementById('truckProgressFill')
  const stepDots     = section.querySelectorAll('.truck-step-dot')

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
          gsap.to(el, { opacity: active?1:0, y: active?0:(i<step?-28:36), duration:0.5, ease:'power2.out', overwrite:true })
        })
        stepDots.forEach((d, i) => d.classList.toggle('active', i === step))
      },
    },
  })
}

initTruckScene()
