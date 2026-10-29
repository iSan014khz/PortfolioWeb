import { useLayoutEffect, useMemo, useRef } from 'react'
import { useReducedMotion, type MotionValue } from 'motion/react'
import ixtli from './assets/ixtli.svg?raw'
import bohorquez from './assets/bohorquez.svg?raw'
import data from './assets/ixtli-data.svg?raw'
import './stories.css'

const art = { ixtli, bohorquez, 'ixtli-data': data }
export type IsometricId = keyof typeof art
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}
type Kind = 'good' | 'alert'
type News = { id: number; business: number; kind: Kind; start: number }
function newsAt(time: number): News | null {
  if (time < 1.1) return null
  if (time < 4) return { id: 0, business: 0, kind: 'good', start: 1.1 }
  if (time < 7) return { id: 1, business: 1, kind: 'alert', start: 4 }
  if (time < 10.5) return { id: 2, business: 2, kind: 'good', start: 7 }
  const step = Math.floor((time - 10.5) / 3.5)
  return { id: step + 3, business: step % 3, kind: step % 2 ? 'good' : 'alert', start: 10.5 + step * 3.5 }
}

export default function IsometricStory({ projectId, progress }: { projectId: IsometricId; progress: MotionValue<number>; onReplay?: () => void }) {
  const drawingRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion() ?? false
  // Stable markup prevents context renders from replacing the SVG nodes used by the playhead.
  const markup = useMemo(() => ({ __html: art[projectId] }), [projectId])

  useLayoutEffect(() => {
    const drawing = drawingRef.current
    const svg = drawing?.querySelector<SVGSVGElement>('svg')
    if (!drawing || !svg) return
    const desktopHeight = Number(svg.dataset.desktopHeight ?? 610)
    const media = window.matchMedia('(max-width: 639px)')
    const find = <T extends Element,>(selector: string) => Array.from(svg.querySelectorAll<T>(selector))
    const indexed = <T extends Element,>(selector: string, attribute: string) => find<T>(selector).sort((a, b) => Number(a.getAttribute(attribute)) - Number(b.getAttribute(attribute)))
    const actors = find<SVGGElement>('[data-actor]')
    const businesses = find<SVGGElement>('[data-business]')
    const rows = indexed<SVGGElement>('[data-phone-row]', 'data-phone-row')
    const accents = indexed<SVGGElement>('[data-phone-accent]', 'data-phone-accent')
    const notices = find<SVGGElement>('[data-notice]')
    const routes = find<SVGPathElement>('[data-route]')
    const good = indexed<SVGGElement>('[data-ui-good]', 'data-ui-good')
    const alerts = indexed<SVGGElement>('[data-ui-alert]', 'data-ui-alert')
    const parts = find<SVGGElement>('[data-motion]').map(element => ({
      element, phase: (element.dataset.phase ?? '0,1').split(',').map(Number),
      shift: (element.dataset.shift ?? '0,0').split(',').map(Number), reveal: element.hasAttribute('data-reveal'),
    }))
    const artLayer = svg.querySelector<SVGGElement>('[data-art]')
    const candidates = indexed<SVGGElement>('[data-candidate]', 'data-candidate')
    const candidateObjects = indexed<SVGGElement>('[data-candidate-object]', 'data-candidate-object')
    const verdicts = indexed<SVGGElement>('[data-verdict]', 'data-verdict')
    const lens = svg.querySelector<SVGGElement>('[data-analysis-lens]')
    const client = svg.querySelector<SVGGElement>('[data-client-outcome]')
    const selectedActor = svg.querySelector<SVGGElement>('[data-candidate="1"]')
    const selectedParts = find<SVGGElement>('[data-selected-product]')
    const selectedAnchor = (selectedActor?.dataset.productAnchor ?? '0,0').split(',').map(Number)
    const selectedHeight = Number(selectedActor?.dataset.productHeight ?? 1)
    const pack = svg.querySelector<SVGGElement>('[data-pack-unit]')
    const productParts = find<SVGGElement>('[data-pack-product]')
    const productLift = (pack?.dataset.packLift ?? '0,-80').split(',').map(Number)
    const packAnchor = (pack?.dataset.packAnchor ?? '0,0').split(',').map(Number)
    const packBase = (pack?.dataset.packBase ?? '0,0').split(',').map(Number)
    const packLoadEnd = (pack?.dataset.loadEnd ?? '0,0,1').split(',').map(Number)
    const packedHeight = Number(pack?.dataset.productHeight ?? 1)
    const flaps = find<SVGGElement>('[data-pack-flap]').map(element => ({
      element, index: Number(element.dataset.packFlap),
      matrix: element.dataset.flapMatrix!.split(',').map(Number), up: element.dataset.flapUp!.split(',').map(Number),
    }))
    const seal = svg.querySelector<SVGPathElement>('[data-pack-seal] path')
    const stock = find<SVGGElement>('[data-stock-carton]').map(element => ({
      element, index: Number(element.dataset.stockCarton),
      start: element.dataset.loadStart!.split(',').map(Number), end: element.dataset.loadEnd!.split(',').map(Number),
    }))
    const truck = svg.querySelector<SVGGElement>('[data-truck]')
    const truckBase = (truck?.dataset.truckBase ?? '0,0').split(',').map(Number)
    const truckAxis = (truck?.dataset.truckAxis ?? '1,0').split(',').map(Number)
    const truckSlope = truckAxis[1] / truckAxis[0]
    const truckScreen = svg.querySelector<SVGRectElement>('[data-truck-screen]')
    let exitDistance = 600
    const truckBody = find<SVGGElement>('[data-truck-body]')
    const cargo = find<SVGGElement>('[data-loaded-carton]')
    const cartonCount = Math.max(1, ...cargo.map(part => Number(part.dataset.loadedCarton) + 1))
    // Keep the existing loading window and departure cue as the shipment grows.
    const loadOffset = (index: number) => index / Math.max(1, cartonCount - 1) * 1.8
    const wheels = find<SVGGElement>('[data-truck-wheel]').map(element => {
      const matrix = new DOMMatrix(element.dataset.wheelBasis!.split(',').map(Number))
      return { element, matrix, inverse: matrix.inverse() }
    })
    const bars = find<SVGGElement>('[data-market-bar]').map(element => {
      const values = element.dataset.barBasis!.slice(7, -1).trim().split(/[\s,]+/).map(Number)
      const matrix = new DOMMatrix(values)
      return { element, matrix, inverse: matrix.inverse(), order: element.dataset.marketBar!.split(',').map(Number) }
    })
    if (seal) { seal.setAttribute('pathLength', '1'); seal.style.strokeDasharray = '1' }
    let lengths: number[] = []
    const base = (element: SVGGElement) => element.dataset.layoutBase ?? ''
    const status = (index: number, kind: Kind) => {
      if (good[index]) good[index].style.opacity = kind === 'good' ? '1' : '0'
      if (alerts[index]) alerts[index].style.opacity = kind === 'alert' ? '1' : '0'
      if (rows[index]) rows[index].dataset.status = kind
      if (businesses[index]) businesses[index].dataset.status = kind
    }

    const draw = (time: number) => {
      if (projectId === 'ixtli') {
        businesses.forEach((business, i) => {
          const reveal = reduced ? 1 : smooth(i * 2.6, i * 2.6 + 0.85, time)
          business.style.opacity = String(reveal)
          business.setAttribute('transform', `${base(business)} translate(0 ${(12 * (1 - reveal)).toFixed(2)})`)
          if (routes[i]) routes[i].style.opacity = String(reveal * 0.7)
          if (rows[i]) rows[i].style.opacity = String(reveal)
          if (accents[i]) accents[i].style.opacity = String(reveal)
        })
        good.forEach(element => { element.style.opacity = '0' })
        alerts.forEach(element => { element.style.opacity = '0' })
        rows.forEach(row => { row.removeAttribute('data-status'); row.dataset.received = 'false' })
        const arrivals: Array<{ at: number; kind: Kind }> = [{ at: 3.1, kind: 'good' }, { at: 6, kind: 'alert' }, { at: 9, kind: 'good' }]
        let latest = -1
        arrivals.forEach(({ at, kind }, i) => { if (time >= at) { status(i, kind); latest = i } })
        if (latest >= 0 && rows[latest]) rows[latest].dataset.received = 'true'
        notices.forEach(notice => { notice.style.opacity = '0' })
        if (reduced) { status(0, 'good'); status(1, 'alert'); status(2, 'good'); return }
        const event = newsAt(time)
        if (!event) return
        const t = clamp((time - event.start) / 2)
        if (t < 1 && routes[event.business] && notices[event.business]) {
          const point = routes[event.business].getPointAtLength(lengths[event.business] * smooth(0, 1, t))
          const notice = notices[event.business]
          notice.dataset.kind = event.kind
          notice.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`)
          notice.style.opacity = String(smooth(0, 0.12, t) * (1 - smooth(0.88, 1, t)))
        }

        return
      }
      if (projectId === 'ixtli-data') {
        const t = reduced ? 18 : time
        if (artLayer) artLayer.style.opacity = '1'
        const chosen = smooth(4.8, 6.1, t)
        candidates.forEach((candidate, i) => {
          const arrival = reduced ? 1 : smooth(i * 0.12, 0.8 + i * 0.12, t)
          candidate.style.opacity = String(arrival)
          candidate.setAttribute('transform', `${base(candidate)} translate(0 ${(8 * (1 - arrival)).toFixed(2)})`)
          candidate.dataset.chosen = String(i === 1 && chosen > 0.6)
          if (candidateObjects[i]) candidateObjects[i].style.opacity = String(i === 1 ? 1 : 1 - chosen * 0.68)
          if (verdicts[i]) verdicts[i].style.opacity = String(smooth(i === 0 ? 2.8 : i === 2 ? 4.1 : 5.1, i === 0 ? 3.5 : i === 2 ? 4.8 : 5.8, t))
        })
        if (lens) {
          const first = 1 - smooth(1.3, 3.4, t)
          const across = smooth(1.3, 3.4, t) * (1 - smooth(3.8, 5.3, t))
          const distance = media.matches ? 216 : 208, stagger = media.matches ? 40 : 60
          lens.setAttribute('transform', `${base(lens)} translate(${(-distance * first + distance * across).toFixed(2)} ${(stagger * (first + across)).toFixed(2)})`)
          lens.style.opacity = String(reduced ? 0 : smooth(0.6, 1.2, t) * (1 - smooth(5.5, 6.7, t)))
        }
        bars.forEach(({ element, matrix, inverse, order: [candidate, index] }) => {
          const start = candidate === 0 ? 1.2 : candidate === 2 ? 2.6 : 4.2
          const height = Math.max(0.015, smooth(start + index * 0.1, start + 0.8 + index * 0.1, t))
          element.style.opacity = String(smooth(start, start + 0.35, t))
          element.setAttribute('transform', matrix.scale(1, height).multiply(inverse).toString())
        })
        if (client) {
          const arrival = smooth(5.7, 7.2, t)
          client.style.opacity = String(arrival)
          client.setAttribute('transform', `${base(client)} translate(0 ${(12 * (1 - arrival)).toFixed(2)})`)
        }
        if (pack) {
          const load = smooth(13.3, 14.4, t)
          const x = packBase[0] + (packLoadEnd[0] - packBase[0]) * load
          const y = packBase[1] + (packLoadEnd[1] - packBase[1]) * load - Math.sin(load * Math.PI) * 25
          const scale = 1 + (packLoadEnd[2] - 1) * load
          pack.style.opacity = String(smooth(5.8, 6.5, t) * (1 - smooth(.92, 1, load)))
          pack.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`)
        }
        const flight = smooth(5.65, 6.55, t)
        const handoff = smooth(0.88, 1, flight)
        const drop = 1 - smooth(6.5, 8.1, t)
        const sourcePlacement = (selectedActor?.dataset.layoutPlacement ?? '0,0,1').split(',').map(Number)
        const destinationPlacement = (client?.dataset.layoutPlacement ?? '0,0,1').split(',').map(Number)
        const [sx, sy, ss] = sourcePlacement, [dx, dy, ds] = destinationPlacement
        const targetX = (dx + ds * (packBase[0] + packAnchor[0] + productLift[0] * drop) - sx) / ss
        const targetY = (dy + ds * (12 * (1 - smooth(5.7, 7.2, t)) + packBase[1] + packAnchor[1] + productLift[1] * drop) - sy) / ss
        const arrivalScale = packedHeight * ds / (selectedHeight * ss)
        const productScale = 1 + (arrivalScale - 1) * flight
        const productX = selectedAnchor[0] + (targetX - selectedAnchor[0]) * flight - selectedAnchor[0] * productScale
        const productY = selectedAnchor[1] + (targetY - selectedAnchor[1]) * flight - Math.sin(flight * Math.PI) * 30 - selectedAnchor[1] * productScale
        selectedParts.forEach(part => {
          part.style.opacity = String(1 - handoff)
          part.setAttribute('transform', `translate(${productX} ${productY}) scale(${productScale})`)
        })
        productParts.forEach(product => {
          product.style.opacity = String(handoff)
          product.setAttribute('transform', `translate(${(productLift[0] * drop).toFixed(2)} ${(productLift[1] * drop).toFixed(2)})`)
        })
        flaps.forEach(({ element, index, matrix: [a, b, c, d, e, f], up }) => {
          const angle = (1 - smooth(8.2 + index * 0.16, 9 + index * 0.16, t)) * 100 * Math.PI / 180
          element.setAttribute('transform', `matrix(${a} ${b} ${c * Math.cos(angle) + up[0] * Math.sin(angle)} ${d * Math.cos(angle) + up[1] * Math.sin(angle)} ${e} ${f})`)
        })
        if (seal) {
          const sealed = smooth(9.5, 10.2, t)
          seal.style.opacity = String(sealed); seal.style.strokeDashoffset = String(1 - sealed)
        }
        const arrive = smooth(11.7, 13.2, t), leave = smooth(19, 22.3, t)
        const travel = -75 * (1 - arrive) + exitDistance * leave
        const suspension = smooth(11.7, 12.1, t) * (1 - smooth(13.2, 13.6, t)) +
          smooth(19, 19.4, t) * (1 - smooth(21.9, 22.3, t))
        const bob = reduced ? 0 : Math.sin(t * 8) * 0.9 * suspension
        if (truck) {
          truck.style.opacity = reduced ? '1' : String(smooth(11.7, 12.1, t))
          // Both approach and departure follow the truck's projected longitudinal axis.
          truck.setAttribute('transform', `translate(${truckBase[0] + travel} ${truckBase[1] + travel * truckSlope})`)
        }
        truckBody.forEach(part => part.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`))
        wheels.forEach(({ element, matrix, inverse }) => {
          element.setAttribute('transform', matrix.rotate(travel * 1.8).multiply(inverse).toString())
        })
        stock.forEach(({ element, index, start, end }) => {
          const offset = loadOffset(index)
          const load = smooth(13.3 + offset, 14.4 + offset, t)
          const reveal = smooth(10.1 + offset, 10.7 + offset, t)
          const blend = (i: number) => start[i] + (end[i] - start[i]) * load
          element.style.opacity = String(reveal * (1 - smooth(0.92, 1, load)))
          element.setAttribute('transform', `translate(${blend(0).toFixed(2)} ${(blend(1) - Math.sin(load * Math.PI) * 25).toFixed(2)}) scale(${blend(2).toFixed(4)})`)
        })
        cargo.forEach(part => {
          const index = Number(part.dataset.loadedCarton)
          const offset = loadOffset(index)
          const load = smooth(13.3 + offset, 14.4 + offset, t)
          part.style.opacity = String(smooth(0.92, 1, load))
          part.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`)
        })
        return
      }
      const t = reduced ? 11 : time
      const p = clamp(t / 10)
      if (artLayer) artLayer.style.opacity = '1'
      for (const { element, phase, shift, reveal } of parts) {
        const progress = smooth(phase[0], phase[1], p)
        element.setAttribute('transform', `translate(${(shift[0] * (1 - progress)).toFixed(3)} ${(shift[1] * (1 - progress)).toFixed(3)})`)
        if (reveal) element.style.opacity = String(progress)
      }
    }

    const duration = projectId === 'ixtli-data' ? 23 : projectId === 'bohorquez' ? 10.5 : 10
    const renderProgress = (value: number) => {
      const position = clamp((value - 0.025) / 0.95)
      drawing.dataset.progress = position.toFixed(4)
      draw(position * duration)
    }
    const layout = () => {
      const compact = media.matches && actors.length > 0
      drawing.dataset.compact = String(compact)
      if (actors.length) {
        const width = compact ? 640 : 1040, height = compact ? Number(svg.dataset.mobileHeight ?? 790) : desktopHeight
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
        svg.setAttribute('width', String(width)); svg.setAttribute('height', String(height))
        for (const actor of actors) {
          const values = (compact ? actor.dataset.mobile : actor.dataset.desktop)?.split(',').map(Number) ?? [0, 0, 1]
          actor.dataset.layoutBase = `translate(${values[0]} ${values[1]}) scale(${values[2] ?? 1})`
          actor.dataset.layoutPlacement = values.join(',')
          actor.setAttribute('transform', base(actor))
        }
        for (const route of routes) route.setAttribute('d', (compact ? route.dataset.mobilePath : route.dataset.desktopPath) ?? '')
      }
      lengths = routes.map(route => route.getTotalLength())
      const screenMatrix = client?.getScreenCTM()
      if (screenMatrix && Math.abs(screenMatrix.a) > 0.0001) {
        const inverse = screenMatrix.inverse()
        const corner = new DOMPoint(0, 0).matrixTransform(inverse)
        const opposite = new DOMPoint(window.innerWidth, window.innerHeight).matrixTransform(inverse)
        exitDistance = Math.max(400, opposite.x - truckBase[0] + 48 / screenMatrix.a)
        if (truckScreen) {
          // Only the actual horizontal screen edges clip the departure; page scroll never crops it vertically.
          truckScreen.setAttribute('x', String(corner.x)); truckScreen.setAttribute('y', '-10000')
          truckScreen.setAttribute('width', String(opposite.x - corner.x)); truckScreen.setAttribute('height', '20000')
        }
      }
      renderProgress(progress.get())
    }
    drawing.dataset.reduced = String(reduced)
    layout()
    const unsubscribe = progress.on('change', renderProgress)
    const resize = new ResizeObserver(layout)
    resize.observe(drawing)
    media.addEventListener('change', layout)
    return () => {
      unsubscribe()
      resize.disconnect()
      media.removeEventListener('change', layout)
    }
  }, [projectId, reduced, progress])

  return (
    <div className="project-isometric-stage">
      <div ref={drawingRef} className="project-isometric" data-active="false" dangerouslySetInnerHTML={markup} />

    </div>
  )
}
