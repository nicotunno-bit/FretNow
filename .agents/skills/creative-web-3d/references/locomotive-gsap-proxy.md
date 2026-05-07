# Locomotive Scroll + GSAP ScrollTrigger — Setup complet

## Pourquoi un proxy ?

Locomotive Scroll remplace le scroll natif du navigateur par sa propre valeur lissée.
ScrollTrigger écoute le scroll natif par défaut → ils ne se voient pas sans pont.
Le `scrollerProxy` est ce pont.

## Install

```bash
npm install locomotive-scroll gsap
# GSAP plugins (ScrollTrigger, SplitText) sont gratuits depuis avril 2025
```

## Code complet

```js
import LocomotiveScroll from 'locomotive-scroll'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// 1. Init Locomotive
const locoScroll = new LocomotiveScroll({
  el: document.querySelector('#scroll-container'),
  smooth: true,
  multiplier: 1,    // vitesse
  lerp: 0.07,       // inertie (0.05 = Porsche.com, 0.1 = standard)
})

// 2. Le proxy — clé de tout
ScrollTrigger.scrollerProxy('#scroll-container', {
  scrollTop(value) {
    return arguments.length
      ? locoScroll.scrollTo(value, { duration: 0, disableLerp: true })
      : locoScroll.scroll.instance.scroll.y
  },
  getBoundingClientRect() {
    return {
      top: 0, left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    }
  },
  pinType: document.querySelector('#scroll-container').style.transform
    ? 'transform'
    : 'fixed',
})

// 3. Synchronisation croisée (obligatoire)
locoScroll.on('scroll', ScrollTrigger.update)
ScrollTrigger.addEventListener('refresh', () => locoScroll.update())
ScrollTrigger.refresh()
```

## Valeurs lerp recommandées

| Effet | lerp | Rendu |
|---|---|---|
| Ultra-fluide luxueux | 0.04–0.05 | Porsche, Ferrari |
| Premium standard | 0.07–0.08 | Agences top |
| Réactif | 0.10–0.12 | SaaS, apps |
| Quasi-natif | 0.15+ | Utiliser Lenis plutôt |

## Alternative légère : Lenis

Pour les projets sans Locomotive (plus simple à configurer) :

```js
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const lenis = new Lenis({ lerp: 0.1 })

lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
// Pas de proxy nécessaire avec Lenis — beaucoup plus simple
```
