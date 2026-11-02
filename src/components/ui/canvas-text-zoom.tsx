import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { MotionValue } from 'motion/react'

type Item = { char: string; index: number; x: number; y: number }
export default function CanvasTitle({ items, progress, camera, opacity, reduced, measureRef, textClassName, hideThreshold }: {
  items: Item[]
  progress: MotionValue<number>
  camera: MotionValue<string>
  opacity: MotionValue<number>
  reduced: boolean
  measureRef: RefObject<SVGTextElement | null>
  textClassName?: string
  hideThreshold: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const canvas = ref.current
    const source = measureRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !source || !items.length) return
    let frame = 0
    let cancelled = false
    let baselineOffset = 0
    let font = ''
    let color = '#f0f0f0'
    const configureFont = () => {
      const styles = getComputedStyle(source)
      font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`
      color = styles.fill
      // Align the canvas alphabetic baseline with the original SVG central baseline.
      const probe = source.cloneNode(false) as SVGTextElement
      probe.textContent = 'Hg'
      probe.setAttribute('text-anchor', 'start')
      source.parentNode?.appendChild(probe)
      try {
        const central = probe.getBBox().y
        probe.setAttribute('dominant-baseline', 'alphabetic')
        baselineOffset = central - probe.getBBox().y
      } finally { probe.remove() }
    }
    const paint = () => {
      frame = 0
      if (cancelled) return
      const box = canvas.getBoundingClientRect()
      if (!box.width || !box.height) return
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const pixelWidth = Math.round(box.width * dpr)
      const pixelHeight = Math.round(box.height * dpr)
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      // Clear the complete bitmap every frame; no retained SVG paint regions.
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
      const p = progress.get()
      if (p >= hideThreshold || opacity.get() <= 0) return
      const [x, y, width] = camera.get().split(' ').map(Number)
      const scale = box.width / width
      context.setTransform(dpr * scale, 0, 0, dpr * scale, -x * scale * dpr, -y * scale * dpr)
      context.font = font
      context.fillStyle = color
      context.textAlign = 'left'
      context.textBaseline = 'alphabetic'
      for (const item of items) {
        const t = Math.max(0, Math.min(1, (p - item.index * 0.002) / 0.055))
        const entry = 1 - Math.pow(1 - t, 3)
        const size = reduced ? 1 : 1 + 0.22 * (1 - entry)
        const dx = reduced ? 0 : (item.x - 500) * 0.65 * (1 - entry)
        const dy = reduced ? 0 : -18 * (1 - entry)
        context.save()
        context.translate(dx + item.x * (1 - size), dy + item.y * (1 - size))
        context.scale(size, size)
        context.globalAlpha = Math.min(1, entry / 0.6) * opacity.get()
        context.fillText(item.char, item.x, item.y + baselineOffset)
        context.restore()
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint) }
    configureFont()
    schedule()
    void document.fonts.ready.then(() => { if (!cancelled) { configureFont(); schedule() } })
    const unsubscribe = [progress.on('change', schedule), camera.on('change', schedule), opacity.on('change', schedule)]
    const observer = new ResizeObserver(schedule)
    observer.observe(canvas)
    window.addEventListener('resize', schedule)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      unsubscribe.forEach(stop => stop())
      observer.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [items, progress, camera, opacity, reduced, measureRef, hideThreshold])
  return <canvas ref={ref} aria-hidden="true" className={textClassName} style={{
    position: 'absolute', top: 0, left: '50%', width: '100vw', height: '100%',
    transform: 'translateX(-50%)', pointerEvents: 'none',
  }} />
}
