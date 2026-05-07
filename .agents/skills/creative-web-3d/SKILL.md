---
name: creative-web-3d
description: Build immersive, scroll-driven websites with 3D animations, WebGL, and cinematic effects — the kind agencies charge 50k€ for. Use this skill whenever the user asks for scroll animations, parallax effects, scroll-driven storytelling, 3D model viewers, GSAP animations, Three.js scenes, Locomotive Scroll, or any kind of "wow effect" website. Also trigger for requests like "effet de scroll comme Apple", "site qui fait tourner un objet 3D", "animation au scroll", "site immersif", "site comme Awwwards", "WebGL", "effet cinématique". If the user wants a website that moves, this skill applies.
---

# Creative Web 3D — Immersive Scroll Experiences

Build scroll-driven, cinematic websites with real 3D, real animations, and real "wow" factor. Think Apple product pages, Stripe animations, agency portfolio sites.

## Stack de référence

**Toujours disponible (CDN, pas d'install) :**
- `gsap` + `ScrollTrigger` — animations au scroll, pinning de sections, scrub
- `three` + `GLTFLoader` + `RGBELoader` — rendu 3D avec éclairage PBR réaliste
- `locomotive-scroll` — smooth scroll inertiel premium

**Selon le projet :**
- `barba.js` — transitions entre pages (morphing, fade, slide)
- `lenis` — alternative légère à Locomotive pour les projets simples
- `anime.js` — animations SVG/DOM complexes

---

## Avant de coder — 3 décisions obligatoires

### 1. Quel effet scroll ?

| Effet | Tech | Cas d'usage |
|---|---|---|
| Objet 3D qui tourne | Three.js + ScrollTrigger | Produit, véhicule, machine |
| Sections sticky avec reveal | ScrollTrigger pin | Storytelling, fonctionnalités |
| Parallax multi-couches | Locomotive + GSAP | Portfolio, hero section |
| Morphing de texte/forme | GSAP SplitText | Accueil, transition |
| Progression narrative | ScrollTrigger timeline | Case study, landing page |

### 2. Locomotive ou pas ?

- **Avec Locomotive** : smooth scroll inertiel, effet premium, MAIS nécessite le proxy ScrollTrigger (voir `references/locomotive-gsap-proxy.md`)
- **Sans Locomotive (Lenis)** : plus simple à configurer, suffisant pour 80% des projets
- **Sans aucun** : ScrollTrigger seul, pour les projets légers ou accessibilité prioritaire

### 3. 3D ou CSS pur ?

- **Three.js** : objet GLTF réaliste, matériaux PBR, ombres → charge 250kb min
- **CSS 3D + perspective** : cubes, cartes, rotations simples → 0kb, accessible
- **Canvas 2D** : particules, trails, effets fluides → compromis léger

---

## Pipeline Three.js réaliste (le bon setup)

```js
// Les 5 réglages qui font la différence
renderer.toneMapping = THREE.ACESFilmicToneMapping  // rendu cinématique
renderer.toneMappingExposure = 1.2
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// HDR environment map — OBLIGATOIRE pour les reflets métal/verre
// Source gratuite CC0 : polyhaven.com (télécharger 1K suffit)
new RGBELoader().load('/hdr/studio.hdr', (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = hdr
})

// Centrage automatique du modèle (GLB souvent décalés)
const box = new THREE.Box3().setFromObject(model)
const center = box.getCenter(new THREE.Vector3())
model.position.sub(center)

// Activer les ombres sur chaque mesh
model.traverse(child => {
  if (child.isMesh) {
    child.castShadow = true
    child.receiveShadow = true
    if (child.material.map)
      child.material.map.colorSpace = THREE.SRGBColorSpace
  }
})
```

Pour le détail complet du setup Locomotive + ScrollTrigger proxy : voir `references/locomotive-gsap-proxy.md`

---

## Patterns ScrollTrigger essentiels

### Objet 3D lié au scroll
```js
ScrollTrigger.create({
  trigger: "#section",
  start: "top top",
  end: "bottom bottom",
  pin: true,
  scrub: 1,           // 1 = délai 1s, true = instantané
  onUpdate: (self) => {
    model.rotation.y = self.progress * Math.PI * 2
    // Bonus : élévation pendant la rotation
    model.position.y = Math.sin(self.progress * Math.PI) * 0.2
  }
})
```

### Timeline multi-étapes
```js
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: "#section",
    start: "top top",
    end: "+=300%",
    pin: true,
    scrub: 1,
  }
})
tl.to(".title", { y: -100, opacity: 0 })
  .from(".features", { y: 50, opacity: 0, stagger: 0.1 })
  .to(".model", { rotateY: 180 })
```

### Reveal de texte au scroll
```js
// SplitText (GSAP plugin gratuit depuis 2025)
const split = new SplitText(".headline", { type: "chars,words" })
gsap.from(split.chars, {
  scrollTrigger: { trigger: ".headline", start: "top 80%" },
  opacity: 0, y: 30, stagger: 0.02, duration: 0.6, ease: "power2.out"
})
```

---

## Sources modèles 3D gratuits

| Source | Licence | Format natif | Qualité |
|---|---|---|---|
| **sketchfab.com** (filtre Downloadable) | CC Attribution | GLB ✅ | ⭐⭐⭐⭐ |
| **polyhaven.com** | CC0 — aucune attribution | GLB ✅ | ⭐⭐⭐⭐⭐ |
| **meshy.ai** | CC0 — aucune attribution | GLB ✅ | ⭐⭐⭐ |
| **cgtrader.com** (filtre Free) | Royalty Free | Souvent FBX → convertir |⭐⭐⭐⭐ |

**Conversion FBX → GLB :** Blender › File › Export › glTF 2.0 (cocher "Include Textures" + "Draco compression")

**Optimisation GLB :** `npx gltf-pipeline -i model.glb -o model-opt.glb --draco.compressionLevel 7`

---

## Structure HTML de base

```html
<!-- Toujours : data-scroll-container sur le wrapper principal -->
<div id="scroll-container" data-scroll-container>

  <section data-scroll-section class="hero">
    <canvas id="canvas"></canvas>
    <div class="hero-text" data-scroll data-scroll-speed="2">
      <h1>Titre</h1>
    </div>
  </section>

  <!-- Section sticky pour la rotation 3D : hauteur = durée de l'animation -->
  <section id="model-section" data-scroll-section style="height: 400vh">
    <!-- Le canvas est positionné fixed pendant le pin -->
  </section>

  <section data-scroll-section class="content">
    <!-- Suite du site -->
  </section>

</div>
```

**Règle de hauteur :** `200vh` = rotation rapide (effet dynamique), `400vh` = rotation lente et cinématique, `600vh` = très lent, narratif.

---

## Performance & accessibilité

```js
// Toujours limiter le pixelRatio
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Respecter prefers-reduced-motion
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (!prefersReduced) {
  // Initialiser Locomotive, GSAP ScrollTrigger, animations
} else {
  // Version statique sans animations
}

// Nettoyer au unmount (React/Vue)
return () => {
  locoScroll.destroy()
  ScrollTrigger.getAll().forEach(t => t.kill())
  renderer.dispose()
}
```

---

## Checklist avant livraison

- [ ] `pixelRatio` limité à 2
- [ ] `prefers-reduced-motion` géré
- [ ] HDR environment map chargée (reflets réalistes)
- [ ] Modèle centré via `Box3`
- [ ] `scrub` réglé (1 = standard, 2 = luxueux)
- [ ] Section sticky assez haute (`min 200vh`)
- [ ] Test mobile (resize handler sur le renderer)
- [ ] Licence du modèle 3D vérifiée (CC Attribution = crédit en footer)

---

## Références détaillées

- `references/locomotive-gsap-proxy.md` — setup complet du proxy et synchronisation
- `references/three-js-lighting.md` — éclairage PBR, HDR, ombres douces
- `references/scroll-patterns.md` — 8 patterns ScrollTrigger prêts à l'emploi
