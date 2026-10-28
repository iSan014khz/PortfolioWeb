import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as k from './vendor/anatomy/iso-kit.mjs'
import * as a from './vendor/anatomy/asset.mjs'
import * as G from './vendor/anatomy/lathe.mjs'
import * as A from './vendor/anatomy/audit.mjs'

// Original geometry, built with Anatomy Asset. Only the resulting SVG ships.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src/components/projects/isometrics/assets')
mkdirSync(OUT, { recursive: true })
const W = 760, H = 540
const metadata = {}
const CAMERA = { azimuth: 55, elevation: 34 }
const bounds = [...k.boxCorners({ x: -154, y: -99, w: 308, d: 198, r: 0 }, -12, 146)]
let P = k.fitProjection(bounds, W, H, { ...CAMERA, pad: 30 })
const N = n => +n.toFixed(4)
const at = p => k.iso(p, P)
const delta = p => { const o = at([0, 0, 0]), q = at(p); return [N(q[0] - o[0]), N(q[1] - o[1])] }
const wrap = (svg, mat) => `<g class="mat-${mat}">${svg}</g>`
const join = list => list.filter(Boolean).join('')
const plane = (o, u = [1, 0, 0], v = [0, 1, 0], normal = [0, 0, 1]) => ({ o, u, v, a: normal })
const front = (y, z = 0, x = 0) => plane([x, y, z], [1, 0, 0], [0, 0, 1], [0, -1, 0])
const local = (F, x, y, s = 0) => F.o.map((v, i) => v + F.u[i] * x + F.v[i] * y + F.a[i] * s)
const planePath = (F, points, s = 0, closed = false) => k.pathOf(points.map(([x, y]) => at(local(F, x, y, s))), closed)
const ink = (d, tone = 'mid', free = false) => k.lineSvg(d, { tone, free })
const planeLine = (F, points, s = 0, tone = 'mid', free = false) => ink(planePath(F, points, s), tone, free)
const circleOn = (F, x, y, r, s = 0, tone = 'mid') => ink(planePath(F, k.circleRing(x, y, r, 28), s, true), tone)
const rect = (x, y, w, d, r = 0) => ({ x, y, w, d, r })

function materialCss(id) {
  // Anatomy's original light palette, without custom blue/copper body materials.
  // Recesses use existing ramp tones; all four side shades stay kit originals.
  return `#${id} .mat-graphite{--anatomy-top:#e5e5e2}
    #${id} .mat-screen,#${id} .mat-felt{--anatomy-top:#f4f4f1}
    #${id} .mat-glass{--anatomy-top:#ededea}
    #${id} .mat-ink{--anatomy-lo:#8a8a8f}
    #${id} .mat-stone{--anatomy-top:#f4f4f1}
    #${id} .mat-tape{--anatomy-top:#e5e5e2;--anatomy-paper:#ededea}
    #${id} .iso-edge{stroke:var(--anatomy-hi);stroke-opacity:.64;stroke-width:.68px}
    #${id} .iso-line:not(.iso-edge){stroke-width:.46px}
    #${id} .iso-line[data-tone="green"],#${id} .iso-line[data-tone="red"]{stroke-width:.75px}
    #${id} .mat-tape .iso-edge{stroke-opacity:.35;stroke-width:.42px}
    #${id} [data-item^="wheel.tire-"] .mat-graphite{--anatomy-top:#3e3e3e;--anatomy-paper:#26262a;--anatomy-shade-0:#131313;--anatomy-shade-1:#181818;--anatomy-shade-2:#26262a;--anatomy-shade-3:#3e3e3e}
    #${id} [data-item^="wheel.tire-"] .iso-edge{stroke:#8a8a8f;stroke-opacity:.7}
    #${id} [data-pack-seal] path{stroke-width:2px;stroke:#b4b4b8;stroke-linecap:butt}
    #${id}{--anatomy-halo:#000000;--anatomy-halo-opacity:.48}`
}

class Scene {
  constructor(id, label) {
    this.id = id
    this.label = label
    this.R = A.recorder(P)
    this.motion = {}
  }
  put(name, paths, shape, mat, options = {}) {
    const { inner = '', tone = 'mid', part, phase, offset, reveal, ambient, crease = 'faint' } = options
    const style = { inner, tone, crease }
    const svg = wrap(k.solidSvg(paths, style), mat)
    if (shape) this.R.solid(shape)
    const motion = part ? { part, phase: phase ?? [0, 1], offset: offset ?? [0, 0, 0], reveal } : null
    const item = this.R.put({
      name, svg, at: options.at ?? [0, 0, 0],
      shapes: shape ? [shape] : [], move: offset ?? [0, 0, 0],
      part, motion, ambient,
    })
    return item
  }
  slab(name, plan, z, h, mat = 'graphite', options = {}) {
    return this.put(name, k.slabOf(plan, z, h, P, 5, Math.min(h / 3, 0.7)), A.slab(plan, z, h, { name }, 5), mat, {
      at: [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], ...options,
    })
  }
  cyl(name, x, y, r, z, h, mat = 'graphite', options = {}) {
    return this.put(name, k.cylinder(x, y, r, z, h, P, 24, Math.min(h / 3, 0.4)), A.cylinder(x, y, r, z, h, { name }), mat, {
      at: [x, y, z + h / 2], ...options,
    })
  }
  prism(name, F, polygon, from, to, mat = 'graphite', options = {}) {
    const center = polygon.reduce((sum, p) => [sum[0] + p[0] / polygon.length, sum[1] + p[1] / polygon.length], [0, 0])
    return this.put(name, G.prismOf(F, polygon, from, to, P), A.prism(F, polygon, from, to, { name }), mat, {
      at: local(F, center[0], center[1], (from + to) / 2), ...options,
    })
  }
  face(name, F, plan, s, thickness, mat = 'graphite', options = {}) {
    return this.prism(name, F, k.roundedPlan(plan, 5), s, s + thickness, mat, options)
  }
  mark(name, svg, center, mat = 'ink', options = {}) {
    this.R.put({ name, svg: wrap(svg, mat), at: center, shapes: [], ...options })
  }
  base() {
    const base = rect(-145, -91, 290, 182, 8)
    this.R.put({ name: 'ground.shadow', at: [0, 0, -14], key: -10000, shapes: [], svg: `<path class="iso-halo" d="${k.haloOf(base, -12, 5, P)}"/>` })
    for (const [i, [x, y]] of k.corners(base, 16).entries()) {
      this.cyl(`stand.foot-${i}`, x, y, 5.2, -11, 5, 'felt')
    }
    this.slab('stand.plinth', base, -6, 6, 'graphite', { inner: ink(k.planOutline(k.insetPlan(base, 4), -1.2, P, 5), 'faint') })
    this.slab('stand.inlay', k.insetPlan(base, 8), 0, 0.65, 'felt')
    for (const [i, [x, y]] of k.corners(base, 5).entries()) {
      this.cyl(`stand.fixing-${i}`, x, y, 1.35, 0, 0.25, 'graphite', {
        inner: ink(k.lineOnTop([x - 0.8, y], [x + 0.8, y], 0.25, P), 'lo'),
      })
    }
  }
  write() {
    // The true, recorded solids determine the painter's order, not hand-tuned z-indexes.
    const settled = A.settle(this.R, P, { states: [0, 0.5, 1], step: 0.5 })
    const items = [...settled.items].sort((left, right) => left.key - right.key)
    const body = items.map(item => {
      const d = item.motion
      const attrs = [`data-item="${item.name}"`]
      if (d) {
        const [dx, dy] = delta(d.offset)
        attrs.push(`data-motion="${d.part}" data-phase="${d.phase.join(',')}" data-shift="${dx},${dy}"`)
        if (d.reveal) attrs.push('data-reveal=""')
      }
      const content = item.ambient ? `<g class="iso-ambient-${item.ambient}">${item.svg}</g>` : item.svg
      return `<g ${attrs.join(' ')}>${content}</g>`
    }).join('')
    const svg = a.assetSvg({
      width: W, height: H, label: this.label, body, id: `project-iso-${this.id}`,
      theme: 'light', weight: 0.65, motion: false,
      css: materialCss(`project-iso-${this.id}`),
    })
    writeFileSync(path.join(OUT, `${this.id}.svg`), svg)
    const config = {
      id: this.id, projection: P, width: W, height: H,
      solids: this.R.solids.length, paths: (svg.match(/<path\b/g) ?? []).length,
      ...this.motion,
    }
    metadata[this.id] = config
    writeFileSync(path.join(OUT, `${this.id}.meta.json`), JSON.stringify(config, null, 2))
    console.log(`${this.id}: ${this.R.solids.length} solids · ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`)
    A.auditOrExit(this.R, P, { apart: false })
  }
}

function boxIcon(F, x, y, size = 9, s = 0, tone = 'hi') {
  return join([
    planeLine(F, [[x - size, y + size / 2], [x, y + size], [x + size, y + size / 2], [x + size, y - size / 2], [x, y - size], [x - size, y - size / 2], [x - size, y + size / 2]], s, tone),
    planeLine(F, [[x - size, y + size / 2], [x, y], [x + size, y + size / 2]], s, tone),
    planeLine(F, [[x, y], [x, y - size]], s, tone),
  ])
}
function arrow(F, x, y, length = 15, s = 0, tone = 'hi') {
  return planeLine(F, [[x, y], [x + length, y], [x + length - 4, y + 3]], s, tone, true) +
    planeLine(F, [[x + length, y], [x + length - 4, y - 3]], s, tone, true)
}
function checkIcon(F, x, y, s = 0, tone = 'hi') {
  return planeLine(F, [[x - 4, y], [x - 0.5, y - 3.5], [x + 6, y + 5]], s, tone, true)
}
function shopIcon(F, x, y, s = 0) {
  return ink(planePath(F, [[x - 6, y - 5], [x + 6, y - 5], [x + 6, y + 3], [x - 6, y + 3], [x - 6, y - 5]], s), 'hi') +
    ink(planePath(F, [[x - 8, y + 3], [x - 5, y + 8], [x + 5, y + 8], [x + 8, y + 3], [x - 8, y + 3]], s), 'hi')
}

function businessIcon(kind, F, x, y, s = 0) {
  if (kind === 'market') return shopIcon(F, x, y, s)
  const points = kind === 'cafe'
    ? [[-6, 4], [-5, -3], [-3, -5], [3, -5], [5, -3], [6, 4], [-6, 4]]
    : [[-6, -5], [1, 2], [0, 5], [3, 8], [6, 7], [3, 5], [5, 3], [7, 5], [8, 2], [5, -1], [2, 0], [-5, -7], [-6, -5]]
  return planeLine(F, points.map(([xx, yy]) => [x + xx, y + yy]), s, 'hi') +
    (kind === 'cafe' ? planeLine(F, [[x + 6, y + 3], [x + 9, y + 3], [x + 9, y - 1], [x + 5, y - 1]], s, 'hi') : '')
}

function storefront(scene, x, y, kind) {
  const w = 58, d = 45, h = kind === 'workshop' ? 49 : 55
  const F = front(y + d, 1, x)
  scene.slab(`${kind}.step`, rect(x - 4, y - 3, w + 8, d + 11, 3), 0.65, 3, 'graphite')
  scene.slab(`${kind}.body`, rect(x, y, w, d, 2), 3.65, h, 'porcelain')
  scene.slab(`${kind}.roof-rim`, rect(x - 2, y - 2, w + 4, d + 4, 2), h + 3.65, 3, 'graphite')
  scene.slab(`${kind}.roof`, rect(x + 2, y + 2, w - 4, d - 4, 2), h + 6.65, 0.9, 'felt', {
    inner: ink(k.planOutline(rect(x + 4, y + 4, w - 8, d - 8, 1), h + 7.55, P), 'faint'),
  })
  const shelf = kind === 'market' ? planeLine(F, [[8, 21], [30, 21]], -0.1, 'lo') +
    [10, 18, 26].map(xx => planeLine(F, [[xx - 2, 21], [xx - 2, 27], [xx + 2, 27], [xx + 2, 21]], -0.1, 'faint')).join('') : ''
  scene.face(`${kind}.window`, F, rect(5, 13, 28, 25, 1), -0.1, 0.5, 'glass', {
    inner: shelf + planeLine(F, [[8, 16], [29, 35]], -0.15, 'faint', true) + planeLine(F, [[12, 16], [29, 31]], -0.15, 'faint', true),
  })
  scene.face(`${kind}.window-middle`, F, rect(18, 13, 1, 25), -0.5, 0.5, 'porcelain')
  scene.face(`${kind}.sill`, F, rect(3, 10, 32, 2, 0.5), -0.7, 0.7, 'graphite')
  scene.face(`${kind}.door`, F, rect(38, 5, 15, 36, 1), -0.1, 0.5, 'graphite', {
    inner: planeLine(F, [[39.5, 6.5], [51.5, 6.5], [51.5, 39.5], [39.5, 39.5], [39.5, 6.5]], -0.15, 'faint'),
  })
  scene.face(`${kind}.door-glass`, F, rect(40, 13, 11, 24, 0.8), -0.7, 0.5, 'glass')
  scene.face(`${kind}.handle`, F, rect(49, 18, 1, 6, 0.4), -0.8, 0.8, 'porcelain')
  for (const z of [12, 34]) scene.face(`${kind}.hinge-${z}`, F, rect(38.3, z, 1.1, 3.2, 0.3), -0.8, 0.7, 'porcelain')
  scene.cyl(`${kind}.downpipe`, x + 56, y + d + 0.8, 0.6, 4, h + 2.65, 'graphite')
  for (const z of [16, 36]) scene.face(`${kind}.pipe-clip-${z}`, F, rect(54.8, z, 2.4, 1.2, 0.3), -1.5, 0.5, 'porcelain')
  scene.face(`${kind}.transom`, F, rect(3, 43, w - 6, 6, 1), -0.1, 0.5, kind === 'market' ? 'blue' : 'graphite')
  if (kind === 'market') {
    for (const xx of [1, 55]) scene.prism(`market.awning-bracket-${xx}`, plane([x + xx, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0]), [[y + d, 37], [y + d, 44], [y + d + 10, 44]], 0, 0.8, 'graphite')
    for (let i = 0; i < 8; i++) {
      scene.slab(`market.awning-${i}`, rect(x - 2 + i * 8, y + d + 0.1, 8, 12, 0.4), 44, 2, i % 2 ? 'porcelain' : 'blue')
      scene.face(`market.valance-${i}`, front(y + d + 12.1, 0, x - 2 + i * 8), rect(0, 39, 8, 5, 0.4), 0, 0.35, i % 2 ? 'porcelain' : 'blue')
    }
  } else if (kind === 'cafe') {
    const sign = front(y + d, 0, x)
    scene.face('cafe.sign-plate', sign, rect(12, 43, 29, 12, 2), -0.3, 0.8, 'porcelain', {
      inner: join([
        planeLine(sign, [[20, 51], [20, 47], [22, 45], [28, 45], [30, 47], [30, 51], [20, 51]], -0.3, 'lo'),
        planeLine(sign, [[30, 50], [34, 50], [34, 47], [30, 47]], -0.3, 'lo'),
      ]),
    })
    scene.cyl('cafe.table-pedestal', x + 18, y + d + 8, 1.3, 3.65, 8, 'graphite')
    scene.cyl('cafe.table', x + 18, y + d + 8, 7, 11.65, 1, 'porcelain')
    scene.cyl('cafe.cup', x + 18, y + d + 8, 1.8, 12.65, 3.2, 'blue')
  } else {
    scene.face('workshop.shutter', F, rect(5, 9, 28, 27, 0.5), -0.8, 0.5, 'graphite', {
      inner: join(Array.from({ length: 7 }, (_, i) => planeLine(F, [[5, 11 + i * 3.4], [33, 11 + i * 3.4]], -0.8, 'lo'))),
    })
    scene.face('workshop.tool-plate', F, rect(9, 38, 30, 12, 1), -0.4, 0.6, 'porcelain', {
      inner: planeLine(F, [[18, 40], [26, 48], [30, 47], [29, 44], [26, 44], [21, 39]], -0.4, 'lo'),
    })
  }
  for (const [i, [xx, yy]] of k.corners(rect(x - 1, y - 1, w + 2, d + 2), 3).entries()) {
    scene.cyl(`${kind}.roof-fixing-${i}`, xx, yy, 0.8, h + 7.55, 0.2, 'porcelain')
  }
}

function buildBohorquez() {
  const s = new Scene('bohorquez', 'Una maqueta de vivienda se completa cuando su fachada encaja con precisión sobre el banco de trabajo')
  s.base()
  const house = rect(-72, -48, 126, 85, 1)
  s.slab('house.foundation', rect(-78, -54, 138, 99, 3), 0.65, 6, 'porcelain')
  s.slab('house.floor', house, 6.65, 3, 'graphite')
  s.slab('house.back', rect(-72, -48, 126, 4, 0.4), 9.65, 63, 'porcelain')
  s.slab('house.left-wall', rect(-72, -44, 4, 77, 0.4), 9.65, 63, 'porcelain')
  s.slab('house.right-wall', rect(50, -44, 4, 77, 0.4), 9.65, 63, 'porcelain')
  const roofF = plane([0, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0])
  const roof = [[-55, 73], [-5.5, 108], [44, 73], [44, 70], [-5.5, 104], [-55, 70]]
  s.prism('house.roof', roofF, roof, -79, 61, 'graphite', {
    inner: join(Array.from({ length: 11 }, (_, i) => k.segment([-76 + i * 13, -5.5, 108], [-76 + i * 13, 44, 73], P)).map(d => ink(d, 'lo'))),
  })
  s.slab('house.ridge', rect(-80, -7, 142, 3, 0.8), 107.5, 1.4, 'copper')
  s.slab('house.chimney', rect(-48, -28, 12, 13, 0.6), 90, 26, 'porcelain')
  s.slab('house.chimney-cap', rect(-50, -30, 16, 17, 0.6), 116, 2.2, 'graphite')
  s.slab('house.chimney-inset', rect(-47, -27, 10, 11, 0.4), 118.2, 0.2, 'felt')
  const face = front(38, 0)
  const facade = { part: 'facade', phase: [0.12, 0.8], offset: [0, 29, 10] }
  s.face('facade.wall', face, rect(-72, 9.65, 126, 63, 0.8), -2, 3.4, 'porcelain', facade)
  for (const x of [-61, 9]) {
    s.face(`facade.window-${x}`, face, rect(x, 36, 31, 25, 0.6), -2.9, 0.5, 'glass', {
      ...facade,
      inner: planeLine(face, [[x + 3, 39], [x + 28, 58]], -2.9, 'lo'),
    })
    s.face(`facade.sill-${x}`, face, rect(x - 2, 33.5, 35, 2.5, 0.5), -5.2, 2.2, 'porcelain', facade)
    s.face(`facade.mullion-${x}`, face, rect(x + 15, 36, 1, 25), -3.6, 0.6, 'porcelain', facade)
    s.face(`facade.transom-${x}`, face, rect(x, 48, 31, 1), -3.6, 0.6, 'porcelain', facade)
    for (const edge of [x - 1.5, x + 31]) s.face(`facade.window-trim-${edge}`, face, rect(edge, 35, 1.5, 27), -4.2, 0.7, 'porcelain', facade)
  }
  s.face('facade.door', face, rect(-22, 10, 23, 43, 0.8), -3.1, 0.9, 'copper', {
    ...facade, inner: ink(planePath(face, k.roundedPlan(rect(-19, 13, 17, 36, 0.5)), -3.1, true), 'lo'),
  })
  s.face('facade.door-glass', face, rect(-18, 34, 15, 15, 0.5), -4.1, 0.6, 'glass', facade)
  s.face('facade.handle', face, rect(-5, 24, 1.4, 6, 0.6), -5.1, 0.8, 'porcelain', facade)
  for (const x of [-21, -1]) s.face(`facade.door-trim-${x}`, face, rect(x - 1, 10, 1.6, 44), -4.4, 0.7, 'porcelain', facade)
  for (let i = 0; i < 6; i++) {
    s.face(`facade.cladding-${i}`, face, rect(44, 13 + i * 8, 7, 6, 0.3), -4.1, 0.6, 'copper', facade)
  }
  s.slab('house.front-step', rect(-28, 40, 35, 15, 1), 0.65, 6, 'porcelain')
  // A real scaffold, ladder and masonry distinguish a construction scene from a property model.
  for (const x of [-127, -84]) for (const y of [-20, 20]) {
    s.slab(`scaffold.foot-${x}-${y}`, rect(x - 4, y - 4, 8, 8, 0.7), 0.65, 2, 'graphite')
    s.cyl(`scaffold.post-${x}-${y}`, x, y, 1.25, 2.65, 72, 'porcelain')
    for (const z of [35, 66]) s.cyl(`scaffold.collar-${x}-${y}-${z}`, x, y, 1.9, z - 2, 3, 'graphite')
  }
  for (const z of [35, 66]) {
    s.slab(`scaffold.deck-${z}`, rect(-129, -23, 47, 46, 0.5), z, 2.3, 'porcelain', {
      inner: join([0, 1, 2].map(i => ink(k.lineOnTop([-129, -12 + i * 12], [-82, -12 + i * 12], z + 2.3, P), 'lo'))),
    })
  }
  const scaffold = front(20)
  for (const [i, points] of [
    [[-126, 5], [-84, 64], [-84, 66], [-127, 7]],
    [[-126, 64], [-84, 5], [-84, 7], [-127, 66]],
  ].entries()) s.prism(`scaffold.brace-${i}`, scaffold, points, -1, 0.5, 'graphite')
  for (const x of [-130, -113]) s.slab(`ladder.rail-${x}`, rect(x, 25, 1.8, 2, 0.4), 0.65, 62, 'graphite')
  for (let i = 0; i < 7; i++) s.slab(`ladder.rung-${i}`, rect(-128.2, 25, 15.2, 2, 0.3), 7 + i * 8, 1.6, 'porcelain')
  for (let row = 0; row < 3; row++) for (let i = 0; i < 3; i++) {
    s.slab(`masonry.brick-${row}-${i}`, rect(-89 + i * 12 + (row % 2) * 3, 66, 11, 7, 0.5), 0.65 + row * 4, 3.8, 'porcelain', {
      inner: ink(k.lineOnTop([-86 + i * 12 + (row % 2) * 3, 68], [-81 + i * 12 + (row % 2) * 3, 68], 4.45 + row * 4, P), 'faint', true),
    })
  }
  // The roller stays in contact with the wall; the complete tool moves along world Z together.
  const roller = { part: 'paint-roller', phase: [0.81, 1], offset: [0, 0, 8] }
  const rollerF = plane([-60, 43.3, 22], [0, 1, 0], [0, 0, 1], [1, 0, 0])
  s.prism('paint.roller', rollerF, k.circleRing(0, 0, 3.3, 24), 0, 17, 'porcelain', roller)
  s.slab('paint.spindle', rect(-61, 42.5, 20, 1.5, 0.3), 21.3, 1.5, 'graphite', roller)
  s.slab('paint.neck', rect(-62, 43.3, 1.5, 5.5, 0.3), 21.3, 1.5, 'porcelain', roller)
  s.slab('paint.handle', rect(-62, 47.3, 2.3, 2.3, 0.6), 9, 13.8, 'graphite', roller)
  // Workbench tools have real thickness and sit in a shallow fitted tray.
  s.slab('tools.tray', rect(80, -26, 48, 95, 3), 0.65, 3, 'graphite')
  s.slab('tools.mat', rect(83, -23, 42, 89, 2), 3.65, 0.6, 'felt')
  s.slab('tools.level', rect(90, 12, 12, 46, 1), 4.25, 5, 'copper')
  s.slab('tools.level-glass', rect(92, 28, 8, 15, 2), 9.25, 0.4, 'glass')
  s.cyl('tools.level-bubble', 96, 35, 1.3, 9.65, 0.15, 'porcelain', {
    part: 'level', phase: [0.67, 0.98], offset: [0, 4, 0], ambient: 'level',
  })
  s.slab('tools.square-arm', rect(109, -13, 4, 35, 0.4), 4.25, 1.5, 'porcelain')
  s.slab('tools.square-base', rect(109, -13, 12, 4, 0.4), 4.25, 1.5, 'porcelain')
  for (let i = 0; i < 8; i++) s.mark(`tools.square-tick-${i}`, ink(k.lineOnTop([109, -10 + i * 4], [111.5, -10 + i * 4], 5.75, P), 'lo'), [110, -10 + i * 4, 5.8], 'porcelain')
  s.slab('tools.screwdriver-handle', rect(112, 31, 6, 18, 2), 4.25, 4, 'graphite')
  s.slab('tools.screwdriver-shaft', rect(114, 49, 2, 11, 0.3), 5, 1.8, 'porcelain')
  for (let i = 0; i < 5; i++) s.cyl(`tools.screw-${i}`, 86 + (i % 2) * 6, -14 + Math.floor(i / 2) * 7, 1, 4.25, 0.8, 'porcelain')
  // Compact task lamp, its light gently breathes; the assembly itself stays planted.
  s.cyl('lamp.foot', -112, 47, 12, 0.65, 3, 'graphite')
  s.cyl('lamp.stem', -112, 47, 1.8, 3.65, 46, 'porcelain')
  s.cyl('lamp.joint', -112, 47, 3.5, 48, 3, 'copper')
  s.slab('lamp.arm', rect(-114, 29, 4, 20, 0.6), 50, 3, 'porcelain')
  s.cyl('lamp.shade', -112, 29, 10, 47, 5, 'graphite')
  s.cyl('lamp.lens', -112, 29, 8, 46.7, 0.3, 'paper', { ambient: 'lamp' })
  s.write()
}


export const setProjection = (projection) => { P = projection }
export const getProjection = () => P
export function renderScene(scene, { layer } = {}) {
  const settled = A.settle(scene.R, P, { states: [0], step: 0.5 })
  return [...settled.items].sort((a,b)=> {
    // Engraved surface graphics are painted after the object they belong to.
    const aInk = !a.shapes.length && a.name !== 'ground.shadow';
    const bInk = !b.shapes.length && b.name !== 'ground.shadow';
    return (layer ? layer(a) - layer(b) : 0) || Number(aInk) - Number(bInk) || a.key-b.key;
  }).map(item => {
    const motion = item.motion;
    const shift = motion ? delta(motion.offset) : [0,0];
    const attributes = motion ? ' data-motion="'+motion.part+'" data-phase="'+motion.phase.join(',')+'" data-shift="'+shift.join(',')+'"'+(motion.reveal?' data-reveal=""':'') : '';
    return '<g data-item="'+item.name+'"'+attributes+'>'+item.svg+'</g>';
  }).join('');
}
export { Scene, storefront, buildBohorquez, k, a, G, A, at, delta, plane, front, local, planePath, ink, planeLine, circleOn, rect, wrap, join, boxIcon, arrow, checkIcon, shopIcon, businessIcon, materialCss, metadata, OUT }
