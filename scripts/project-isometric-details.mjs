import { k, front, ink, planeLine, circleOn, rect, getProjection } from './project-isometric-shapes.mjs'

// One bottle, at different physical scales. The chosen product and the packed product share every part.
export function productBottle(scene, prefix = 'product', { x = 0, y = 0, z = 38, scale = 1 } = {}) {
  const n = value => value * scale
  const F = front(y + n(15), z, x)
  scene.cyl(`${prefix}.bottle`, x, y, n(15), z, n(38), 'porcelain', {
    inner: ink(k.ring(x, y, n(13.6), z + n(1), getProjection()), 'faint'),
  })
  scene.cyl(`${prefix}.shoulder`, x, y, n(12), z + n(38), n(3), 'porcelain')
  scene.cyl(`${prefix}.collar`, x, y, n(6.4), z + n(41), n(2.2), 'graphite', {
    inner: ink(k.ring(x, y, n(5.2), z + n(43.2), getProjection()), 'lo'),
  })
  scene.cyl(`${prefix}.neck`, x, y, n(5), z + n(43.2), n(6.8), 'porcelain')
  scene.slab(`${prefix}.pump`, rect(x - n(8), y - n(4), n(23), n(8), n(1.3)), z + n(50), n(3), 'porcelain', {
    inner: ink(k.planOutline(rect(x - n(6), y - n(2), n(16), n(4), n(0.8)), z + n(53), getProjection()), 'faint'),
  })
  scene.face(`${prefix}.nozzle`, front(y + n(4)), rect(x + n(10), z + n(50.5), n(4), n(1.2), n(0.4)), -n(0.1), n(0.2), 'graphite')
  scene.face(`${prefix}.label`, F, rect(-n(10), n(10), n(20), n(19), n(1)), 0, n(0.2), 'paper', {
    inner: planeLine(F, [[0, n(24)], [-n(3), n(19)], [-n(2), n(16)], [0, n(15)], [n(2), n(16)], [n(3), n(19)], [0, n(24)]], -n(0.25), 'lo') +
      circleOn(F, 0, n(20), n(6.8), -n(0.25), 'faint'),
  })
  return { bottom: [x, y, z], top: [x, y, z + n(53)] }
}
