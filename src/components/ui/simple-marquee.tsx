import { useRef, type RefObject } from "react"
import {
  motion,
  type SpringOptions,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react"

import { cn } from "@/lib/utils"

/**
 * Función auxiliar para "envolver" (wrap) un valor dentro de un rango cíclico [min, max].
 * Garantiza un bucle infinito continuo (por ejemplo, de 0% a -100%) sin saltos bruscos.
 */
const wrap = (min: number, max: number, value: number): number => {
  const range = max - min
  return ((((value - min) % range) + range) % range) + min
}

export interface SimpleMarqueeProps {
  /** Elementos hijos que se desplazarán dentro del marquee */
  children: React.ReactNode
  /** Clases CSS adicionales para el contenedor principal */
  className?: string
  /** Dirección del movimiento: 'left' (izquierda), 'right' (derecha), 'up' (arriba), 'down' (abajo) */
  direction?: "left" | "right" | "up" | "down"
  /** Velocidad base de desplazamiento en píxeles por segundo */
  baseVelocity?: number
  /** Función de suavizado (easing) opcional para personalizar la aceleración */
  easing?: (value: number) => number
  /** Si es true, ralentiza la animación al pasar el cursor por encima (hover) */
  slowdownOnHover?: boolean
  /** Factor multiplicador de velocidad durante el hover (ej. 0.3 reduce la velocidad al 30%) */
  slowDownFactor?: number
  /** Configuración de resorte (spring) para la transición suave al hacer hover */
  slowDownSpringConfig?: SpringOptions
  /** Si es true, la velocidad del scroll del usuario aumentará la velocidad del marquee */
  useScrollVelocity?: boolean
  /** Si es true, invierte la dirección del marquee según la dirección del scroll */
  scrollAwareDirection?: boolean
  /** Configuración de resorte para suavizar la aceleración basada en el scroll */
  scrollSpringConfig?: SpringOptions
  /** Contenedor personalizado de scroll (por defecto es la ventana global) */
  scrollContainer?: RefObject<HTMLElement | null> | HTMLElement | null
  /** Cantidad de veces que se duplican los elementos hijos para crear el efecto infinito */
  repeat?: number
  /** Permite al usuario arrastrar (drag) el contenido con el ratón o touch */
  draggable?: boolean
  /** Sensibilidad de respuesta al arrastrar con el cursor */
  dragSensitivity?: number
  /** Tasa de deceleración tras soltar el arrastre (fricción/inercia hasta volver a baseVelocity) */
  dragVelocityDecay?: number
  /** Si es true, el sentido del marquee cambia hacia donde el usuario arrastró */
  dragAwareDirection?: boolean
  /** Ángulo en grados del movimiento de arrastre (útil si el marquee está rotado, ej. 45°) */
  dragAngle?: number
  /** Cambia el cursor a 'grabbing' durante el arrastre */
  grabCursor?: boolean
}

export const SimpleMarquee = ({
  children,
  className,
  direction = "right",
  baseVelocity = 5,
  slowdownOnHover = false,
  slowDownFactor = 0.3,
  slowDownSpringConfig = { damping: 50, stiffness: 400 },
  useScrollVelocity = false,
  scrollAwareDirection = false,
  scrollSpringConfig = { damping: 50, stiffness: 400 },
  scrollContainer,
  repeat = 3,
  draggable = false,
  dragSensitivity = 0.2,
  dragVelocityDecay = 0.96,
  dragAwareDirection = false,
  dragAngle = 0,
  grabCursor = false,
  easing,
}: SimpleMarqueeProps) => {
  // ── Valores de posición acumulada (X e Y) ──────────────────────────────────
  const baseX = useMotionValue(0)
  const baseY = useMotionValue(0)

  // ── Detección y física del scroll ──────────────────────────────────────────
  const { scrollY } = useScroll({
    ...(scrollContainer && {
      container: scrollContainer as RefObject<HTMLDivElement>,
    }),
  })

  // Obtiene la velocidad instantánea del scroll y la suaviza con un resorte (spring)
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, scrollSpringConfig)

  // ── Control de velocidad y hover ───────────────────────────────────────────
  const hoverFactorValue = useMotionValue(1)
  const defaultVelocity = useMotionValue(1)
  const smoothHoverFactor = useSpring(hoverFactorValue, slowDownSpringConfig)

  // ── Control del estado de arrastre (Drag) ──────────────────────────────────
  const isDragging = useRef(false)
  const dragVelocity = useRef(0)
  const lastPointerPosition = useRef({ x: 0, y: 0 })

  // Convierte la velocidad de scroll en un multiplicador [0 -> 5] para acelerar el marquee
  const velocityFactor = useTransform(
    useScrollVelocity ? smoothVelocity : defaultVelocity,
    [0, 1000],
    [0, 5],
    {
      clamp: false,
    }
  )

  // Determina si la orientación es horizontal o vertical
  const isHorizontal = direction === "left" || direction === "right"

  // Ajusta el signo de la velocidad base según la dirección elegida
  const actualBaseVelocity =
    direction === "left" || direction === "up" ? -baseVelocity : baseVelocity

  // Referencias para el estado de hover y factor de sentido (+1 o -1)
  const isHovered = useRef(false)
  const directionFactor = useRef(1)

  // ── Transformaciones de movimiento cíclico (0% a -100%) ─────────────────────
  // La función wrap() asegura que el valor permanezca en el rango [0, -100]%
  const x = useTransform(baseX, (v) => {
    const wrappedValue = wrap(0, -100, v)
    return `${easing ? easing(wrappedValue / -100) * -100 : wrappedValue}%`
  })

  const y = useTransform(baseY, (v) => {
    const wrappedValue = wrap(0, -100, v)
    return `${easing ? easing(wrappedValue / -100) * -100 : wrappedValue}%`
  })

  // ── Bucle de animación por fotograma (60/120 FPS) ───────────────────────────
  useAnimationFrame((_t, delta) => {
    // 1. Si el usuario está arrastrando activamente:
    if (isDragging.current && draggable) {
      if (isHorizontal) {
        baseX.set(baseX.get() + dragVelocity.current)
      } else {
        baseY.set(baseY.get() + dragVelocity.current)
      }

      // Decaimiento rápido mientras el puntero está quieto sobre la pantalla
      dragVelocity.current *= 0.9

      if (Math.abs(dragVelocity.current) < 0.01) {
        dragVelocity.current = 0
      }

      return
    }

    // 2. Aplicar factor de ralentización si el cursor está encima (hover)
    if (isHovered.current) {
      hoverFactorValue.set(slowdownOnHover ? slowDownFactor : 1)
    } else {
      hoverFactorValue.set(1)
    }

    // 3. Cálculo del desplazamiento base por frame (ajustado por delta de tiempo y hover)
    let moveBy =
      directionFactor.current *
      actualBaseVelocity *
      (delta / 1000) *
      smoothHoverFactor.get()

    // 4. Adaptar la dirección y aceleración con base en la velocidad del scroll
    if (scrollAwareDirection && !isDragging.current) {
      if (velocityFactor.get() < 0) {
        directionFactor.current = -1
      } else if (velocityFactor.get() > 0) {
        directionFactor.current = 1
      }
    }

    // Suma el empuje adicional que provoca el scroll
    moveBy += directionFactor.current * moveBy * velocityFactor.get()

    // 5. Aplicar inercia y física tras soltar el arrastre (drag)
    if (draggable) {
      moveBy += dragVelocity.current

      // Si se activa dragAwareDirection, mantiene el sentido del último arrastre
      if (dragAwareDirection && Math.abs(dragVelocity.current) > 0.1) {
        directionFactor.current = Math.sign(dragVelocity.current)
      }

      // Fricción gradual de la velocidad de arrastre hasta volver a 0
      if (!isDragging.current && Math.abs(dragVelocity.current) > 0.01) {
        dragVelocity.current *= dragVelocityDecay
      } else if (!isDragging.current) {
        dragVelocity.current = 0
      }
    }

    // 6. Actualizar el valor de movimiento acumulado en X o Y
    if (isHorizontal) {
      baseX.set(baseX.get() + moveBy)
    } else {
      baseY.set(baseY.get() + moveBy)
    }
  })

  // ── Manejadores de eventos de arrastre (Pointer Events) ─────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draggable) return

    // Captura el puntero para seguir recibiendo eventos aunque salga del elemento
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    if (grabCursor) {
      ;(e.currentTarget as HTMLElement).style.cursor = "grabbing"
    }

    isDragging.current = true
    lastPointerPosition.current = { x: e.clientX, y: e.clientY }
    dragVelocity.current = 0
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggable || !isDragging.current) return

    const currentPosition = { x: e.clientX, y: e.clientY }

    // Diferencia respecto a la posición anterior
    const deltaX = currentPosition.x - lastPointerPosition.current.x
    const deltaY = currentPosition.y - lastPointerPosition.current.y

    // Convertir el ángulo configurado de grados a radianes
    const angleInRadians = (dragAngle * Math.PI) / 180

    // Proyección del movimiento a lo largo del ángulo mediante producto punto (dot product)
    const directionX = Math.cos(angleInRadians)
    const directionY = Math.sin(angleInRadians)
    const projectedDelta = deltaX * directionX + deltaY * directionY

    // Actualizar la velocidad de arrastre con la sensibilidad aplicada
    dragVelocity.current = projectedDelta * dragSensitivity
    lastPointerPosition.current = currentPosition
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggable) return

    // Liberar la captura del puntero
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    isDragging.current = false
  }

  return (
    <motion.div
      className={cn("flex", isHorizontal ? "flex-row" : "flex-col", className)}
      onHoverStart={() => (isHovered.current = true)}
      onHoverEnd={() => (isHovered.current = false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {Array.from({ length: repeat }, (_, i) => i).map((i) => (
        <motion.div
          key={i}
          className={cn(
            "shrink-0",
            isHorizontal && "flex",
            draggable && grabCursor && "cursor-grab",
          )}
          style={isHorizontal ? { x } : { y }}
          aria-hidden={i > 0}
        >
          {children}
        </motion.div>
      ))}
    </motion.div>
  )
}

export default SimpleMarquee

