import { ReactLenis } from 'lenis/react'
import { useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import 'lenis/dist/lenis.css'

const lenisOptions = {
  autoRaf: true,
  duration: 1.2,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1.1,
  gestureOrientation: 'vertical' as const,
  overscroll: true,

  // --- Comportamiento nativo ultra fluido en móvil ---
  syncTouch: false,       // Devuelve el control al hardware nativo (0 latencia)
  touchMultiplier: 1.0,   // Sin alterar la física natural del dedo
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion() ?? false
  const options = useMemo(() => ({ ...lenisOptions, smoothWheel: !reduced }), [reduced])
  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  )
}
