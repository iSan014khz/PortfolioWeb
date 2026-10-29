import {
  Scene, k, G, a, front, plane, local, ink, planeLine, circleOn,
  rect, getProjection, setProjection, renderScene,
} from './project-isometric-shapes.mjs'
import { productBottle } from './project-isometric-details.mjs'

const fit = (bounds, w, h, camera = {}) => setProjection(k.fitProjection(bounds, w, h, { pad: 16, azimuth: 65, elevation: 30, ...camera }))
const animate = (start, end, height = 16) => ({ part: 'construction', phase: [start / 10, end / 10], offset: [0, 0, height], reveal: true })

export function constructionHouse() {
  fit(k.boxCorners(rect(-145, -95, 290, 195), -5, 137), 890, 550, { azimuth: 54, elevation: 31 })
  const s = new Scene('construction-house', '')
  s.slab('site.ground', rect(-140, -90, 280, 185, 3), -4, 4, 'graphite')
  // A small materials and finishing area flanks the house throughout its construction.
  const supplies = animate(.25, 1.2, 5)
  for (const x of [-132, -117]) s.slab(`site.pallet-foot-${x}`, rect(x, 22, 4, 34), 0, 3, 'graphite', supplies)
  for (let i = 0; i < 5; i++) s.slab(`site.pallet-board-${i}`, rect(-135, 22 + i * 7, 25, 5), 3, 1.5, 'porcelain', supplies)
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    s.slab(`site.brick-${row}-${col}`, rect(-133, 24 + col * 10, 21, 9, .3), 4.5 + row * 5, 4.7, 'stone', animate(.5 + row * .15, 1.4 + row * .15, 4))
  }
  const scaffold = animate(2, 3, 5)
  for (const x of [101, 126]) for (const y of [-48, 12]) {
    s.cyl(`site.scaffold-post-${x}-${y}`, x, y, 1, 0, 78, 'porcelain', scaffold)
    s.slab(`site.scaffold-foot-${x}-${y}`, rect(x - 3, y - 3, 6, 6), 0, 1, 'graphite', scaffold)
  }
  for (const z of [28, 58]) {
    s.slab(`site.scaffold-deck-${z}`, rect(99, -50, 29, 64), z, 2, 'graphite', scaffold)
    s.mark(`site.scaffold-brace-${z}`, ink(k.segment([126, -48, z - 25], [126, 12, z], getProjection()), 'mid'), [126, -18, z], 'ink', scaffold)
  }
  const finish = animate(6.1, 7, 4)
  for (const [i, x] of [100, 121].entries()) {
    s.cyl(`site.paint-bucket-${i}`, x, 64, 7, 0, 13, 'porcelain', finish)
    s.cyl(`site.paint-lid-${i}`, x, 64, 7.5, 13, 1, 'graphite', finish)
    s.cyl(`site.paint-grip-${i}`, x, 64, 2, 14, 1, 'porcelain', finish)
  }
  s.slab('site.tile-stack', rect(-126, 69, 27, 20, .4), 0, 7, 'porcelain', finish)
  for (const z of [2, 4, 6]) s.mark(`site.tile-edge-${z}`, ink(k.segment([-126, 89, z], [-99, 89, z], getProjection()), 'faint'), [-112, 89, z], 'ink', finish)
  s.mark('site.plan', ink(k.planOutline(rect(-78, -53, 156, 106), 0.1, getProjection()), 'mid'), [0, 0, 0.1])
  // Nothing above ground exists at the beginning. Foundations and each masonry course have their own cue.
  for (const [i, plan] of [rect(-78, -53, 156, 7), rect(-78, 46, 156, 7), rect(-78, -46, 7, 92), rect(71, -46, 7, 92)].entries()) {
    s.slab(`foundation.strip-${i}`, plan, 0, 6, 'porcelain', animate(0.35 + i * 0.13, 1.05 + i * 0.13, 10))
  }
  s.slab('floor.slab', rect(-75, -50, 150, 100, 0.5), 6, 2, 'graphite', animate(1, 1.7, 12))
  // Real furnishings inside the existing floor plan; the facade and roof keep their cues.
  const living = animate(2.1, 3.1, 4)
  s.slab('interior.rug', rect(-67, 8, 60, 35, 1.6), 8.05, .3, 'felt', living)
  for (const [i, [x, y]] of [[-62, 15], [-27, 15], [-62, 31], [-27, 31]].entries()) {
    s.slab(`interior.sofa-foot-${i}`, rect(x, y, 2, 2, .3), 8.35, 4, 'graphite', living)
  }
  s.slab('interior.sofa-base', rect(-65, 12, 43, 24, 2), 12.35, 5, 'graphite', living)
  s.slab('interior.sofa-back', rect(-65, 12, 43, 5, 1.2), 17.35, 18, 'porcelain', living)
  for (const x of [-65, -26]) s.slab(`interior.sofa-arm-${x}`, rect(x, 17, 4, 19, 1.2), 17.35, 9, 'porcelain', living)
  for (let i = 0; i < 2; i++) {
    s.slab(`interior.sofa-cushion-${i}`, rect(-60 + i * 17, 18, 16, 16, 1.5), 17.35, 4, 'porcelain', living)
    s.slab(`interior.sofa-pillow-${i}`, rect(-58 + i * 18, 17, 12, 4, 1), 21.35, 10, 'felt', living)
  }
  const table = animate(2.65, 3.45, 4)
  for (const x of [-52, -35]) s.slab(`interior.table-leg-${x}`, rect(x, 38, 2, 6, .4), 8.4, 9, 'graphite', table)
  s.slab('interior.coffee-table', rect(-55, 36, 25, 10, 1.5), 17.4, 1.4, 'porcelain', table)
  s.slab('interior.table-book', rect(-49, 38, 10, 5, .4), 18.8, 1, 'graphite', table)
  s.cyl('interior.table-vase', -33, 40, 1.8, 18.8, 4, 'porcelain', table)
  const reading = animate(3.05, 3.9, 4)
  s.slab('interior.armchair-base', rect(23, 13, 21, 22, 1.8), 12, 5, 'graphite', reading)
  s.slab('interior.armchair-back', rect(23, 13, 21, 4, 1), 17, 17, 'porcelain', reading)
  s.slab('interior.armchair-seat', rect(27, 18, 13, 15, 1.2), 17, 4, 'felt', reading)
  for (const x of [23, 40]) s.slab(`interior.armchair-arm-${x}`, rect(x, 17, 4, 18, 1), 17, 9, 'porcelain', reading)
  s.cyl('interior.floor-lamp-base', 51, 23, 5, 8.3, 1.2, 'graphite', reading)
  s.cyl('interior.floor-lamp-stem', 51, 23, .7, 9.5, 29, 'porcelain', reading)
  s.cyl('interior.floor-lamp-shade', 51, 23, 7, 37, 6, 'porcelain', reading)
  s.cyl('interior.floor-lamp-diffuser', 51, 23, 5.7, 36.7, .3, 'felt', reading)
  const decor = animate(3.4, 4.3, 3)
  for (const [i, x] of [-52, -22].entries()) {
    s.face(`interior.picture-frame-${i}`, front(-44), rect(x, 43, 22, 22, .5), -.5, .8, 'graphite', decor)
    s.face(`interior.picture-print-${i}`, front(-44), rect(x + 2, 45, 18, 18), -1.4, .4, 'porcelain', {
      ...decor, inner: circleOn(front(-44), x + 8, 57, 3, -1.9, 'lo') + planeLine(front(-44), [[x + 3, 47], [x + 9, 53], [x + 14, 49], [x + 19, 54]], -1.9, 'faint'),
    })
  }
  s.slab('interior.sideboard', rect(14, -40, 46, 13, 1), 8.3, 18, 'porcelain', decor)
  for (let i = 0; i < 4; i++) s.slab(`interior.book-${i}`, rect(19 + i * 3, -35, 2.3, 7, .2), 26.3, 9 + i % 2 * 3, i % 2 ? 'felt' : 'graphite', decor)
  s.cyl('interior.plant-pot', 61, 6, 4, 8.3, 7, 'graphite', decor)
  s.cyl('interior.plant-stem', 61, 6, .5, 15.3, 17, 'porcelain', decor)
  for (const [i, [x, y, z]] of [[58, 6, 21], [64, 6, 25], [60, 4, 29], [63, 8, 31]].entries()) s.slab(`interior.plant-leaf-${i}`, rect(x - 3, y - 1.5, 6, 3, 1.4), z, .7, 'felt', decor)
  for (let row = 0; row < 9; row++) {
    const z = 8 + row * 8, cue = 1.6 + row * 0.39
    const motion = animate(cue, cue + 0.65, 13)
    s.slab(`wall.back-${row}`, rect(-75, -50, 150, 5), z, 7.7, 'porcelain', motion)
    for (const x of [-75, 70]) s.slab(`wall.side-${x}-${row}`, rect(x, -45, 5, 90), z, 7.7, 'porcelain', {
      ...motion,
      inner: [-22, 0, 22].map(y => planeLine(plane([x + 5, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0]), [[y + (row % 2) * 8, z], [y + (row % 2) * 8, z + 7.7]], 0.05, 'faint')).join(''),
    })
    // Openings are real gaps in the brickwork, rather than windows painted over a solid wall.
    let spans = z < 56 ? [[-75, -22], [3, 75]] : [[-75, 75]]
    if (z >= 32 && z < 64) for (const [left, right] of [[-63, -28], [20, 55]]) {
      spans = spans.flatMap(([a, b]) => b <= left || a >= right ? [[a, b]] : [[a, Math.min(b, left)], [Math.max(a, right), b]].filter(([a, b]) => b - a > 0.8))
    }
    spans.forEach(([start, end], segment) => {
      const count = Math.ceil((end - start) / 24), width = (end - start) / count
      for (let brick = 0; brick < count; brick++) s.slab(`wall.front-${row}-${segment}-${brick}`, rect(start + brick * width, 45, width - 0.35, 5), z, 7.7, (row + brick) % 5 === 0 ? 'stone' : 'porcelain', animate(cue + brick * 0.035, cue + 0.65 + brick * 0.035, 13))
    })
  }
  const F = front(50)
  for (const [i, x] of [-63, 20].entries()) {
    const motion = animate(5.4 + i * 0.24, 6.3 + i * 0.24, 8)
    s.face(`window.glass-${i}`, F, rect(x, 32, 35, 32), 0, 0.6, 'glass', {
      ...motion, inner: planeLine(F, [[x + 3, 36], [x + 13, 46]], -0.1, 'faint', true) +
        planeLine(F, [[x + 21, 50], [x + 32, 61]], -0.1, 'faint', true),
    })
    s.face(`window.lintel-${i}`, F, rect(x - 2, 65, 39, 2, 0.4), -1, 1, 'porcelain', motion)
    for (const edge of [x, x + 34]) s.face(`window.jamb-${i}-${edge}`, F, rect(edge - 0.8, 31, 1.6, 34), -0.8, 0.8, 'porcelain', motion)
    for (const z of [31, 47, 64]) s.face(`window.cross-${i}-${z}`, F, rect(x, z, 35, 1), -0.9, 0.9, 'porcelain', motion)
    s.face(`window.mullion-${i}`, F, rect(x + 17, 32, 1, 32), -0.9, 0.9, 'porcelain', motion)
    s.slab(`window.sill-${i}`, rect(x - 2, 50, 39, 4, 0.4), 30, 2, 'graphite', motion)
  }
  s.face('entry.door', F, rect(-22, 8, 25, 48, 0.6), -0.2, 0.8, 'graphite', animate(6, 6.8, 12))
  s.face('entry.door-panel', F, rect(-19, 28, 19, 25, 0.4), -1, 0.3, 'glass', animate(6, 6.8, 12))
  s.face('entry.handle', F, rect(-2, 20, 1.2, 5, 0.4), -1.5, 0.5, 'porcelain', animate(6, 6.8, 12))
  s.face('entry.lock-plate', F, rect(-2.3, 26, 1.8, 3, 0.4), -1.5, 0.5, 'porcelain', {
    ...animate(6, 6.8, 12), inner: circleOn(F, -1.4, 27.8, 0.35, -1.6, 'lo'),
  })
  const roofF = plane([0, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0])
  for (const [i, x] of [-75, 70].entries()) s.prism(`gable.${i}`, roofF, [[-50, 80], [0, 112], [50, 80]], x, x + 5, 'porcelain', animate(6.5 + i * 0.15, 7.3 + i * 0.15, 15))
  for (const [i, polygon] of [
    [[-57, 79], [0, 116], [0, 112], [-57, 75]],
    [[0, 116], [57, 79], [57, 75], [0, 112]],
  ].entries()) s.prism(`roof.panel-${i}`, roofF, polygon, -84, 84, 'graphite', {
    ...animate(7.4 + i * 0.45, 8.5 + i * 0.45, 25),
    inner: Array.from({ length: 12 }, (_, index) => ink(k.segment([-82 + index * 15, 0, 116], [-82 + index * 15, i ? 57 : -57, 79], getProjection()), 'lo')).join(''),
  })
  s.slab('roof.ridge', rect(-85, -1.5, 170, 3, 0.5), 116, 1.4, 'porcelain', animate(8.7, 9.4, 16))
  s.slab('roof.fascia', rect(-85, 55, 170, 3, 0.4), 75, 4, 'porcelain', animate(8.9, 9.5, 10))
  s.slab('roof.gutter', rect(-86, 58, 172, 2.4, 0.8), 77.5, 2, 'graphite', {
    ...animate(9, 9.6, 10), inner: ink(k.lineOnTop([-85, 59.2], [85, 59.2], 79.5, getProjection()), 'faint'),
  })
  s.cyl('roof.downspout', 79, 59.2, 0.9, 1, 77, 'porcelain', animate(9.1, 9.8, 8))
  for (const z of [29, 61]) s.face(`roof.downspout-clip-${z}`, front(60.2), rect(77, z, 4, 2, 0.4), 0, 0.4, 'graphite', animate(9.1, 9.8, 8))
  s.slab('entry.step', rect(-26, 53, 33, 15, 0.7), 0, 4, 'porcelain', animate(8.5, 9.3, 9))
  s.slab('entry.step-top', rect(-24, 51, 29, 10, 0.6), 4, 4, 'porcelain', animate(8.7, 9.5, 9))
  // Last details belong to the completed house, not a permanent surrounding workshop.
  for (const x of [-92, 91]) {
    s.slab(`garden.planter-${x}`, rect(x - 7, 53, 14, 17, 1), 0, 10, 'graphite', animate(9.1, 9.8, 8))
    s.cyl(`garden.shrub-${x}`, x, 61.5, 7, 10, 10, 'porcelain', animate(9.1, 9.8, 8))
  }
  const body = renderScene(s).replace(/(<g data-item="window\.glass-\d"[^>]*>)/g, '$1<style>.house-window-glass .iso-fill,.house-window-glass .iso-shade,.house-window-glass .iso-top{fill-opacity:.18}</style>')
    .replace(/data-item="window\.glass-(\d)"/g, 'data-item="window.glass-$1" class="house-window-glass"')
  return { body, solids: s.R.solids.length }
}

export function marketCandidate(index) {
  fit(k.boxCorners(rect(-43, -28, 86, 64), 0, 110), 205, 300, { azimuth: 78, elevation: 24 })
  const s = new Scene(`candidate-${index}`, '')
  s.slab('podium.foot', rect(-41, -25, 82, 57, 3), 0, 4, 'graphite')
  s.slab('podium.body', rect(-37, -22, 74, 50, 2), 4, 32, 'porcelain')
  s.slab('podium.cap', rect(-41, -25, 82, 57, 2), 36, 2, 'graphite')
  const F = front(28)
  s.face('metrics.panel', F, rect(-32, 8, 64, 23, 1), -0.1, 0.3, 'screen')
  for (let i = 0; i < 4; i++) s.face(`metrics.bar-${i}`, F, rect(-25 + i * 13, 11, 8, [index === 1 ? 8 : 5, index === 1 ? 11 : 7, index === 1 ? 14 : 5, index === 1 ? 17 : 9][i], 0.3), -0.5, 0.2, 'graphite')
  if (index === 0) {
    s.slab('product.package', rect(-22, -15, 44, 33, 1.5), 38, 40, 'porcelain')
    s.slab('product.lid', rect(-23, -16, 46, 35, 1), 78, 3, 'graphite', {
      inner: ink(k.planOutline(rect(-21, -14, 42, 31, 0.5), 81, getProjection()), 'faint'),
    })
    s.face('product.inset', front(18), rect(-14, 48, 28, 21, 0.6), -0.1, 0.3, 'glass')
  } else if (index === 1) {
    productBottle(s)
  } else {
    s.cyl('product.jar', 0, 0, 23, 38, 27, 'porcelain')
    s.cyl('product.lid', 0, 0, 24, 65, 5, 'graphite', {
      inner: ink(k.knurl(0, 0, 24, 65, 70, 32, getProjection()), 'faint'),
    })
    for (let i = 0; i < 3; i++) s.mark(`product.lid-ring-${i}`, ink(k.ring(0, 0, 17 + i * 2.5, 70, getProjection()), 'lo'), [0, 0, 70])
  }
  const basis = a.planeMatrix(local(F, 0, 11, -0.5), F.u, F.v, getProjection())
  let model = renderScene(s).replace(/data-item="metrics\.bar-(\d)"/g, `data-item="metrics.bar-$1" data-market-bar="${index},$1" data-bar-basis="${basis}"`)
  if (index === 1) model = model.replace(/data-item="product\.([^"]+)"/g, 'data-item="product.$1" data-selected-product=""')
  const body = `<g data-candidate-object="${index}">${model}</g>` +
    `<g data-verdict="${index}" opacity="0"><circle cx="172" cy="70" r="15" fill="#0d0d0d" stroke="${index === 1 ? '#30a46c' : '#e5484d'}" stroke-width="1"/><path d="${index === 1 ? 'm165 70 5 5 9-11' : 'm167 65 10 10m0-10-10 10'}" fill="none" stroke="${index === 1 ? '#30a46c' : '#e5484d'}" stroke-width="1.4" stroke-linecap="round"/></g>`
  const anchor = k.iso([0, 0, 38], getProjection())
  const productHeight = Math.abs(k.iso([0, 0, 91], getProjection())[1] - anchor[1])
  return { body, solids: s.R.solids.length, anchor, productHeight }
}

export function analysisLens() {
  fit(k.boxCorners(rect(-40, -8, 80, 16), 0, 95), 170, 190, { azimuth: 78, elevation: 13 })
  const s = new Scene('analysis-lens', '')
  const F = front(0)
  const lens = G.ringBand(0, 3, 31, 35, { ...F, o: local(F, 0, 57) }, getProjection(), { steps: 72, hole: [0, 31] })
  s.put('lens.rim', lens, null, 'porcelain', { at: [0, 0, 57] })
  // The handle follows the radius of the ring in the exact same 3D plane.
  const diagonal = Math.SQRT1_2
  const handleF = plane(local(F, 35 * diagonal, 57 - 35 * diagonal),
    [diagonal, 0, -diagonal], [diagonal, 0, diagonal], F.a)
  s.face('lens.handle', handleF, rect(-1.5, -3.1, 28, 6.2, 3.1), 0, 3, 'graphite')
  s.face('lens.handle-collar', handleF, rect(-2.2, -4.2, 5.5, 8.4, 1.2), -0.2, 3.2, 'porcelain')
  for (const x of [8, 11, 14, 17, 20]) s.face(`lens.grip-${x}`, handleF, rect(x, -3.15, 0.45, 6.3, 0.15), -0.1, 0.15, 'porcelain')
  const glass = `<g transform="${a.planeMatrix(local(F, 0, 57, -0.15), F.u, F.v, getProjection())}">
    <circle data-lens-glass="" r="30.8" fill="#dae9ed" fill-opacity=".12" stroke="#c8d8dc" stroke-opacity=".35" stroke-width=".5"/>
    <path d="M-23 6A24 24 0 0 1-5-23" fill="none" stroke="#ffffff" stroke-opacity=".42" stroke-width=".7" stroke-linecap="round"/>
  </g>`
  return renderScene(s) + glass
}
