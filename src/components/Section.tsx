import type { ElementType, ReactNode, Ref } from 'react'
import { cn } from '@/lib/cn'

/** Retícula compartida: cada sección aporta la mitad del espacio entre capítulos. */

type Pad = 'default' | 'tight' | 'none'

const PAD_Y: Record<Pad, string> = {
  default: 'py-12 sm:py-14 md:py-section',
  tight: 'py-12 sm:py-16 md:py-section-tight',
  none: '',
}

const PAD_X = 'px-5 sm:px-8 md:px-gutter'

export function Section({
  as: Tag = 'section',
  id,
  pad = 'default',
  className,
  // React 19 pasa `ref` como una prop normal en componentes de funcion, asi que las secciones
  // que anclan un `useScroll` pueden seguir midiendose sin envolver esto en forwardRef.
  ref,
  children,
}: {
  as?: ElementType
  id?: string
  /** Ritmo vertical. `tight` para bloques que ya traen su propia altura (hero, sticky). */
  pad?: Pad
  className?: string
  ref?: Ref<HTMLElement>
  children: ReactNode
}) {
  return (
    <Tag ref={ref} id={id} className={cn('w-full', PAD_X, PAD_Y[pad], className)}>
      {children}
    </Tag>
  )
}

/**
 * Centra el contenido y le pone techo. `page` es la columna de la pagina; `full` lo deja suelto
 * para los pocos casos que fijan su propio ancho.
 */
export function Container({
  width = 'page',
  className,
  children,
}: {
  width?: 'page' | 'reading' | 'full'
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'w-full',
        width === 'page' && 'mx-auto max-w-page',
        width === 'reading' && 'max-w-reading',
        className
      )}
    >
      {children}
    </div>
  )
}
