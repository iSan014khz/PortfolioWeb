import { animate } from 'motion/react'

/** Independent gestures on inner artwork, leaving the scroll transforms on its parents. */
export function attachPieceReactions(svg: SVGSVGElement, project: string) {
  type Gesture = (value: number, index: number) => string
  const controls: Array<() => void> = []
  const reactions = new Map<Element, () => void>()
  const material = (scope: Element, selector: string) => Array.from(scope.querySelectorAll<SVGElement>(selector))
    .flatMap(item => Array.from(item.children).filter((child): child is SVGElement => child instanceof SVGElement && child.classList.contains('iso-solid')))
  const solids = (scope: Element, selector: string) => material(scope, selector)
  const register = (hit: Element, parts: SVGElement[], gesture: Gesture, origin = 'center') => {
    if (!parts.length) return
    let value = 0
    let control: ReturnType<typeof animate> | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const originals = parts.map(part => ({ transform: part.style.transform, origin: part.style.transformOrigin, box: part.style.transformBox }))
    // All faces of an object share one pivot, so the object moves as a solid.
    const boxes = parts.map(part => (part as SVGGraphicsElement).getBBox())
    const left = Math.min(...boxes.map(box => box.x)), top = Math.min(...boxes.map(box => box.y))
    const right = Math.max(...boxes.map(box => box.x + box.width)), bottom = Math.max(...boxes.map(box => box.y + box.height))
    const pivotX = origin.includes('left') ? left : (left + right) / 2
    const pivotY = origin.includes('bottom') ? bottom : origin.includes('top') ? top : (top + bottom) / 2
    parts.forEach(part => { part.style.transformBox = 'view-box'; part.style.transformOrigin = `${pivotX}px ${pivotY}px` })
    const paint = (next: number) => { value = next; parts.forEach((part, index) => { part.style.transform = gesture(next, index) }) }
    reactions.set(hit, () => {
      control?.stop()
      clearTimeout(timer)
      control = animate(value, 1, {
        type: 'spring', duration: 0.5, bounce: 0.2,
        onUpdate: paint,
        onComplete: () => { timer = setTimeout(() => {
          control = animate(value, 0, { type: 'spring', duration: 0.5, bounce: 0.2, onUpdate: paint,
            onComplete: () => parts.forEach((part, i) => { part.style.transform = originals[i].transform }),
          })
        }, 180) },
      })
    })
    controls.push(() => {
      control?.stop()
      clearTimeout(timer)
      parts.forEach((part, i) => {
        part.style.transform = originals[i].transform
        part.style.transformOrigin = originals[i].origin
        part.style.transformBox = originals[i].box
      })
    })
  }
  const each = (selector: string, callback: (element: Element) => void) => svg.querySelectorAll(selector).forEach(callback)
  const door = (scope: Element, partsSelector: string, hits: Element[]) => {
    const geometry = scope.querySelector<SVGGElement>('[data-door-hinge]')
    if (!geometry) return
    const [hx, hy] = geometry.dataset.doorHinge!.split(',').map(Number)
    const [ux, uy, zx, zy, nx, ny] = geometry.dataset.doorAxes!.split(',').map(Number)
    const inverse = new DOMMatrix([ux, uy, zx, zy, 0, 0]).inverse()
    const parts = solids(scope, partsSelector)
    if (!parts.length) return
    const leaf = parts[0].querySelector('path.iso-fill')
    const opening = leaf?.cloneNode(true) as SVGPathElement | undefined
    if (opening) {
      opening.removeAttribute('class')
      opening.setAttribute('fill', '#29292d')
      parts[0].parentElement?.insertBefore(opening, parts[0])
    }
    let value = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let control: ReturnType<typeof animate> | undefined
    const originals = parts.map(part => part.getAttribute('transform'))
    const paint = (angle: number) => {
      value = angle
      const radians = angle * Math.PI / 180
      const rotation = new DOMMatrix([ux * Math.cos(radians) + nx * Math.sin(radians), uy * Math.cos(radians) + ny * Math.sin(radians), zx, zy, 0, 0]).multiply(inverse)
      rotation.e = hx - rotation.a * hx - rotation.c * hy
      rotation.f = hy - rotation.b * hx - rotation.d * hy
      parts.forEach(part => part.setAttribute('transform', rotation.toString()))
    }
    const open = () => {
      control?.stop(); clearTimeout(timer)
      control = animate(value, 92, { type: 'spring', duration: 0.5, bounce: 0.2, onUpdate: paint,
        onComplete: () => { timer = setTimeout(() => {
          control = animate(value, 0, { type: 'spring', duration: 0.5, bounce: 0.2, onUpdate: paint })
        }, 650) },
      })
    }
    hits.forEach(hit => reactions.set(hit, open))
    controls.push(() => {
      control?.stop(); clearTimeout(timer); opening?.remove()
      parts.forEach((part, i) => { if (originals[i] === null) part.removeAttribute('transform'); else part.setAttribute('transform', originals[i]!) })
    })
  }
  if (project === 'ixtli') {
    each('[data-business]', business => {
      door(business, '[data-item$=".door"] > g, [data-item$=".door-glass"] > g, [data-item$=".handle"] > g', [business])
    })
    each('[data-actor="phone"]', phone => register(phone, solids(phone, '[data-item^="phone."] > g'), v => `rotate(${v * .45}deg)`, 'center bottom'))
    each('[data-phone-row]', row => register(row, solids(row, ':scope > g'), v => `translateY(${-v * 1.3}px) scale(${1 + v * .008})`))
  } else if (project === 'bohorquez') {
    const house = svg.querySelector('[data-actor="construction-house"]')
    if (house) {
      door(house, '[data-item^="entry.door"] > g, [data-item="entry.handle"] > g, [data-item="entry.lock-plate"] > g', Array.from(house.querySelectorAll('[data-item^="entry.door"], [data-item="entry.handle"], [data-item="entry.lock-plate"]')))
    }
    const scaffoldItems = Array.from(svg.querySelectorAll('[data-item^="site.scaffold-"]'))
    if (scaffoldItems[0]) {
      register(scaffoldItems[0], solids(svg, '[data-item^="site.scaffold-"] > g'), v => `rotate(${v * 1.2}deg)`, 'center bottom')
      const react = reactions.get(scaffoldItems[0])
      if (react) scaffoldItems.forEach(item => reactions.set(item, react))
    }
    each('[data-item="site.tile-stack"], [data-item^="site.paint-bucket-"]', part => register(part, solids(part, ':scope > g'), v => `rotate(${-v * .6}deg)`, 'center bottom'))
    each('[data-item^="roof.panel-"]', part => register(part, solids(part, ':scope > g'), v => `translateY(${-v * .6}px)`))
  } else {
    each('[data-candidate]', candidate => register(candidate, solids(candidate, '[data-item^="product."] > g'), v => `rotate(${v * 2.5}deg)`, 'center bottom'))
    each('[data-analysis-lens]', lens => register(lens, solids(lens, '[data-item^="lens."] > g'), v => `translate(${v * 2}px, ${-v}px)`))
    each('[data-stock-carton], [data-loaded-carton]', carton => register(carton, Array.from(carton.querySelectorAll<SVGElement>('.iso-solid')), (v, i) => `rotate(${v * (i % 2 ? -1.3 : 1.3)}deg) translateY(${-v * 1.2}px)`, 'center bottom'))
    each('[data-pack-flap]', flap => {
      // The flap already has a scroll-driven matrix; its inner paths receive the touch gesture.
      register(flap, Array.from(flap.querySelectorAll<SVGElement>('path')), v => `scaleY(${1 - v * .035})`, 'center top')
    })
    each('[data-truck]', truck => register(truck, solids(truck, '[data-truck-body]:not([data-truck-wheel]) > g'), v => `translateY(${v * 1.2}px)`))
  }
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  const hitAt = (target: EventTarget | null): Element | null => {
    let node = target instanceof Element ? target : null
    while (node && node !== svg) {
      if (reactions.has(node)) return node
      node = node.parentElement
    }
    return null
  }
  const over = (event: PointerEvent) => {
    const hit = hitAt(event.target)
    if (event.pointerType === 'mouse' && fine.matches && hit && hit !== hitAt(event.relatedTarget)) reactions.get(hit)?.()
  }
  let press: { x: number; y: number; id: number; hit: Element | null } | null = null
  const down = (event: PointerEvent) => { if (event.isPrimary) press = { x: event.clientX, y: event.clientY, id: event.pointerId, hit: hitAt(event.target) } }
  const up = (event: PointerEvent) => {
    if (press?.id === event.pointerId && press.hit && press.hit === hitAt(event.target) && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 8) reactions.get(press.hit)?.()
    press = null
  }
  const cancel = () => { press = null }
  svg.addEventListener('pointerover', over)
  svg.addEventListener('pointerdown', down, { passive: true })
  svg.addEventListener('pointerup', up)
  svg.addEventListener('pointercancel', cancel)
  return () => {
    svg.removeEventListener('pointerover', over)
    svg.removeEventListener('pointerdown', down)
    svg.removeEventListener('pointerup', up)
    svg.removeEventListener('pointercancel', cancel)
    controls.forEach(cleanup => cleanup())
  }
}
