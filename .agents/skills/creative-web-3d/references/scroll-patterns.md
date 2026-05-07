# ScrollTrigger — 8 patterns prêts à l'emploi

## 1. Objet 3D lié au scroll (rotation complète)

```js
ScrollTrigger.create({
  trigger: "#model-section",
  scroller: "#scroll-container",  // retirer si pas de Locomotive
  start: "top top",
  end: "bottom bottom",
  pin: true,
  scrub: 1,
  onUpdate: (self) => {
    model.rotation.y = self.progress * Math.PI * 2
    model.position.y = Math.sin(self.progress * Math.PI) * 0.2
  }
})
```

## 2. Timeline multi-étapes (storytelling)

```js
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: "#story",
    start: "top top",
    end: "+=400%",
    pin: true,
    scrub: 1,
  }
})

tl.to(".step-1", { opacity: 0, y: -50, duration: 1 })
  .from(".step-2", { opacity: 0, y: 50, duration: 1 }, "<")
  .to(model.rotation, { y: Math.PI, duration: 2 })
  .from(".step-3", { opacity: 0, scale: 0.8, duration: 1 })
```

## 3. Reveal de texte lettre par lettre

```js
import { SplitText } from 'gsap/SplitText'
gsap.registerPlugin(SplitText)

const split = new SplitText(".headline", { type: "chars,words" })

gsap.from(split.chars, {
  scrollTrigger: {
    trigger: ".headline",
    start: "top 80%",
  },
  opacity: 0,
  y: 40,
  rotateX: -90,
  stagger: 0.02,
  duration: 0.5,
  ease: "power3.out"
})
```

## 4. Parallax multi-couches

```js
// Avec Locomotive : data-scroll data-scroll-speed sur les éléments HTML
// Sans Locomotive :
gsap.to(".bg-layer", {
  scrollTrigger: { trigger: ".hero", scrub: true },
  y: "-30%"
})
gsap.to(".mid-layer", {
  scrollTrigger: { trigger: ".hero", scrub: true },
  y: "-15%"
})
gsap.to(".fg-layer", {
  scrollTrigger: { trigger: ".hero", scrub: true },
  y: "5%"
})
```

## 5. Compteur qui s'anime au scroll

```js
gsap.to(".counter", {
  scrollTrigger: { trigger: ".stats", start: "top 70%" },
  textContent: 1250,
  duration: 2,
  ease: "power1.out",
  snap: { textContent: 1 },
  onUpdate() {
    this.targets()[0].textContent =
      Math.round(this.targets()[0].textContent).toLocaleString('fr-FR')
  }
})
```

## 6. Entrée de cards en cascade

```js
gsap.from(".card", {
  scrollTrigger: {
    trigger: ".cards-grid",
    start: "top 75%",
  },
  opacity: 0,
  y: 60,
  stagger: { amount: 0.6, from: "start" },
  duration: 0.8,
  ease: "power2.out"
})
```

## 7. Barre de progression du scroll

```js
gsap.to(".progress-bar", {
  scaleX: 1,
  ease: "none",
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: 0,
  }
})
// CSS : .progress-bar { transform-origin: left; scaleX: 0; }
```

## 8. Section qui "respire" (scale au scroll)

```js
gsap.from(".feature-block", {
  scrollTrigger: {
    trigger: ".feature-block",
    start: "top bottom",
    end: "top center",
    scrub: 1,
  },
  scale: 0.85,
  opacity: 0.4,
  borderRadius: "40px",
})
```

## Valeurs scrub recommandées

| scrub | Effet | Usage |
|---|---|---|
| `true` | Instantané | Démo, prototype |
| `0.5` | Très réactif | UI dynamiques |
| `1` | Standard premium | Landing pages |
| `2` | Luxueux, cinématique | Sites haut de gamme |
| `3+` | Très lent, narratif | Storytelling, portfolios |
