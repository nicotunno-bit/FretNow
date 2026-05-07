import * as THREE from 'https://esm.sh/three@0.167.1'
import { gsap } from 'https://esm.sh/gsap@3.12.5'
import { ScrollTrigger } from 'https://esm.sh/gsap@3.12.5/dist/ScrollTrigger'

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
    desc:  'Chaque camion transmet sa position à la seconde. Suivez votre marchandise depuis la prise en charge jusqu\'à la livraison.',
  },
  {
    tag:   'Sécurité',
    title: 'Assurance<br><em>tout risque.</em>',
    desc:  'Palettes, pièces industrielles hors-gabarit, colis fragiles — chaque transport est couvert par une assurance marchandise incluse.',
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

// ── Environnement IBL — gradient équirectangulaire ──────────────
function buildEnvMap(renderer) {
  const W = 2048, H = 1024
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')

  // Ciel → horizon → sol
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0,    '#0c1628')
  sky.addColorStop(0.30, '#162845')
  sky.addColorStop(0.48, '#5a7a96')
  sky.addColorStop(0.52, '#2a1e14')
  sky.addColorStop(1,    '#0a0907')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // Soleil (reflet sur chrome)
  const sx = W * 0.74, sy = H * 0.3
  const sun = ctx.createRadialGradient(sx, sy, 2, sx, sy, 120)
  sun.addColorStop(0,   'rgba(255,230,130,1.0)')
  sun.addColorStop(0.2, 'rgba(255,180, 60,0.6)')
  sun.addColorStop(0.6, 'rgba(255,130, 20,0.2)')
  sun.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H)

  // Halo orange chaud (reflet capot)
  const halo = ctx.createRadialGradient(W*0.55, H*0.52, 0, W*0.55, H*0.52, 300)
  halo.addColorStop(0,   'rgba(255,100,0,0.18)')
  halo.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H)

  const tex = new THREE.CanvasTexture(c)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace

  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const rt = pmrem.fromEquirectangular(tex)
  tex.dispose(); pmrem.dispose()
  return rt.texture
}

// ── Texture canvas de la remorque (logo FretNow) ─────────────────
function buildTrailerDecal() {
  const W = 2048, H = 512
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')

  // Fond aluminium brossé
  const alumGrad = ctx.createLinearGradient(0, 0, 0, H)
  alumGrad.addColorStop(0,   '#2a2724')
  alumGrad.addColorStop(0.5, '#1e1c1a')
  alumGrad.addColorStop(1,   '#2a2724')
  ctx.fillStyle = alumGrad
  ctx.fillRect(0, 0, W, H)

  // Nervures horizontales subtiles
  ctx.strokeStyle = 'rgba(255,255,255,0.035)'
  ctx.lineWidth = 1
  for (let y = 20; y < H; y += 28) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // Bande orange DOT en bas
  const stripe = ctx.createLinearGradient(0, H - 70, 0, H)
  stripe.addColorStop(0, '#cc5200'); stripe.addColorStop(1, '#ff7a1a')
  ctx.fillStyle = stripe
  ctx.fillRect(0, H - 70, W, 70)

  // Reflet supérieur (liseré chromé)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(0, 0, W, 6)

  // ── Logo FretNow ───────────────────────────────────────────────
  const cx = W / 2, cy = H * 0.44

  // Ombre portée du texte
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetX = 4
  ctx.shadowOffsetY = 4

  // "Fret" — gris clair
  ctx.font = '700 italic 195px "Barlow Condensed", "Arial Narrow", sans-serif'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#d8d0c8'
  ctx.textAlign = 'right'
  ctx.fillText('Fret', cx - 8, cy)

  // "Now" — orange vif
  ctx.fillStyle = '#ff6a00'
  ctx.textAlign = 'left'
  ctx.fillText('Now', cx + 8, cy)

  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0

  // Tagline
  ctx.font = '500 52px "Barlow", "Arial", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.42)'
  ctx.letterSpacing = '0.15em'
  ctx.fillText('TRANSPORT INDUSTRIEL', cx, cy + 72)

  // Tiret décoratif gauche / droite
  ctx.fillStyle = 'rgba(255,106,0,0.55)'
  ctx.fillRect(cx - 420, cy + 42, 170, 3)
  ctx.fillRect(cx + 250, cy + 42, 170, 3)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// ════════════════════════════════════════════════════════════════
function initTruckScene() {
  buildTextPanels()
  const section = document.getElementById('truck-scene')
  const canvas  = document.getElementById('truck-canvas')
  if (!section || !canvas) return

  // ── Renderer (setup complet du skill) ──────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap
  renderer.toneMapping       = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95
  renderer.outputColorSpace  = THREE.SRGBColorSpace   // ← clé pour les couleurs correctes
  renderer.setClearColor(0x0b0a09)

  // ── Scene & Camera ─────────────────────────────────────────────
  const scene  = new THREE.Scene()
  scene.fog    = new THREE.FogExp2(0x0b0a09, 0.022)
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120)
  camera.position.set(0, 3.6, 17)
  camera.lookAt(0, 1.9, 0)

  // ── IBL Environment (reflets PBR réalistes) ────────────────────
  scene.environment = buildEnvMap(renderer)
  scene.environmentIntensity = 1.4

  // ── Lumières ───────────────────────────────────────────────────
  // Hémisphère ciel/sol
  scene.add(new THREE.HemisphereLight(0xb8d4f0, 0x5c3a12, 0.55))

  // Soleil — ombres PCF 4096px
  const sun = new THREE.DirectionalLight(0xfff2d0, 3.0)
  sun.position.set(9, 18, 12)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  sun.shadow.camera.near   =  1
  sun.shadow.camera.far    = 70
  sun.shadow.camera.left   = -16
  sun.shadow.camera.right  =  16
  sun.shadow.camera.top    =  16
  sun.shadow.camera.bottom = -16
  sun.shadow.bias          = -0.0004
  sun.shadow.normalBias    =  0.02
  scene.add(sun)

  // Contre-jour bleu froid (sépare la silhouette du fond)
  scene.add(Object.assign(new THREE.DirectionalLight(0x3366bb, 0.6),
    { position: new THREE.Vector3(-6, 10, -14) }))

  // Rim light arrière-droite
  scene.add(Object.assign(new THREE.DirectionalLight(0x1a3366, 0.4),
    { position: new THREE.Vector3(5, 6, -12) }))

  // Accent orange (reflet phares → sol)
  const accent = new THREE.PointLight(0xff6600, 4.5, 12, 1.8)
  accent.position.set(0, 0.5, 8)
  scene.add(accent)

  // ── Sol showroom réfléchissant (valeurs skill) ─────────────────
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({
      color: 0x0d0c0a, roughness: 0.18, metalness: 0.88,
      envMapIntensity: 1.2,
    })
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Lignes oranges au sol
  const lm = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.12 })
  for (const x of [-2.8, 0, 2.8]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 40), lm)
    l.rotation.x = -Math.PI / 2; l.position.set(x, 0.001, 0); scene.add(l)
  }

  // ── Matériaux PBR (valeurs du skill creative-web-3d) ───────────
  const M = {
    // Peinture orange laquée — clearcoat = effet carrosserie automobile
    paint: new THREE.MeshPhysicalMaterial({
      color: 0xff6a00, metalness: 0.06, roughness: 0.22,
      clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 1.5,
    }),
    // Chrome — miroir quasi-parfait (valeur skill: metalness 1.0, roughness 0.05)
    chrome: new THREE.MeshPhysicalMaterial({
      color: 0xe0e0e0, metalness: 1.0, roughness: 0.04, envMapIntensity: 3.5,
    }),
    // Aluminium brossé (réservoirs)
    alu: new THREE.MeshPhysicalMaterial({
      color: 0xa8a8a8, metalness: 0.88, roughness: 0.28,
      clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 1.8,
    }),
    // Verre — transmission physique (valeur skill: roughness 0.0)
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x8ac8e0, metalness: 0.0, roughness: 0.0,
      transmission: 0.9, transparent: true, opacity: 0.3,
      envMapIntensity: 2.0, ior: 1.5,
    }),
    // Corps remorque — métal sombre + légère réflexion
    trailer: new THREE.MeshStandardMaterial({
      color: 0x1e1c1a, metalness: 0.3, roughness: 0.65, envMapIntensity: 0.8,
    }),
    // Caoutchouc pneus (valeur skill: roughness 0.9, metalness 0.0)
    rubber: new THREE.MeshStandardMaterial({ color: 0x111010, metalness: 0.0, roughness: 0.92 }),
    // Plastique noir (pare-chocs, joints)
    plastic: new THREE.MeshStandardMaterial({ color: 0x0e0d0c, metalness: 0.0, roughness: 0.88 }),
    // Phares / feux (émissifs)
    headlight: new THREE.MeshStandardMaterial({ color: 0xfff8d0, emissive: 0xffcc44, emissiveIntensity: 3.5 }),
    amber:     new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0xff7700, emissiveIntensity: 2.2 }),
    marker:    new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff1100, emissiveIntensity: 2.0 }),
    markerW:   new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdddddd, emissiveIntensity: 1.8 }),
    // Grille sombre
    grille: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.6 }),
    // Bande réfléchissante orange (DOT)
    refl: new THREE.MeshStandardMaterial({ color: 0xff6a00, emissive: 0x441800, emissiveIntensity: 0.6, roughness: 0.25 }),
  }

  // ── Helpers géométriques ───────────────────────────────────────
  const B = (w,h,d) => new THREE.BoxGeometry(w,h,d)
  const C = (rt,rb,h,s=20) => new THREE.CylinderGeometry(rt,rb,h,s)

  function add(parent, geo, mat, x=0, y=0, z=0, rx=0, ry=0, rz=0) {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x,y,z); m.rotation.set(rx,ry,rz)
    m.castShadow = true; m.receiveShadow = true
    parent.add(m); return m
  }
  const bx = (p,m,w,h,d,...a) => add(p, B(w,h,d), m, ...a)
  const cy = (p,m,rt,rb,h,s,...a) => add(p, C(rt,rb,h,s), m, ...a)

  // ══════════════════════════════════════════════════════════════
  //  GROUPE PRINCIPAL
  // ══════════════════════════════════════════════════════════════
  const truck = new THREE.Group()
  scene.add(truck)

  // ══════════════════════════════════════════════════════════════
  //  REMORQUE  (Z center = -3.6)
  // ══════════════════════════════════════════════════════════════
  const TR = new THREE.Group()
  truck.add(TR)
  const TZ = -3.6

  // Corps principal
  bx(TR, M.trailer, 2.04, 2.52, 7.2,  0, 2.26, TZ)
  // Rails chromés (arêtes)
  bx(TR, M.chrome,  2.06, 0.055, 7.26, 0, 3.54, TZ)    // toit
  bx(TR, M.chrome,  0.045, 2.52, 7.26, -1.04, 2.26, TZ) // côté G
  bx(TR, M.chrome,  0.045, 2.52, 7.26,  1.04, 2.26, TZ) // côté D
  // Bande réfléchissante DOT
  bx(TR, M.refl, 2.08, 0.1, 7.28, 0, 1.02, TZ)
  // Sous-caisse
  bx(TR, M.chrome, 1.88, 0.14, 7.0, 0, 0.82, TZ)
  // Plaque kingpin
  bx(TR, M.chrome, 0.92, 0.12, 0.55, 0, 0.82, TZ+3.36)

  // Nez de remorque
  bx(TR, M.chrome, 2.06, 2.52, 0.06, 0, 2.26, TZ+3.63)

  // Portes arrière
  bx(TR, M.chrome, 2.08, 0.16, 0.16, 0, 0.82, TZ-3.72) // pare-choc arrière
  bx(TR, M.chrome, 0.045, 2.12, 0.07, -0.1, 2.26, TZ-3.7)  // montant G
  bx(TR, M.chrome, 0.045, 2.12, 0.07,  0.1, 2.26, TZ-3.7)  // montant D
  bx(TR, M.chrome, 2.06, 0.045, 0.07, 0, 1.24, TZ-3.7)     // traverse basse
  bx(TR, M.chrome, 2.06, 0.045, 0.07, 0, 3.26, TZ-3.7)     // traverse haute
  // Feux arrière (rouges)
  for (const [x,y] of [[-0.7,3.06],[0.7,3.06],[-0.7,1.12],[0.7,1.12]]) {
    bx(TR, M.marker, 0.22, 0.07, 0.04, x, y, TZ-3.71)
  }
  // Nervures verticales
  for (let dz = -2.6; dz <= 2.6; dz += 1.3) {
    bx(TR, M.chrome, 0.028, 2.51, 0.04, -1.04, 2.26, TZ+dz)
    bx(TR, M.chrome, 0.028, 2.51, 0.04,  1.04, 2.26, TZ+dz)
  }
  // Bavettes
  for (const [x,z] of [[-1.05,TZ+2.7],[1.05,TZ+2.7],[-1.05,TZ-2.3],[1.05,TZ-2.3]]) {
    bx(TR, M.plastic, 0.07, 0.48, 0.92, x, 0.82, z)
  }

  // ── Décal logo FretNow sur les côtés de la remorque ────────────
  const decalTex = buildTrailerDecal()
  // On crée un plan pour chaque côté (légèrement décalé des parois)
  const decalMat = new THREE.MeshStandardMaterial({
    map: decalTex, roughness: 0.4, metalness: 0.05,
    transparent: false, envMapIntensity: 0.3,
  })
  // Côté gauche
  const decalL = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 1.8), decalMat)
  decalL.position.set(-1.048, 2.26, TZ)
  decalL.rotation.y = Math.PI / 2
  TR.add(decalL)
  // Côté droit (miroir)
  const decalR = decalL.clone()
  decalR.position.x = 1.048
  decalR.rotation.y = -Math.PI / 2
  TR.add(decalR)

  // ══════════════════════════════════════════════════════════════
  //  CABINE  — semi américain conventionnel (long capot)
  //  Pare-choc avant ≈ Z+6.5, arrière cabine ≈ Z+1.0
  // ══════════════════════════════════════════════════════════════
  const CAB = new THREE.Group()
  truck.add(CAB)

  // ── Pare-choc chromé ──────────────────────────────────────────
  bx(CAB, M.chrome,  2.18, 0.38, 0.25,  0, 0.9,  6.56)   // barre principale
  bx(CAB, M.chrome,  2.18, 0.12, 0.16,  0, 0.72, 6.56)   // sous-lame
  bx(CAB, M.chrome,  0.22, 0.38, 0.65, -1.18, 0.9,  6.34) // prolongement G
  bx(CAB, M.chrome,  0.22, 0.38, 0.65,  1.18, 0.9,  6.34) // prolongement D
  bx(CAB, M.plastic, 0.52, 0.16, 0.1,  -0.58, 0.9,  6.6)  // prise d'air G
  bx(CAB, M.plastic, 0.52, 0.16, 0.1,   0.58, 0.9,  6.6)  // prise d'air D

  // ── Ailes avant ───────────────────────────────────────────────
  bx(CAB, M.paint,  0.28, 0.58, 1.85, -1.18, 1.38, 5.78)
  bx(CAB, M.paint,  0.28, 0.58, 1.85,  1.18, 1.38, 5.78)
  bx(CAB, M.paint,  0.22, 0.18, 1.85, -1.35, 1.06, 5.78) // lèvre G
  bx(CAB, M.paint,  0.22, 0.18, 1.85,  1.35, 1.06, 5.78) // lèvre D

  // ── Capot long ────────────────────────────────────────────────
  bx(CAB, M.paint, 1.88, 0.78, 2.95,  0, 1.65, 4.92, -0.028)
  bx(CAB, M.paint, 0.14, 0.78, 2.95, -1.06, 1.65, 4.92, -0.028) // flanc G
  bx(CAB, M.paint, 0.14, 0.78, 2.95,  1.06, 1.65, 4.92, -0.028) // flanc D
  // Pente avant capot
  bx(CAB, M.paint, 1.88, 0.24, 0.5,   0, 1.18, 6.28)
  bx(CAB, M.paint, 1.88, 0.08, 0.22,  0, 1.04, 6.48)
  // Persiennes capot
  for (let i = 0; i < 4; i++) {
    bx(CAB, M.plastic, 0.52, 0.05, 1.02, -0.6,  1.8+i*0.065, 4.94)
    bx(CAB, M.plastic, 0.52, 0.05, 1.02,  0.6,  1.8+i*0.065, 4.94)
  }

  // ── Calandre ──────────────────────────────────────────────────
  bx(CAB, M.chrome, 1.3,  0.54, 0.1,  0, 1.44, 6.58)
  for (let i = 0; i < 9; i++) bx(CAB, M.grille, 1.22, 0.046, 0.14, 0, 1.18+i*0.056, 6.6)
  bx(CAB, M.chrome, 0.34, 0.14, 0.1,  0, 1.52, 6.6)  // emblème central

  // ── Phares ────────────────────────────────────────────────────
  bx(CAB, M.chrome,    0.6,  0.28, 0.12, -0.64, 1.06, 6.58)
  bx(CAB, M.chrome,    0.6,  0.28, 0.12,  0.64, 1.06, 6.58)
  bx(CAB, M.headlight, 0.48, 0.22, 0.09, -0.64, 1.06, 6.6)
  bx(CAB, M.headlight, 0.48, 0.22, 0.09,  0.64, 1.06, 6.6)
  bx(CAB, M.headlight, 0.2,  0.13, 0.09, -0.64, 0.8,  6.6)   // antibrouillard G
  bx(CAB, M.headlight, 0.2,  0.13, 0.09,  0.64, 0.8,  6.6)   // antibrouillard D
  bx(CAB, M.amber,     0.2,  0.13, 0.09, -1.1,  1.0,  6.46)  // clignotant G
  bx(CAB, M.amber,     0.2,  0.13, 0.09,  1.1,  1.0,  6.46)  // clignotant D

  // ── Corps cabine + couchette ───────────────────────────────────
  bx(CAB, M.paint, 2.1, 2.55, 2.26,  0, 2.38, 2.28)   // cabine
  bx(CAB, M.paint, 2.1, 2.55, 0.1,   0, 2.38, 1.15)   // paroi arrière
  bx(CAB, M.paint, 2.1, 2.3,  1.45,  0, 2.25, 0.32)   // sleeper
  bx(CAB, M.paint, 2.1, 2.3,  0.1,   0, 2.25,-0.45)   // paroi arrière sleeper

  // ── Pare-brise & vitres ────────────────────────────────────────
  bx(CAB, M.glass,  1.78, 1.1,  0.08,  0,  3.02, 3.4,  -0.038)  // pare-brise
  // Cadre pare-brise
  bx(CAB, M.plastic, 1.86, 0.08, 0.1,  0, 3.60, 3.4)
  bx(CAB, M.plastic, 1.86, 0.08, 0.1,  0, 2.46, 3.4)
  bx(CAB, M.plastic, 0.09, 1.1,  0.1, -0.94, 3.02, 3.4)
  bx(CAB, M.plastic, 0.09, 1.1,  0.1,  0.94, 3.02, 3.4)
  // Vitres latérales
  bx(CAB, M.glass, 0.09, 0.78, 0.95, -1.06, 2.96, 2.34)
  bx(CAB, M.glass, 0.09, 0.78, 0.95,  1.06, 2.96, 2.34)
  bx(CAB, M.glass, 0.09, 0.54, 0.5,  -1.06, 2.98, 3.06)   // déflecteur G
  bx(CAB, M.glass, 0.09, 0.54, 0.5,   1.06, 2.98, 3.06)   // déflecteur D
  // Vitres sleeper
  bx(CAB, M.glass, 0.09, 0.52, 0.62, -1.06, 2.72, 0.34)
  bx(CAB, M.glass, 0.09, 0.52, 0.62,  1.06, 2.72, 0.34)

  // ── Toit & becquet aéro ───────────────────────────────────────
  bx(CAB, M.paint, 2.1, 0.09, 3.8,  0, 3.66, 1.72)      // toit plat
  bx(CAB, M.paint, 2.1, 0.65, 0.68, 0, 3.74, 3.34)      // montée becquet
  bx(CAB, M.paint, 2.1, 0.42, 2.44, 0, 3.85, 2.14, -0.042) // becquet incliné
  bx(CAB, M.chrome,2.1, 0.07, 0.45, 0, 3.62, 3.32)      // visière chromée

  // ── 5 feux de gabarit DOT (toit) ─────────────────────────────
  for (const x of [-0.76,-0.38,0,0.38,0.76]) {
    bx(CAB, M.markerW, 0.12, 0.065, 0.04, x, 3.72, 3.3)
  }

  // ── Échappements doubles ──────────────────────────────────────
  cy(CAB, M.plastic, 0.12, 0.12, 1.72, 14, -0.9, 3.58, 1.52)
  cy(CAB, M.plastic, 0.12, 0.12, 1.72, 14,  0.9, 3.58, 1.52)
  cy(CAB, M.chrome,  0.088,0.088,1.76,14, -0.9, 3.6, 1.52)
  cy(CAB, M.chrome,  0.088,0.088,1.76,14,  0.9, 3.6, 1.52)
  cy(CAB, M.chrome,  0.15, 0.092,0.1, 12, -0.9, 4.5, 1.52) // chapeau G
  cy(CAB, M.chrome,  0.15, 0.092,0.1, 12,  0.9, 4.5, 1.52) // chapeau D

  // ── Rétroviseurs ──────────────────────────────────────────────
  bx(CAB, M.chrome, 0.09, 0.07, 0.28, -1.17, 3.14, 3.2)
  bx(CAB, M.chrome, 0.09, 0.07, 0.28,  1.17, 3.14, 3.2)
  bx(CAB, M.plastic,0.4,  0.26, 0.09, -1.23, 3.06, 3.06)
  bx(CAB, M.plastic,0.4,  0.26, 0.09,  1.23, 3.06, 3.06)
  bx(CAB, M.glass,  0.32, 0.2,  0.07, -1.23, 3.06, 3.07)
  bx(CAB, M.glass,  0.32, 0.2,  0.07,  1.23, 3.06, 3.07)
  bx(CAB, M.plastic,0.26, 0.17, 0.07, -1.21, 2.78, 3.05) // rétro convexe G
  bx(CAB, M.plastic,0.26, 0.17, 0.07,  1.21, 2.78, 3.05)

  // ── Poignées & marchepieds ────────────────────────────────────
  bx(CAB, M.chrome, 0.1, 0.07, 0.07, -1.07, 2.7, 2.5)
  bx(CAB, M.chrome, 0.1, 0.07, 0.07,  1.07, 2.7, 2.5)
  bx(CAB, M.chrome, 0.36, 0.07, 1.42, -1.06, 1.34, 2.34)
  bx(CAB, M.chrome, 0.36, 0.07, 1.42,  1.06, 1.34, 2.34)
  bx(CAB, M.chrome, 0.36, 0.07, 1.42, -1.06, 1.68, 2.34)
  bx(CAB, M.chrome, 0.36, 0.07, 1.42,  1.06, 1.68, 2.34)

  // ── Réservoirs cylindriques aluminium ─────────────────────────
  cy(CAB, M.alu, 0.33, 0.33, 1.6, 22, -1.1, 1.3,  0.48, 0, 0, Math.PI/2)
  cy(CAB, M.alu, 0.33, 0.33, 1.6, 22,  1.1, 1.3,  0.48, 0, 0, Math.PI/2)
  bx(CAB, M.chrome, 0.04, 0.72, 1.62, -1.42, 1.3, 0.48)  // sangle G
  bx(CAB, M.chrome, 0.04, 0.72, 1.62,  1.42, 1.3, 0.48)  // sangle D
  cy(CAB, M.chrome, 0.07, 0.07, 0.07, 8, -1.1, 1.68, 0.48) // bouchon G
  cy(CAB, M.chrome, 0.07, 0.07, 0.07, 8,  1.1, 1.68, 0.48) // bouchon D

  // ── Déflecteurs latéraux (cab → remorque) ─────────────────────
  bx(CAB, M.paint, 0.08, 1.18, 0.95, -1.07, 2.72, 0.68)
  bx(CAB, M.paint, 0.08, 1.18, 0.95,  1.07, 2.72, 0.68)

  // ── Bavettes cabine ───────────────────────────────────────────
  bx(CAB, M.plastic, 0.08, 0.5, 0.98, -1.07, 0.95, 0.08)
  bx(CAB, M.plastic, 0.08, 0.5, 0.98,  1.07, 0.95, 0.08)

  // ── Plaque de 5ème roue ───────────────────────────────────────
  bx(truck, M.chrome, 0.95, 0.12, 0.6, 0, 0.92, 0.78)

  // ══════════════════════════════════════════════════════════════
  //  ROUES — CylinderGeometry, doubles à l'arrière, 8 boulons
  // ══════════════════════════════════════════════════════════════
  const WY = 0.46

  function makeWheel(x, y, z, dual = false) {
    const outer = x < 0 ? -1 : 1

    function singleTire(ox) {
      const g = new THREE.Group()
      g.position.set(x + ox, y, z)
      truck.add(g)

      // Pneu
      const tire = add(g, C(0.46, 0.46, 0.27, 30), M.rubber, 0, 0, 0, 0, 0, Math.PI/2)
      tire.castShadow = true

      // Flanc (légèrement plus large)
      const sw = add(g, C(0.47, 0.47, 0.04, 28), M.rubber, outer*0.145, 0, 0, 0, 0, Math.PI/2)

      // Jante chrome
      add(g, C(0.31, 0.31, 0.25, 22), M.chrome, 0, 0, 0, 0, 0, Math.PI/2)

      // Disque hub
      add(g, C(0.27, 0.27, 0.055, 20), M.chrome, outer*0.128, 0, 0, 0, 0, Math.PI/2)

      // Moyeu central
      add(g, C(0.09, 0.09, 0.09, 12), M.chrome, outer*0.128, 0, 0, 0, 0, Math.PI/2)

      // 8 écrous
      for (let i = 0; i < 8; i++) {
        const a = (i/8)*Math.PI*2
        const nut = add(g, C(0.024, 0.024, 0.075, 6), M.chrome,
          outer*0.128, Math.sin(a)*0.2, Math.cos(a)*0.2, 0, 0, Math.PI/2)
      }
    }

    if (dual) { singleTire(-0.175); singleTire(0.175) }
    else       { singleTire(0) }
  }

  // Essieu avant (simple)
  makeWheel(-1.22, WY,  6.0, false)
  makeWheel( 1.22, WY,  6.0, false)
  // Essieux moteurs (doubles)
  makeWheel(-1.22, WY,  0.72, true)
  makeWheel( 1.22, WY,  0.72, true)
  makeWheel(-1.22, WY, -0.34, true)
  makeWheel( 1.22, WY, -0.34, true)
  // Essieux remorque (doubles)
  makeWheel(-1.22, WY, -5.6,  true)
  makeWheel( 1.22, WY, -5.6,  true)
  makeWheel(-1.22, WY, -6.7,  true)
  makeWheel( 1.22, WY, -6.7,  true)

  // Barres d'essieu
  for (const z of [6.0, 0.72, -0.34, -5.6, -6.7]) {
    bx(truck, M.chrome, 2.56, 0.13, 0.13, 0, WY, z)
  }

  // ── Resize ────────────────────────────────────────────────────
  function onResize() {
    const el = document.querySelector('.truck-sticky')
    const w = el.clientWidth, h = el.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  onResize()
  window.addEventListener('resize', onResize)

  // ── Render loop ───────────────────────────────────────────────
  let scrollProgress = 0
  const clock = new THREE.Clock()

  ;(function tick() {
    requestAnimationFrame(tick)
    const t = clock.getElapsedTime()
    truck.rotation.y = scrollProgress * Math.PI * 2
    truck.position.y = Math.sin(t * 0.72) * 0.036
    accent.intensity  = 4.0 + Math.sin(t * 1.7) * 0.9
    renderer.render(scene, camera)
  })()

  // ── GSAP ScrollTrigger ────────────────────────────────────────
  const textItems    = section.querySelectorAll('.truck-text-item')
  const progressFill = document.getElementById('truckProgressFill')
  const stepDots     = section.querySelectorAll('.truck-step-dot')

  textItems.forEach((el, i) => gsap.set(el, { opacity: i===0?1:0, y: i===0?0:40 }))

  gsap.to({}, {
    scrollTrigger: {
      trigger: section, start: 'top top', end: 'bottom bottom',
      pin: '.truck-sticky', scrub: 1.4,
      onUpdate(self) {
        scrollProgress = self.progress
        if (progressFill) progressFill.style.height = (self.progress*100)+'%'
        const step = Math.min(Math.floor(self.progress * 3), 2)
        textItems.forEach((el, i) => {
          const on = i === step
          gsap.to(el, { opacity:on?1:0, y:on?0:(i<step?-28:36), duration:0.5, ease:'power2.out', overwrite:true })
        })
        stepDots.forEach((d, i) => d.classList.toggle('active', i === step))
      },
    },
  })
}

initTruckScene()
