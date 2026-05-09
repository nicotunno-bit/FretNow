import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'

// ── Scroll step definitions ───────────────────────────────────────────────
const STEPS = [
  {
    tag:   'Réactivité',
    title: 'Mise en relation<br /><em>en 15 minutes.</em>',
    desc:  "Notre algorithme contacte les transporteurs disponibles dans votre zone en temps réel. Premier retour garanti sous le quart d'heure.",
  },
  {
    tag:   'Traçabilité',
    title: 'Suivi GPS<br /><em>en direct.</em>',
    desc:  "Chaque camion transmet sa position à la seconde. Suivez votre marchandise sur la carte depuis la prise en charge jusqu'à la livraison.",
  },
  {
    tag:   'Sécurité',
    title: 'Assurance<br /><em>tout risque.</em>',
    desc:  'Palettes, pièces industrielles hors-gabarit, colis fragiles — chaque transport est couvert par une assurance marchandise incluse dans le prix.',
  },
]

// [start, end] progress ranges per step (after the hero-intro phase ends at 0.18)
const STEP_RANGES = [[0.18, 0.45], [0.45, 0.72], [0.72, 1.00]]

function stepOpacity(i, p) {
  const [s, e] = STEP_RANGES[i]
  if (p <= s) return 0
  if (p >= e) return 0
  const fi = 0.06, fo = i < 2 ? 0.06 : 0
  if (p < s + fi) return (p - s) / fi
  if (i < 2 && p > e - fo) return (e - p) / fo
  return 1
}
function stepY(i, p) {
  const [s, e] = STEP_RANGES[i]
  if (p <= s) return 36
  if (i < 2 && p >= e) return -28
  return 0
}

// ── Three.js helpers ──────────────────────────────────────────────────────
function makeTex(w, h, fn) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  fn(c.getContext('2d'), w, h)
  return new THREE.CanvasTexture(c)
}

function makeSkyEnv() {
  const sz = 128
  const faces = [
    { top: '#7a8fbb', bot: '#3a5080' }, { top: '#6a7faa', bot: '#2a4070' },
    { top: '#c0ccee', bot: '#7888c0' }, { top: '#100e0c', bot: '#080604' },
    { top: '#8898cc', bot: '#485888' }, { top: '#606e90', bot: '#303850' },
  ]
  const tex = new THREE.CubeTexture(faces.map(({ top, bot }) => {
    const c = document.createElement('canvas'); c.width = sz; c.height = sz
    const ctx = c.getContext('2d'), g = ctx.createLinearGradient(0, 0, 0, sz)
    g.addColorStop(0, top); g.addColorStop(1, bot)
    ctx.fillStyle = g; ctx.fillRect(0, 0, sz, sz); return c
  }))
  tex.needsUpdate = true; return tex
}

// ── Framer Motion variants for initial hero text ──────────────────────────
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.13, delayChildren: 0.3 } } }
const item = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } }

export default function HeroTruck() {
  const sectionRef    = useRef(null)
  const canvasRef     = useRef(null)
  const heroOverlayRef = useRef(null)
  const textPanelRef  = useRef(null)
  const scrollHintRef = useRef(null)
  const progressFillRef = useRef(null)
  const stepRefs = useRef([])
  const dotRefs  = useRef([])
  const scrollProg = useRef(0)

  useEffect(() => {
    const canvas  = canvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    renderer.toneMapping       = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.18
    renderer.outputColorSpace  = THREE.SRGBColorSpace
    renderer.setClearColor(0x070605)

    // ── Scene ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x070605, 0.020)
    scene.environment = makeSkyEnv()

    // ── Camera ────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 140)
    camera.position.set(0, 4.4, 17.5)
    camera.lookAt(0, 2.1, 0)

    // ── Lighting ──────────────────────────────────────────────────────────
    scene.add(new THREE.HemisphereLight(0xb0c4e0, 0x5a3a18, 0.55))
    const sun = new THREE.DirectionalLight(0xfff0d0, 4.0)
    sun.position.set(10, 20, 14); sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 1;  sun.shadow.camera.far  = 72
    sun.shadow.camera.left = -17; sun.shadow.camera.right = 17
    sun.shadow.camera.top  = 17;  sun.shadow.camera.bottom = -17
    sun.shadow.bias = -0.00032; sun.shadow.normalBias = 0.018
    scene.add(sun)
    const skyFill = new THREE.DirectionalLight(0x4466cc, 0.60); skyFill.position.set(-10, 14, 6); scene.add(skyFill)
    const rim = new THREE.DirectionalLight(0x1a3366, 0.80);     rim.position.set(-3, 9, -16);    scene.add(rim)
    const warm = new THREE.DirectionalLight(0xff8844, 0.20);    warm.position.set(8, 2, 10);     scene.add(warm)
    const hlL = new THREE.PointLight(0xfffce0, 6.5, 9, 2.2);   hlL.position.set(-0.68, 1.06, 7.3); scene.add(hlL)
    const hlR = new THREE.PointLight(0xfffce0, 6.5, 9, 2.2);   hlR.position.set( 0.68, 1.06, 7.3); scene.add(hlR)
    scene.add(new THREE.AmbientLight(0x283050, 0.75))

    // ── Textures ──────────────────────────────────────────────────────────
    const paintTex = makeTex(512, 512, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w * 0.6, h)
      g.addColorStop(0, '#ff7c22'); g.addColorStop(0.4, '#ff6b00'); g.addColorStop(1, '#c94400')
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 3500; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,200,120,${Math.random() * 0.07})` : `rgba(160,60,0,${Math.random() * 0.042})`
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
      }
    })
    const chromeTex = makeTex(256, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#f4f8ff'); g.addColorStop(0.10, '#ccd8f0'); g.addColorStop(0.30, '#7888a8')
      g.addColorStop(0.52, '#38485e'); g.addColorStop(0.72, '#bcc8e0'); g.addColorStop(0.88, '#e4ecf8'); g.addColorStop(1, '#f8fbff')
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 24; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.10})`; ctx.fillRect(Math.random() * w, 0, Math.random() * 2 + 0.5, h) }
    })
    const treadTex = makeTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#131211'; ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#090807'; for (let i = 0; i < 10; i++) ctx.fillRect(0, (i / 10) * h, w, 5)
      ctx.fillStyle = '#0f0e0d'; for (let i = 0; i < 16; i++) ctx.fillRect((i / 16) * w, 0, 2, h)
      for (let r = 0; r < 10; r++) for (let col = 0; col < 8; col++)
        if ((r + col) % 2 === 0) { ctx.fillStyle = 'rgba(38,36,34,0.85)'; ctx.fillRect(col / 8 * w + 1, r / 10 * h + 1, w / 8 - 3, h / 10 - 3) }
    })
    treadTex.wrapS = treadTex.wrapT = THREE.RepeatWrapping; treadTex.repeat.set(1, 4)

    const asphaltTex = makeTex(1024, 1024, (ctx, w, h) => {
      ctx.fillStyle = '#0d0c0b'; ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 9000; i++) { const v = Math.floor(Math.random() * 22 + 10); ctx.fillStyle = `rgb(${v},${v - 1},${v - 2})`; ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 2.5 + 0.5, Math.random() * 2.5 + 0.5) }
      ctx.strokeStyle = 'rgba(255,100,0,0.07)'; ctx.lineWidth = 3; ctx.setLineDash([50, 50])
      for (const x of [w * 0.33, w * 0.66]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    })
    asphaltTex.wrapS = asphaltTex.wrapT = THREE.RepeatWrapping; asphaltTex.repeat.set(6, 6)

    // ── Materials ─────────────────────────────────────────────────────────
    const M = {
      paint:    new THREE.MeshStandardMaterial({ map: paintTex,  metalness: 0.18, roughness: 0.24, envMapIntensity: 1.5 }),
      paintDim: new THREE.MeshStandardMaterial({ color: 0xe05500, metalness: 0.16, roughness: 0.28 }),
      paintDk:  new THREE.MeshStandardMaterial({ color: 0xc04000, metalness: 0.14, roughness: 0.32 }),
      chrome:   new THREE.MeshStandardMaterial({ map: chromeTex, metalness: 0.97, roughness: 0.04, envMapIntensity: 3.2 }),
      dark:     new THREE.MeshStandardMaterial({ color: 0x1a1816, metalness: 0.08, roughness: 0.85 }),
      black:    new THREE.MeshStandardMaterial({ color: 0x0b0a09, metalness: 0.04, roughness: 0.93 }),
      glass:    new THREE.MeshStandardMaterial({ color: 0x78a8c8, metalness: 0.02, roughness: 0.04, transparent: true, opacity: 0.28 }),
      rubber:   new THREE.MeshStandardMaterial({ map: treadTex,  metalness: 0.04, roughness: 0.94 }),
      rim:      new THREE.MeshStandardMaterial({ map: chromeTex, metalness: 0.96, roughness: 0.06, envMapIntensity: 2.8 }),
      trailer:  new THREE.MeshStandardMaterial({ color: 0x1c1a18, metalness: 0.14, roughness: 0.78 }),
      tank:     new THREE.MeshStandardMaterial({ map: chromeTex, metalness: 0.82, roughness: 0.20, envMapIntensity: 2.0 }),
      headlight:new THREE.MeshStandardMaterial({ color: 0xfffce0, emissive: 0xffdd55, emissiveIntensity: 5.5, roughness: 0.08 }),
      foglight: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3.5 }),
      amber:    new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0xff7700, emissiveIntensity: 3.5 }),
      marker:   new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff1100, emissiveIntensity: 2.8 }),
      markerW:  new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.2 }),
      refl:     new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x441800, emissiveIntensity: 0.75, roughness: 0.24 }),
      grille:   new THREE.MeshStandardMaterial({ color: 0x181818, metalness: 0.45, roughness: 0.55 }),
    }

    // ── Ground ────────────────────────────────────────────────────────────
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.88, metalness: 0.05 }))
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)
    const puddle = new THREE.Mesh(new THREE.PlaneGeometry(12, 22), new THREE.MeshStandardMaterial({ color: 0x060504, roughness: 0.04, metalness: 0.02, transparent: true, opacity: 0.42 }))
    puddle.rotation.x = -Math.PI / 2; puddle.position.y = 0.002; scene.add(puddle)
    const lmat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.12 })
    for (const x of [-2.7, 0, 2.7]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 38), lmat); l.rotation.x = -Math.PI / 2; l.position.set(x, 0.003, 0); scene.add(l) }

    // ── Geometry helpers ──────────────────────────────────────────────────
    const B = (w, h, d) => new THREE.BoxGeometry(w, h, d)
    const C = (rt, rb, h, s = 18) => new THREE.CylinderGeometry(rt, rb, h, s)
    function mesh(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m
    }
    const bx = (p, m, w, h, d, ...a) => mesh(p, B(w, h, d), m, ...a)
    const cy = (p, m, rt, rb, h, s, ...a) => mesh(p, C(rt, rb, h, s), m, ...a)

    // ── TRUCK GROUP ───────────────────────────────────────────────────────
    const truck = new THREE.Group(); scene.add(truck)

    // TRAILER
    const TR = new THREE.Group(); truck.add(TR); const TZ = -3.5
    bx(TR, M.trailer, 2.04, 2.55, 7.0,   0, 2.275, TZ)
    bx(TR, M.chrome,  2.06, 0.06, 7.08,  0, 3.58,  TZ)
    bx(TR, M.chrome,  0.05, 2.55, 7.08, -1.045, 2.275, TZ)
    bx(TR, M.chrome,  0.05, 2.55, 7.08,  1.045, 2.275, TZ)
    bx(TR, M.refl,    2.08, 0.13, 7.12,  0, 1.05, TZ)
    bx(TR, M.chrome,  2.06, 2.55, 0.07,  0, 2.275, TZ + 3.53)
    bx(TR, M.chrome,  2.08, 0.19, 0.20,  0, 0.84, TZ - 3.56)
    bx(TR, M.chrome,  0.05, 2.16, 0.08, -0.12, 2.275, TZ - 3.54)
    bx(TR, M.chrome,  0.05, 2.16, 0.08,  0.12, 2.275, TZ - 3.54)
    bx(TR, M.chrome,  2.06, 0.05, 0.08,  0, 1.30, TZ - 3.54)
    bx(TR, M.chrome,  2.06, 0.05, 0.08,  0, 3.22, TZ - 3.54)
    for (const [x, y] of [[-0.72, 3.10], [0.72, 3.10], [-0.72, 1.18], [0.72, 1.18]]) bx(TR, M.marker, 0.20, 0.07, 0.05, x, y, TZ - 3.555)
    bx(TR, M.dark, 1.92, 0.18, 6.90, 0, 0.85, TZ)
    bx(TR, M.chrome, 0.92, 0.14, 0.56, 0, 0.84, TZ + 3.30)
    for (let dz = -2.8; dz <= 2.8; dz += 1.4) { bx(TR, M.chrome, 0.03, 2.54, 0.06, -1.044, 2.275, TZ + dz); bx(TR, M.chrome, 0.03, 2.54, 0.06, 1.044, 2.275, TZ + dz) }
    for (const [x, z] of [[-1.05, TZ + 2.8], [1.05, TZ + 2.8], [-1.05, TZ - 2.4], [1.05, TZ - 2.4]]) bx(TR, M.black, 0.07, 0.54, 0.96, x, 0.86, z)

    // CAB
    const CAB = new THREE.Group(); truck.add(CAB)
    bx(CAB, M.chrome, 2.16, 0.38, 0.28,  0,    0.90, 6.47); bx(CAB, M.chrome, 2.16, 0.13, 0.20,  0, 0.71, 6.47)
    bx(CAB, M.chrome, 0.24, 0.38, 0.64, -1.16, 0.90, 6.24); bx(CAB, M.chrome, 0.24, 0.38, 0.64,  1.16, 0.90, 6.24)
    bx(CAB, M.black,  0.54, 0.18, 0.12, -0.58, 0.90, 6.49); bx(CAB, M.black,  0.54, 0.18, 0.12,  0.58, 0.90, 6.49)
    cy(CAB, M.chrome, 0.06, 0.06, 0.22, 8, -0.74, 0.72, 6.40, 0, Math.PI / 2); cy(CAB, M.chrome, 0.06, 0.06, 0.22, 8,  0.74, 0.72, 6.40, 0, Math.PI / 2)
    bx(CAB, M.paint,  0.28, 0.63, 1.74, -1.18, 1.38, 5.76); bx(CAB, M.paint,  0.28, 0.63, 1.74,  1.18, 1.38, 5.76)
    bx(CAB, M.paint,  0.20, 0.20, 1.74, -1.34, 1.06, 5.76); bx(CAB, M.paint,  0.20, 0.20, 1.74,  1.34, 1.06, 5.76)
    bx(CAB, M.chrome, 0.28, 0.04, 1.74, -1.18, 1.71, 5.76); bx(CAB, M.chrome, 0.28, 0.04, 1.74,  1.18, 1.71, 5.76)
    bx(CAB, M.amber,  0.14, 0.07, 0.06, -1.19, 1.55, 5.00); bx(CAB, M.amber,  0.14, 0.07, 0.06,  1.19, 1.55, 5.00)
    bx(CAB, M.paint,  1.88, 0.78, 2.90,  0,    1.64, 4.90, -0.030); bx(CAB, M.paint,  0.14, 0.78, 2.90, -1.05, 1.64, 4.90, -0.030); bx(CAB, M.paint,  0.14, 0.78, 2.90,  1.05, 1.64, 4.90, -0.030)
    bx(CAB, M.paint,  1.88, 0.24, 0.47,  0,    1.18, 6.26); bx(CAB, M.paint,  1.88, 0.08, 0.24,  0, 1.04, 6.45)
    bx(CAB, M.chrome, 1.88, 0.04, 2.90,  0,    2.04, 4.90)
    for (let i = 0; i < 5; i++) { bx(CAB, M.dark, 0.58, 0.06, 0.98, -0.58, 1.78 + i * 0.062, 4.92); bx(CAB, M.dark, 0.58, 0.06, 0.98,  0.58, 1.78 + i * 0.062, 4.92) }
    cy(CAB, M.chrome, 0.19, 0.19, 0.84, 18,  1.01, 2.06, 4.60); cy(CAB, M.dark,   0.17, 0.17, 0.86, 18,  1.01, 2.06, 4.60)
    cy(CAB, M.chrome, 0.22, 0.22, 0.05, 18,  1.01, 2.52, 4.60); cy(CAB, M.chrome, 0.22, 0.22, 0.05, 18,  1.01, 1.62, 4.60)
    cy(CAB, M.chrome, 0.08, 0.08, 0.42, 10, -0.90, 2.00, 5.80)
    bx(CAB, M.chrome, 1.40, 0.62, 0.13,  0,    1.42, 6.50); bx(CAB, M.chrome, 0.08, 0.62, 0.15, -0.66, 1.42, 6.48,  0,  0.09); bx(CAB, M.chrome, 0.08, 0.62, 0.15,  0.66, 1.42, 6.48,  0, -0.09)
    for (let i = 0; i < 13; i++) bx(CAB, M.grille, 1.30, 0.036, 0.15, 0, 1.11 + i * 0.046, 6.52)
    bx(CAB, M.chrome, 0.04, 0.62, 0.17, 0, 1.42, 6.53); bx(CAB, M.chrome, 0.32, 0.17, 0.13, 0, 1.54, 6.52)
    bx(CAB, M.chrome,    0.64, 0.31, 0.13, -0.67, 1.06, 6.50); bx(CAB, M.chrome,    0.64, 0.31, 0.13,  0.67, 1.06, 6.50)
    bx(CAB, M.dark,      0.58, 0.25, 0.11, -0.67, 1.06, 6.51); bx(CAB, M.dark,      0.58, 0.25, 0.11,  0.67, 1.06, 6.51)
    bx(CAB, M.headlight, 0.50, 0.21, 0.10, -0.67, 1.06, 6.53); bx(CAB, M.headlight, 0.50, 0.21, 0.10,  0.67, 1.06, 6.53)
    cy(CAB, M.chrome,   0.11, 0.11, 0.07, 14, -0.67, 0.80, 6.51); cy(CAB, M.chrome,   0.11, 0.11, 0.07, 14,  0.67, 0.80, 6.51)
    cy(CAB, M.foglight, 0.09, 0.09, 0.06, 14, -0.67, 0.80, 6.53); cy(CAB, M.foglight, 0.09, 0.09, 0.06, 14,  0.67, 0.80, 6.53)
    bx(CAB, M.amber, 0.22, 0.14, 0.11, -1.12, 1.02, 6.38); bx(CAB, M.amber, 0.22, 0.14, 0.11,  1.12, 1.02, 6.38)
    bx(CAB, M.paint,    2.10, 2.56, 2.25,  0, 2.37, 2.27); bx(CAB, M.paintDim, 2.10, 2.56, 0.10,  0, 2.37, 1.15)
    bx(CAB, M.chrome, 0.06, 2.56, 0.13, -1.08, 2.37, 3.38); bx(CAB, M.chrome, 0.06, 2.56, 0.13,  1.08, 2.37, 3.38)
    bx(CAB, M.paintDk, 0.12, 0.05, 2.22, -1.07, 2.00, 2.27); bx(CAB, M.paintDk, 0.12, 0.05, 2.22,  1.07, 2.00, 2.27)
    bx(CAB, M.chrome, 0.12, 0.06, 2.22, -1.07, 1.10, 2.27); bx(CAB, M.chrome, 0.12, 0.06, 2.22,  1.07, 1.10, 2.27)
    bx(CAB, M.paint,    2.10, 2.32, 1.44,  0, 2.26,  0.33); bx(CAB, M.paintDim, 2.10, 2.32, 0.10,  0, 2.26, -0.46)
    bx(CAB, M.glass, 1.80, 1.12, 0.09, 0, 3.02, 3.37, -0.038)
    bx(CAB, M.dark, 1.88, 0.09, 0.13,  0,    3.59, 3.37); bx(CAB, M.dark, 1.88, 0.09, 0.13,  0, 2.45, 3.37)
    bx(CAB, M.dark, 0.09, 1.12, 0.13, -0.96, 3.02, 3.37); bx(CAB, M.dark, 0.09, 1.12, 0.13,  0.96, 3.02, 3.37)
    bx(CAB, M.glass, 0.09, 0.80, 0.95, -1.06, 2.97, 2.31); bx(CAB, M.glass, 0.09, 0.80, 0.95,  1.06, 2.97, 2.31)
    bx(CAB, M.chrome, 0.10, 0.05, 0.95, -1.06, 3.38, 2.31); bx(CAB, M.chrome, 0.10, 0.05, 0.95,  1.06, 3.38, 2.31)
    bx(CAB, M.glass, 0.09, 0.56, 0.52, -1.06, 2.99, 3.04); bx(CAB, M.glass, 0.09, 0.56, 0.52,  1.06, 2.99, 3.04)
    bx(CAB, M.glass, 0.09, 0.56, 0.64, -1.06, 2.75, 0.35); bx(CAB, M.glass, 0.09, 0.56, 0.64,  1.06, 2.75, 0.35)
    bx(CAB, M.paint,  2.10, 0.09, 3.74, 0, 3.64, 1.71); bx(CAB, M.paint,  2.10, 0.65, 0.67, 0, 3.73, 3.33); bx(CAB, M.paint,  2.10, 0.43, 2.42, 0, 3.84, 2.13, -0.042)
    bx(CAB, M.chrome, 2.12, 0.08, 0.47, 0, 3.62, 3.29); bx(CAB, M.dark,   2.10, 0.27, 0.37, 0, 3.47, 3.24, 0.16)
    for (const x of [-0.76, -0.38, 0, 0.38, 0.76]) bx(CAB, M.markerW, 0.12, 0.06, 0.05, x, 3.71, 3.31)
    cy(CAB, M.dark,   0.122, 0.122, 1.72, 18, -0.88, 3.59, 1.53); cy(CAB, M.dark,   0.122, 0.122, 1.72, 18,  0.88, 3.59, 1.53)
    cy(CAB, M.chrome, 0.090, 0.090, 1.78, 18, -0.88, 3.61, 1.53); cy(CAB, M.chrome, 0.090, 0.090, 1.78, 18,  0.88, 3.61, 1.53)
    cy(CAB, M.chrome, 0.152, 0.092, 0.12, 14, -0.88, 4.52, 1.53); cy(CAB, M.chrome, 0.152, 0.092, 0.12, 14,  0.88, 4.52, 1.53)
    for (const y of [2.4, 2.9, 3.4]) { bx(CAB, M.chrome, 0.17, 0.05, 0.30, -0.88, y, 1.53); bx(CAB, M.chrome, 0.17, 0.05, 0.30,  0.88, y, 1.53) }
    bx(CAB, M.chrome, 0.09, 0.08, 0.30, -1.18, 3.14, 3.21); bx(CAB, M.chrome, 0.09, 0.08, 0.30,  1.18, 3.14, 3.21)
    bx(CAB, M.dark,   0.42, 0.30, 0.11, -1.25, 3.04, 3.07); bx(CAB, M.dark,   0.42, 0.30, 0.11,  1.25, 3.04, 3.07)
    bx(CAB, M.glass,  0.34, 0.24, 0.08, -1.25, 3.04, 3.08); bx(CAB, M.glass,  0.34, 0.24, 0.08,  1.25, 3.04, 3.08)
    bx(CAB, M.dark,   0.28, 0.19, 0.09, -1.23, 2.74, 3.06); bx(CAB, M.dark,   0.28, 0.19, 0.09,  1.23, 2.74, 3.06)
    bx(CAB, M.chrome, 0.10, 0.07, 0.09, -1.07, 2.70, 2.46); bx(CAB, M.chrome, 0.10, 0.07, 0.09,  1.07, 2.70, 2.46)
    for (const [y, d] of [[1.62, 1.44], [1.28, 1.46], [0.96, 1.48]]) { bx(CAB, M.chrome, 0.38, 0.07, d, -1.06, y, 2.29); bx(CAB, M.chrome, 0.38, 0.07, d,  1.06, y, 2.29) }
    cy(CAB, M.tank, 0.34, 0.34, 1.62, 24, -1.10, 1.28, 0.47, 0, 0, Math.PI / 2); cy(CAB, M.tank, 0.34, 0.34, 1.62, 24,  1.10, 1.28, 0.47, 0, 0, Math.PI / 2)
    bx(CAB, M.chrome, 0.04, 0.74, 1.64, -1.40, 1.28, 0.47); bx(CAB, M.chrome, 0.04, 0.74, 1.64,  1.40, 1.28, 0.47)
    cy(CAB, M.chrome, 0.076, 0.076, 0.09, 10, -1.10, 1.67, 0.47); cy(CAB, M.chrome, 0.076, 0.076, 0.09, 10,  1.10, 1.67, 0.47)
    cy(CAB, M.chrome, 0.34, 0.34, 0.04, 22, -1.10, 1.28, -0.34); cy(CAB, M.chrome, 0.34, 0.34, 0.04, 22,  1.10, 1.28, -0.34)
    cy(CAB, M.chrome, 0.34, 0.34, 0.04, 22, -1.10, 1.28,  1.26); cy(CAB, M.chrome, 0.34, 0.34, 0.04, 22,  1.10, 1.28,  1.26)
    bx(CAB, M.paint, 0.08, 1.24, 0.94, -1.06, 2.71, 0.67); bx(CAB, M.paint, 0.08, 1.24, 0.94,  1.06, 2.71, 0.67)
    bx(CAB, M.black, 0.08, 0.53, 0.97, -1.07, 0.96, 0.13); bx(CAB, M.black, 0.08, 0.53, 0.97,  1.07, 0.96, 0.13)
    bx(truck, M.chrome, 0.94, 0.12, 0.63, 0, 0.90, 0.77)

    // WHEELS
    function makeWheel(x, y, z, dual = false) {
      const sign = x < 0 ? -1 : 1
      function buildTire(offX) {
        const g = new THREE.Group(); g.position.set(x + offX, y, z); truck.add(g)
        const tire = new THREE.Mesh(C(0.47, 0.47, 0.29, 32), M.rubber); tire.rotation.z = Math.PI / 2; tire.castShadow = true; tire.receiveShadow = true; g.add(tire)
        const sw = new THREE.Mesh(C(0.48, 0.48, 0.04, 28), M.black);   sw.rotation.z = Math.PI / 2; sw.position.x = sign * 0.148; g.add(sw)
        const rim = new THREE.Mesh(C(0.31, 0.31, 0.27, 26), M.rim);    rim.rotation.z = Math.PI / 2; rim.castShadow = true; g.add(rim)
        const hub = new THREE.Mesh(C(0.28, 0.28, 0.05, 26), M.rim);    hub.rotation.z = Math.PI / 2; hub.position.x = sign * 0.135; g.add(hub)
        const hc  = new THREE.Mesh(C(0.095, 0.095, 0.10, 14), M.chrome); hc.rotation.z = Math.PI / 2; hc.position.x = sign * 0.135; g.add(hc)
        for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const ln = new THREE.Mesh(C(0.022, 0.022, 0.07, 6), M.chrome); ln.rotation.z = Math.PI / 2; ln.position.set(sign * 0.135, Math.sin(a) * 0.204, Math.cos(a) * 0.204); g.add(ln) }
        const vs = new THREE.Mesh(C(0.012, 0.012, 0.07, 6), M.chrome); vs.rotation.z = Math.PI / 2; vs.position.set(sign * 0.152, 0.36, 0.08); g.add(vs)
      }
      if (dual) { buildTire(-0.185); buildTire(0.185) } else buildTire(0)
    }
    const WY = 0.47
    makeWheel(-1.22, WY,  5.94, false); makeWheel( 1.22, WY,  5.94, false)
    makeWheel(-1.22, WY,  0.72, true);  makeWheel( 1.22, WY,  0.72, true)
    makeWheel(-1.22, WY, -0.35, true);  makeWheel( 1.22, WY, -0.35, true)
    makeWheel(-1.22, WY, -5.52, true);  makeWheel( 1.22, WY, -5.52, true)
    makeWheel(-1.22, WY, -6.64, true);  makeWheel( 1.22, WY, -6.64, true)
    for (const z of [5.94, 0.72, -0.35, -5.52, -6.64]) bx(truck, M.chrome, 2.60, 0.14, 0.14, 0, WY, z)

    // ── Resize ────────────────────────────────────────────────────────────
    function onResize() {
      const w = window.innerWidth, h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    onResize()
    window.addEventListener('resize', onResize)

    // ── Scroll progress ───────────────────────────────────────────────────
    function getProgress() {
      const rect = section.getBoundingClientRect()
      const scrollable = section.offsetHeight - window.innerHeight
      return Math.max(0, Math.min(1, -rect.top / scrollable))
    }

    function applyProgress(p) {
      scrollProg.current = p

      // Hero overlay: visible 0→0.12, fades 0.12→0.22, hidden after
      const heroOp = p < 0.12 ? 1 : p > 0.22 ? 0 : 1 - (p - 0.12) / 0.10
      if (heroOverlayRef.current) {
        heroOverlayRef.current.style.opacity = heroOp
        heroOverlayRef.current.style.transform = `translateY(${(1 - heroOp) * -20}px)`
        heroOverlayRef.current.style.pointerEvents = heroOp > 0.05 ? 'auto' : 'none'
      }
      if (scrollHintRef.current) scrollHintRef.current.style.opacity = heroOp

      // Step panel: appears when hero fades
      const stepsOp = p < 0.15 ? 0 : p > 0.22 ? 1 : (p - 0.15) / 0.07
      if (textPanelRef.current) textPanelRef.current.style.opacity = stepsOp

      // Progress bar
      if (progressFillRef.current) progressFillRef.current.style.height = (p * 100) + '%'

      // Which step is active
      const stepIdx = p < 0.18 ? 0
        : p < 0.45 ? 0
        : p < 0.72 ? 1
        : 2

      // Step texts
      stepRefs.current.forEach((el, i) => {
        if (!el) return
        const op = stepOpacity(i, p)
        const y  = stepY(i, p)
        el.style.opacity   = op
        el.style.transform = `translateY(${y}px)`
      })

      // Dots
      dotRefs.current.forEach((el, i) => {
        if (!el) return
        el.classList.toggle('active', i === stepIdx && p >= 0.18)
      })
    }

    function onScroll() { applyProgress(getProgress()) }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── Render loop ───────────────────────────────────────────────────────
    const clock = new THREE.Clock()
    let animId

    ;(function tick() {
      animId = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      const p = scrollProg.current
      // Truck rotation: smoothly follows scroll target
      const rotTarget = p < 0.18 ? 0 : ((p - 0.18) / 0.82) * Math.PI * 2
      truck.rotation.y += (rotTarget - truck.rotation.y) * 0.06
      truck.position.y = Math.sin(t * 0.55) * 0.038
      hlL.intensity = hlR.intensity = 5.5 + Math.sin(t * 1.4) * 1.8
      renderer.render(scene, camera)
    })()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      renderer.dispose()
    }
  }, [])

  return (
    <section ref={sectionRef} className="hero-truck-section" id="accueil">
      <div className="truck-sticky">
        <canvas ref={canvasRef} className="hero-truck-canvas" />

        {/* Phase 1 — hero intro, fades on scroll */}
        <motion.div
          ref={heroOverlayRef}
          className="hero-intro-overlay"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="hero-tag" variants={item}>Transport Industriel</motion.div>
          <motion.h1 className="hero-truck-h1" variants={item}>
            Votre fret,<br /><em>livré vite.</em>
          </motion.h1>
          <motion.p className="hero-truck-p" variants={item}>
            Colis, palettes, pièces industrielles hors gabarit — FretNow organise votre transport
            de A à Z avec des délais maîtrisés et une traçabilité totale.
          </motion.p>
          <motion.div className="hero-ctas" variants={item}>
            <motion.a href="#commande" className="btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>Demander un devis</motion.a>
            <motion.a href="#fonctionnement" className="btn-ghost"  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>Comment ça marche</motion.a>
          </motion.div>
          <motion.div className="hero-stats hero-truck-stats" variants={item}>
            {[{ num: '24H', label: 'Délai express' }, { num: '847', label: 'Transporteurs' }, { num: 'FR+EU', label: 'Couverture' }].map((s, i) => (
              <div key={i} className="stat"><div className="stat-num">{s.num}</div><div className="stat-label">{s.label}</div></div>
            ))}
          </motion.div>
        </motion.div>

        {/* Phase 2 — step text panels */}
        <div ref={textPanelRef} className="truck-text-panel" style={{ opacity: 0 }}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              ref={el => { stepRefs.current[i] = el }}
              className="truck-text-item"
              style={{ opacity: i === 0 ? 0 : 0, transform: 'translateY(36px)' }}
            >
              <div className="section-tag">{s.tag}</div>
              <h2 className="truck-h2" dangerouslySetInnerHTML={{ __html: s.title }} />
              <p className="truck-p">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Progress indicator */}
        <div className="truck-progress-wrap">
          <div className="truck-scroll-hint">SCROLL</div>
          <div className="truck-progress-track">
            <div ref={progressFillRef} className="truck-progress-fill" />
          </div>
          <div className="truck-step-dots">
            {STEPS.map((_, i) => (
              <span key={i} ref={el => { dotRefs.current[i] = el }} className="truck-step-dot" />
            ))}
          </div>
        </div>

        {/* Initial scroll arrow */}
        <motion.div
          ref={scrollHintRef}
          className="hero-scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
        >
          <motion.span animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>↓</motion.span>
          <span>SCROLL</span>
        </motion.div>
      </div>
    </section>
  )
}
