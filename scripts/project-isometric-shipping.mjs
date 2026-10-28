import {
  Scene, k, a, front, plane, local, ink, planeLine, circleOn, rect,
  getProjection, setProjection, renderScene, delta,
} from './project-isometric-shapes.mjs'
import { productBottle } from './project-isometric-details.mjs'

const CAMERA = { azimuth: 65, elevation: 25 }
const fit = (bounds, w, h) => setProjection(k.fitProjection(bounds, w, h, { ...CAMERA, pad: 10 }))
const matrix = (F, origin = F.o) => a.planeMatrix(origin, F.u, F.v, getProjection()).slice(7, -1).split(/[\s,]+/).map(Number)
const bottleMark = (F, x, z, size = 1, s = -0.1) => planeLine(F, [
  [-3, 0], [-3, 7], [-1, 9], [-1, 11], [1, 11], [1, 9], [3, 7], [3, 0], [-3, 0],
].map(([px, pz]) => [x + px * size, z + pz * size]), s, 'mid') +
  planeLine(F, [[x - size, z + 11 * size], [x + 4 * size, z + 11 * size]], s, 'mid')

function carton(s, name, x, y, z) {
  const F = front(y + 10)
  s.slab(`${name}.body`, rect(x - 10, y - 10, 20, 20, 0.4), z, 22, 'porcelain', {
    inner: bottleMark(F, x, z + 4, 0.9) +
      planeLine(F, [[x - 9.5, z + 1.2], [x + 9.5, z + 1.2]], -0.1, 'faint') +
      planeLine(F, [[x - 8.8, z], [x - 8.8, z + 22]], -0.1, 'faint'),
  })
  s.slab(`${name}.tape`, rect(x - 1.2, y - 10, 2.4, 20), z + 22, 0.15, 'tape')
  s.face(`${name}.tape-front`, F, rect(x - 1.2, z + 16, 2.4, 6, 0.2), -0.1, 0.12, 'tape')
}

function packingGlyph() {
  fit(k.boxCorners(rect(-18, -18, 36, 36), 0, 65), 180, 200)
  const s = new Scene('packing', '')
  const P = getProjection()
  s.slab('pack.bottom', rect(-10, -10, 20, 20, 0.3), 0, 0.6, 'graphite')
  s.slab('pack.back', rect(-10, -10, 20, 0.6), 0.6, 21.4, 'porcelain')
  for (const x of [-10, 9.4]) s.slab(`pack.side-${x}`, rect(x, -9.4, 0.6, 18.8), 0.6, 21.4, 'porcelain')
  productBottle(s, 'product', { z: 1, scale: 1 / 3 })
  s.face('pack.front', front(10), rect(-10, 0.6, 20, 21.4, 0.3), 0, 0.6, 'porcelain', { inner: bottleMark(front(10), 0, 4, 0.9) })
  let body = renderScene(s).replace(/data-item="product\.([^"]+)"/g, 'data-item="product.$1" data-pack-product=""')
  // Four real hinge planes: the projected second basis rotates from world Z to its closing direction.
  const hinges = [
    { o: [-10, -10, 22], u: [0, 1, 0], v: [1, 0, 0] },
    { o: [10, 10, 22], u: [0, -1, 0], v: [-1, 0, 0] },
    { o: [-10, 10, 22], u: [1, 0, 0], v: [0, -1, 0] },
    { o: [10, -10, 22], u: [-1, 0, 0], v: [0, 1, 0] },
  ]
  const up = delta([0, 0, 1])
  hinges.forEach((F, i) => {
    body += `<g data-pack-flap="${i}" data-flap-matrix="${matrix(F).join(',')}" data-flap-up="${up.join(',')}"><path d="M0 0H20V10H0Z" fill="${i < 2 ? '#ededea' : '#fbfbfa'}" stroke="#8a8a8f" stroke-width=".65" stroke-linejoin="round"/><path d="M0 0H20" stroke="#b4b4b8" stroke-width=".5"/></g>`
  })
  body += `<g data-pack-seal="">${ink(k.lineOnTop([0, -10], [0, 10], 22.2, P), 'mid')}</g>`
  const anchor = k.iso([0, 0, 1], P)
  const productHeight = Math.abs(k.iso([0, 0, 1 + 53 / 3], P)[1] - anchor[1])
  return { body, P, anchor, productHeight, lift: delta([0, 0, 34]), solids: s.R.solids.length + 4 }
}

function closedCarton() {
  fit(k.boxCorners(rect(-11, -11, 22, 22), 0, 24), 90, 90)
  const P = getProjection(), s = new Scene('closed-carton', '')
  carton(s, 'carton', 0, 0, 0)
  return { body: renderScene(s), P, solids: s.R.solids.length }
}

function truckGlyph() {
  fit(k.boxCorners(rect(-104, -33, 218, 66), 0, 86), 350, 240)
  const P = getProjection(), s = new Scene('pickup', '')
  s.slab('truck.chassis', rect(-96, -25, 201, 50, 2), 17, 6, 'graphite')
  s.slab('truck.bed-floor', rect(-94, -24, 109, 48, 0.7), 23, 3, 'porcelain')
  s.slab('truck.bed-back', rect(-94, -24, 109, 1.5, 0.4), 26, 20, 'porcelain')
  s.slab('truck.tailgate', rect(-94, -22.5, 2, 45, 0.5), 26, 20, 'porcelain')
  s.slab('truck.bed-front', rect(13, -22.5, 2, 45, 0.5), 26, 20, 'porcelain')
  // The near board is lower, so loaded cartons remain readable above it.
  s.slab('truck.bed-near', rect(-94, 22.5, 109, 1.5, 0.4), 26, 11, 'porcelain', {
    inner: planeLine(front(24), [[-92, 31], [12, 31]], -0.1, 'faint') +
      [-87, -63, -39, -15, 9].map(x => circleOn(front(24), x, 34, 0.5, -0.1, 'lo')).join(''),
  })
  const F = front(24)
  s.prism('truck.cab', F, [[17, 23], [97, 23], [104, 31], [100, 48], [77, 54], [63, 79], [25, 79], [17, 66]], 0, 48, 'porcelain')
  s.prism('truck.window', front(24.4), [[25, 54], [25, 73], [59, 73], [70, 54]], 0, 0.4, 'glass', {
    inner: planeLine(front(24.4), [[28, 56], [43, 71]], -0.1, 'faint', true) +
      planeLine(front(24.4), [[34, 56], [49, 71]], -0.1, 'faint', true),
  })
  s.face('truck.door', front(24.5), rect(23, 28, 46, 23, 0.7), 0, 0.4, 'porcelain', {
    inner: planeLine(front(24.5), [[29, 46], [38, 46]], -0.2, 'mid') + circleOn(front(24.5), 40, 45.5, 0.65, -0.2, 'lo'),
  })
  s.mark('truck.door-seam', planeLine(front(24.8), [[21, 25], [70, 25], [70, 51], [61, 76], [23, 76], [21, 25]], 0, 'lo'), [45, 24.8, 50])
  s.slab('truck.step', rect(20, 24, 34, 5, 0.7), 20.5, 1.5, 'graphite')
  s.slab('truck.roof', rect(24, -25, 40, 50, 1.2), 79, 1.7, 'graphite')
  s.slab('truck.hood', rect(77, -24, 24, 48, 0.8), 48, 1.6, 'porcelain')
  s.slab('truck.front-bumper', rect(101, -26, 5, 52, 0.7), 22, 5, 'graphite')
  s.slab('truck.rear-bumper', rect(-100, -26, 6, 52, 0.7), 19, 4, 'graphite')
  const nose = plane([104, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0])
  for (const y of [-20, 10]) s.face(`truck.headlight-${y}`, nose, rect(y, 33, 10, 7, 1), 0, 0.5, 'glass', {
    inner: planeLine(nose, [[y + 1, 34], [y + 9, 34], [y + 9, 39], [y + 1, 39], [y + 1, 34]], 0.6, 'lo'),
  })
  s.face('truck.grille', nose, rect(-9, 31, 18, 10, 0.4), 0, 0.5, 'graphite', {
    inner: [34, 37].map(z => planeLine(nose, [[-8, z], [8, z]], 0.6, 'lo')).join(''),
  })
  s.face('truck.mirror', front(28), rect(65, 54, 7, 10, 1), 0, 3, 'graphite')
  s.slab('truck.mirror-arm', rect(66, 24, 1.5, 5, 0.4), 57, 1.5, 'porcelain')
  s.face('truck.tail-light', front(24.4), rect(-92, 27, 3, 8, 0.6), 0, 0.4, 'glass', {
    inner: planeLine(front(24.4), [[-91.5, 31], [-89.5, 31]], -0.1, 'lo'),
  })
  for (const [i, [x, y]] of [[-65, -26], [73, -26], [-65, 29], [73, 29]].entries()) {
    const W = front(y)
    const basis = matrix(W, local(W, x, 14))
    s.prism(`wheel.tire-${i}`, W, k.circleRing(x, 14, 13, 40), 0, 4, 'graphite', {
      inner: circleOn(W, x, 14, 11.8, -0.1, 'lo'),
    })
    s.prism(`wheel.hub-${i}`, W, k.circleRing(x, 14, 7.5, 32), -0.8, -0.3, 'porcelain', {
      inner: circleOn(W, x, 14, 3, -0.9, 'mid') + [0, 1, 2].map(j => {
        const t = j * Math.PI * 2 / 3
        return planeLine(W, [[x + 3 * Math.cos(t), 14 + 3 * Math.sin(t)], [x + 6.5 * Math.cos(t), 14 + 6.5 * Math.sin(t)]], -0.9, 'lo')
      }).join('') + Array.from({ length: 5 }, (_, j) => {
        const t = j * Math.PI * 2 / 5
        return circleOn(W, x + 4.3 * Math.cos(t), 14 + 4.3 * Math.sin(t), 0.45, -0.9, 'mid')
      }).join(''),
    })
    if (y > 0) s.mark(`truck.wheel-arch-${i}`, planeLine(front(25.1), Array.from({ length: 25 }, (_, j) => {
      const t = (144 - j * 108 / 24) * Math.PI / 180
      return [x + 15.5 * Math.cos(t), 14 + 15.5 * Math.sin(t)]
    }), -0.1, 'lo'), [x, 25.1, 27])
    s.R.items.filter(item => item.name === `wheel.tire-${i}` || item.name === `wheel.hub-${i}`).forEach(item => { item.wheelBasis = basis })
  }
  // Six cartons on the bed and two supported across the lower layer, below the cab roof.
  // Index zero is the original package containing the selected product.
  const cargo = [[-24, 11, 26], [-48, 11, 26], [-72, 11, 26], [-24, -11, 26], [-48, -11, 26], [-72, -11, 26], [-36, 0, 48], [-60, 0, 48]]
  cargo.forEach(([x, y, z], i) => carton(s, `cargo-${i}`, x, y, z))
  let body = renderScene(s)
  body = body.replace(/data-item="cargo-(\d)\.([^"]+)"/g, 'data-item="cargo-$1.$2" data-loaded-carton="$1"')
  s.R.items.filter(item => item.wheelBasis).forEach(item => {
    body = body.replace(`data-item="${item.name}"`, `data-item="${item.name}" data-truck-wheel="" data-wheel-basis="${item.wheelBasis.join(',')}"`)
  })
  body = body.replace(/data-item="truck\.([^"]+)"/g, 'data-item="truck.$1" data-truck-body=""')
  return { body, P, cargo, axis: delta([1, 0, 0]), solids: s.R.solids.length }
}

export function shippingOutcome() {
  const pack = packingGlyph(), box = closedCarton(), truck = truckGlyph()
  const packAt = [160, -5], truckAt = [-5, 230]
  const r = truck.P.scale / box.P.scale
  const source = k.iso([0, 0, 0], box.P)
  const packedOrigin = k.iso([0, 0, 0], pack.P)
  const firstTarget = k.iso(truck.cargo[0], truck.P)
  const packedScale = truck.P.scale / pack.P.scale
  const packedEnd = [truckAt[0] + firstTarget[0] - packedOrigin[0] * packedScale, truckAt[1] + firstTarget[1] - packedOrigin[1] * packedScale, packedScale]
  const packedBody = `<g data-pack-unit="" data-pack-base="${packAt.join(',')}" data-load-end="${packedEnd.join(',')}" data-pack-anchor="${pack.anchor.join(',')}" data-product-height="${pack.productHeight}" data-pack-lift="${pack.lift.join(',')}" transform="translate(${packAt.join(' ')})">${pack.body}</g>`
  let body = ''
  // This window is updated to the actual device viewport, rather than the illustration's bounds.
  const truckBody = `<defs><clipPath id="truck-screen-window" clipPathUnits="userSpaceOnUse"><rect data-truck-screen="" x="-3000" y="-3000" width="6000" height="6000"/></clipPath></defs><g clip-path="url(#truck-screen-window)"><g data-truck="" transform="translate(${truckAt.join(' ')})" data-truck-base="${truckAt.join(',')}" data-truck-axis="${truck.axis.join(',')}">${truck.body}</g></g>`
  body += truckBody
  truck.cargo.forEach((position, i) => {
    // The first box is not replaced by a fresh stock box: its actual packing group travels.
    if (i === 0) return
    const target = k.iso(position, truck.P)
    const end = [truckAt[0] + target[0] - source[0] * r, truckAt[1] + target[1] - source[1] * r, r]
    const relative = position.map((value, axis) => value - truck.cargo[0][axis])
    const origin = k.iso(relative, pack.P), startScale = pack.P.scale / box.P.scale
    const start = [packAt[0] + origin[0] - source[0] * startScale, packAt[1] + origin[1] - source[1] * startScale, startScale]
    body += `<g data-stock-carton="${i}" data-load-start="${start.join(',')}" data-load-end="${end.join(',')}" opacity="0">${box.body}</g>`
  })
  body += packedBody
  return { body, solids: pack.solids + box.solids * (truck.cargo.length - 1) + truck.solids }
}
