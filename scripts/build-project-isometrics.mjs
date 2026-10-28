import { writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  Scene, storefront, k, a, front, ink, planeLine, circleOn,
  rect, wrap, checkIcon, businessIcon, materialCss, metadata, OUT,
  setProjection, getProjection, renderScene,
} from './project-isometric-shapes.mjs'
import { constructionHouse, marketCandidate, analysisLens } from './project-isometric-scenes.mjs'
import { shippingOutcome } from './project-isometric-shipping.mjs'

const DESKTOP = [1040, 610]
const MOBILE = [640, 790]
const projection = (bounds, width, height, camera = {}) => k.fitProjection(bounds, width, height, {
  pad: 8, azimuth: 55, elevation: 30, ...camera,
})
const actor = (name, body, desktop, mobile, extra = '') =>
  `<g data-actor="${name}" data-desktop="${desktop.join(',')}" data-mobile="${mobile.join(',')}" transform="translate(${desktop[0]} ${desktop[1]}) scale(${desktop[2] ?? 1})" ${extra}>${body}</g>`

function writeStory(id, label, body, config, solids) {
  const sid = `project-iso-${id}`
  const svg = a.assetSvg({
    id: sid, width: DESKTOP[0], height: config.desktopHeight ?? DESKTOP[1], label, body,
    theme: 'light', weight: 0.65, motion: false,
    css: materialCss(sid) + `\n#${sid}{--story-blue:var(--anatomy-green);--story-amber:var(--anatomy-red);--story-ink:var(--anatomy-hi);--story-line:#737373}`,
  })
  writeFileSync(path.join(OUT, `${id}.svg`), svg.replace('data-theme="light"', `data-theme="light" data-desktop-height="${config.desktopHeight ?? DESKTOP[1]}" data-mobile-height="${config.mobileHeight ?? MOBILE[1]}"`))
  metadata[id] = { id, width: DESKTOP[0], height: config.desktopHeight ?? DESKTOP[1], mobile: [MOBILE[0], config.mobileHeight ?? MOBILE[1]], solids, ...config }
  writeFileSync(path.join(OUT, `${id}.meta.json`), JSON.stringify(metadata[id], null, 2))
  console.log(`${id}: ${solids} crafted parts · ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`)
}

function businessGlyph(kind) {
  setProjection(projection(k.boxCorners(rect(-7, -5, 73, 68), 0, 67), 210, 180, { elevation: 28 }))
  const scene = new Scene(`business-${kind}`, '')
  storefront(scene, 0, 0, kind)
  const shadow = `<path class="iso-halo" d="${k.haloOf(rect(-4, -3, 66, 56, 3), 0, 3, getProjection())}"/>`
  return { body: shadow + renderScene(scene), solids: scene.R.solids.length }
}

function warning(F, x, y, s = 0, size = 7) {
  return planeLine(F, [[x, y + size], [x + size, y - size * 0.7], [x - size, y - size * 0.7], [x, y + size]], s, 'hi') +
    planeLine(F, [[x, y + size * 0.4], [x, y - size * 0.15]], s, 'hi', true) +
    circleOn(F, x, y - size * 0.4, size * 0.06, s, 'hi')
}

function phoneGlyph() {
  setProjection(projection(k.boxCorners(rect(-36, -10, 72, 20), 0, 132), 240, 348, { azimuth: 80, elevation: 12 }))
  const s = new Scene('phone', '')
  const F = front(0)
  s.face('phone.case', F, rect(-35, 0, 70, 130, 7), 0, 4.3, 'porcelain', {
    inner: planeLine(F, [[-3, 2], [3, 2], [3, 3.1], [-3, 3.1], [-3, 2]], -0.1, 'lo') +
      [-18, -15.8, -13.6, 13.6, 15.8, 18].map(x => circleOn(F, x, 2.6, 0.32, -0.1, 'lo')).join(''),
  })
  s.face('phone.rim', F, rect(-33.3, 1.6, 66.6, 126.8, 6), -0.25, 0.25, 'graphite')
  s.face('phone.glass', F, rect(-30.5, 4.4, 61, 120.6, 5), -0.5, 0.25, 'screen', {
    inner: planeLine(F, [[-29, 81], [5, 115]], -0.55, 'faint', true),
  })
  s.face('phone.camera-island', F, rect(-9.5, 116.8, 19, 5.2, 2.5), -0.75, 0.25, 'graphite', {
    inner: [-5, -3.2, -1.4, 0.4].map(x => circleOn(F, x, 119.4, 0.3, -0.8, 'lo')).join(''),
  })
  s.face('phone.camera', F, rect(4, 118.3, 2, 2, 1), -0.85, 0.1, 'glass', {
    inner: circleOn(F, 5, 119.3, 0.5, -0.9, 'hi'),
  })
  s.face('phone.home', F, rect(-9, 8, 18, 1.3, 0.65), -0.75, 0.2, 'porcelain')
  s.face('phone.volume', F, rect(-35.7, 82, 0.7, 14, 0.3), 0.7, 1.2, 'graphite')
  s.face('phone.power', F, rect(35, 76, 0.7, 21, 0.3), 0.7, 1.2, 'graphite')
  for (let i = 0; i < 3; i++) {
    const y = 99 - i * 26
    const status = `<g data-ui-good="${i}">${wrap(checkIcon(F, 17, y, -0.8), 'blue')}</g>` +
      `<g data-ui-alert="${i}" opacity="0">${wrap(warning(F, 17, y, -0.8, 5.5), 'copper')}</g>`
    s.face(`phone.row-${i}`, F, rect(-26, y - 10, 52, 21, 3), -0.75, 0.25, 'graphite', {
      inner: businessIcon(['market', 'cafe', 'workshop'][i], F, -14, y - 1, -0.8) + status,
    })
    s.face(`phone.row-accent-${i}`, F, rect(-25.5, y - 6, 1.5, 13, 0.7), -0.9, 0.15, 'blue')
  }
  s.face('phone.summary', F, rect(-26, 16, 52, 16, 3), -0.75, 0.25, 'blue', {
    inner: circleOn(F, -16, 24, 4.5, -0.8, 'hi') +
      planeLine(F, [[-8, 21], [-3, 26], [2, 23], [7, 28], [12, 26], [19, 29]], -0.8, 'hi', true),
  })
  // All these faces are parallel. Paint their actual front offsets so the screen never covers a card.
  const faceOffset = ({ name }) => name === 'phone.case' ? 0 : name === 'phone.rim' ? 0.25 : name === 'phone.glass' ? 0.5 :
    name.startsWith('phone.row-accent') ? 0.9 : name === 'phone.camera' ? 0.85 : name === 'phone.power' || name === 'phone.volume' ? -0.7 : 0.75
  const body = renderScene(s, { layer: faceOffset }).replace(/data-item="phone\.row-(\d)"/g, 'data-item="phone.row-$1" data-phone-row="$1"')
    .replace(/data-item="phone\.row-accent-(\d)"/g, 'data-item="phone.row-accent-$1" data-phone-accent="$1"')
  return { body, solids: s.R.solids.length }
}

function dataCubeGlyph() {
  setProjection({ ...getProjection(), origin: [0, 8], scale: 1.35, azimuth: 55, elevation: 30 })
  const s = new Scene('notice', '')
  s.slab('notice.cube', rect(-7, -7, 14, 14, 0.8), 0, 14, 'porcelain')
  const F = front(7)
  const good = `<g data-notice-good="" class="notice-mark">${checkIcon(F, 0, 7, -0.15, 'green')}</g>`
  const alert = `<g data-notice-alert="" class="notice-mark">${warning(F, 0, 7, -0.15, 4.3)}</g>`
  // These are solid cubes, with a seam on the lid and a status on the front face.
  s.mark('notice.lid-seam', ink(k.lineOnTop([-7, 0], [7, 0], 14, getProjection()), 'lo'), [0, 0, 14])
  s.mark('notice.status', good + alert, [0, 7, 7])
  return renderScene(s)
}

function buildIxtli() {
  const businesses = ['market', 'cafe', 'workshop'].map(businessGlyph)
  const phone = phoneGlyph()
  const desktop = [[34, 28, 1.15], [398, 0, 1.15], [788, 35, 1.15]]
  const mobile = [[-4, 86, 0.95], [219, 0, 0.95], [442, 86, 0.95]]
  const routes = [
    { desktop: 'M 155 215 C 155 320 390 280 445 378', mobile: 'M 97 241 C 97 365 223 405 244 532' },
    { desktop: 'M 519 190 C 519 225 519 234 519 264', mobile: 'M 319 165 C 319 270 319 330 319 412' },
    { desktop: 'M 909 222 C 909 325 651 280 594 378', mobile: 'M 543 241 C 543 365 417 405 394 532' },
  ]
  let body = routes.map((route, i) =>
    `<path data-route="${i}" data-desktop-path="${route.desktop}" data-mobile-path="${route.mobile}" d="${route.desktop}" class="story-route"/>`
  ).join('')
  body += businesses.map((business, i) => actor(`business-${i}`, business.body, desktop[i], mobile[i], `data-business="${i}"`)).join('')
  body += actor('phone', phone.body, [400, 245, 1], [199, 393, 1.02])
  const cube = dataCubeGlyph()
  body += routes.map((_, i) => `<g data-notice="${i}" opacity="0" class="story-notice">${cube}</g>`).join('')
  writeStory('ixtli', 'Los negocios se incorporan uno a uno y envían noticias positivas y alertas que se reflejan en su fila del teléfono', body, { routes }, businesses.reduce((sum, business) => sum + business.solids, 0) + phone.solids)
}

function buildHouse() {
  const house = constructionHouse()
  const body = actor('construction-house', house.body, [75, 30, 1], [0, 40, 0.72])
  writeStory('bohorquez', 'Una casa se construye desde cero: primero los cimientos, luego las hiladas de muros, ventanas, puerta y finalmente el tejado', body, { mobileHeight: 490 }, house.solids)
}

function buildData() {
  const candidates = [0, 1, 2].map(marketCandidate)
  const lens = analysisLens(), client = shippingOutcome()
  const desktop = [[18, 90, 1], [226, 30, 1], [434, 90, 1]]
  const mobile = [[0, 40, 1], [216, 0, 1], [432, 40, 1]]
  let body = candidates.map((candidate, i) => actor(`candidate-${i}`, candidate.body, desktop[i], mobile[i], `data-candidate="${i}"${i === 1 ? ` data-product-anchor="${candidate.anchor.join(',')}" data-product-height="${candidate.productHeight}"` : ''}`)).join('')
  body += actor('analysis-lens', lens, [244, 90, 1], [234, 60, 1], 'data-analysis-lens=""')
  body += actor('client-outcome', client.body, [675, 0, 1], [170, 245, 0.78], 'data-client-outcome=""')
  writeStory('ixtli-data', 'Una lupa con cristal semitransparente encuentra un producto. Se empaqueta en una caja, se cierran las solapas y aparecen más cajas del mismo producto. Una camioneta pequeña las carga y se marcha', body, { desktopHeight: 540, mobileHeight: 640 }, candidates.reduce((sum, candidate) => sum + candidate.solids, 0) + client.solids)
}

buildHouse()
buildIxtli()
buildData()
writeFileSync(path.join(OUT, 'scene-config.ts'), `// Generated by scripts/build-project-isometrics.mjs\nexport const sceneGeometry = ${JSON.stringify(metadata, null, 2)} as const\n`)
