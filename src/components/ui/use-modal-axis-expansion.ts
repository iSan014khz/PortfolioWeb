import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { usePresence, useReducedMotion } from 'motion/react'

export type ModalOrigin = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'> & {
  trigger?: HTMLButtonElement
}

// Production CSS minification turns 350ms into .35s. WAAPI always expects ms.
function timeInMs(styles: CSSStyleDeclaration, token: string, fallback: number) {
  const value = styles.getPropertyValue(token).trim()
  const number = parseFloat(value)
  if (!Number.isFinite(number)) return fallback
  return number * (value.endsWith('ms') ? 1 : 1000)
}

/** A single clipped surface keeps the trigger's circle and its one-pixel border intact. */
export function useModalAxisExpansion(
  panelRef: RefObject<HTMLDivElement | null>,
  origin?: ModalOrigin,
  backdropRef?: RefObject<HTMLDivElement | null>,
) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const glyphRef = useRef<HTMLDivElement>(null)
  const animationsRef = useRef<Animation[]>([])
  const closeSurfaceRef = useRef<(() => Animation[]) | null>(null)
  const reduced = useReducedMotion()
  const [present, safeToRemove] = usePresence()
  const [ready, setReady] = useState(!origin || !!reduced)
  const [contentLeaving, setContentLeaving] = useState(false)
  const readyRef = useRef(ready)
  // Transfer the visible trigger to the portal before the first paint. Restore it
  // only once the returning circle and glyph have reached their original place.
  useLayoutEffect(() => {
    const trigger = origin?.trigger
    if (!trigger || reduced) return
    const visibility = trigger.style.visibility
    trigger.style.visibility = 'hidden'
    return () => { trigger.style.visibility = visibility }
  }, [origin, reduced])

  useLayoutEffect(() => {
    const panel = panelRef.current
    const surface = surfaceRef.current
    const fill = fillRef.current
    const glyph = glyphRef.current
    if (!origin || !panel || !surface || !fill || !glyph || reduced) return

    const tokens = getComputedStyle(panel)
    const easing = tokens.getPropertyValue('--ease-out').trim()
    const slow = timeInMs(tokens, '--duration-slow', 350)
    const fast = timeInMs(tokens, '--duration-fast', 160)
    const normal = timeInMs(tokens, '--duration-normal', 220)
    const horizontal = slow + fast
    const vertical = slow + normal
    const total = horizontal + vertical
    const split = horizontal / total
    let rect = panel.getBoundingClientRect()
    // Use the click-time box. Locking body scroll can change sticky ancestors;
    // measuring the button afterwards would move the circle on the first frame.
    let trigger = origin
    const radius = trigger.width / 2
    const strip = () => ({
      left: rect.left, top: trigger.top, width: rect.width, height: trigger.height,
    })
    const clip = (box: ModalOrigin, rounding: number, inset = 0) =>
      `inset(${box.top + inset}px ${window.innerWidth - box.left - box.width + inset}px ${window.innerHeight - box.top - box.height + inset}px ${box.left + inset}px round ${Math.max(0, rounding - inset)}px)`
    const frames = (inset: number) => [
      { clipPath: clip(trigger, radius, inset), offset: 0, easing },
      { clipPath: clip(strip(), radius, inset), offset: split, easing },
      { clipPath: clip(rect, parseFloat(tokens.borderRadius) || 12, inset), offset: 1 },
    ]

    const positionGlyph = () => {
      glyph.style.left = `${trigger.left}px`
      glyph.style.top = `${trigger.top}px`
    }
    positionGlyph()
    glyph.style.width = `${trigger.width}px`
    glyph.style.height = `${trigger.height}px`
    glyph.style.color = origin.trigger ? getComputedStyle(origin.trigger).color : tokens.color

    const timing = { duration: total, fill: 'both' as const }
    let animations = [
      surface.animate(frames(0), timing),
      fill.animate(frames(1), timing),
      glyph.animate([
        { opacity: 1, transform: 'scale(1)', offset: 0, easing },
        { opacity: 0.4, transform: 'scale(0.6)', offset: normal / total, easing },
        { opacity: 0, transform: 'scale(0.35)', offset: slow / total },
        { opacity: 0, transform: 'scale(0.35)', offset: 1 },
      ], timing),
    ]
    const backdrop = backdropRef?.current
    if (backdrop) animations.push(backdrop.animate([
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: split, easing },
      { opacity: 1, offset: 1 },
    ], timing))
    // The presence effect below owns playback, including mid-flight reversal.
    animations.forEach(animation => animation.pause())
    if (readyRef.current) animations.forEach(animation => animation.finish())
    animationsRef.current = animations
    let activeFrames = frames
    let closing = false
    closeSurfaceRef.current = () => {
      if (closing) return animations
      closing = true
      // Keep the current painted shape when Escape interrupts the entrance.
      // Exit follows the same path, with ease-out on each contraction stage.
      const inVertical = Number(animations[0].currentTime) > horizontal
      const exitY = inVertical ? timeInMs(tokens, '--modal-axis-exit-y-duration', 420) : 0
      const exitX = timeInMs(tokens, '--modal-axis-exit-x-duration', 350)
      const exitTotal = exitY + exitX
      const exitSplit = exitY / exitTotal
      const startClips = [surface, fill].map(element => getComputedStyle(element).clipPath)
      const glyphStyle = getComputedStyle(glyph)
      const startGlyph = { opacity: Number(glyphStyle.opacity), transform: glyphStyle.transform }
      const startBackdrop = backdrop ? Number(getComputedStyle(backdrop).opacity) : 0
      const exitFrames = (inset: number) => [
        { clipPath: startClips[inset], offset: 0, easing },
        ...(exitY ? [{ clipPath: clip(strip(), radius, inset), offset: exitSplit, easing }] : []),
        { clipPath: clip(trigger, radius, inset), offset: 1 },
      ]
      animations.forEach(animation => animation.cancel())
      const exitTiming = { duration: exitTotal, fill: 'both' as const }
      animations = [
        surface.animate(exitFrames(0), exitTiming),
        fill.animate(exitFrames(1), exitTiming),
        glyph.animate([
          { ...startGlyph, offset: 0, easing },
          ...(exitY ? [{ ...startGlyph, offset: exitSplit, easing }] : []),
          { opacity: 1, transform: 'scale(1)', offset: 1 },
        ], exitTiming),
      ]
      if (backdrop) animations.push(backdrop.animate([
        { opacity: startBackdrop, offset: 0, easing },
        ...(exitY ? [{ opacity: 0, offset: exitSplit }] : []),
        { opacity: 0, offset: 1 },
      ], exitTiming))
      animations.forEach(animation => animation.pause())
      activeFrames = exitFrames
      animationsRef.current = animations
      return animations
    }
    // Safari's address bar can resize the viewport during a tap. Update the
    // shapes on the existing timeline without finishing it or revealing content.
    const onResize = () => {
      rect = panel.getBoundingClientRect()
      trigger = origin.trigger?.getBoundingClientRect() ?? origin
      for (const [index, inset] of [0, 1].entries()) {
        (animations[index].effect as KeyframeEffect).setKeyframes(activeFrames(inset))
      }
      positionGlyph()
    }
    window.addEventListener('resize', onResize)
    const observer = new ResizeObserver(() => {
      const next = panel.getBoundingClientRect()
      if (Math.abs(next.height - rect.height) > 1 || Math.abs(next.width - rect.width) > 1) onResize()
    })
    observer.observe(panel)
    return () => {
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      animations.forEach(animation => animation.cancel())
      closeSurfaceRef.current = null
    }
  }, [origin, panelRef, reduced, backdropRef])

  useLayoutEffect(() => {
    if (!origin || reduced) {
      if (!present) safeToRemove?.()
      else { readyRef.current = true; setReady(true) }
      return
    }
    const animations = animationsRef.current
    if (!animations.length) {
      if (!present) safeToRemove?.()
      else { readyRef.current = true; setReady(true) }
      return
    }
    let cancelled = false
    let frame: number | undefined
    const finish = () => {
      if (cancelled) return
      if (present) { readyRef.current = true; setReady(true) }
      else safeToRemove?.()
    }
    const play = () => {
      if (!present && Number(animations[0].currentTime) <= 0) {
        finish()
        return
      }
      const active = present ? animations : closeSurfaceRef.current?.() ?? animations
      active.forEach(animation => {
        animation.playbackRate = 1
        animation.play()
      })
      void Promise.all(active.map(animation => animation.finished)).then(finish).catch(() => {})
    }

    if (present) {
      setContentLeaving(false)
      play()
    } else {
      const hadContent = readyRef.current
      readyRef.current = false
      const rewindSurface = () => {
        if (cancelled) return
        setReady(false)
        setContentLeaving(false)
        play()
      }
      if (hadContent) {
        const panel = panelRef.current!
        const panelBox = panel.getBoundingClientRect()
        const blocks = Array.from(panel.querySelectorAll<HTMLElement>('[data-modal-reveal]'))
        const visible = blocks.filter(block => {
          block.style.setProperty('--modal-exit-order', '0')
          const box = block.getBoundingClientRect()
          const scrollBox = block.closest('[data-modal-scroll]')?.getBoundingClientRect() ?? panelBox
          return getComputedStyle(block).opacity !== '0' &&
            box.bottom > scrollBox.top && box.top < scrollBox.bottom
        })
        // Last visible block leaves first. Offscreen sections do not add a wait.
        visible.reverse().forEach((block, order) => {
          block.style.setProperty('--modal-exit-order', String(order))
        })
        setContentLeaving(true)
        frame = requestAnimationFrame(() => {
          // Wait for the actual retargeted CSS transitions, including the delay,
          // so closing midway through the entrance cannot flash or cut content.
          const transitions = visible.flatMap(block => block.getAnimations())
          void Promise.allSettled(transitions.map(animation => animation.finished))
            .then(rewindSurface)
        })
      } else {
        // Escape during the empty surface expansion rewinds immediately.
        rewindSurface()
      }
    }
    return () => { cancelled = true; if (frame !== undefined) cancelAnimationFrame(frame) }
  }, [origin, panelRef, present, reduced, safeToRemove])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (origin && ready && document.activeElement === panel) {
      panel?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    }
  }, [origin, panelRef, ready])

  return { surfaceRef, fillRef, glyphRef, expanding: !!origin && !ready, contentLeaving, present }
}
