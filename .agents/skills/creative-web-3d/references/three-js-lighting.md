# Three.js — Éclairage PBR réaliste

## Setup renderer (obligatoire)

```js
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
```

## HDR Environment Map (le plus important)

Sans IBL, un matériau PBR ressemble à du plastique même avec des textures parfaites.

```js
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'

new RGBELoader().load('/hdr/studio_1k.hdr', (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = hdr       // reflets sur tous les objets
  // scene.background = hdr    // fond HDR visible (optionnel)
  scene.environmentIntensity = 1.0
})
```

**Sources HDR CC0 gratuites :**
- polyhaven.com → HDRI → télécharger 1K (suffisant pour le web)
- Recommandés pour véhicules : "industrial_sunset", "automotive_studio", "sky_patio"

## Lumières complémentaires

```js
// Soleil directionnel avec ombres
const sun = new THREE.DirectionalLight(0xfff4e0, 2.5)
sun.position.set(8, 12, 6)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.bias = -0.001   // évite le "shadow acne"
scene.add(sun)

// Remplissage côté ombre
const fill = new THREE.DirectionalLight(0x8ab4f8, 0.8)
fill.position.set(-5, 3, -5)
scene.add(fill)

// Ambiance douce (l'IBL fait déjà 80% du job)
scene.add(new THREE.AmbientLight(0xffffff, 0.3))
```

## Sol réfléchissant (effet showroom)

```js
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.15,
    metalness: 0.9,
    envMapIntensity: 1.5,
  })
)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)
```

## Chargement GLB avec Draco

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)

loader.load('/models/truck.glb', (gltf) => {
  const model = gltf.scene

  // Ombres + correction colorspace
  model.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
      if (child.material.map)
        child.material.map.colorSpace = THREE.SRGBColorSpace
    }
  })

  // Centrage automatique
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  model.position.sub(center)
  model.position.y = 0

  scene.add(model)
})
```

## Valeurs de référence par matériau

| Matériau | roughness | metalness |
|---|---|---|
| Carrosserie laquée | 0.1–0.2 | 0.9–1.0 |
| Caoutchouc (pneus) | 0.9 | 0.0 |
| Chrome | 0.05 | 1.0 |
| Verre | 0.0 | 0.0 + transparent |
| Plastique mat | 0.7–0.8 | 0.0 |
| Béton | 0.8–0.9 | 0.0 |
